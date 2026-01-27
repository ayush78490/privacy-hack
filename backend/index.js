const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const BUILD_ID = process.env.BUILD_ID || new Date().toISOString();

// Middleware
app.use(cors());
app.use(express.json());
// Prevent stale HTML/JS during rapid iteration (and avoids "why am I seeing old UI?" issues)
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

function base64ToBase58Signature(signature_base64) {
    // Phantom signMessage gives bytes; we send them as base64 from browser.
    // ShadowWire backend expects base58 string.
    const bs58 = require('bs58');
    const buf = Buffer.from(signature_base64, 'base64');
    return bs58.encode(buf);
}

// ShadowWire client instance (lazy loaded)
let shadowWireClient = null;

async function getClient() {
    if (!shadowWireClient) {
        const { ShadowWireClient } = await import('@radr/shadowwire');
        shadowWireClient = new ShadowWireClient({ debug: true });
    }
    return shadowWireClient;
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), build: BUILD_ID });
});

// Get balance for a wallet
app.get('/api/balance/:wallet', async (req, res) => {
    try {
        const { wallet } = req.params;
        const { token = 'SOL' } = req.query;

        const client = await getClient();
        const balance = await client.getBalance(wallet, token);

        res.json({
            success: true,
            data: {
                wallet,
                token,
                available: balance.available,
                availableFormatted: balance.available / Math.pow(10, getDecimals(token)),
                pool_address: balance.pool_address
            }
        });
    } catch (error) {
        console.error('Balance error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get balance for multiple tokens
app.get('/api/balances/:wallet', async (req, res) => {
    try {
        const { wallet } = req.params;
        const tokens = ['SOL', 'RADR', 'USDC', 'BONK', 'ORE'];

        const client = await getClient();
        const balances = await Promise.all(
            tokens.map(async (token) => {
                try {
                    const balance = await client.getBalance(wallet, token);
                    return {
                        token,
                        available: balance.available,
                        availableFormatted: balance.available / Math.pow(10, getDecimals(token)),
                        pool_address: balance.pool_address
                    };
                } catch (e) {
                    return { token, available: 0, availableFormatted: 0, error: e.message };
                }
            })
        );

        res.json({
            success: true,
            data: { wallet, balances }
        });
    } catch (error) {
        console.error('Balances error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create deposit transaction
app.post('/api/deposit', async (req, res) => {
    try {
        const { wallet, amount, token = 'SOL' } = req.body;

        if (!wallet || !amount) {
            return res.status(400).json({
                success: false,
                error: 'wallet and amount are required'
            });
        }

        const client = await getClient();
        const { TokenUtils } = await import('@radr/shadowwire');

        // Convert to smallest unit (lamports for SOL)
        const amountSmallest = TokenUtils.toSmallestUnit(amount, token);

        // IMPORTANT:
        // ShadowWire SDK deposit/withdraw uses `token_mint` (NOT `token` symbol).
        // If token_mint is omitted, it defaults to SOL.
        const tokenMint = TokenUtils.getTokenMint(token);
        const token_mint = tokenMint === 'Native' ? undefined : tokenMint;

        const result = await client.deposit({
            wallet,
            amount: amountSmallest,
            ...(token_mint ? { token_mint } : {})
        });

        // SDK returns: { success, unsigned_tx_base64, pool_address, user_balance_pda, amount }
        res.json({
            success: true,
            data: {
                message: 'Deposit transaction created - sign with your wallet',
                unsigned_tx_base64: result.unsigned_tx_base64,
                pool_address: result.pool_address,
                user_balance_pda: result.user_balance_pda,
                amount: result.amount,
                token,
                token_mint: token_mint || 'Native',
                amount_smallest_unit: amountSmallest
            }
        });
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create withdraw transaction
app.post('/api/withdraw', async (req, res) => {
    try {
        const { wallet, amount, token = 'SOL' } = req.body;

        if (!wallet || !amount) {
            return res.status(400).json({
                success: false,
                error: 'wallet and amount are required'
            });
        }

        const client = await getClient();
        const { TokenUtils } = await import('@radr/shadowwire');

        const amountSmallest = TokenUtils.toSmallestUnit(amount, token);

        const tokenMint = TokenUtils.getTokenMint(token);
        const token_mint = tokenMint === 'Native' ? undefined : tokenMint;

        const result = await client.withdraw({
            wallet,
            amount: amountSmallest,
            ...(token_mint ? { token_mint } : {})
        });

        // SDK returns: { success, unsigned_tx_base64, ... }
        res.json({
            success: true,
            data: {
                message: 'Withdraw transaction created - sign with your wallet',
                unsigned_tx_base64: result.unsigned_tx_base64,
                // WithdrawResponse fields differ; keep what we have + extras for debugging
                amount_withdrawn: result.amount_withdrawn,
                fee: result.fee,
                token,
                token_mint: token_mint || 'Native',
                amount_smallest_unit: amountSmallest
            }
        });
    } catch (error) {
        console.error('Withdraw error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Execute transfer (internal or external)
app.post('/api/transfer', async (req, res) => {
    try {
        const {
            sender,
            recipient,
            amount,
            token = 'SOL',
            type = 'internal',
            zk_auth,
            transfer_auth
        } = req.body;

        if (!sender || !recipient || !amount) {
            return res.status(400).json({
                success: false,
                error: 'sender, recipient, and amount are required'
            });
        }

        if (sender === recipient) {
            return res.status(400).json({
                success: false,
                error: 'Cannot transfer to yourself'
            });
        }

        const client = await getClient();

        // Wallet signature authentication is mandatory for transfers.
        // We require two signed messages from the client:
        // 1) zk_transfer (for /zk/upload-proof)
        // 2) internal_transfer or external_transfer (for the transfer call itself)
        if (!zk_auth?.signature_base64 || !zk_auth?.signature_message) {
            return res.status(400).json({
                success: false,
                error:
                    "Sender signature required. Sign message 'shadowpay:zk_transfer:{nonce}:{timestamp}' with your wallet.",
                errorType: 'SignatureAuthMissing'
            });
        }
        if (!transfer_auth?.signature_base64 || !transfer_auth?.signature_message) {
            return res.status(400).json({
                success: false,
                error:
                    "Sender signature required. Sign message 'shadowpay:internal_transfer|external_transfer:{nonce}:{timestamp}' with your wallet.",
                errorType: 'SignatureAuthMissing'
            });
        }

        console.log('[Transfer] Received amount:', amount, 'type:', typeof amount);
        
        const { TokenUtils } = await import('@radr/shadowwire');
        const parsedAmount = parseFloat(amount);
        console.log('[Transfer] Parsed amount:', parsedAmount);
        
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: `Invalid amount value: ${amount} (parsed: ${parsedAmount})`,
                errorType: 'ValidationError'
            });
        }
        
        const amountSmallestUnitRaw = TokenUtils.toSmallestUnit(parsedAmount, token);
        const amountSmallestUnitStr = amountSmallestUnitRaw?.toString?.();
        const amountSmallestUnitNum = Number(amountSmallestUnitStr);
        console.log('[Transfer] Amount in smallest unit:', amountSmallestUnitRaw, 'as number:', amountSmallestUnitNum);

        if (!amountSmallestUnitStr || !Number.isFinite(amountSmallestUnitNum) || amountSmallestUnitNum <= 0) {
            return res.status(400).json({
                success: false,
                error: `Invalid smallest unit amount: ${amountSmallestUnitStr}`,
                errorType: 'ValidationError'
            });
        }
        
        const nonce = Math.floor(Date.now() / 1000);
        const tokenMint = TokenUtils.getTokenMint(token);
        const tokenParam = tokenMint === 'Native' ? 'SOL' : tokenMint;

        const sender_signature_zk = base64ToBase58Signature(zk_auth.signature_base64);
        const sender_signature_transfer = base64ToBase58Signature(transfer_auth.signature_base64);

        const uploadProofPayload = {
            sender_wallet: sender,
            token: tokenParam,
            amount: amountSmallestUnitNum,
            nonce,
            sender_signature: sender_signature_zk,
            signature_message: zk_auth.signature_message
        };
        console.log('[Transfer] uploadProof payload:', JSON.stringify(uploadProofPayload));
        
        let proofResult;
        try {
            proofResult = await client.uploadProof(uploadProofPayload);
            console.log('[Transfer] uploadProof result:', proofResult);
        } catch (uploadErr) {
            console.error('[Transfer] uploadProof failed:', uploadErr);
            return res.status(400).json({
                success: false,
                error: uploadErr.message || 'Failed to upload proof',
                errorType: 'UploadProofError',
                details: uploadErr.response?.data || uploadErr.toString()
            });
        }

        const relayerFee = Math.floor(amountSmallestUnitNum * 0.01);

        if (type === 'internal') {
            const internalPayload = {
                sender_wallet: sender,
                recipient_wallet: recipient,
                token: tokenParam,
                nonce: proofResult.nonce,
                relayer_fee: relayerFee,
                sender_signature: sender_signature_transfer,
                signature_message: transfer_auth.signature_message
            };
            console.log('[Transfer] internalTransfer payload:', JSON.stringify(internalPayload));

            let internalResult;
            try {
                internalResult = await client.internalTransfer(internalPayload);
                console.log('[Transfer] internalTransfer result:', internalResult);
            } catch (internalErr) {
                console.error('[Transfer] internalTransfer failed:', internalErr);
                return res.status(400).json({
                    success: false,
                    error: internalErr.message || 'Failed to execute internal transfer',
                    errorType: 'InternalTransferError',
                    details: internalErr.response?.data || internalErr.toString()
                });
            }

            return res.json({
                success: true,
                data: {
                    tx_signature: internalResult.tx_signature,
                    amount_hidden: true,
                    proof_pda: internalResult.proof_pda,
                    type,
                    token,
                    amount,
                    relayer_fee: relayerFee
                }
            });
        }

        const externalPayload = {
            sender_wallet: sender,
            recipient_wallet: recipient,
            token: tokenParam,
            nonce: proofResult.nonce,
            relayer_fee: relayerFee,
            sender_signature: sender_signature_transfer,
            signature_message: transfer_auth.signature_message
        };
        console.log('[Transfer] externalTransfer payload:', JSON.stringify(externalPayload));

        let externalResult;
        try {
            externalResult = await client.externalTransfer(externalPayload);
            console.log('[Transfer] externalTransfer result:', externalResult);
        } catch (externalErr) {
            console.error('[Transfer] externalTransfer failed:', externalErr);
            return res.status(400).json({
                success: false,
                error: externalErr.message || 'Failed to execute external transfer',
                errorType: 'ExternalTransferError',
                details: externalErr.response?.data || externalErr.toString()
            });
        }

        return res.json({
            success: true,
            data: {
                tx_signature: externalResult.tx_signature,
                amount_hidden: false,
                amount_sent: externalResult.amount_sent,
                proof_pda: externalResult.proof_pda,
                type,
                token,
                amount,
                relayer_fee: relayerFee
            }
        });
    } catch (error) {
        console.error('Transfer error:', error);

        // Handle specific errors
        const errorName = error.constructor.name;
        let statusCode = 500;
        let errorMessage = error.message;

        if (errorName === 'RecipientNotFoundError') {
            statusCode = 404;
            errorMessage = 'Recipient not found. They may not have used ShadowWire before. Try an external transfer instead.';
        } else if (errorName === 'InsufficientBalanceError') {
            statusCode = 400;
            errorMessage = 'Insufficient balance for this transfer.';
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            errorType: errorName
        });
    }
});

// Upload proof (advanced - 2-step transfer)
app.post('/api/upload-proof', async (req, res) => {
    try {
        const { sender_wallet, token = 'SOL', amount } = req.body;

        if (!sender_wallet || !amount) {
            return res.status(400).json({
                success: false,
                error: 'sender_wallet and amount are required'
            });
        }

        const client = await getClient();
        const { TokenUtils } = await import('@radr/shadowwire');

        const amountSmallest = TokenUtils.toSmallestUnit(amount, token);
        const nonce = Math.floor(Date.now() / 1000);

        const result = await client.uploadProof({
            sender_wallet,
            token,
            amount: amountSmallest,
            nonce
        });

        res.json({
            success: true,
            data: {
                nonce: result.nonce,
                message: 'Proof uploaded. Use this nonce for the internal transfer.'
            }
        });
    } catch (error) {
        console.error('Upload proof error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Execute internal transfer with nonce (advanced - 2-step transfer)
app.post('/api/internal-transfer', async (req, res) => {
    try {
        const { sender_wallet, recipient_wallet, token = 'SOL', nonce, relayer_fee = 1000000 } = req.body;

        if (!sender_wallet || !recipient_wallet || !nonce) {
            return res.status(400).json({
                success: false,
                error: 'sender_wallet, recipient_wallet, and nonce are required'
            });
        }

        const client = await getClient();

        const result = await client.internalTransfer({
            sender_wallet,
            recipient_wallet,
            token,
            nonce,
            relayer_fee
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Internal transfer error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get supported tokens
app.get('/api/tokens', (req, res) => {
    const tokens = [
        { symbol: 'SOL', name: 'Solana', decimals: 9 },
        { symbol: 'RADR', name: 'Radr', decimals: 9 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { symbol: 'ORE', name: 'ORE', decimals: 11 },
        { symbol: 'BONK', name: 'Bonk', decimals: 5 },
        { symbol: 'JIM', name: 'Jim', decimals: 9 },
        { symbol: 'GODL', name: 'GODL', decimals: 11 },
        { symbol: 'HUSTLE', name: 'Hustle', decimals: 9 },
        { symbol: 'ZEC', name: 'Zcash', decimals: 8 },
        { symbol: 'CRT', name: 'DefiCarrot', decimals: 9 },
        { symbol: 'BLACKCOIN', name: 'Blackcoin', decimals: 6 },
        { symbol: 'GIL', name: 'Kith Gil', decimals: 6 },
        { symbol: 'ANON', name: 'ANON', decimals: 9 },
        { symbol: 'WLFI', name: 'World Liberty Financial', decimals: 6 },
        { symbol: 'USD1', name: 'USD1', decimals: 6 },
        { symbol: 'AOL', name: 'AOL', decimals: 6 },
        { symbol: 'IQLABS', name: 'IQ Labs', decimals: 9 }
    ];

    res.json({
        success: true,
        data: tokens
    });
});

// Helper function to get decimals
function getDecimals(token) {
    const decimalsMap = {
        'SOL': 9, 'RADR': 9, 'USDC': 6, 'ORE': 11, 'BONK': 5,
        'JIM': 9, 'GODL': 11, 'HUSTLE': 9, 'ZEC': 8, 'CRT': 9,
        'BLACKCOIN': 6, 'GIL': 6, 'ANON': 9, 'WLFI': 6, 'USD1': 6,
        'AOL': 6, 'IQLABS': 9
    };
    return decimalsMap[token] || 9;
}

// Serve the test HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔮 ShadowWire API Server                                ║
║                                                           ║
║   Server running at: http://localhost:${PORT}              ║
║   Test UI available at: http://localhost:${PORT}           ║
║                                                           ║
║   API Endpoints:                                          ║
║   • GET  /api/health          - Health check              ║
║   • GET  /api/balance/:wallet - Get wallet balance        ║
║   • GET  /api/balances/:wallet - Get all token balances   ║
║   • GET  /api/tokens          - List supported tokens     ║
║   • POST /api/deposit         - Create deposit tx         ║
║   • POST /api/withdraw        - Create withdraw tx        ║
║   • POST /api/transfer        - Execute transfer          ║
║   • POST /api/upload-proof    - Upload proof (advanced)   ║
║   • POST /api/internal-transfer - Internal transfer       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

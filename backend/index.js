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
// For Android: accepts optional sender_signature, generates ZK proof server-side
app.post('/api/transfer', async (req, res) => {
    try {
        const {
            sender,
            recipient,
            amount,
            token = 'SOL',
            type = 'internal',
            sender_signature // Optional: pre-signed by client (base58 encoded)
        } = req.body;

        if (!sender || !recipient || amount === undefined || amount === null) {
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

        console.log('[Transfer] Received:', { sender, recipient, amount, token, type, hasSig: !!sender_signature });

        const parsedAmount = parseFloat(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: `Invalid amount value: ${amount}`,
                errorType: 'ValidationError'
            });
        }

        const client = await getClient();
        const { TokenUtils, initWASM, generateRangeProof } = await import('@radr/shadowwire');

        // Convert amount to smallest unit
        const amountSmallestUnit = TokenUtils.toSmallestUnit(parsedAmount, token);
        console.log('[Transfer] Amount in smallest unit:', amountSmallestUnit);

        // Generate nonce
        const nonce = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);

        // Get token parameter - for API, use mint address except for SOL
        const tokenMint = TokenUtils.getTokenMint(token);
        const tokenParam = tokenMint === 'Native' ? 'SOL' : token;

        // Generate ZK proof on server (WASM works in Node.js)
        console.log('[Transfer] Generating ZK proof server-side...');
        await initWASM();
        const proof = await generateRangeProof(amountSmallestUnit, 64);
        console.log('[Transfer] ZK proof generated');

        // Prepare transfer request with proof
        const transferRequest = {
            sender_wallet: sender,
            recipient_wallet: recipient,
            token: tokenParam,
            nonce: nonce,
            amount: amountSmallestUnit,
            proof_bytes: proof.proofBytes,
            commitment: proof.commitmentBytes,
        };

        // Add signature if provided by client (for transfers requiring auth)
        if (sender_signature) {
            transferRequest.sender_signature = sender_signature;
            console.log('[Transfer] Using client-provided signature');
        }

        let result;
        if (type === 'internal') {
            console.log('[Transfer] Calling internalTransfer...');
            result = await client.internalTransfer(transferRequest, null);
        } else {
            console.log('[Transfer] Calling externalTransfer...');
            result = await client.externalTransfer(transferRequest, null);
        }

        console.log('[Transfer] Result:', result);

        return res.json({
            success: true,
            data: {
                tx_signature: result.tx_signature || '',
                amount_hidden: result.amount_hidden || type === 'internal',
                amount_sent: result.amount_sent,
                proof_pda: result.proof_pda || '',
                type,
                token,
                amount: parsedAmount
            }
        });
    } catch (error) {
        console.error('Transfer error:', error);

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

import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '../context/WalletContext';
import { executeAnonymousTransfer, estimateTotalAnonymousGas, estimateSplTokenGas } from '../utils/anonymousWallet';
import { ShadowWireClient } from '@radr/shadowwire';
import { sendSol, getConnection } from '../utils/solana';
import * as txStore from '../utils/txStore';
import { executeTransfer } from '../utils/api';
import {
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getAccount,
} from '@solana/spl-token';
import { LOGO_PATH } from '../constants/logo';

// Token configuration
const SEND_TOKENS = [
    { symbol: 'SOL', name: 'Solana', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
    { symbol: 'USDC', name: 'USD Coin', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
    { symbol: 'RADR', name: 'Radr', logo: '' },
    { symbol: 'BONK', name: 'Bonk', logo: 'https://assets.coingecko.com/coins/images/28600/standard/bonk.jpg' },
];


// Token mint addresses for direct transfers
const TOKEN_MINTS: Record<string, string> = {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
};

interface TransactionPreview {
    type: 'internal' | 'external' | 'direct';
    sender: string;
    recipient: string;
    amount: string;
    token: string;
    estimatedFee: string;
    message: string;
    signature?: string;
    isAnonymous?: boolean;
    estimatedGas?: number;
}

type AnonymousStep = 'idle' | 'estimating' | 'funding' | 'sending' | 'complete';

// Detect if running in Android WebView (WASM fetch doesn't work with file:// protocol)
const isAndroidWebView = (): boolean => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    // Android WebView typically has 'wv' in user agent or Version/X.X Chrome/X
    const isAndroid = ua.includes('Android');
    const isWebView = ua.includes('wv') || (ua.includes('Version/') && ua.includes('Chrome/'));
    // Also check if loaded from file:// protocol (bundled assets)
    const isFileProtocol = window.location.protocol === 'file:';
    return isAndroid && (isWebView || isFileProtocol);
};

// Helper function to parse transaction errors and return user-friendly messages
const parseTransactionError = (error: any): { title: string; message: string; suggestion: string } => {
    const errorStr = error?.message || error?.toString() || 'Unknown error';
    const logsStr = error?.logs?.join(' ') || '';

    // Check for insufficient lamports for ATA creation
    if (errorStr.includes('insufficient funds') || logsStr.includes('insufficient funds')) {
        const match = errorStr.match(/insufficient funds (\d+), need (\d+)/) ||
            logsStr.match(/insufficient funds (\d+), need (\d+)/);
        let details = '';
        if (match) {
            const have = (parseInt(match[1]) / 1e9).toFixed(6);
            const need = (parseInt(match[2]) / 1e9).toFixed(6);
            details = ` You have ${have} SOL but need ${need} SOL.`;
        }
        return {
            title: 'Insufficient SOL for Fees',
            message: `Your wallet doesn't have enough SOL to cover the transaction fees.${details}`,
            suggestion: 'The recipient doesn\'t have a token account yet, so one needs to be created (~0.002 SOL). Please add more SOL to your wallet and try again.'
        };
    }

    // Check for ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL errors
    if (errorStr.includes('ATokenGPv') || logsStr.includes('ATokenGPv')) {
        return {
            title: 'Token Account Creation Failed',
            message: 'Failed to create the recipient\'s token account.',
            suggestion: 'This usually happens when you don\'t have enough SOL for rent. Please ensure you have at least 0.003 SOL in your wallet.'
        };
    }

    // Check for simulation failed
    if (errorStr.includes('Simulation failed') || errorStr.includes('simulation failed')) {
        return {
            title: 'Transaction Simulation Failed',
            message: 'The transaction could not be completed.',
            suggestion: 'Please check your balance and try again. If the issue persists, the network may be congested.'
        };
    }

    // Check for insufficient balance
    if (errorStr.includes('insufficient') || errorStr.includes('Insufficient')) {
        return {
            title: 'Insufficient Balance',
            message: 'You don\'t have enough funds to complete this transaction.',
            suggestion: 'Please check your balance and make sure you have enough for both the transfer amount and fees.'
        };
    }

    // Check for invalid address
    if (errorStr.includes('Invalid public key') || errorStr.includes('invalid address')) {
        return {
            title: 'Invalid Address',
            message: 'The recipient address is not valid.',
            suggestion: 'Please double-check the Solana address and try again.'
        };
    }

    // Check for network errors
    if (errorStr.includes('Network') || errorStr.includes('timeout') || errorStr.includes('ECONNREFUSED')) {
        return {
            title: 'Network Error',
            message: 'Could not connect to the Solana network.',
            suggestion: 'Please check your internet connection and try again.'
        };
    }

    // Default error
    return {
        title: 'Transaction Failed',
        message: errorStr.length > 100 ? errorStr.substring(0, 100) + '...' : errorStr,
        suggestion: 'Please try again. If the issue persists, contact support.'
    };
};

const Send: React.FC = () => {
    const {
        wallet,
        address,
        tokenBalances,
        refreshBalance,
        apiConnected,
        solPrice,
        isAnonymousMode,
        anonymousWallet,
        anonymousAddress,
        onChainBalance,
        onChainUsdcBalance,
        shieldedBalance,
        shieldedUsdcBalance,
        shieldedTokenBalances,
        getActiveWallet,
        getActiveAddress
    } = useWallet();
    const [, setLocation] = useLocation();
    const [amount, setAmount] = useState('0');
    const [recipient, setRecipient] = useState('');
    const [loading] = useState(false);
    const [transferType, setTransferType] = useState<'internal' | 'external' | 'direct'>('internal');
    const [selectedToken, setSelectedToken] = useState('SOL');
    const [showTokenSelect, setShowTokenSelect] = useState(false);

    // Transaction approval state
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [txPreview, setTxPreview] = useState<TransactionPreview | null>(null);
    const [signing, setSigning] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [fundingTxHash, setFundingTxHash] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Anonymous transfer progress
    const [anonymousStep, setAnonymousStep] = useState<AnonymousStep>('idle');

    // Get balance for selected token based on mode and transfer type
    // - Anonymous mode: use MAIN WALLET balance (funds FROM main wallet)
    // - Private/External: use SHIELDED balance (funds FROM pool)
    // - Direct: use MAIN WALLET balance (regular on-chain transfer)
    const getTokenBalance = (symbol: string): number => {
        if (isAnonymousMode) {
            // Anonymous mode: fund FROM main wallet
            if (symbol === 'SOL') return onChainBalance;
            if (symbol === 'USDC') return onChainUsdcBalance;
        } else if (transferType === 'direct') {
            // Direct transfer: use main wallet balance
            if (symbol === 'SOL') return onChainBalance;
            if (symbol === 'USDC') return onChainUsdcBalance;
            // For other tokens in direct mode, check on-chain balance
            const tb = tokenBalances.find(t => t.symbol === symbol);
            return tb?.balanceFormatted || 0;
        } else {
            // Private/External: use shielded (pool) balance
            if (symbol === 'SOL') return shieldedBalance;
            if (symbol === 'USDC') return shieldedUsdcBalance;
            // For other tokens, check shielded token balances
            const stb = shieldedTokenBalances.find(t => t.symbol === symbol);
            return stb?.balanceFormatted || 0;
        }
        const tb = tokenBalances.find(t => t.symbol === symbol);
        return tb?.balanceFormatted || 0;
    };

    // USD value calculation
    const usdValue = useMemo(() => {
        const amt = parseFloat(amount) || 0;
        if (selectedToken === 'SOL') return amt * solPrice;
        if (selectedToken === 'USDC') return amt;
        return 0;
    }, [amount, selectedToken, solPrice]);

    const handleKeypad = (val: string | number) => {
        if (loading) return;

        if (val === '.') {
            if (!amount.includes('.')) {
                setAmount(prev => prev + '.');
            }
            return;
        }

        if (amount === '0') {
            setAmount(val.toString());
        } else {
            setAmount(prev => prev + val.toString());
        }
    };

    const handleBackspace = () => {
        if (loading) return;
        setAmount(prev => {
            if (prev.length <= 1) return '';
            const newVal = prev.slice(0, -1);
            // Remove leading zeros except for "0."
            if (newVal.length > 1 && newVal.startsWith('0') && newVal[1] !== '.') {
                return newVal.replace(/^0+/, '') || '';
            }
            return newVal;
        });
    };

    const shadowWireClient = useMemo(() => new ShadowWireClient({ debug: true }), []);

    // Sign message with the active wallet (Keypair) for ShadowWire SDK.
    // ShadowWire expects a wallet adapter with `signMessage(messageBytes) => signatureBytes`.
    const signMessageBytes = async (messageBytes: Uint8Array): Promise<Uint8Array> => {
        const activeWallet = getActiveWallet();
        if (!activeWallet) throw new Error('Wallet not available');
        const nacl = await import('tweetnacl');
        return nacl.sign.detached(messageBytes, activeWallet.secretKey);
    };

    // Prepare transaction for approval
    const handlePrepareTransaction = async () => {
        const activeAddress = getActiveAddress();
        const activeWallet = getActiveWallet();

        const amountNumber = Number(amount);
        if (!activeWallet || !activeAddress || !recipient || !Number.isFinite(amountNumber) || amountNumber <= 0) {
            alert('Please enter a valid address and amount');
            return;
        }

        // Anonymous mode supports SOL and USDC
        if (isAnonymousMode && selectedToken !== 'SOL' && selectedToken !== 'USDC') {
            alert(`Anonymous transfers only support SOL and USDC. Please switch token or use normal mode.`);
            return;
        }

        // For anonymous mode, check MAIN wallet balance for the selected token
        // Also need SOL for gas fees in all cases
        let checkBalance: number;
        if (isAnonymousMode) {
            if (selectedToken === 'SOL') {
                checkBalance = onChainBalance;
            } else if (selectedToken === 'USDC') {
                checkBalance = onChainUsdcBalance;
            } else {
                checkBalance = getTokenBalance(selectedToken);
            }
        } else {
            checkBalance = getTokenBalance(selectedToken);
        }

        // Estimate gas for anonymous transfer (always need SOL for gas)
        let estimatedGas = 0;
        if (isAnonymousMode) {
            setAnonymousStep('estimating');
            if (selectedToken === 'SOL') {
                estimatedGas = await estimateTotalAnonymousGas();
            } else {
                // USDC and other SPL tokens need more gas for ATA creation
                estimatedGas = await estimateSplTokenGas();
            }
            setAnonymousStep('idle');
        }

        // Minimum SOL to keep in main wallet for rent exemption
        const RENT_EXEMPT_MIN = 0.001;

        // For SOL transfers, total = amount + gas + rent reserve
        // For other tokens, need enough of the token AND enough SOL for gas + rent
        if (selectedToken === 'SOL') {
            const totalRequired = parseFloat(amount) + estimatedGas + (isAnonymousMode ? RENT_EXEMPT_MIN : 0);
            if (totalRequired > checkBalance) {
                if (isAnonymousMode) {
                    alert(`Insufficient SOL in main wallet. Need ${totalRequired.toFixed(6)} SOL (${amount} + ${estimatedGas.toFixed(6)} gas + ${RENT_EXEMPT_MIN} rent reserve)`);
                } else {
                    alert(`Insufficient SOL balance. Need ${totalRequired.toFixed(6)} SOL (including ${estimatedGas.toFixed(6)} gas)`);
                }
                return;
            }
        } else {
            // For non-SOL tokens, check token balance AND SOL for gas + rent
            if (parseFloat(amount) > checkBalance) {
                alert(`Insufficient ${selectedToken} balance. Need ${parseFloat(amount).toFixed(6)} ${selectedToken}`);
                return;
            }
            // Also check SOL for gas + rent (use onChainBalance for direct, shieldedBalance for private/external)
            const solForGas = isAnonymousMode ? onChainBalance : (transferType === 'direct' ? onChainBalance : shieldedBalance);
            const totalSolNeeded = estimatedGas + (isAnonymousMode ? RENT_EXEMPT_MIN : 0);
            if (isAnonymousMode && totalSolNeeded > solForGas) {
                alert(`Insufficient SOL for gas in main wallet. Need ${totalSolNeeded.toFixed(6)} SOL (${estimatedGas.toFixed(6)} gas + ${RENT_EXEMPT_MIN} rent reserve)`);
                return;
            }
        }

        // Create transaction preview (message is for display only)
        const transferTypeLabel = isAnonymousMode ? 'Anonymous' : (transferType === 'internal' ? 'Private' : transferType === 'external' ? 'External' : 'Direct');
        const displayMessage = `${transferTypeLabel} transfer of ${amount} ${selectedToken} to ${recipient.slice(0, 8)}...`;

        const preview: TransactionPreview = {
            type: transferType,
            sender: isAnonymousMode ? (address || '') : activeAddress,
            recipient: recipient,
            amount: amount,
            token: selectedToken,
            estimatedFee: isAnonymousMode ? `~${estimatedGas.toFixed(6)} SOL (2 txns)` : '0.00005 SOL',
            message: displayMessage,
            isAnonymous: isAnonymousMode,
            estimatedGas: estimatedGas,
        };

        setTxPreview(preview);
        setShowApprovalModal(true);
    };

    // Execute anonymous two-hop transfer
    const handleAnonymousTransfer = async () => {
        if (!txPreview || !wallet || !anonymousWallet || !address) return;

        setSigning(true);
        try {
            const result = await executeAnonymousTransfer({
                mainWallet: wallet,
                anonymousWallet: anonymousWallet,
                recipientAddress: txPreview.recipient,
                amount: parseFloat(txPreview.amount),
                token: selectedToken === 'SOL' ? 'SOL' : selectedToken === 'USDC' ? 'USDC' : 'SOL',
                onProgress: (step, hash) => {
                    if (step === 'funding') {
                        setAnonymousStep('funding');
                    } else if (step === 'sending') {
                        setAnonymousStep('sending');
                        if (hash) setFundingTxHash(hash);
                    } else if (step === 'complete') {
                        setAnonymousStep('complete');
                    }
                }
            });

            setFundingTxHash(result.fundingTxHash);
            setTxHash(result.transferTxHash);

            // Save to transaction history
            if (address) {
                txStore.addTransaction(address, {
                    type: 'send',
                    status: 'confirmed',
                    fromToken: selectedToken,
                    amount: txPreview.amount,
                    recipient: txPreview.recipient,
                    txHash: result.transferTxHash,
                    isPrivate: true,
                });
            }

            setShowApprovalModal(false);
            setShowSuccessModal(true);
            refreshBalance();
        } catch (err: any) {
            console.error('[Send] Anonymous transfer failed:', err);
            const parsed = parseTransactionError(err);
            setErrorMessage(JSON.stringify(parsed));
            setShowApprovalModal(false);
            setShowErrorModal(true);
            setAnonymousStep('idle');
        } finally {
            setSigning(false);
        }
    };

    // Handle direct transfer (main wallet to main wallet, regular on-chain)
    const handleDirectTransfer = async () => {
        if (!txPreview) return;

        const activeWallet = getActiveWallet();
        const activeAddress = getActiveAddress();

        if (!activeWallet || !activeAddress) return;

        setSigning(true);
        try {
            const amountNumber = Number(txPreview.amount);
            if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
                setErrorMessage('Invalid amount. Please enter a valid number.');
                setShowApprovalModal(false);
                setShowErrorModal(true);
                return;
            }

            const connection = getConnection();
            let signature: string;

            if (txPreview.token === 'SOL') {
                // Direct SOL transfer
                signature = await sendSol(activeWallet, txPreview.recipient, amountNumber);
            } else {
                // Direct SPL token transfer
                const mintAddress = TOKEN_MINTS[txPreview.token];
                if (!mintAddress) {
                    throw new Error(`Token ${txPreview.token} not supported for direct transfers`);
                }

                const mint = new PublicKey(mintAddress);
                const recipientPubkey = new PublicKey(txPreview.recipient);
                const senderPubkey = activeWallet.publicKey;

                // Get or create associated token accounts
                const senderAta = await getAssociatedTokenAddress(mint, senderPubkey);
                const recipientAta = await getAssociatedTokenAddress(mint, recipientPubkey);

                // Calculate token amount in smallest units (USDC has 6 decimals, BONK has 5)
                const decimals = txPreview.token === 'USDC' ? 6 : txPreview.token === 'BONK' ? 5 : 9;
                const tokenAmount = Math.floor(amountNumber * Math.pow(10, decimals));

                const transaction = new Transaction();

                // Check if recipient ATA exists, if not, create it
                try {
                    await getAccount(connection, recipientAta);
                } catch {
                    // ATA doesn't exist, add create instruction
                    transaction.add(
                        createAssociatedTokenAccountInstruction(
                            senderPubkey, // payer
                            recipientAta, // ata
                            recipientPubkey, // owner
                            mint // mint
                        )
                    );
                }

                // Add transfer instruction
                transaction.add(
                    createTransferInstruction(
                        senderAta,
                        recipientAta,
                        senderPubkey,
                        tokenAmount
                    )
                );

                signature = await sendAndConfirmTransaction(connection, transaction, [activeWallet]);
            }

            // Save to transaction history (direct transfers are public)
            if (activeAddress) {
                txStore.addTransaction(activeAddress, {
                    type: 'send',
                    status: 'confirmed',
                    fromToken: txPreview.token,
                    amount: txPreview.amount,
                    recipient: txPreview.recipient,
                    txHash: signature,
                    isPrivate: false,
                });
            }

            setTxHash(signature);
            setShowApprovalModal(false);
            setShowSuccessModal(true);
            refreshBalance();
        } catch (err: any) {
            console.error('[Send] Direct transfer failed:', err);
            const parsed = parseTransactionError(err);
            setErrorMessage(JSON.stringify(parsed));
            setShowApprovalModal(false);
            setShowErrorModal(true);
        } finally {
            setSigning(false);
        }
    };

    // Sign and send normal transaction
    const handleSignAndSend = async () => {
        if (!txPreview) return;

        // If anonymous mode, use two-hop transfer
        if (txPreview.isAnonymous) {
            await handleAnonymousTransfer();
            return;
        }

        // If direct transfer, use regular on-chain transfer
        if (txPreview.type === 'direct') {
            await handleDirectTransfer();
            return;
        }

        const activeWallet = getActiveWallet();
        const activeAddress = getActiveAddress();

        if (!activeWallet || !activeAddress) return;

        setSigning(true);
        try {
            const amountNumber = Number(txPreview.amount);
            if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
                setErrorMessage('Invalid amount. Please enter a valid number.');
                setShowApprovalModal(false);
                setShowErrorModal(true);
                return;
            }

            let txSig: string | undefined;

            // On Android WebView, use backend API to avoid WASM loading issues
            // Backend generates ZK proof server-side, we just need to provide signature
            if (isAndroidWebView()) {
                console.log('[Send] Android WebView detected - using backend API for private transfer');

                // Generate signature for authentication (same format as SDK)
                const transferType = txPreview.type === 'internal' ? 'internal_transfer' : 'external_transfer';
                const nonce = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const timestamp = Math.floor(Date.now() / 1000);
                const signatureMessage = `shadowpay:${transferType}:${nonce}:${timestamp}`;

                // Sign the message
                const encoder = new TextEncoder();
                const messageBytes = encoder.encode(signatureMessage);
                const signatureBytes = await signMessageBytes(messageBytes);

                // Convert to base58 (same as SDK)
                const bs58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
                let signatureBase58 = '';
                const bytes = Array.from(signatureBytes);
                let num = BigInt(0);
                for (const byte of bytes) {
                    num = num * BigInt(256) + BigInt(byte);
                }
                while (num > 0) {
                    signatureBase58 = bs58Chars[Number(num % BigInt(58))] + signatureBase58;
                    num = num / BigInt(58);
                }
                // Handle leading zeros
                for (const byte of bytes) {
                    if (byte === 0) signatureBase58 = '1' + signatureBase58;
                    else break;
                }

                console.log('[Send] Signature generated for backend API');

                const apiResult = await executeTransfer({
                    sender: activeAddress,
                    recipient: txPreview.recipient,
                    amount: amountNumber,
                    token: txPreview.token,
                    type: txPreview.type as 'internal' | 'external',
                    sender_signature: signatureBase58,
                });

                if (!apiResult.success) {
                    throw new Error(apiResult.error || 'Transfer failed');
                }

                txSig = apiResult.data?.tx_signature;
            } else {
                // Execute transfer directly via ShadowWire SDK (browser with WASM support)
                console.log('[Send] Browser detected - using client-side SDK for private transfer');
                const result: any = await shadowWireClient.transfer({
                    sender: activeAddress,
                    recipient: txPreview.recipient,
                    amount: amountNumber,
                    token: txPreview.token as any,
                    type: txPreview.type as 'internal' | 'external',
                    wallet: {
                        signMessage: async (bytes: Uint8Array) => signMessageBytes(bytes),
                    },
                });

                txSig = result?.tx_signature || result?.signature || result?.txSignature ||
                    (typeof result === 'string' ? result : undefined);
            }

            setTxHash(txSig || 'shadowwire-tx');

            // Save to transaction history (private/ShadowWire transfers)
            const activeAddr = getActiveAddress();
            if (activeAddr) {
                console.log('[Send] Saving private transaction to txStore:', {
                    address: activeAddr,
                    amount: txPreview.amount,
                    recipient: txPreview.recipient,
                    txHash: txSig,
                });
                txStore.addTransaction(activeAddr, {
                    type: 'send',
                    status: 'confirmed',
                    fromToken: txPreview.token,
                    amount: txPreview.amount,
                    recipient: txPreview.recipient,
                    txHash: txSig || 'shadowwire-tx',
                    isPrivate: true,
                });
            }

            setShowApprovalModal(false);
            setShowSuccessModal(true);
            refreshBalance();
        } catch (err: any) {
            console.error('[Send] Transaction failed:', err);
            const parsed = parseTransactionError(err);
            setErrorMessage(JSON.stringify(parsed));
            setShowApprovalModal(false);
            setShowErrorModal(true);
        } finally {
            setSigning(false);
        }
    };

    // Close success modal and go back
    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        setTxHash(null);
        setFundingTxHash(null);
        setAmount('0');
        setRecipient('');
        setAnonymousStep('idle');
        setLocation('/dashboard');
    };

    return (
        <div className="bg-[#121212] text-white h-full font-display antialiased relative">
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF611A]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FF611A]/5 rounded-full blur-[120px] pointer-events-none"></div>

            <header className="relative p-4 pt-8 pb-2 z-10 max-w-md mx-auto w-full flex items-center justify-between">
                <Link href="/dashboard" className="text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </Link>
                <div className="flex items-center gap-2">
                    <h2 className="text-white/90 text-lg font-bold leading-tight tracking-wide drop-shadow-sm">
                        {isAnonymousMode ? 'Anonymous Send' : 'Private Send'}
                    </h2>
                    {isAnonymousMode && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FF611A]/20 text-[#FF611A]">ANON</span>
                    )}
                </div>
                <div className="flex w-12 items-center justify-end">
                    <div className={`flex items-center justify-center rounded-full h-10 w-10 backdrop-blur border border-white/5 shadow-inner ${apiConnected ? 'bg-[#FF611A]/10 text-[#FF611A]' : 'bg-white/5 text-white/60'}`}>
                        <img src={LOGO_PATH} alt="PrivyPay" className="w-5 h-5 object-contain" />
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col px-6 pt-4 pb-32 relative z-10 max-w-md mx-auto w-full">
                {/* Anonymous Mode Banner */}
                {/* {isAnonymousMode && (
                    <div className="bg-gradient-to-r from-[#FF611A]/20 to-amber-500/10 border border-[#FF611A]/30 rounded-xl p-3 mb-4 flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#FF611A]">visibility_off</span>
                        <div className="flex-1">
                            <p className="text-[10px] text-[#FF611A] font-bold uppercase tracking-wider">Two-Hop Transfer</p>
                            <p className="text-[10px] text-white/60">Main → Temp → Recipient</p>
                        </div>
                    </div>
                )} */}

                {/* Amount Display */}
                <div className="flex flex-col items-center justify-center py-0 flex-grow-0 mb-2">
                    <div className="flex items-baseline gap-2 relative">
                        <div className="absolute inset-0 bg-[#FF611A]/20 blur-2xl rounded-full opacity-50 pointer-events-none"></div>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => {
                                const val = e.target.value;
                                // Allow empty, numbers, and single decimal point
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    // Don't add leading zeros (except for "0." decimal)
                                    if (val === '') {
                                        setAmount('');
                                    } else if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
                                        setAmount(val.replace(/^0+/, '') || '0');
                                    } else {
                                        setAmount(val);
                                    }
                                }
                            }}
                            onFocus={() => {
                                if (amount === '0') setAmount('');
                            }}
                            onBlur={() => {
                                if (amount === '' || amount === '.') setAmount('0');
                            }}
                            className="relative text-white text-[3.5rem] font-medium tracking-tight drop-shadow-[0_0_15px_rgba(255,97,26,0.2)] bg-transparent border-none outline-none text-center w-32 focus:outline-none"
                            style={{ caretColor: '#FF611A' }}
                        />

                        {/* Token Selector */}
                        <button
                            type="button"
                            className="relative flex items-center gap-1 text-[#FF611A] hover:text-[#FF8A50] transition-colors z-10"
                            onClick={() => setShowTokenSelect(!showTokenSelect)}
                        >
                            <span className="text-xl font-semibold">{selectedToken}</span>
                            <span className="material-symbols-outlined text-[16px]">expand_more</span>
                        </button>

                        {/* Token Dropdown */}
                        {showTokenSelect && (
                            <div className="absolute top-full right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px]">
                                {SEND_TOKENS.map(token => (
                                    <button
                                        key={token.symbol}
                                        type="button"
                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                                        onClick={() => { setSelectedToken(token.symbol); setShowTokenSelect(false); setAmount('0'); }}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-[#FF611A]/20 overflow-hidden flex items-center justify-center">
                                            {token.logo ? <img src={token.logo} alt={token.symbol} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-[#FF611A]">{token.symbol[0]}</span>}
                                        </div>
                                        <span className="font-medium text-sm text-white">{token.symbol}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className="text-white/40 text-sm font-medium mt-1 tracking-wide">
                        ≈ ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                    <p className="text-white/30 text-xs mt-1">
                        {isAnonymousMode ? 'Main Wallet' : (transferType === 'direct' ? 'Wallet' : 'Shielded')} Balance: {getTokenBalance(selectedToken).toFixed(4)} {selectedToken}
                    </p>
                </div>

                {/* Transfer Type Toggle - Hidden in anonymous mode */}
                {!isAnonymousMode && (
                    <div className="mb-4 flex items-center justify-center gap-2 flex-wrap">
                        <button
                            onClick={() => setTransferType('internal')}
                            className={`px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${transferType === 'internal' ? 'bg-[#FF611A] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                            Private
                        </button>
                        <button
                            onClick={() => setTransferType('external')}
                            className={`px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${transferType === 'external' ? 'bg-[#FF611A] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                            External
                        </button>
                        <button
                            onClick={() => setTransferType('direct')}
                            className={`px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${transferType === 'direct' ? 'bg-[#FF611A] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                            Direct
                        </button>
                    </div>
                )}

                {/* Transfer Type Description */}
                {!isAnonymousMode && (
                    <p className="text-white/40 text-[10px] text-center mb-4 px-4">
                        {transferType === 'internal' && 'Pool → Pool: Private transfer within ShadowWire'}
                        {transferType === 'external' && 'Pool → Wallet: From your pool to recipient\'s main wallet'}
                        {transferType === 'direct' && 'Wallet → Wallet: Regular on-chain transfer (public)'}
                    </p>
                )}

                {/* Recipient Address */}
                <div className="mb-4 relative group z-10">
                    <label className="block text-white/50 text-[11px] font-bold uppercase tracking-widest mb-2 pl-1">To Solana Address</label>
                    <div className="glass-input flex w-full items-stretch rounded-2xl overflow-hidden focus-within:border-[#FF611A]/60 focus-within:shadow-[0_0_25px_rgba(255,97,26,0.1)] transition-all duration-300">
                        <input
                            className="flex-1 bg-transparent border-none text-white placeholder:text-white/20 px-4 py-4 focus:outline-none focus:ring-0 text-base font-medium outline-none"
                            placeholder="Paste Solana address..."
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                        <button type="button" className="px-5 flex items-center justify-center text-[#FF611A]/80 border-l border-white/5 hover:bg-white/5 hover:text-[#FF611A] transition-colors">
                            <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
                        </button>
                    </div>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-y-2 gap-x-4 px-2 mb-6 mt-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleKeypad(num)}
                            className="flex items-center justify-center h-14 w-full text-2xl font-light text-white/90 transition-all duration-200 rounded-2xl hover:bg-white/5 active:bg-[#FF611A]/20 active:scale-95 select-none"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleBackspace}
                        className="flex items-center justify-center h-14 w-full text-white/50 hover:text-white transition-all duration-200 rounded-2xl hover:bg-white/5 active:bg-[#FF611A]/20 active:scale-95 select-none"
                    >
                        <span className="material-symbols-outlined text-[24px]">backspace</span>
                    </button>
                </div>

                {/* Send Button */}
                <button
                    onClick={handlePrepareTransaction}
                    disabled={loading}
                    className={`w-full ${loading ? 'opacity-50 grayscale' : 'bg-[#FF611A]'} text-white font-bold h-[60px] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,97,26,0.35)] hover:shadow-[0_0_45px_rgba(255,97,26,0.5)] relative overflow-hidden group`}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 blur-md"></div>
                    <span className="material-symbols-outlined relative z-10">visibility_off</span>
                    <span className="relative z-10 text-lg tracking-wide">Review & Sign</span>
                </button>
            </main>

            {/* Transaction Approval Modal */}
            {showApprovalModal && txPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {txPreview.isAnonymous ? 'Anonymous Transfer' : 'Approve Transaction'}
                            </h3>
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Anonymous Transfer Explanation */}
                        {txPreview.isAnonymous && (
                            <div className="bg-[#FF611A]/10 border border-[#FF611A]/30 rounded-xl p-3 mb-4">
                                <p className="text-[10px] text-[#FF611A] font-bold uppercase tracking-wider mb-2">Two-Hop Anonymous Transfer</p>
                                <div className="flex items-center gap-2 text-[10px] text-white/60">
                                    <span className="font-mono">Main</span>
                                    <span className="material-symbols-outlined text-[12px] text-[#FF611A]">arrow_forward</span>
                                    <span className="font-mono">Temp</span>
                                    <span className="material-symbols-outlined text-[12px] text-[#FF611A]">arrow_forward</span>
                                    <span className="font-mono">Recipient</span>
                                </div>
                            </div>
                        )}

                        {/* Transaction Summary */}
                        <div className="bg-[#121212] rounded-2xl p-4 mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-slate-400 text-sm">Amount</span>
                                <div className="text-right">
                                    <p className="text-white text-xl font-bold">{txPreview.amount} {txPreview.token}</p>
                                    <p className="text-slate-500 text-xs">
                                        ≈ ${(parseFloat(txPreview.amount) * (txPreview.token === 'SOL' ? solPrice : 1)).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-xs">Type</span>
                                    <span className={`text-xs font-bold uppercase ${txPreview.isAnonymous ? 'text-[#FF611A]' : txPreview.type === 'internal' ? 'text-[#FF611A]' : 'text-white'}`}>
                                        {txPreview.isAnonymous ? '🔒 Anonymous' : txPreview.type === 'internal' ? '🔒 Private' : '🌐 Public'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-xs">From</span>
                                    <span className="text-white text-xs font-mono">{txPreview.sender.slice(0, 8)}...{txPreview.sender.slice(-6)}</span>
                                </div>
                                {txPreview.isAnonymous && anonymousAddress && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 text-xs">Via (Temp)</span>
                                        <span className="text-[#FF611A] text-xs font-mono">{anonymousAddress.slice(0, 8)}...{anonymousAddress.slice(-6)}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-xs">To</span>
                                    <span className="text-white text-xs font-mono">{txPreview.recipient.slice(0, 8)}...{txPreview.recipient.slice(-6)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-xs">Network Fee</span>
                                    <span className="text-white text-xs">{txPreview.estimatedFee}</span>
                                </div>
                            </div>
                        </div>

                        {/* Anonymous Progress Steps */}
                        {txPreview.isAnonymous && signing && (
                            <div className="bg-[#121212] rounded-xl p-4 mb-4">
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-3 ${anonymousStep === 'funding' || anonymousStep === 'sending' || anonymousStep === 'complete' ? 'text-white' : 'text-slate-500'}`}>
                                        {anonymousStep === 'funding' ? (
                                            <span className="material-symbols-outlined text-[#FF611A] animate-spin text-[18px]">sync</span>
                                        ) : (anonymousStep === 'sending' || anonymousStep === 'complete') ? (
                                            <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>
                                        )}
                                        <span className="text-xs">Funding temp wallet...</span>
                                    </div>
                                    <div className={`flex items-center gap-3 ${anonymousStep === 'sending' || anonymousStep === 'complete' ? 'text-white' : 'text-slate-500'}`}>
                                        {anonymousStep === 'sending' ? (
                                            <span className="material-symbols-outlined text-[#FF611A] animate-spin text-[18px]">sync</span>
                                        ) : anonymousStep === 'complete' ? (
                                            <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>
                                        )}
                                        <span className="text-xs">Sending to recipient...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Warning */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-amber-400 text-[18px]">warning</span>
                                <p className="text-amber-400 text-xs">
                                    {txPreview.isAnonymous
                                        ? 'This will execute 2 transactions. Funds will first go to a temporary wallet, then to the recipient.'
                                        : 'By signing, you authorize this transaction. This action cannot be undone.'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                disabled={signing}
                                className="py-4 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignAndSend}
                                disabled={signing}
                                className="py-4 rounded-xl bg-[#FF611A] text-white font-bold shadow-[0_0_20px_rgba(255,97,26,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {signing ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                                        {anonymousStep === 'funding' ? 'Funding...' : anonymousStep === 'sending' ? 'Sending...' : 'Processing...'}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                        {txPreview.isAnonymous ? 'Execute' : 'Sign & Send'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && txHash && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FF611A]/10 flex items-center justify-center">
                            <img src={LOGO_PATH} alt="PrivyPay" className="w-12 h-12 object-contain" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">
                            {txPreview?.isAnonymous ? 'Anonymous Transfer Complete!' : 'Authorization Signed!'}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            {txPreview?.isAnonymous
                                ? 'Your funds were sent through a temporary wallet for privacy.'
                                : 'Your transaction authorization has been cryptographically signed.'
                            }
                        </p>

                        {/* Anonymous: Show both TX hashes */}
                        {txPreview?.isAnonymous && fundingTxHash && (
                            <div className="bg-[#121212] rounded-xl p-4 mb-3 text-left">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Funding TX</p>
                                <p className="text-xs font-mono text-slate-400 truncate">{fundingTxHash}</p>
                            </div>
                        )}

                        <div className="bg-[#121212] rounded-xl p-4 mb-6 text-left">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                                {txPreview?.isAnonymous ? 'Transfer TX' : 'Digital Signature'}
                            </p>
                            <p className="text-[#FF611A] font-mono text-xs break-all">{txHash}</p>
                        </div>

                        <button
                            onClick={() => navigator.clipboard.writeText(txHash)}
                            className="w-full py-3 rounded-xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 mb-3"
                        >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            Copy TX Hash
                        </button>

                        <button
                            onClick={handleSuccessClose}
                            className="w-full py-4 rounded-xl bg-[#FF611A] text-white font-bold shadow-[0_0_20px_rgba(255,97,26,0.3)]"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (() => {
                // Parse the error message if it's in JSON format
                let parsedError = { title: 'Transaction Failed', message: errorMessage, suggestion: '' };
                try {
                    if (errorMessage.startsWith('{')) {
                        parsedError = JSON.parse(errorMessage);
                    }
                } catch {
                    // Keep default if parsing fails
                }
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-[#1a1a1a] border border-red-500/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-500 text-[48px]">error</span>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">{parsedError.title}</h3>
                            <p className="text-slate-400 text-sm mb-4">
                                {parsedError.message}
                            </p>

                            {parsedError.suggestion && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-left">
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-amber-400 text-[18px] flex-shrink-0 mt-0.5">lightbulb</span>
                                        <p className="text-amber-300 text-xs">{parsedError.suggestion}</p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setShowErrorModal(false);
                                    setErrorMessage('');
                                }}
                                className="w-full py-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors mb-3"
                            >
                                Try Again
                            </button>

                            <button
                                onClick={() => {
                                    setShowErrorModal(false);
                                    setErrorMessage('');
                                    setAmount('0');
                                    setRecipient('');
                                    setLocation('/dashboard');
                                }}
                                className="w-full py-3 rounded-xl bg-transparent text-slate-400 font-medium hover:text-white transition-colors"
                            >
                                Go Back to Dashboard
                            </button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Send;

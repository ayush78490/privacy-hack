import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '../context/WalletContext';
import * as api from '../utils/api';
import bs58 from 'bs58';

// Token configuration
const SEND_TOKENS = [
    { symbol: 'SOL', name: 'Solana', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
    { symbol: 'USDC', name: 'USD Coin', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
    { symbol: 'RADR', name: 'Radr', logo: '' },
    { symbol: 'BONK', name: 'Bonk', logo: 'https://assets.coingecko.com/coins/images/28600/standard/bonk.jpg' },
];

// SOL price placeholder
const SOL_PRICE_USD = 135.42;

interface TransactionPreview {
    type: 'internal' | 'external';
    sender: string;
    recipient: string;
    amount: string;
    token: string;
    estimatedFee: string;
    message: string;
    signature?: string;
}

const Send: React.FC = () => {
    const { wallet, address, balance, usdcBalance, tokenBalances, refreshBalance, apiConnected } = useWallet();
    const [, setLocation] = useLocation();
    const [amount, setAmount] = useState('0');
    const [recipient, setRecipient] = useState('');
    const [loading] = useState(false);
    const [transferType, setTransferType] = useState<'internal' | 'external'>('internal');
    const [selectedToken, setSelectedToken] = useState('SOL');
    const [showTokenSelect, setShowTokenSelect] = useState(false);

    // Transaction approval state
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [txPreview, setTxPreview] = useState<TransactionPreview | null>(null);
    const [signing, setSigning] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Get balance for selected token
    const getTokenBalance = (symbol: string): number => {
        if (symbol === 'SOL') return balance;
        if (symbol === 'USDC') return usdcBalance;
        const tb = tokenBalances.find(t => t.symbol === symbol);
        return tb?.balanceFormatted || 0;
    };

    // USD value calculation
    const usdValue = useMemo(() => {
        const amt = parseFloat(amount) || 0;
        if (selectedToken === 'SOL') return amt * SOL_PRICE_USD;
        if (selectedToken === 'USDC') return amt;
        return 0;
    }, [amount, selectedToken]);

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
            if (prev.length === 1) return '0';
            return prev.slice(0, -1);
        });
    };

    // Generate signature message for transaction
    const generateSignatureMessage = (type: 'internal' | 'external', amt: string, token: string, to: string): string => {
        const timestamp = Date.now();
        const message = `ShadowWire Transaction\n\nType: ${type === 'internal' ? 'Private' : 'External'}\nAmount: ${amt} ${token}\nTo: ${to}\nTimestamp: ${timestamp}\n\nSign to approve this transaction.`;
        return message;
    };

    // Sign message with wallet
    const signMessage = async (message: string): Promise<string> => {
        if (!wallet) throw new Error('Wallet not available');

        const messageBytes = new TextEncoder().encode(message);
        // Use nacl to sign with the wallet's secret key
        const nacl = await import('tweetnacl');
        const signature = nacl.sign.detached(messageBytes, wallet.secretKey);
        return bs58.encode(signature);
    };

    // Prepare transaction for approval
    const handlePrepareTransaction = async () => {
        if (!wallet || !address || !recipient || parseFloat(amount) <= 0) {
            alert('Please enter a valid address and amount');
            return;
        }

        const tokenBalance = getTokenBalance(selectedToken);
        if (parseFloat(amount) > tokenBalance) {
            alert('Insufficient balance');
            return;
        }

        // Generate signature message
        const message = generateSignatureMessage(transferType, amount, selectedToken, recipient);

        // Create transaction preview
        const preview: TransactionPreview = {
            type: transferType,
            sender: address,
            recipient: recipient,
            amount: amount,
            token: selectedToken,
            estimatedFee: '0.00005 SOL',
            message: message,
        };

        setTxPreview(preview);
        setShowApprovalModal(true);
    };

    // Sign and send transaction
    const handleSignAndSend = async () => {
        if (!txPreview || !wallet || !address) return;

        setSigning(true);
        try {
            // Sign the message
            console.log('[Send] Signing transaction message...');
            const signature = await signMessage(txPreview.message);
            console.log('[Send] Signature generated:', signature.slice(0, 20) + '...');

            // Update preview with signature
            setTxPreview(prev => prev ? { ...prev, signature } : null);

            if (apiConnected) {
                // Use ShadowWire API with signature auth
                const result = await api.executeTransfer({
                    sender: address,
                    recipient: txPreview.recipient,
                    amount: parseFloat(txPreview.amount),
                    token: txPreview.token,
                    type: txPreview.type,
                    zk_auth: {
                        signature_base64: btoa(signature),
                        signature_message: txPreview.message,
                    },
                    transfer_auth: {
                        signature_base64: btoa(signature),
                        signature_message: txPreview.message,
                    },
                });

                if (result.success && result.data) {
                    console.log('[Send] Transaction successful:', result.data);
                    setTxHash(result.data.tx_signature || signature);
                    setShowApprovalModal(false);
                    setShowSuccessModal(true);
                    refreshBalance();
                } else {
                    // Even if API returns error, show signature was created
                    console.log('[Send] API Response:', result);
                    setTxHash(signature);
                    setShowApprovalModal(false);
                    setShowSuccessModal(true);
                }
            } else {
                // Fallback: Direct on-chain send
                const { sendShielded } = await import('../utils/solana');
                const result = await sendShielded(wallet, txPreview.recipient, parseFloat(txPreview.amount));
                console.log('[Send] Fallback transaction successful:', result);
                setTxHash(result.ghostId || signature);
                setShowApprovalModal(false);
                setShowSuccessModal(true);
                refreshBalance();
            }
        } catch (err: any) {
            console.error('[Send] Transaction failed:', err);
            alert(`Transaction failed: ${err.message || 'Unknown error'}`);
        } finally {
            setSigning(false);
        }
    };

    // Close success modal and go back
    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        setTxHash(null);
        setAmount('0');
        setRecipient('');
        setLocation('/dashboard');
    };

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-[#121212] pb-24">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-[#FF611A]/10 rounded-full blur-[100px] opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-full h-[400px] bg-[#FF611A]/5 rounded-full blur-[80px] pointer-events-none"></div>

            <header className="relative flex items-center justify-between p-4 pt-8 pb-2 z-10">
                <Link href="/dashboard" className="text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </Link>
                <h2 className="text-white/90 text-lg font-bold leading-tight tracking-wide flex-1 text-center drop-shadow-sm">Private Send</h2>
                <div className="flex w-12 items-center justify-end">
                    <div className={`flex items-center justify-center rounded-full h-10 w-10 backdrop-blur border border-white/5 shadow-inner ${apiConnected ? 'bg-[#FF611A]/10 text-[#FF611A]' : 'bg-white/5 text-white/60'}`}>
                        <span className="material-symbols-outlined text-[20px] filled">shield</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col px-6 pt-4 pb-8 relative z-10">
                {/* Amount Display */}
                <div className="flex flex-col items-center justify-center py-6 flex-grow-0 mb-2">
                    <div className="flex items-baseline gap-2 relative">
                        <div className="absolute inset-0 bg-[#FF611A]/20 blur-2xl rounded-full opacity-50"></div>
                        <h1 className="relative text-white text-[3.5rem] font-medium tracking-tight drop-shadow-[0_0_15px_rgba(255,97,26,0.2)]">{amount}</h1>

                        {/* Token Selector */}
                        <button
                            className="relative flex items-center gap-1 text-[#FF611A] hover:text-[#FF8A50] transition-colors"
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
                        Balance: {getTokenBalance(selectedToken).toFixed(4)} {selectedToken}
                    </p>
                </div>

                {/* Transfer Type Toggle */}
                <div className="mb-4 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setTransferType('internal')}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${transferType === 'internal' ? 'bg-[#FF611A] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        Internal (Private)
                    </button>
                    <button
                        onClick={() => setTransferType('external')}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${transferType === 'external' ? 'bg-[#FF611A] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        External
                    </button>
                </div>

                {/* Recipient Address */}
                <div className="mb-4 relative group">
                    <label className="block text-white/50 text-[11px] font-bold uppercase tracking-widest mb-2 pl-1">To Solana Address</label>
                    <div className="glass-input flex w-full items-stretch rounded-2xl overflow-hidden focus-within:border-[#FF611A]/60 focus-within:shadow-[0_0_25px_rgba(255,97,26,0.1)] transition-all duration-300">
                        <input
                            className="flex-1 bg-transparent border-none text-white placeholder:text-white/20 px-4 py-4 focus:ring-0 text-base font-medium"
                            placeholder="Paste Solana address..."
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                        />
                        <button className="px-5 flex items-center justify-center text-[#FF611A]/80 border-l border-white/5 hover:bg-white/5 hover:text-[#FF611A] transition-colors">
                            <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
                        </button>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mb-auto">
                    <div className="glass-card flex items-stretch justify-between gap-4 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#FF611A]/20 rounded-full blur-[60px] pointer-events-none mix-blend-screen opacity-50"></div>
                        <div className="flex flex-col gap-2 flex-[3] relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#FF611A] text-[20px] drop-shadow-[0_0_8px_rgba(255,97,26,0.6)] filled">lock</span>
                                <p className="text-white text-sm font-bold leading-tight tracking-wide">
                                    {transferType === 'internal' ? 'Ghost Mode Active' : 'External Transfer'}
                                </p>
                            </div>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed">
                                {transferType === 'internal'
                                    ? <>Powered by <span className="text-[#FF611A] font-semibold">ShadowWire</span>. Amount hidden via ZK proof.</>
                                    : <>Standard Solana transfer. Amount visible on explorer.</>
                                }
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-xl shrink-0 opacity-80 border border-white/10 shadow-lg overflow-hidden flex items-center justify-center bg-[#FF611A]/10">
                            <img src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" alt="Solana" className="w-8 h-8" />
                        </div>
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

                {/* Send Button - Opens Approval Modal */}
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
                            <h3 className="text-xl font-bold text-white">Approve Transaction</h3>
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Transaction Summary */}
                        <div className="bg-[#121212] rounded-2xl p-4 mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-slate-400 text-sm">Amount</span>
                                <div className="text-right">
                                    <p className="text-white text-xl font-bold">{txPreview.amount} {txPreview.token}</p>
                                    <p className="text-slate-500 text-xs">
                                        ≈ ${(parseFloat(txPreview.amount) * (txPreview.token === 'SOL' ? SOL_PRICE_USD : 1)).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-xs">Type</span>
                                    <span className={`text-xs font-bold uppercase ${txPreview.type === 'internal' ? 'text-[#FF611A]' : 'text-white'}`}>
                                        {txPreview.type === 'internal' ? '🔒 Private' : '🌐 Public'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-xs">From</span>
                                    <span className="text-white text-xs font-mono">{txPreview.sender.slice(0, 8)}...{txPreview.sender.slice(-6)}</span>
                                </div>
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

                        {/* Signature Message Preview */}
                        <div className="mb-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Signature Message</p>
                            <div className="bg-[#0f0f0f] rounded-xl p-3 font-mono text-[10px] text-slate-400 max-h-32 overflow-y-auto border border-white/5">
                                <pre className="whitespace-pre-wrap">{txPreview.message}</pre>
                            </div>
                        </div>

                        {/* Signature Display (if signed) */}
                        {txPreview.signature && (
                            <div className="mb-4">
                                <p className="text-[10px] text-[#FF611A] uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                    Signature Generated
                                </p>
                                <div className="bg-[#0f0f0f] rounded-xl p-3 font-mono text-[10px] text-[#FF611A] overflow-x-auto border border-[#FF611A]/20">
                                    {txPreview.signature.slice(0, 64)}...
                                </div>
                            </div>
                        )}

                        {/* Warning */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-amber-400 text-[18px]">warning</span>
                                <p className="text-amber-400 text-xs">
                                    By signing, you authorize this transaction. This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="py-4 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
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
                                        Signing...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                        Sign & Send
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
                            <span className="material-symbols-outlined text-[#FF611A] text-[48px] filled">verified</span>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">Authorization Signed!</h3>
                        <p className="text-slate-400 text-sm mb-2">Your transaction authorization has been cryptographically signed.</p>
                        <div className="flex justify-center mb-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span className="text-amber-400 text-xs font-bold">Pending Backend Processing</span>
                            </div>
                        </div>

                        {/* Transaction Hash */}
                        <div className="bg-[#121212] rounded-xl p-4 mb-6">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Digital Signature</p>
                            <p className="text-[#FF611A] font-mono text-xs break-all">{txHash}</p>
                        </div>

                        {/* Info Note */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4 text-left">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-400 text-[16px] mt-0.5">info</span>
                                <p className="text-blue-400 text-[11px]">
                                    This is a signed authorization, not a blockchain transaction. The backend will process and broadcast the actual transaction.
                                </p>
                            </div>
                        </div>

                        {/* Copy Button */}
                        <button
                            onClick={() => navigator.clipboard.writeText(txHash)}
                            className="w-full py-3 rounded-xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 mb-3"
                        >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            Copy Signature
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
        </div>
    );
};

export default Send;

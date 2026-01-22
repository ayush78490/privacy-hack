import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'wouter';
import { useWallet } from '../context/WalletContext';
import * as api from '../utils/api';
import * as txStore from '../utils/txStore';
import { executeJupiterSwap, getTokenDecimals } from '../utils/jupiter';
import bs58 from 'bs58';

// Default token logos
const TOKEN_LOGOS: Record<string, string> = {
    SOL: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    USDC: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    RADR: 'https://cryptologos.cc/logos/solana-sol-logo-full.svg',
    BONK: 'https://assets.coingecko.com/coins/images/28600/standard/bonk.jpg',
    ORE: 'https://assets.coingecko.com/coins/images/35707/standard/ore-logo.png',
    USDT: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
};

interface SwapPreview {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    route: string;
    estimatedFee: string;
    message: string;
    signature?: string;
}

const Swap: React.FC = () => {
    const { wallet, address, balance, usdcBalance, tokenBalances, tokens: contextTokens, apiConnected, refreshBalance, solPrice } = useWallet();
    const [swapTokens, setSwapTokens] = useState<api.Token[]>([]);
    const [fromToken, setFromToken] = useState('SOL');
    const [toToken, setToToken] = useState('USDC');
    const [fromAmount, setFromAmount] = useState('');
    const [loading] = useState(false);
    const [tokensLoading, setTokensLoading] = useState(true);
    const [showFromTokenSelect, setShowFromTokenSelect] = useState(false);
    const [showToTokenSelect, setShowToTokenSelect] = useState(false);

    // Approval state
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [swapPreview, setSwapPreview] = useState<SwapPreview | null>(null);
    const [signing, setSigning] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Swap mode: 'normal' = on-chain via Jupiter, 'private' = ShadowWire
    const [swapMode, setSwapMode] = useState<'normal' | 'private'>('normal');

    // Fetch tokens from backend on mount
    useEffect(() => {
        const fetchTokens = async () => {
            setTokensLoading(true);
            try {
                const tokens = await api.getTokens();
                if (tokens && tokens.length > 0) {
                    setSwapTokens(tokens);
                    console.log('[Swap] Loaded tokens from API:', tokens.length);
                } else if (contextTokens.length > 0) {
                    setSwapTokens(contextTokens);
                }
            } catch (err) {
                console.error('[Swap] Failed to load tokens:', err);
                if (contextTokens.length > 0) {
                    setSwapTokens(contextTokens);
                }
            } finally {
                setTokensLoading(false);
            }
        };
        fetchTokens();
    }, [contextTokens]);

    // Get balance for selected token
    const getTokenBalance = (symbol: string): number => {
        if (symbol === 'SOL') return balance;
        if (symbol === 'USDC') return usdcBalance;
        const tb = tokenBalances.find(t => t.symbol === symbol);
        return tb?.balanceFormatted || 0;
    };

    // Get token logo
    const getTokenLogo = (symbol: string) => TOKEN_LOGOS[symbol] || '';

    // Calculate receive amount (simple mock rate)
    const toAmount = useMemo(() => {
        const from = parseFloat(fromAmount) || 0;
        if (from <= 0) return '';

        if (fromToken === 'SOL' && toToken === 'USDC') {
            return (from * solPrice).toFixed(2);
        } else if (fromToken === 'USDC' && toToken === 'SOL') {
            return (from / solPrice).toFixed(6);
        }
        return from.toFixed(4);
    }, [fromAmount, fromToken, toToken]);

    // USD value of from amount
    const fromUsdValue = useMemo(() => {
        const from = parseFloat(fromAmount) || 0;
        if (fromToken === 'SOL') return from * solPrice;
        if (fromToken === 'USDC') return from;
        return 0;
    }, [fromAmount, fromToken]);

    // Swap token positions
    const handleSwapTokens = () => {
        const temp = fromToken;
        setFromToken(toToken);
        setToToken(temp);
        setFromAmount('');
    };

    // Set max amount
    const handleMax = () => {
        const bal = getTokenBalance(fromToken);
        setFromAmount(bal.toString());
    };

    // Generate signature message
    const generateSignatureMessage = (): string => {
        const timestamp = Date.now();
        return `ShadowWire Swap\n\nFrom: ${fromAmount} ${fromToken}\nTo: ${toAmount} ${toToken}\nRoute: ShadowWire + Jupiter\nTimestamp: ${timestamp}\n\nSign to approve this swap.`;
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

    // Prepare swap for approval
    const handlePrepareSwap = async () => {
        if (!fromAmount || parseFloat(fromAmount) <= 0) {
            alert('Please enter an amount');
            return;
        }

        if (parseFloat(fromAmount) > getTokenBalance(fromToken)) {
            alert('Insufficient balance');
            return;
        }

        if (!address) {
            alert('Please connect your wallet first');
            return;
        }

        const message = generateSignatureMessage();

        // For Normal swap, execute immediately on-chain
        if (swapMode === 'normal') {
            await handleNormalSwap();
            return;
        }

        // For Private swap, show approval modal
        const preview: SwapPreview = {
            fromToken,
            toToken,
            fromAmount,
            toAmount: toAmount || '0',
            route: 'ShadowWire + Jupiter',
            estimatedFee: '0.00005 SOL',
            message,
        };

        setSwapPreview(preview);
        setShowApprovalModal(true);
    };

    // Execute normal on-chain swap using Jupiter
    const handleNormalSwap = async () => {
        if (!wallet || !address) return;

        const amount = parseFloat(fromAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        setSigning(true);
        try {
            console.log('[Swap] Executing Jupiter swap...', { fromToken, toToken, amount });

            const { Connection } = await import('@solana/web3.js');
            const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
            const connection = new Connection(rpcUrl, 'confirmed');

            // Execute real swap via Jupiter
            const result = await executeJupiterSwap(
                connection,
                wallet,
                fromToken,
                toToken,
                amount,
                50 // 0.5% slippage
            );

            if (!result) {
                throw new Error('Swap failed - no result returned');
            }

            console.log('[Swap] Jupiter swap confirmed:', result.signature);

            // Calculate output amount for display
            const outputDecimals = getTokenDecimals(toToken);
            const outputAmount = (parseInt(result.outputAmount) / Math.pow(10, outputDecimals)).toFixed(6);

            setTxHash(result.signature);
            setShowSuccessModal(true);

            // Save transaction to local store
            txStore.addTransaction(address, {
                type: 'swap',
                status: 'confirmed',
                fromToken,
                toToken,
                amount: fromAmount,
                toAmount: outputAmount,
                txHash: result.signature,
                isPrivate: false,
            });

            refreshBalance();
        } catch (err: any) {
            console.error('[Swap] Jupiter swap failed:', err);
            alert(`Swap failed: ${err.message || 'Transaction error'}`);
        } finally {
            setSigning(false);
        }
    };

    // Sign and execute swap (for Private mode)
    const handleSignAndSwap = async () => {
        if (!swapPreview || !wallet) return;

        setSigning(true);
        try {
            console.log('[Swap] Signing swap message...');
            const signature = await signMessage(swapPreview.message);
            console.log('[Swap] Signature generated:', signature.slice(0, 20) + '...');

            setSwapPreview(prev => prev ? { ...prev, signature } : null);

            // Simulate swap (in production, integrate with Jupiter)
            await new Promise(r => setTimeout(r, 2000));

            setTxHash(signature);
            setShowApprovalModal(false);
            setShowSuccessModal(true);

            // Save transaction to local store
            if (address) {
                txStore.addTransaction(address, {
                    type: 'swap',
                    status: 'pending',
                    fromToken: swapPreview.fromToken,
                    toToken: swapPreview.toToken,
                    amount: swapPreview.fromAmount,
                    toAmount: swapPreview.toAmount,
                    txHash: signature,
                    isPrivate: true,
                });
            }

            refreshBalance();
        } catch (err: any) {
            console.error('[Swap] Error:', err);
            alert(`Swap failed: ${err.message}`);
        } finally {
            setSigning(false);
        }
    };

    // Close success modal
    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        setTxHash(null);
        setFromAmount('');
    };

    return (
        <div className="bg-[#121212] text-white min-h-screen font-display antialiased relative pb-24">
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF611A]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FF611A]/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="flex items-center p-4 pb-2 justify-between sticky top-0 z-30 backdrop-blur-xl bg-[#121212]/60 border-b border-white/5">
                <div className="w-12">
                    <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                </div>
                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-bold leading-tight tracking-wide text-white">
                        {swapMode === 'private' ? 'Private Swap' : 'Swap'}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${apiConnected ? 'bg-[#FF611A]' : 'bg-amber-400'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${apiConnected ? 'bg-[#FF611A]' : 'bg-amber-500'}`}></span>
                        </span>
                        <span className={`text-[10px] ${apiConnected ? 'text-[#FF611A]' : 'text-amber-400'} uppercase tracking-widest font-semibold`}>
                            {apiConnected ? 'ShadowWire Active' : 'RPC Mode'}
                        </span>
                    </div>
                </div>
                <div className="w-12 flex justify-end">
                    <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">tune</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col flex-1 px-4 py-6 max-w-md mx-auto w-full relative z-10">

                {/* Swap Mode Toggle */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    <button
                        onClick={() => setSwapMode('normal')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${swapMode === 'normal' ? 'bg-[#FF611A] text-white shadow-[0_0_20px_rgba(255,97,26,0.3)]' : 'bg-[#1a1a1a] text-slate-400 hover:bg-[#262626] border border-white/10'}`}
                    >
                        <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                        Normal Swap
                    </button>
                    <button
                        onClick={() => setSwapMode('private')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${swapMode === 'private' ? 'bg-[#FF611A] text-white shadow-[0_0_20px_rgba(255,97,26,0.3)]' : 'bg-[#1a1a1a] text-slate-400 hover:bg-[#262626] border border-white/10'}`}
                    >
                        <span className="material-symbols-outlined text-[16px] filled">shield</span>
                        Private Swap
                    </button>
                </div>

                {/* Tokens Count */}
                <div className="flex justify-center mb-4">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                        {tokensLoading ? 'Loading tokens...' : `${swapTokens.length} tokens available`}
                    </span>
                </div>

                <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-[#FF611A]/40 via-white/5 to-[#FF611A]/20 shadow-2xl">
                    <div className="bg-[#1a1a1a] rounded-[23px] relative overflow-hidden">
                        {/* From Token */}
                        <div className="p-5 pt-6 relative transition-all duration-300">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pay</span>
                                <div
                                    className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10"
                                    onClick={handleMax}
                                >
                                    <span className="material-symbols-outlined text-[#FF611A]" style={{ fontSize: '14px' }}>account_balance_wallet</span>
                                    <span className="text-slate-300 text-xs font-medium">{getTokenBalance(fromToken).toFixed(4)} {fromToken}</span>
                                    <span className="text-[#FF611A] text-[10px] font-bold uppercase">Max</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <input
                                        className="bg-transparent text-4xl font-bold text-white border-none p-0 focus:ring-0 w-full placeholder-slate-700 font-display tracking-tight"
                                        placeholder="0.0"
                                        type="number"
                                        value={fromAmount}
                                        onChange={(e) => setFromAmount(e.target.value)}
                                    />
                                    <p className="text-slate-500 text-sm mt-1 font-medium">
                                        ≈ ${fromUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="relative">
                                    <button
                                        className="flex shrink-0 items-center gap-2 bg-[#262626] hover:bg-[#2a2a2a] border border-white/10 rounded-full pl-2 pr-3 py-1.5 transition-all group shadow-lg"
                                        onClick={() => { setShowFromTokenSelect(!showFromTokenSelect); setShowToTokenSelect(false); }}
                                    >
                                        <div className="w-7 h-7 rounded-full bg-[#FF611A]/20 flex items-center justify-center overflow-hidden">
                                            {getTokenLogo(fromToken) ? (
                                                <img src={getTokenLogo(fromToken)} alt={fromToken} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-[#FF611A]">{fromToken[0]}</span>
                                            )}
                                        </div>
                                        <span className="text-lg font-bold">{fromToken}</span>
                                        <span className="material-symbols-outlined text-slate-500 group-hover:text-white transition-colors" style={{ fontSize: '20px' }}>expand_more</span>
                                    </button>

                                    {showFromTokenSelect && (
                                        <div className="absolute top-full right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-[300px] overflow-y-auto min-w-[180px]">
                                            {swapTokens.filter(t => t.symbol !== toToken).map(token => (
                                                <button
                                                    key={token.symbol}
                                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                                                    onClick={() => { setFromToken(token.symbol); setShowFromTokenSelect(false); }}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-[#FF611A]/20 overflow-hidden flex items-center justify-center">
                                                        {getTokenLogo(token.symbol) ? (
                                                            <img src={getTokenLogo(token.symbol)} alt={token.symbol} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-[#FF611A]">{token.symbol[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span className="font-medium text-sm">{token.symbol}</span>
                                                        <span className="text-[10px] text-slate-500">{token.name}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Swap Button */}
                        <div className="relative h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1 flex items-center justify-center z-10">
                            <button
                                className="absolute bg-[#1a1a1a] border-[3px] border-[#121212] p-2 rounded-xl text-[#FF611A] hover:text-[#FF8A50] hover:shadow-[0_0_20px_rgba(255,97,26,0.3)] hover:scale-110 transition-all duration-300 group"
                                onClick={handleSwapTokens}
                            >
                                <span className="material-symbols-outlined group-hover:-rotate-180 transition-transform duration-500">swap_vert</span>
                            </button>
                        </div>

                        {/* To Token */}
                        <div className="p-5 pb-6 relative transition-all duration-300">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Receive</span>
                                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                                    <span className="material-symbols-outlined text-[#FF611A]" style={{ fontSize: '14px' }}>account_balance_wallet</span>
                                    <span className="text-slate-300 text-xs font-medium">{getTokenBalance(toToken).toFixed(4)} {toToken}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <input
                                        className="bg-transparent text-4xl font-bold text-[#FF611A] border-none p-0 focus:ring-0 w-full placeholder-slate-700 font-display tracking-tight"
                                        placeholder="0.0"
                                        type="number"
                                        value={toAmount}
                                        readOnly
                                    />
                                    <p className="text-slate-500 text-sm mt-1 font-medium">
                                        {toToken === 'USDC' ? `≈ $${toAmount || '0.00'}` : ''}
                                    </p>
                                </div>
                                <div className="relative">
                                    <button
                                        className="flex shrink-0 items-center gap-2 bg-[#262626] hover:bg-[#2a2a2a] border border-white/10 rounded-full pl-2 pr-3 py-1.5 transition-all group shadow-lg"
                                        onClick={() => { setShowToTokenSelect(!showToTokenSelect); setShowFromTokenSelect(false); }}
                                    >
                                        <div className="w-7 h-7 rounded-full bg-[#FF611A]/20 flex items-center justify-center overflow-hidden">
                                            {getTokenLogo(toToken) ? (
                                                <img src={getTokenLogo(toToken)} alt={toToken} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-[#FF611A]">{toToken[0]}</span>
                                            )}
                                        </div>
                                        <span className="text-lg font-bold">{toToken}</span>
                                        <span className="material-symbols-outlined text-slate-500 group-hover:text-white transition-colors" style={{ fontSize: '20px' }}>expand_more</span>
                                    </button>

                                    {showToTokenSelect && (
                                        <div className="absolute top-full right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-[300px] overflow-y-auto min-w-[180px]">
                                            {swapTokens.filter(t => t.symbol !== fromToken).map(token => (
                                                <button
                                                    key={token.symbol}
                                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                                                    onClick={() => { setToToken(token.symbol); setShowToTokenSelect(false); }}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-[#FF611A]/20 overflow-hidden flex items-center justify-center">
                                                        {getTokenLogo(token.symbol) ? (
                                                            <img src={getTokenLogo(token.symbol)} alt={token.symbol} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-[#FF611A]">{token.symbol[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span className="font-medium text-sm">{token.symbol}</span>
                                                        <span className="text-[10px] text-slate-500">{token.name}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        
                    </div>
                </div>

                {/* Swap Info */}
                <div className="mt-6 px-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                        <span>Rate</span>
                        <span className="text-slate-300">
                            1 {fromToken} ≈ {fromToken === 'SOL' ? solPrice.toFixed(2) : (1 / solPrice).toFixed(6)} {toToken}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                        <span>Network Fee</span>
                        <span className="text-slate-300">~0.00005 SOL</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Privacy Level</span>
                        <span className="text-[#FF611A] font-medium">Maximum</span>
                    </div>
                </div>

                {/* Privacy Strength - Only for Private Swap */}
                {swapMode === 'private' && (
                    <div className="mt-6 mb-4">
                        <div className="flex justify-between items-end mb-2 px-1">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Privacy Strength</span>
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[#FF611A] filled" style={{ fontSize: '16px' }}>shield</span>
                                <span className="text-xs text-[#FF611A] font-bold uppercase tracking-wider">Untraceable</span>
                            </div>
                        </div>
                        <div className="h-3 w-full bg-[#1a1a1a] rounded-full overflow-hidden p-[2px] shadow-inner border border-white/5">
                            <div className="h-full w-full rounded-full bg-gradient-to-r from-[#FF611A] via-[#FF8A50] to-[#FF611A] animate-pulse"></div>
                        </div>
                    </div>
                )}

                {/* Swap Button */}
                <div className="mt-4 mb-6 relative group">
                    <div className={`absolute -inset-0.5 ${swapMode === 'private' ? 'bg-[#FF611A]' : 'bg-[#FF611A]'} rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse-slow`}></div>
                    <button
                        className={`relative w-full h-14 rounded-xl overflow-hidden ${swapMode === 'private' ? 'bg-[#FF611A]' : 'bg-[#FF611A]'} shadow-xl active:scale-[0.98] transition-all border border-white/10 disabled:opacity-50 disabled:grayscale`}
                        onClick={handlePrepareSwap}
                        disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
                    >
                        <div className="relative flex items-center justify-center gap-3 text-white z-10">
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                                {swapMode === 'private' ? 'shield' : 'swap_horiz'}
                            </span>
                            <span className="text-lg font-bold tracking-wide">
                                {swapMode === 'private' ? 'Review & Sign' : 'Swap Now'}
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Approval Modal */}
            {showApprovalModal && swapPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Approve Swap</h3>
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Swap Summary */}
                        <div className="bg-[#121212] rounded-2xl p-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#FF611A]/20 flex items-center justify-center overflow-hidden">
                                        {getTokenLogo(swapPreview.fromToken) ? (
                                            <img src={getTokenLogo(swapPreview.fromToken)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-[#FF611A]">{swapPreview.fromToken[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{swapPreview.fromAmount}</p>
                                        <p className="text-slate-500 text-xs">{swapPreview.fromToken}</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-[#FF611A]">arrow_forward</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#FF611A]/20 flex items-center justify-center overflow-hidden">
                                        {getTokenLogo(swapPreview.toToken) ? (
                                            <img src={getTokenLogo(swapPreview.toToken)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-[#FF611A]">{swapPreview.toToken[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[#FF611A] font-bold">{swapPreview.toAmount}</p>
                                        <p className="text-slate-500 text-xs">{swapPreview.toToken}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-3 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-xs">Route</span>
                                    <span className="text-white text-xs">{swapPreview.route}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-xs">Fee</span>
                                    <span className="text-white text-xs">{swapPreview.estimatedFee}</span>
                                </div>
                            </div>
                        </div>

                        {/* Signature Message */}
                        <div className="mb-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Signature Message</p>
                            <div className="bg-[#0f0f0f] rounded-xl p-3 font-mono text-[10px] text-slate-400 max-h-28 overflow-y-auto border border-white/5">
                                <pre className="whitespace-pre-wrap">{swapPreview.message}</pre>
                            </div>
                        </div>

                        {/* Signature Display */}
                        {swapPreview.signature && (
                            <div className="mb-4">
                                <p className="text-[10px] text-[#FF611A] uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                    Signature Generated
                                </p>
                                <div className="bg-[#0f0f0f] rounded-xl p-3 font-mono text-[10px] text-[#FF611A] border border-[#FF611A]/20 truncate">
                                    {swapPreview.signature.slice(0, 64)}...
                                </div>
                            </div>
                        )}

                        {/* Warning */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-amber-400 text-[18px]">warning</span>
                                <p className="text-amber-400 text-xs">
                                    By signing, you authorize this swap. Rates may vary slightly.
                                </p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowApprovalModal(false)}
                                className="py-4 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignAndSwap}
                                disabled={signing}
                                className="py-4 rounded-xl bg-[#FF611A] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {signing ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                                        Signing...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                        Sign & Swap
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
                            <span className="material-symbols-outlined text-[#FF611A] text-[48px] filled">{swapMode === 'normal' ? 'check_circle' : 'verified'}</span>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">{swapMode === 'normal' ? 'Swap Complete!' : 'Authorization Signed!'}</h3>
                        <p className="text-slate-400 text-sm mb-2">{swapMode === 'normal' ? 'Your swap executed on-chain successfully.' : 'Your swap authorization has been cryptographically signed.'}</p>
                        <div className="flex justify-center mb-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${swapMode === 'normal' ? 'bg-[#FF611A]/10 border-green-500/20' : 'bg-amber-500/10 border-amber-500/20'} border`}>
                                <span className={`w-2 h-2 rounded-full ${swapMode === 'normal' ? 'bg-[#FF611A]' : 'bg-amber-500 animate-pulse'}`}></span>
                                <span className={`text-xs font-bold ${swapMode === 'normal' ? 'text-green-400' : 'text-amber-400'}`}>
                                    {swapMode === 'normal' ? 'Confirmed on Solana' : 'Pending Backend Processing'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-[#121212] rounded-xl p-4 mb-6">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{swapMode === 'normal' ? 'Transaction Hash' : 'Digital Signature'}</p>
                            <p className="text-[#FF611A] font-mono text-xs break-all">{txHash}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                onClick={() => navigator.clipboard.writeText(txHash)}
                                className="py-3 rounded-xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                Copy
                            </button>
                            <button
                                onClick={() => window.open(`https://solscan.io/tx/${txHash}`, '_blank')}
                                className="py-3 rounded-xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                Explorer
                            </button>
                        </div>

                        <button
                            onClick={handleSuccessClose}
                            className="w-full py-4 rounded-xl bg-[#FF611A] text-white font-bold"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Swap;

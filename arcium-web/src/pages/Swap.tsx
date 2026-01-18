import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'wouter';
import { useWallet } from '../context/WalletContext';
import * as api from '../utils/api';

// Default token logos
const TOKEN_LOGOS: Record<string, string> = {
    SOL: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    USDC: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    RADR: 'https://cryptologos.cc/logos/solana-sol-logo-full.svg',
    BONK: 'https://assets.coingecko.com/coins/images/28600/standard/bonk.jpg',
    ORE: 'https://assets.coingecko.com/coins/images/35707/standard/ore-logo.png',
    USDT: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
};

// SOL price placeholder
const SOL_PRICE_USD = 135.42;

const Swap: React.FC = () => {
    const { balance, usdcBalance, tokenBalances, tokens: contextTokens, apiConnected, refreshBalance, address } = useWallet();
    const [swapTokens, setSwapTokens] = useState<api.Token[]>([]);
    const [fromToken, setFromToken] = useState('SOL');
    const [toToken, setToToken] = useState('USDC');
    const [fromAmount, setFromAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [tokensLoading, setTokensLoading] = useState(true);
    const [showFromTokenSelect, setShowFromTokenSelect] = useState(false);
    const [showToTokenSelect, setShowToTokenSelect] = useState(false);

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
            return (from * SOL_PRICE_USD).toFixed(2);
        } else if (fromToken === 'USDC' && toToken === 'SOL') {
            return (from / SOL_PRICE_USD).toFixed(6);
        }
        return from.toFixed(4);
    }, [fromAmount, fromToken, toToken]);

    // USD value of from amount
    const fromUsdValue = useMemo(() => {
        const from = parseFloat(fromAmount) || 0;
        if (fromToken === 'SOL') return from * SOL_PRICE_USD;
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

    // Execute swap
    const handleSwap = async () => {
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

        setLoading(true);
        try {
            console.log('[Swap] Initiating swap:', { from: fromToken, to: toToken, amount: fromAmount });
            await new Promise(r => setTimeout(r, 2000));
            alert(`Swap ${fromAmount} ${fromToken} → ${toAmount} ${toToken}\n\nThis will integrate with Jupiter aggregator for private swaps. Coming soon!`);
            refreshBalance();
        } catch (err: any) {
            console.error('[Swap] Error:', err);
            alert(`Swap failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
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
                    <h2 className="text-lg font-bold leading-tight tracking-wide text-white">Private Swap</h2>
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
                {/* Network Badge - Solana */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#1a1a1a] border border-white/10 shadow-lg">
                        <img src={TOKEN_LOGOS.SOL} alt="Solana" className="w-5 h-5 rounded-full" />
                        <span className="text-xs font-medium text-gray-300">Solana Mainnet</span>
                        <span className="material-symbols-outlined text-[#FF611A]" style={{ fontSize: '16px' }}>verified</span>
                    </div>
                </div>

                {/* Available Tokens Count */}
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

                        {/* Route Info */}
                        <div className="bg-black/30 border-t border-white/5 p-3 flex items-center justify-between relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#FF611A]/5 via-transparent to-[#FF611A]/5"></div>
                            <div className="flex items-center gap-2 z-10">
                                <div className="p-1 rounded bg-[#FF611A]/10 border border-[#FF611A]/20">
                                    <span className="material-symbols-outlined text-[#FF611A] animate-pulse" style={{ fontSize: '16px' }}>hub</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Route</span>
                                    <span className="text-xs font-semibold text-white">ShadowWire + Jupiter</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 z-10 opacity-80">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF611A] shadow-[0_0_5px_rgba(255,97,26,0.5)]"></span>
                                <div className="w-3 h-[1px] bg-slate-700"></div>
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF8A50]"></span>
                                <div className="w-3 h-[1px] bg-slate-700"></div>
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF611A] shadow-[0_0_5px_rgba(255,97,26,0.5)]"></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Swap Info */}
                <div className="mt-6 px-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                        <span>Rate</span>
                        <span className="text-slate-300">
                            1 {fromToken} ≈ {fromToken === 'SOL' ? SOL_PRICE_USD.toFixed(2) : (1 / SOL_PRICE_USD).toFixed(6)} {toToken}
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

                {/* Privacy Strength */}
                <div className="mt-6 mb-4">
                    <div className="flex justify-between items-end mb-2 px-1">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Privacy Strength</span>
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[#FF611A] filled" style={{ fontSize: '16px' }}>shield</span>
                            <span className="text-xs text-[#FF611A] font-bold uppercase tracking-wider drop-shadow-[0_0_8px_rgba(255,97,26,0.5)]">Untraceable</span>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-[#1a1a1a] rounded-full overflow-hidden p-[2px] shadow-inner border border-white/5">
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-[#FF611A] via-[#FF8A50] to-[#FF611A] animate-pulse shadow-[0_0_15px_rgba(255,97,26,0.3)] relative">
                        </div>
                    </div>
                </div>

                {/* Swap Button */}
                <div className="mt-4 mb-6 relative group">
                    <div className="absolute -inset-0.5 bg-[#FF611A] rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse-slow"></div>
                    <button
                        className="relative w-full h-14 rounded-xl overflow-hidden bg-[#FF611A] shadow-xl active:scale-[0.98] transition-all border border-white/10 disabled:opacity-50 disabled:grayscale"
                        onClick={handleSwap}
                        disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
                    >
                        <div className="relative flex items-center justify-center gap-3 text-white z-10">
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '24px' }}>sync</span>
                                    <span className="text-lg font-bold tracking-wide">Swapping...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>visibility_off</span>
                                    <span className="text-lg font-bold tracking-wide">Swap Untraceable</span>
                                </>
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Swap;

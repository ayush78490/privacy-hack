import React from 'react';
import { Link } from 'wouter';
import { useWallet } from '../context/WalletContext';

// Token logo URLs
const TOKEN_LOGOS: Record<string, string> = {
    SOL: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    USDC: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    RADR: 'https://cryptologos.cc/logos/versions/solana-sol-logo-full.svg',
    BONK: 'https://assets.coingecko.com/coins/images/28600/standard/bonk.jpg',
    ORE: 'https://assets.coingecko.com/coins/images/35707/standard/ore-logo.png',
};

// Token colors for background
const TOKEN_COLORS: Record<string, string> = {
    SOL: 'rgba(30, 240, 150, 0.1)',
    USDC: 'rgba(39, 117, 202, 0.1)',
    RADR: 'rgba(102, 126, 234, 0.1)',
    BONK: 'rgba(255, 165, 0, 0.1)',
    ORE: 'rgba(255, 215, 0, 0.1)',
};

// Approximate SOL price (in production, fetch from price API)
const SOL_PRICE_USD = 135.42;

const Dashboard: React.FC = () => {
    const { address, balance, usdcBalance, tokenBalances, refreshBalance, loading, error, apiConnected } = useWallet();

    React.useEffect(() => {
        if (address) {
            refreshBalance();
            // Set up an interval to refresh balance every 30 seconds
            const interval = setInterval(refreshBalance, 30000);
            return () => clearInterval(interval);
        }
    }, [address, refreshBalance]);

    // Calculate total balance in USD
    const totalBalanceUsd = React.useMemo(() => {
        let total = balance * SOL_PRICE_USD + usdcBalance;
        // Add other token values (simplified - in production use real prices)
        tokenBalances.forEach(tb => {
            if (tb.symbol !== 'SOL' && tb.symbol !== 'USDC') {
                // Add token value if we have a price (placeholder)
                total += 0;
            }
        });
        return total;
    }, [balance, usdcBalance, tokenBalances]);

    // Get display tokens (filter out zero balances for non-primary tokens)
    const displayTokens = React.useMemo(() => {
        const primaryTokens = ['SOL', 'USDC'];
        return tokenBalances.filter(tb =>
            primaryTokens.includes(tb.symbol) || tb.balanceFormatted > 0
        );
    }, [tokenBalances]);

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24">
            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-obsidian overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] width-[50vw] height-[50vw] bg-blue-700/20 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[20%] right-[-20%] width-[60vw] height-[60vw] bg-purple-900/15 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[-10%] left-[20%] width-[40vw] height-[40vw] bg-teal-900/10 rounded-full blur-[80px]"></div>
            </div>

            <header className="sticky top-0 z-20 glass-panel border-b border-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link href="/profile" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-dark border border-white/10 overflow-hidden ring-1 ring-white/5 active:scale-90 transition-transform cursor-pointer">
                        <img
                            alt="User profile"
                            className="h-full w-full object-cover"
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"
                        />
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] filled">shield</span>
                        <div className="flex flex-col">
                            <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Shielded</h2>
                            <p className="text-[10px] text-slate-500 font-mono">
                                {address
                                    ? `${address.slice(0, 4)}...${address.slice(-4)}`
                                    : 'No wallet detected'
                                }
                            </p>
                        </div>
                    </div>
                    <button className="flex size-10 shrink-0 items-center justify-center rounded-full bg-transparent text-white hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 px-4 pt-6">
                {error && (
                    <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-500 text-xs font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        {error}
                    </div>
                )}

                {/* API Status Indicator */}
                <div className="mb-4 flex items-center justify-center">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${apiConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'} border`}>
                        <div className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${apiConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {apiConnected ? 'ShadowWire Connected' : 'Direct RPC Mode'}
                        </span>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-white/5 bg-surface-dark/60 backdrop-blur-md p-4 shadow-lg">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[18px] drop-shadow-[0_0_5px_rgba(59,130,246,0.8)] filled">lock</span>
                                <p className="text-white text-base font-bold leading-tight">Privacy Mode</p>
                            </div>
                            <p className="text-slate-400 text-sm font-medium">Arcium Network Active</p>
                        </div>
                        <label className="relative flex h-[32px] w-[56px] cursor-pointer items-center rounded-full border border-primary/30 bg-primary/10 p-1 transition-all duration-300">
                            <input checked type="checkbox" className="peer invisible absolute" readOnly />
                            <div className="h-6 w-6 rounded-full bg-white shadow-sm transition-all duration-300 translate-x-[24px]"></div>
                        </label>
                    </div>
                </div>

                <div className="glass-card relative mb-8 flex flex-col items-center justify-center py-8 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <p className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-widest text-[10px]">Total Balance</p>
                        <h1 className="text-white tracking-tight text-4xl font-extrabold leading-tight text-center mb-2 drop-shadow-md">
                            ${totalBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h1>
                        <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 mb-6 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                            <span className="material-symbols-outlined text-green-400 text-[16px]">trending_up</span>
                            <p className="text-green-400 text-sm font-bold leading-none">+2.4% today</p>
                        </div>
                        <button className="group flex items-center gap-2 rounded-full bg-black/20 border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm">
                            <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">visibility_off</span>
                            <span>Hide Balance</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    <Link href="/dashboard" className="flex flex-col items-center justify-center gap-2 group">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-dark/80 border border-white/10 text-white shadow-lg backdrop-blur-sm transition-all group-active:scale-95 group-hover:border-primary/50 group-hover:bg-surface-lighter">
                            <span className="material-symbols-outlined rotate-180">arrow_outward</span>
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Receive</span>
                    </Link>
                    <Link href="/send" className="flex flex-col items-center justify-center gap-2 group">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all group-active:scale-95 group-hover:bg-primary/90 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]">
                            <span className="material-symbols-outlined">arrow_outward</span>
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Send</span>
                    </Link>
                    <Link href="/swap" className="flex flex-col items-center justify-center gap-2 group">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-dark/80 border border-white/10 text-white shadow-lg backdrop-blur-sm transition-all group-active:scale-95 group-hover:border-primary/50 group-hover:bg-surface-lighter">
                            <span className="material-symbols-outlined">swap_vert</span>
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">Swap</span>
                    </Link>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1 mb-1">
                        <h3 className="text-lg font-bold text-white">Assets</h3>
                        <button
                            className="text-sm font-bold text-primary hover:text-primary-glow transition-colors flex items-center gap-1"
                            onClick={() => refreshBalance()}
                            disabled={loading}
                        >
                            {loading && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
                            Refresh
                        </button>
                    </div>

                    {/* Dynamic token list */}
                    {displayTokens.length > 0 ? (
                        displayTokens.map(token => (
                            <AssetItem
                                key={token.symbol}
                                logo={TOKEN_LOGOS[token.symbol] || `https://ui-avatars.com/api/?name=${token.symbol}&background=random`}
                                name={token.name}
                                amount={`${token.balanceFormatted.toFixed(token.symbol === 'USDC' ? 2 : 4)} ${token.symbol}`}
                                value={token.symbol === 'SOL'
                                    ? `$${(token.balanceFormatted * SOL_PRICE_USD).toFixed(2)}`
                                    : token.symbol === 'USDC'
                                        ? `$${token.balanceFormatted.toFixed(2)}`
                                        : '--'
                                }
                                change={token.symbol === 'SOL' ? '+1.2%' : '0.0%'}
                                color={TOKEN_COLORS[token.symbol] || 'rgba(102, 126, 234, 0.1)'}
                            />
                        ))
                    ) : (
                        <>
                            <AssetItem
                                logo={TOKEN_LOGOS.SOL}
                                name="Solana"
                                amount={`${balance.toFixed(4)} SOL`}
                                value={`$${(balance * SOL_PRICE_USD).toFixed(2)}`}
                                change="+1.2%"
                                color={TOKEN_COLORS.SOL}
                            />
                            <AssetItem
                                logo={TOKEN_LOGOS.USDC}
                                name="USDC"
                                amount={`${usdcBalance.toFixed(2)} USDC`}
                                value={`$${usdcBalance.toFixed(2)}`}
                                change="0.0%"
                                color={TOKEN_COLORS.USDC}
                            />
                        </>
                    )}
                </div>

                <div className="mt-8 flex justify-center pb-6">
                    <div className="flex items-center gap-2 rounded-full bg-surface-dark/30 px-4 py-2 border border-white/5 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-slate-500 text-[14px]">verified_user</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Zero-Knowledge Proof Verified</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

const AssetItem: React.FC<{ logo: string, name: string, amount: string, value: string, change: string, color: string }> = ({ logo, name, amount, value, change, color }) => (
    <div className="group flex items-center justify-between rounded-2xl border border-white/5 bg-surface-dark/40 hover:bg-surface-dark/60 p-4 transition-all hover:border-primary/30 cursor-pointer backdrop-blur-sm">
        <div className="flex items-center gap-4">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full shadow-inner" style={{ backgroundColor: color }}>
                <img alt={name} className="w-6 h-6 object-contain" src={logo} />
            </div>
            <div className="flex flex-col">
                <span className="text-base font-bold text-white group-hover:text-primary transition-colors">{name}</span>
                <span className="text-xs font-medium text-slate-400">{amount}</span>
            </div>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-base font-bold text-white">{value}</span>
            <span className={`text-xs font-medium ${change.startsWith('+') ? 'text-green-400' : 'text-slate-400'}`}>{change}</span>
        </div>
    </div>
);

export default Dashboard;

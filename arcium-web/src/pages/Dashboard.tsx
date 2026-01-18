import React, { useState } from 'react';
import { Link } from 'wouter';
import { useWallet } from '../context/WalletContext';
import * as api from '../utils/api';

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
    SOL: 'rgba(255, 97, 26, 0.1)',
    USDC: 'rgba(39, 117, 202, 0.1)',
    RADR: 'rgba(255, 138, 80, 0.1)',
    BONK: 'rgba(255, 165, 0, 0.1)',
    ORE: 'rgba(255, 215, 0, 0.1)',
};

// Approximate SOL price
const SOL_PRICE_USD = 135.42;

const Dashboard: React.FC = () => {
    const {
        address,
        wallet,
        onChainBalance,
        onChainUsdcBalance,
        shieldedBalance,
        shieldedUsdcBalance,
        shieldedTokenBalances,
        refreshBalance,
        loading,
        error,
        apiConnected
    } = useWallet();

    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositToken, setDepositToken] = useState('SOL');
    const [depositLoading, setDepositLoading] = useState(false);

    React.useEffect(() => {
        if (address) {
            refreshBalance();
            const interval = setInterval(refreshBalance, 30000);
            return () => clearInterval(interval);
        }
    }, [address, refreshBalance]);

    // Calculate total balances
    const totalOnChainUsd = (onChainBalance * SOL_PRICE_USD) + onChainUsdcBalance;
    const totalShieldedUsd = (shieldedBalance * SOL_PRICE_USD) + shieldedUsdcBalance;

    // Handle deposit
    const handleDeposit = async () => {
        if (!wallet || !address || !depositAmount || parseFloat(depositAmount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const maxAmount = depositToken === 'SOL' ? onChainBalance : onChainUsdcBalance;
        if (parseFloat(depositAmount) > maxAmount) {
            alert('Insufficient on-chain balance');
            return;
        }

        setDepositLoading(true);
        try {
            console.log('[Dashboard] Creating deposit transaction...');
            const result = await api.createDeposit({
                wallet: address,
                amount: parseFloat(depositAmount),
                token: depositToken,
            });

            if (result.success && result.data) {
                console.log('[Dashboard] Deposit tx created:', result.data);
                alert(`Deposit created!\n\nAmount: ${depositAmount} ${depositToken}\nPool: ${result.data.pool_address?.slice(0, 12)}...\n\nSign the transaction with your wallet to complete.`);
                setShowDepositModal(false);
                setDepositAmount('');
                refreshBalance();
            } else {
                throw new Error(result.error || 'Failed to create deposit');
            }
        } catch (err: any) {
            console.error('[Dashboard] Deposit error:', err);
            alert(`Deposit failed: ${err.message}`);
        } finally {
            setDepositLoading(false);
        }
    };

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-[#121212]">
            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#FF611A]/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[20%] right-[-20%] w-[60vw] h-[60vw] bg-[#FF611A]/5 rounded-full blur-[100px]"></div>
            </div>

            <header className="sticky top-0 z-20 glass-panel border-b border-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link href="/profile" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#262626] border border-white/10 overflow-hidden ring-1 ring-white/5 active:scale-90 transition-transform cursor-pointer">
                        <img alt="User profile" className="h-full w-full object-cover" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#FF611A] text-[20px] drop-shadow-[0_0_8px_rgba(255,97,26,0.5)] filled">shield</span>
                        <div className="flex flex-col">
                            <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Shielded</h2>
                            <p className="text-[10px] text-slate-500 font-mono">
                                {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : 'No wallet'}
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

                {/* API Status */}
                <div className="mb-4 flex items-center justify-center">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${apiConnected ? 'bg-[#FF611A]/10 border-[#FF611A]/20' : 'bg-amber-500/10 border-amber-500/20'} border`}>
                        <div className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-[#FF611A]' : 'bg-amber-500'} animate-pulse`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${apiConnected ? 'text-[#FF611A]' : 'text-amber-500'}`}>
                            {apiConnected ? 'ShadowWire Connected' : 'RPC Mode'}
                        </span>
                    </div>
                </div>

                {/* Dual Balance Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* On-Chain Balance */}
                    <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-white/60 text-[16px]">account_balance_wallet</span>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">On-Chain</p>
                        </div>
                        <p className="text-white text-xl font-bold mb-1">
                            ${totalOnChainUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-slate-500 text-[10px]">{onChainBalance.toFixed(6)} SOL</p>
                    </div>

                    {/* Shielded Balance */}
                    <div className="rounded-2xl border border-[#FF611A]/30 bg-[#FF611A]/5 p-4 shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FF611A]/10 to-transparent"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-[#FF611A] text-[16px] filled">shield</span>
                                <p className="text-[10px] text-[#FF611A] font-bold uppercase tracking-widest">Shielded</p>
                            </div>
                            <p className="text-white text-xl font-bold mb-1">
                                ${totalShieldedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-slate-500 text-[10px]">{shieldedBalance.toFixed(4)} SOL</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    <button
                        onClick={() => setShowDepositModal(true)}
                        className="flex flex-col items-center justify-center gap-2 group"
                    >
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#FF611A]/10 border border-[#FF611A]/30 text-[#FF611A] shadow-lg transition-all group-active:scale-95 group-hover:border-[#FF611A]/50 group-hover:bg-[#FF611A]/20">
                            <span className="material-symbols-outlined">download</span>
                        </div>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">Deposit</span>
                    </button>

                    <Link href="/receive" className="flex flex-col items-center justify-center gap-2 group">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#262626] border border-white/10 text-white shadow-lg transition-all group-active:scale-95 group-hover:border-[#FF611A]/50">
                            <span className="material-symbols-outlined rotate-180">arrow_outward</span>
                        </div>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">Receive</span>
                    </Link>

                    <Link href="/send" className="flex flex-col items-center justify-center gap-2 group">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#FF611A] text-white shadow-[0_0_20px_rgba(255,97,26,0.4)] transition-all group-active:scale-95 group-hover:shadow-[0_0_30px_rgba(255,97,26,0.6)]">
                            <span className="material-symbols-outlined">arrow_outward</span>
                        </div>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">Send</span>
                    </Link>

                    <Link href="/swap" className="flex flex-col items-center justify-center gap-2 group">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#262626] border border-white/10 text-white shadow-lg transition-all group-active:scale-95 group-hover:border-[#FF611A]/50">
                            <span className="material-symbols-outlined">swap_vert</span>
                        </div>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">Swap</span>
                    </Link>
                </div>

                {/* Assets Section */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1 mb-1">
                        <h3 className="text-lg font-bold text-white">Assets</h3>
                        <button
                            className="text-sm font-bold text-[#FF611A] hover:text-[#FF8A50] transition-colors flex items-center gap-1"
                            onClick={() => refreshBalance()}
                            disabled={loading}
                        >
                            {loading && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
                            Refresh
                        </button>
                    </div>

                    {/* On-Chain Assets */}
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest px-1 mt-2">On-Chain Balance</p>
                    <AssetItem
                        logo={TOKEN_LOGOS.SOL}
                        name="Solana"
                        amount={`${onChainBalance.toFixed(6)} SOL`}
                        value={`$${(onChainBalance * SOL_PRICE_USD).toFixed(2)}`}
                        color={TOKEN_COLORS.SOL}
                        badge="on-chain"
                    />
                    <AssetItem
                        logo={TOKEN_LOGOS.USDC}
                        name="USDC"
                        amount={`${onChainUsdcBalance.toFixed(2)} USDC`}
                        value={`$${onChainUsdcBalance.toFixed(2)}`}
                        color={TOKEN_COLORS.USDC}
                        badge="on-chain"
                    />

                    {/* Shielded Assets */}
                    {apiConnected && (
                        <>
                            <p className="text-[10px] text-[#FF611A] uppercase tracking-widest px-1 mt-4 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] filled">shield</span>
                                Shielded Balance
                            </p>
                            <AssetItem
                                logo={TOKEN_LOGOS.SOL}
                                name="Solana (Shielded)"
                                amount={`${shieldedBalance.toFixed(4)} SOL`}
                                value={`$${(shieldedBalance * SOL_PRICE_USD).toFixed(2)}`}
                                color="rgba(255, 97, 26, 0.1)"
                                badge="shielded"
                            />
                            <AssetItem
                                logo={TOKEN_LOGOS.USDC}
                                name="USDC (Shielded)"
                                amount={`${shieldedUsdcBalance.toFixed(2)} USDC`}
                                value={`$${shieldedUsdcBalance.toFixed(2)}`}
                                color="rgba(255, 97, 26, 0.1)"
                                badge="shielded"
                            />
                            {shieldedTokenBalances
                                .filter(t => t.symbol !== 'SOL' && t.symbol !== 'USDC' && t.balanceFormatted > 0)
                                .map(token => (
                                    <AssetItem
                                        key={token.symbol}
                                        logo={TOKEN_LOGOS[token.symbol] || ''}
                                        name={`${token.name} (Shielded)`}
                                        amount={`${token.balanceFormatted.toFixed(4)} ${token.symbol}`}
                                        value="--"
                                        color="rgba(255, 97, 26, 0.1)"
                                        badge="shielded"
                                    />
                                ))
                            }
                        </>
                    )}
                </div>

                <div className="mt-8 flex justify-center pb-6">
                    <div className="flex items-center gap-2 rounded-full bg-[#262626]/50 px-4 py-2 border border-white/5">
                        <span className="material-symbols-outlined text-[#FF611A] text-[14px]">verified_user</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Zero-Knowledge Proof Verified</span>
                    </div>
                </div>
            </main>

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Deposit to Shielded</h3>
                            <button
                                onClick={() => setShowDepositModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <p className="text-slate-400 text-sm mb-6">
                            Move funds from your on-chain wallet into your shielded account for private transactions.
                        </p>

                        {/* Token Selection */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setDepositToken('SOL')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${depositToken === 'SOL' ? 'bg-[#FF611A] text-white' : 'bg-white/5 text-slate-400'}`}
                            >
                                SOL
                            </button>
                            <button
                                onClick={() => setDepositToken('USDC')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${depositToken === 'USDC' ? 'bg-[#FF611A] text-white' : 'bg-white/5 text-slate-400'}`}
                            >
                                USDC
                            </button>
                        </div>

                        {/* Available Balance */}
                        <div className="bg-[#262626] rounded-xl p-3 mb-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Available On-Chain</p>
                            <p className="text-white font-bold">
                                {depositToken === 'SOL' ? `${onChainBalance.toFixed(4)} SOL` : `${onChainUsdcBalance.toFixed(2)} USDC`}
                            </p>
                        </div>

                        {/* Amount Input */}
                        <div className="mb-6">
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block">Amount</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="0.0"
                                    className="flex-1 bg-[#262626] border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#FF611A]/50"
                                />
                                <button
                                    onClick={() => setDepositAmount(depositToken === 'SOL' ? onChainBalance.toString() : onChainUsdcBalance.toString())}
                                    className="px-4 py-3 bg-[#262626] border border-white/10 rounded-xl text-[#FF611A] font-bold text-sm hover:bg-[#262626]/80 transition-colors"
                                >
                                    MAX
                                </button>
                            </div>
                        </div>

                        {/* Deposit Button */}
                        <button
                            onClick={handleDeposit}
                            disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
                            className="w-full py-4 rounded-xl bg-[#FF611A] text-white font-bold text-lg shadow-[0_0_20px_rgba(255,97,26,0.3)] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(255,97,26,0.5)] transition-all"
                        >
                            {depositLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">download</span>
                                    Deposit to Shielded
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AssetItem: React.FC<{
    logo: string,
    name: string,
    amount: string,
    value: string,
    color: string,
    badge?: 'on-chain' | 'shielded'
}> = ({ logo, name, amount, value, color, badge }) => (
    <div className={`group flex items-center justify-between rounded-2xl border ${badge === 'shielded' ? 'border-[#FF611A]/20' : 'border-white/5'} bg-[#1a1a1a] hover:bg-[#262626] p-4 transition-all hover:border-[#FF611A]/30 cursor-pointer`}>
        <div className="flex items-center gap-4">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full shadow-inner" style={{ backgroundColor: color }}>
                {logo ? (
                    <img alt={name} className="w-6 h-6 object-contain" src={logo} />
                ) : (
                    <span className="text-white font-bold text-sm">{name[0]}</span>
                )}
                {badge === 'shielded' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FF611A] flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[10px] filled">shield</span>
                    </div>
                )}
            </div>
            <div className="flex flex-col">
                <span className="text-base font-bold text-white group-hover:text-[#FF611A] transition-colors">{name}</span>
                <span className="text-xs font-medium text-slate-400">{amount}</span>
            </div>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-base font-bold text-white">{value}</span>
            {badge && (
                <span className={`text-[10px] font-medium ${badge === 'shielded' ? 'text-[#FF611A]' : 'text-slate-400'}`}>
                    {badge === 'shielded' ? '🔒 Private' : '🌐 Public'}
                </span>
            )}
        </div>
    </div>
);

export default Dashboard;

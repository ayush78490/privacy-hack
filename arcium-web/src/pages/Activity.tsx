import React from 'react';
import { Link } from 'wouter';
import { useWallet } from '../context/WalletContext';

// In production, this would be fetched from the backend
// Currently ShadowWire doesn't have a transaction history endpoint
interface Transaction {
    id: string;
    title: string;
    time: string;
    amount: string;
    fiat: string;
    icon: string;
    status: 'pending' | 'confirmed';
    highlight?: boolean;
}

const Activity: React.FC = () => {
    const { apiConnected, address } = useWallet();
    const [transactions] = React.useState<Transaction[]>([]);
    const [loading] = React.useState(false);

    // Note: Transaction history endpoint not available in ShadowWire yet
    // This would be populated from /api/transactions/:wallet when available

    return (
        <div className="bg-dark-bg min-h-screen flex flex-col overflow-hidden text-gray-200 relative pb-24">
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[10%] right-[-10%] w-[70%] h-[70%] bg-emerald-900/10 rounded-full blur-[120px]"></div>
            </div>

            <header className="flex-none sticky top-0 z-20 glass-panel border-b-0">
                <div className="flex items-center px-4 pt-12 pb-4 justify-between">
                    <Link href="/dashboard" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold leading-tight tracking-wide flex-1 text-center">Shielded Activity</h2>
                    <div className="flex w-10 items-center justify-end">
                        <button className="flex cursor-pointer items-center justify-center size-10 rounded-full hover:bg-white/10 transition-colors text-white">
                            <span className="material-symbols-outlined">filter_list</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10">
                <div className="px-4 py-6">
                    <div className="flex items-center justify-center gap-2 py-1.5 px-4 rounded-full bg-neon-secondary/5 w-fit mx-auto border border-neon-secondary/20 shadow-shield-glow">
                        <span className="material-symbols-outlined text-neon-secondary text-[16px] filled animate-pulse-slow">shield_lock</span>
                        <p className="text-neon-secondary text-[11px] font-semibold tracking-widest uppercase">
                            {apiConnected ? 'ShadowWire Active' : 'Privacy Mode'}
                        </p>
                    </div>
                </div>

                {/* Wallet Address */}
                {address && (
                    <div className="px-4 mb-4">
                        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
                                <span className="text-sm font-mono text-slate-400">
                                    {address.slice(0, 8)}...{address.slice(-8)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <span className="material-symbols-outlined text-primary text-[32px] animate-spin">sync</span>
                    </div>
                ) : transactions.length > 0 ? (
                    <>
                        <div className="px-6 py-2">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Recent Transactions</p>
                        </div>
                        {transactions.map(tx => (
                            <div key={tx.id} className="px-4 mb-3">
                                <ActivityItem
                                    title={tx.title}
                                    time={tx.time}
                                    amount={tx.amount}
                                    fiat={tx.fiat}
                                    icon={tx.icon}
                                    highlight={tx.highlight}
                                    status={tx.status}
                                />
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-8">
                        <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-slate-500 text-[40px]">history</span>
                        </div>
                        <h3 className="text-white text-lg font-bold mb-2">No Transactions Yet</h3>
                        <p className="text-slate-500 text-sm text-center mb-6">
                            Your shielded transactions will appear here once you start using the wallet.
                        </p>
                        <Link href="/send" className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm">
                            Send Your First Transaction
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
};

const ActivityItem: React.FC<{
    title: string,
    time: string,
    amount: string,
    fiat: string,
    icon: string,
    highlight?: boolean,
    status: 'pending' | 'confirmed',
    opacity?: string
}> = ({ title, time, amount, fiat, icon, highlight, status, opacity }) => (
    <div className={`glass-card p-5 rounded-2xl relative overflow-hidden transition-all hover:bg-white/[0.04] ${opacity || ''}`}>
        {highlight && <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-neon-primary/10 rounded-full blur-2xl pointer-events-none"></div>}
        {!highlight && <div className="absolute -right-10 -top-10 w-32 h-32 bg-neon-secondary/10 rounded-full blur-2xl pointer-events-none"></div>}

        <div className="flex justify-between items-start gap-3 relative z-10">
            <div className="flex items-start gap-4 flex-1">
                <div className={`flex items-center justify-center rounded-xl shrink-0 size-12 border border-white/5 ${highlight ? 'bg-neon-secondary/10 border-neon-secondary/20 shadow-[0_0_15px_-5px_rgba(52,211,153,0.2)]' : 'bg-white/5 shadow-inner'}`}>
                    <span className={`material-symbols-outlined text-[24px] ${status === 'pending' ? 'text-amber-400 animate-spin' : highlight ? 'text-neon-secondary' : 'text-gray-300'}`}>{icon}</span>
                </div>
                <div className="flex flex-col justify-center gap-1">
                    <p className="text-white text-[15px] font-bold leading-none">{title}</p>
                    <p className="text-gray-500 text-xs font-medium">{time}</p>
                    <p className={`text-sm font-bold mt-1 tracking-wide ${highlight ? 'text-neon-secondary' : 'text-white'}`}>
                        {amount} {fiat && <span className="text-gray-500 font-normal ml-1">{fiat}</span>}
                    </p>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4 relative z-10">
            <div className="flex items-center gap-1.5">
                {status === 'confirmed' ? (
                    <>
                        <span className="material-symbols-outlined text-neon-secondary text-[14px] filled drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">check_circle</span>
                        <span className="text-[10px] text-neon-secondary font-bold uppercase tracking-wider">Shielded</span>
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined text-amber-400 text-[14px] animate-pulse">schedule</span>
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Pending</span>
                    </>
                )}
            </div>
            <button className="group relative flex items-center justify-center rounded-lg p-[1px]">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 opacity-60 blur-[1px] group-hover:opacity-100 group-hover:blur-[2px] transition-all duration-300"></div>
                <div className="relative bg-dark-bg/90 rounded-[7px] px-3 py-1.5 backface-hidden">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white group-hover:text-cyan-200 transition-colors">View Proof</span>
                </div>
            </button>
        </div>
    </div>
);

export default Activity;

import React from 'react';
import { Link } from 'wouter';

const Activity: React.FC = () => {
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
                        <p className="text-neon-secondary text-[11px] font-semibold tracking-widest uppercase">Arcium Privacy Active</p>
                    </div>
                </div>

                <div className="px-6 py-2">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Today</p>
                </div>

                <div className="px-4 mb-3">
                    <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="relative flex items-center justify-center rounded-xl bg-white/5 shrink-0 size-12 border border-white/5">
                                    <span className="material-symbols-outlined text-[24px] text-amber-400 animate-spin-slow">hourglass_top</span>
                                    <div className="absolute inset-0 rounded-xl bg-amber-400/10 animate-pulse"></div>
                                </div>
                                <div className="flex flex-col justify-center gap-1">
                                    <p className="text-white text-[15px] font-bold leading-none">Shielding Assets...</p>
                                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Pending Confirmation</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                        </span>
                                        <p className="text-gray-400 text-[11px] font-mono">Encrypting via Arcium...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4">
                            <p className="text-[10px] text-gray-600 font-mono tracking-wider">ID: 0x8a...4f21</p>
                            <button className="flex h-7 px-3 items-center justify-center rounded bg-white/5 text-gray-500 text-[10px] font-bold uppercase tracking-widest cursor-not-allowed border border-white/5" disabled>
                                Processing
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-4 mb-3">
                    <ActivityItem
                        title="Private Transaction"
                        time="10:42 AM • Confirmed"
                        amount="-2.4 SOL"
                        fiat="($320.50)"
                        icon="lock"
                    />
                </div>

                <div className="px-6 py-2 mt-6">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Yesterday</p>
                </div>

                <div className="px-4 mb-3">
                    <ActivityItem
                        title="Private Drop"
                        time="4:20 PM • Confirmed"
                        amount="+100 USDC"
                        fiat=""
                        icon="verified_user"
                        highlight={true}
                    />
                </div>

                <div className="px-4 mb-3">
                    <ActivityItem
                        title="Private Transaction"
                        time="9:15 AM • Confirmed"
                        amount="-0.5 SOL"
                        fiat="($65.20)"
                        icon="lock"
                        opacity="opacity-75 hover:opacity-100"
                    />
                </div>
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
    opacity?: string
}> = ({ title, time, amount, fiat, icon, highlight, opacity }) => (
    <div className={`glass-card p-5 rounded-2xl relative overflow-hidden transition-all hover:bg-white/[0.04] ${opacity || ''}`}>
        {highlight && <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-neon-primary/10 rounded-full blur-2xl pointer-events-none"></div>}
        {!highlight && <div className="absolute -right-10 -top-10 w-32 h-32 bg-neon-secondary/10 rounded-full blur-2xl pointer-events-none"></div>}

        <div className="flex justify-between items-start gap-3 relative z-10">
            <div className="flex items-start gap-4 flex-1">
                <div className={`flex items-center justify-center rounded-xl shrink-0 size-12 border border-white/5 ${highlight ? 'bg-neon-secondary/10 border-neon-secondary/20 shadow-[0_0_15px_-5px_rgba(52,211,153,0.2)]' : 'bg-white/5 shadow-inner'}`}>
                    <span className={`material-symbols-outlined text-[24px] ${highlight ? 'text-neon-secondary' : 'text-gray-300'}`}>{icon}</span>
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
                <span className="material-symbols-outlined text-neon-secondary text-[14px] filled drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">check_circle</span>
                <span className="text-[10px] text-neon-secondary font-bold uppercase tracking-wider">Shielded</span>
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

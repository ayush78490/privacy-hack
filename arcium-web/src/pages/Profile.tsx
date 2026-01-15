import React, { useState } from 'react';
import { Link } from 'wouter';

const Profile: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const [walletAddress] = useState(() =>
        localStorage.getItem('arcium_wallet_address') || "7xKX...j9Pv"
    );

    const copyToClipboard = () => {
        const textToCopy = localStorage.getItem('arcium_wallet_address') || walletAddress;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }

        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'COPY_TO_CLIPBOARD',
                payload: textToCopy
            }));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="bg-dark-bg min-h-screen flex flex-col overflow-hidden text-gray-200 relative pb-24">
            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/15 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[20%] left-[-10%] w-[60%] h-[60%] bg-emerald-900/10 rounded-full blur-[120px]"></div>
            </div>

            <header className="flex-none sticky top-0 z-20 glass-panel border-b-0">
                <div className="flex items-center px-4 pt-12 pb-4">
                    <Link href="/dashboard" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold leading-tight tracking-wide flex-1 text-center pr-10">Your Profile</h2>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar relative z-10">
                <div className="px-6 py-8 flex flex-col items-center">
                    {/* Profile Header */}
                    <div className="relative mb-6">
                        <div className="size-24 rounded-full p-[2px] bg-gradient-to-tr from-primary via-cyan-500 to-emerald-500 shadow-glow">
                            <div className="h-full w-full rounded-full bg-surface-dark border-2 border-dark-bg overflow-hidden ring-4 ring-white/5">
                                <img
                                    alt="User profile"
                                    className="h-full w-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXfL_3QE_wLZmKahD-Edq3AcKqFfHsuAnoUi6Ws-0-0BTl-pE0EmkrWmg73OiTztY8S9WWz-0KnIRiBpr6cOBDR8oOUPgK4raYhAtHNpDextF_hyOOBDhft8Nnnphu-LiLuZTQuAnxnILJ1Y31vbnqwRoXok10eU1oX69m51AU1PJVRepdkRsI8eIG5vsNkgI-EXD348pGwXLObMRi7qvgByO69ovZCvUW3gWL9_fKj2zdET-ujkqp6-o9kH6LOGSny7Q9THOzqMS1"
                                />
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 size-6 rounded-full bg-emerald-500 border-2 border-dark-bg flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white text-[14px] filled">check</span>
                        </div>
                    </div>

                    <h1 className="text-white text-2xl font-bold mb-1">Arcium Explorer</h1>
                    <div className="flex items-center gap-2 mb-8">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500/80">Active User</span>
                    </div>

                    {/* Wallet Card */}
                    <div className="w-full glass-card p-6 rounded-3xl border border-white/5 mb-8 relative overflow-hidden group min-h-[320px]">
                        <div className="absolute top-2 right-2 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-[120px] text-white">account_balance_wallet</span>
                        </div>

                        <div className="relative z-10">
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4">Solana Wallet Address</p>

                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-3 bg-obsidian/60 rounded-2xl p-4 border border-white/5 shadow-inner">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-mono text-[13px] leading-relaxed break-all">
                                            {walletAddress}
                                        </p>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="shrink-0 size-10 flex items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary transition-all active:scale-90"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {copied ? 'done' : 'content_copy'}
                                        </span>
                                    </button>
                                </div>

                                <div className="flex flex-col items-center gap-4 py-6 bg-white/[0.02] rounded-2xl border border-white/5 shadow-sm">
                                    <div className="relative size-40 bg-white rounded-2xl p-3 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                        {/* Placeholder for QR Code */}
                                        <div className="w-full h-full bg-white rounded flex items-center justify-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-black/30 text-[80px]">qr_code_2</span>
                                            </div>
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.02)_100%)]"></div>
                                            {/* Decorative corners */}
                                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/40"></div>
                                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/40"></div>
                                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/40"></div>
                                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/40"></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Scan to Receive</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats/Actions */}
                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <div className="glass-card p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Network</span>
                            <span className="text-white font-bold">Arcium</span>
                        </div>
                        <div className="glass-card p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Tier</span>
                            <span className="text-primary font-bold tracking-tight">VIP Shielded</span>
                        </div>
                    </div>

                    {/* Recent Transactions Section */}
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-white font-bold text-lg">Privacy History</h3>
                            <Link href="/activity" className="text-primary text-xs font-bold uppercase tracking-wider">See More</Link>
                        </div>

                        <div className="space-y-4">
                            <ActivityItem
                                title="Shielded Send"
                                amount="-0.5 SOL"
                                time="Today • 2:45 PM"
                                status="Success"
                                icon="shield_lock"
                                color="text-amber-400"
                            />
                            <ActivityItem
                                title="Swap SOL-USDC"
                                amount="1.2 SOL"
                                time="Yesterday • 11:20 AM"
                                status="Success"
                                icon="swap_horiz"
                                color="text-primary"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const ActivityItem: React.FC<{
    title: string,
    amount: string,
    time: string,
    status: string,
    icon: string,
    color: string
}> = ({ title, amount, time, status, icon, color }) => (
    <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-colors group">
        <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-white font-bold text-sm">{title}</span>
                <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">{time}</span>
            </div>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-white font-bold text-sm font-mono tracking-tighter">{amount}</span>
            <div className="flex items-center gap-1">
                <span className="size-1 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">{status}</span>
            </div>
        </div>
    </div>
);

export default Profile;

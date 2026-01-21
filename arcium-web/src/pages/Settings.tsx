import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '../context/WalletContext';

const Settings: React.FC = () => {
    const { address, mnemonic, apiConnected, logout, solPrice } = useWallet();
    const [, setLocation] = useLocation();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const handleLogout = () => {
        logout();
        setLocation('/');
    };

    const displayAddress = address
        ? `${address.slice(0, 8)}...${address.slice(-8)}`
        : 'Not connected';

    const words = mnemonic ? mnemonic.split(' ') : [];

    return (
        <div className="bg-dark-bg min-h-screen flex flex-col overflow-hidden text-gray-200 relative pb-24">
            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FF611A]/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[20%] left-[-10%] w-[60%] h-[60%] bg-emerald-900/10 rounded-full blur-[120px]"></div>
            </div>

            <header className="flex-none sticky top-0 z-20 glass-panel border-b-0">
                <div className="flex items-center px-4 pt-12 pb-4">
                    <Link href="/dashboard" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold leading-tight tracking-wide flex-1 text-center pr-10">Settings</h2>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-4">
                {/* Account Section */}
                <div className="mb-6">
                    <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 px-1">Account</h3>
                    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-4 flex items-center gap-4 border-b border-white/5">
                            <div className="size-12 rounded-full p-[2px] bg-gradient-to-tr from-[#FF611A] via-cyan-500 to-emerald-500">
                                <div className="h-full w-full rounded-full bg-surface-dark overflow-hidden">
                                    <img
                                        alt="User profile"
                                        className="h-full w-full object-cover"
                                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm">Arcium Explorer</p>
                                <p className="text-slate-400 text-xs font-mono truncate">{displayAddress}</p>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${apiConnected ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                <div className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                                <span className={`text-[10px] font-bold ${apiConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {apiConnected ? 'Connected' : 'RPC Only'}
                                </span>
                            </div>
                        </div>
                        <Link href="/profile" className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                                <span className="text-white text-sm font-medium">View Profile</span>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 text-[20px]">chevron_right</span>
                        </Link>
                    </div>
                </div>

                {/* Security Section */}
                <div className="mb-6">
                    <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 px-1">Security</h3>
                    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                        <button
                            onClick={() => setShowRecoveryPhrase(!showRecoveryPhrase)}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors border-b border-white/5"
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#FF611A] text-[20px]">key</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">Recovery Phrase</span>
                                    <span className="text-slate-500 text-[10px]">View your 12-word secret phrase</span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 text-[20px]">
                                {showRecoveryPhrase ? 'expand_less' : 'expand_more'}
                            </span>
                        </button>

                        {showRecoveryPhrase && (
                            <div className="p-4 bg-[#0a0a0a]">
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 flex gap-2">
                                    <span className="material-symbols-outlined text-yellow-500 text-[18px]">warning</span>
                                    <p className="text-yellow-200/80 text-xs leading-relaxed">
                                        Never share your recovery phrase. Anyone with this phrase can access your funds.
                                    </p>
                                </div>
                                <div className="mb-4">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block">Type "CONFIRM" to reveal</label>
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder="CONFIRM"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#FF611A]/50"
                                    />
                                </div>
                                {confirmText === 'CONFIRM' && mnemonic && (
                                    <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                                        {words.map((word, index) => (
                                            <div key={index} className="flex gap-2 items-center bg-obsidian/50 rounded-lg p-2 border border-white/5">
                                                <span className="text-zinc-600 text-[10px] font-bold w-4">{index + 1}</span>
                                                <span className="text-xs font-semibold">{word}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">Auto-Lock Timer</span>
                                    <span className="text-slate-500 text-[10px]">Lock wallet after inactivity</span>
                                </div>
                            </div>
                            <span className="text-[#FF611A] text-sm font-medium">5 min</span>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">fingerprint</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">Biometric Auth</span>
                                    <span className="text-slate-500 text-[10px]">Use fingerprint or Face ID</span>
                                </div>
                            </div>
                            <div className="w-11 h-6 bg-white/10 rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full transition-all"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Network Section */}
                <div className="mb-6">
                    <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 px-1">Network</h3>
                    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-emerald-400 text-[20px]">language</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">Network</span>
                                    <span className="text-slate-500 text-[10px]">Solana Mainnet Beta</span>
                                </div>
                            </div>
                            <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">Mainnet</span>
                        </div>

                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">dns</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">RPC Endpoint</span>
                                    <span className="text-slate-500 text-[10px] truncate max-w-[180px]">mainnet.helius-rpc.com</span>
                                </div>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#FF611A] text-[20px] filled">shield</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">ShadowWire API</span>
                                    <span className="text-slate-500 text-[10px]">Privacy layer status</span>
                                </div>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${apiConnected ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                                {apiConnected ? 'Connected' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* General Section */}
                <div className="mb-6">
                    <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 px-1">General</h3>
                    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">attach_money</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">Currency</span>
                                    <span className="text-slate-500 text-[10px]">Display currency</span>
                                </div>
                            </div>
                            <span className="text-[#FF611A] text-sm font-medium">USD</span>
                        </div>

                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">dark_mode</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">Theme</span>
                                    <span className="text-slate-500 text-[10px]">App appearance</span>
                                </div>
                            </div>
                            <span className="text-[#FF611A] text-sm font-medium">Dark</span>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">notifications</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">Notifications</span>
                                    <span className="text-slate-500 text-[10px]">Transaction alerts</span>
                                </div>
                            </div>
                            <div className="w-11 h-6 bg-[#FF611A] rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="mb-6">
                    <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 px-1">About</h3>
                    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">info</span>
                                <span className="text-white text-sm font-medium">Version</span>
                            </div>
                            <span className="text-slate-400 text-sm">1.0.0</span>
                        </div>

                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">currency_bitcoin</span>
                                <span className="text-white text-sm font-medium">SOL Price</span>
                            </div>
                            <span className="text-slate-400 text-sm">${solPrice.toFixed(2)}</span>
                        </div>

                        <a href="https://arcium.com" target="_blank" rel="noopener noreferrer" className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">help</span>
                                <span className="text-white text-sm font-medium">Help & Support</span>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 text-[20px]">open_in_new</span>
                        </a>

                        <a href="https://arcium.com/terms" target="_blank" rel="noopener noreferrer" className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">description</span>
                                <span className="text-white text-sm font-medium">Terms of Service</span>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 text-[20px]">open_in_new</span>
                        </a>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="mb-8">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full p-4 rounded-2xl flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 font-bold hover:bg-red-500/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Logout
                    </button>
                </div>

                {/* Footer */}
                <div className="flex justify-center mb-4">
                    <div className="flex items-center gap-2 rounded-full bg-[#262626]/50 px-4 py-2 border border-white/5">
                        <span className="material-symbols-outlined text-[#FF611A] text-[14px] filled">shield</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Secured by Arcium</span>
                    </div>
                </div>
            </main>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-red-400 text-[32px]">logout</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Logout?</h3>
                            <p className="text-slate-400 text-sm">
                                Are you sure you want to logout? You'll need your recovery phrase to access your wallet again.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-4 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;

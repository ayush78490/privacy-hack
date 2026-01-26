import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '../context/WalletContext';
import { getWalletHistory, TempWalletHistoryEntry, getPrivateKeyBase58 } from '../utils/anonymousWallet';

const Settings: React.FC = () => {
    const {
        address,
        mnemonic,
        apiConnected,
        logout,
        solPrice,
        userName,
        userProfilePic,
        networkMode,
        switchNetwork,
        anonymousWallet,
        anonymousAddress,
        isAnonymousMode
    } = useWallet();
    const [, setLocation] = useLocation();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [showTempWalletHistory, setShowTempWalletHistory] = useState(false);
    const [walletHistory, setWalletHistory] = useState<TempWalletHistoryEntry[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [copiedCurrentKey, setCopiedCurrentKey] = useState(false);

    // Load wallet history
    useEffect(() => {
        setWalletHistory(getWalletHistory());
    }, [showTempWalletHistory]);

    const handleLogout = () => {
        logout();
        setLocation('/');
    };

    const handleNetworkToggle = () => {
        const newMode = networkMode === 'mainnet' ? 'devnet' : 'mainnet';
        switchNetwork(newMode);
    };

    const copyToClipboard = async (text: string, index?: number) => {
        await navigator.clipboard.writeText(text);
        if (index !== undefined) {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } else {
            setCopiedCurrentKey(true);
            setTimeout(() => setCopiedCurrentKey(false), 2000);
        }
    };

    const displayAddress = address
        ? `${address.slice(0, 8)}...${address.slice(-8)}`
        : 'Not connected';

    const words = mnemonic ? mnemonic.split(' ') : [];

    // Get current anonymous wallet private key
    const currentAnonPrivateKey = anonymousWallet ? getPrivateKeyBase58(anonymousWallet) : null;

    return (
        <div className="bg-[#121212] text-white min-h-screen font-display antialiased relative pb-24">
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF611A]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FF611A]/5 rounded-full blur-[120px] pointer-events-none"></div>

            <header className="flex-none sticky top-0 z-20 glass-panel border-b-0">
                <div className="flex items-center px-4 pt-12 pb-4 max-w-md mx-auto">
                    <Link href="/dashboard" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold leading-tight tracking-wide flex-1 text-center pr-10">Settings</h2>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-4 max-w-md mx-auto w-full">
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
                                        src={userProfilePic}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-white font-bold text-sm">{userName}</p>
                                    {isAnonymousMode && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FF611A]/20 text-[#FF611A]">ANON</span>
                                    )}
                                </div>
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

                {/* Anonymous Wallet Section */}
                <div className="mb-6">
                    <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 px-1">Anonymous Wallet</h3>
                    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                        {/* Current Session Temp Wallet */}
                        {anonymousAddress && (
                            <div className="p-4 border-b border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#FF611A] text-[20px]">visibility_off</span>
                                        <span className="text-white text-sm font-medium">Current Session Wallet</span>
                                    </div>
                                    {isAnonymousMode && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">ACTIVE</span>
                                    )}
                                </div>
                                <div className="bg-[#0a0a0a] rounded-xl p-3">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Address</p>
                                    <p className="text-xs font-mono text-white/80 truncate mb-3">{anonymousAddress}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Private Key</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-mono text-[#FF611A] truncate flex-1">
                                            {currentAnonPrivateKey ? `${currentAnonPrivateKey.slice(0, 20)}...` : 'N/A'}
                                        </p>
                                        {currentAnonPrivateKey && (
                                            <button
                                                onClick={() => copyToClipboard(currentAnonPrivateKey)}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[14px] text-slate-400">
                                                    {copiedCurrentKey ? 'check' : 'content_copy'}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-amber-400/70 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">info</span>
                                    This wallet is regenerated on each app restart
                                </p>
                            </div>
                        )}

                        {/* Temp Wallet History */}
                        <button
                            onClick={() => setShowTempWalletHistory(!showTempWalletHistory)}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">history</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">Temp Wallet History</span>
                                    <span className="text-slate-500 text-[10px]">Last 10 anonymous wallets</span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 text-[20px]">
                                {showTempWalletHistory ? 'expand_less' : 'expand_more'}
                            </span>
                        </button>

                        {showTempWalletHistory && (
                            <div className="p-4 bg-[#0a0a0a] border-t border-white/5">
                                {walletHistory.length === 0 ? (
                                    <p className="text-slate-500 text-xs text-center py-4">No wallet history yet</p>
                                ) : (
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {walletHistory.map((entry, index) => (
                                            <div key={index} className="bg-white/5 rounded-xl p-3 border border-white/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-mono text-white/80">
                                                        {entry.address.slice(0, 8)}...{entry.address.slice(-6)}
                                                    </p>
                                                    <span className="text-[9px] text-slate-500">
                                                        {new Date(entry.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] font-mono text-slate-400 truncate flex-1">
                                                        {entry.privateKey.slice(0, 16)}...
                                                    </p>
                                                    <button
                                                        onClick={() => copyToClipboard(entry.privateKey, index)}
                                                        className="p-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[12px] text-slate-400">
                                                            {copiedIndex === index ? 'check' : 'content_copy'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
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
                        {/* Network Toggle */}
                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className={`material-symbols-outlined text-[20px] ${networkMode === 'mainnet' ? 'text-emerald-400' : 'text-amber-400'}`}>language</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">Network</span>
                                    <span className="text-slate-500 text-[10px]">
                                        {networkMode === 'mainnet' ? 'Solana Mainnet Beta' : 'Solana Devnet'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleNetworkToggle}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${networkMode === 'mainnet'
                                        ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                                        : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                                    }`}
                            >
                                {networkMode === 'mainnet' ? 'Mainnet' : 'Devnet'}
                            </button>
                        </div>

                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">dns</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-white text-sm font-medium">RPC Endpoint</span>
                                    <span className="text-slate-500 text-[10px] truncate max-w-[180px]">
                                        {networkMode === 'mainnet' ? 'mainnet.helius-rpc.com' : 'devnet.helius-rpc.com'}
                                    </span>
                                </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${networkMode === 'mainnet' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/privypay.png" alt="PrivyPay" className="w-5 h-5 object-contain" />
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
                        <img src="/privypay.png" alt="PrivyPay" className="w-4 h-4 object-contain" />
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

import React, { useState } from 'react';
import { Link } from 'wouter';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';
import { LOGO_PATH } from '../constants/logo';

const Profile: React.FC = () => {
    const {
        balance,
        usdcBalance,
        apiConnected,
        solPrice,
        userName,
        userProfilePic,
        updateProfile,
        isAnonymousMode,
        anonymousBalance,
        switchToAnonymousMode,
        switchToMainWallet,
        getActiveAddress
    } = useWallet();
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(userName);
    const [editPic, setEditPic] = useState(userProfilePic);

    // Get current active address based on mode
    const activeAddress = getActiveAddress();
    const displayAddress = activeAddress
        ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-6)}`
        : '';

    // Get current balance based on mode
    const currentBalance = isAnonymousMode ? anonymousBalance : balance;
    const currentUsdcBalance = isAnonymousMode ? 0 : usdcBalance;

    const copyToClipboard = () => {
        const textToCopy = activeAddress || displayAddress;

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

    const totalUsd = (currentBalance * solPrice) + currentUsdcBalance;

    const handleSaveProfile = () => {
        updateProfile(editName, editPic);
        setIsEditing(false);
    };

    const handleModeSwitch = () => {
        if (isAnonymousMode) {
            switchToMainWallet();
        } else {
            switchToAnonymousMode();
        }
    };

    return (
        <div className="bg-[#121212] text-white h-full font-display antialiased relative">
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF611A]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FF611A]/5 rounded-full blur-[120px] pointer-events-none"></div>

            <header className="sticky top-0 z-20 glass-panel border-b border-white/5 px-4 py-3">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <Link href="/dashboard" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold leading-tight tracking-wide">Profile</h2>
                    <Link href="/settings" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined">settings</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 px-4 pt-6 pb-32 max-w-md mx-auto w-full">
                {/* Wallet Mode Banner */}
                <div className={`rounded-2xl p-4 mb-6 flex items-center justify-between ${isAnonymousMode
                    ? 'bg-gradient-to-r from-[#FF611A]/20 to-amber-500/10 border border-[#FF611A]/30'
                    : 'bg-gradient-to-r from-[#FF611A]/20 to-amber-500/10 border border-[#FF611A]/30'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${isAnonymousMode ? 'bg-[#FF611A]/20' : 'bg-[#FF611A]/20'
                            }`}>
                            <span className={`material-symbols-outlined text-[22px] ${isAnonymousMode ? 'text-[#FFF]' : 'text-[#FFF]'
                                }`}>
                                {isAnonymousMode ? 'visibility_off' : 'account_balance_wallet'}
                            </span>
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${isAnonymousMode ? 'text-[#FFF]' : 'text-[#FFF]'}`}>
                                {isAnonymousMode ? 'Anonymous Mode' : 'Main Wallet'}
                            </p>
                            {isAnonymousMode && (
                                <p className="text-[10px] text-amber-400/70">Temporary wallet - regenerated on restart</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleModeSwitch}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${isAnonymousMode
                            ? 'bg-[#FF611A]/20 text-[#FF611A] hover:bg-[#FF611A]/30 border border-[#FF611A]/30'
                            : 'bg-[#FF611A]/20 text-[#FF611A] hover:bg-[#FF611A]/30 border border-[#FF611A]/30'
                            }`}
                    >
                        {isAnonymousMode ? 'Switch to Main' : 'Go Anonymous'}
                    </button>
                </div>

                {/* Profile Card */}
                <div className="rounded-3xl border border-[#FF611A]/20 bg-gradient-to-br from-[#FF611A]/10 to-transparent p-6 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF611A]/10 rounded-full blur-[60px]"></div>

                    <div className="relative z-10 flex items-center gap-4 mb-6">
                        <div className="size-20 rounded-full p-[2px] bg-gradient-to-tr from-[#FF611A] via-orange-400 to-yellow-500 shadow-[0_0_20px_rgba(255,97,26,0.4)]">
                            <div className="h-full w-full rounded-full bg-[#1a1a1a] border-2 border-[#121212] overflow-hidden">
                                <img
                                    alt="User profile"
                                    className="h-full w-full object-cover"
                                    src={userProfilePic}
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-white text-xl font-bold">{userName}</h1>
                                {isAnonymousMode && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FF611A]/20 text-[#FF611A]">ANON</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${apiConnected ? 'bg-[#FF611A]' : 'bg-amber-500'} animate-pulse`}></div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${apiConnected ? 'text-[#FF611A]' : 'text-amber-500'}`}>
                                    {apiConnected ? 'ShadowWire Connected' : 'RPC Mode'}
                                </span>
                            </div>
                        </div>
                        {!isAnonymousMode && (
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="shrink-0 size-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-[#FF611A] transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">{isEditing ? 'close' : 'edit'}</span>
                            </button>
                        )}
                    </div>

                    {isEditing && !isAnonymousMode && (
                        <div className="bg-black/20 rounded-2xl p-4 mb-6 space-y-4 border border-white/5 animate-in slide-in-from-top-2 duration-300">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 block">Display Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#FF611A]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 block">Profile Picture URL</label>
                                <input
                                    type="text"
                                    value={editPic}
                                    onChange={(e) => setEditPic(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#FF611A]"
                                />
                            </div>
                            <button
                                onClick={handleSaveProfile}
                                className="w-full py-2.5 bg-[#FF611A] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#FF611A]/20"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}

                    {/* Total Value */}
                    <div className="text-center py-4 border-t border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Value</p>
                        <p className="text-white text-3xl font-bold">
                            ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Wallet Address Card */}
                <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                            {isAnonymousMode ? 'Anonymous Wallet Address' : 'Wallet Address'}
                        </p>
                        {isAnonymousMode && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">TEMP</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 bg-[#262626] rounded-xl p-3 border border-white/5">
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-mono text-xs leading-relaxed break-all">
                                {displayAddress || 'No wallet connected'}
                            </p>
                        </div>
                        <button
                            onClick={copyToClipboard}
                            disabled={!activeAddress}
                            className="shrink-0 size-10 flex items-center justify-center rounded-xl bg-[#FF611A]/20 text-[#FF611A] border border-[#FF611A]/30 hover:bg-[#FF611A] hover:text-white transition-all active:scale-90 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {copied ? 'done' : 'content_copy'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* QR Code Card */}
                <div className="rounded-2xl border border-[#FF611A]/20 bg-[#FF611A]/5 p-6 mb-6">
                    <div className="flex flex-col items-center">
                        <div className="relative  rounded-2xl p-4 mb-4 bg-[#ff611a]/20 shadow-[0_0_30px_rgba(255,97,26,0.3)]">
                            {activeAddress ? (
                                <QRCodeSVG
                                    value={`solana:${activeAddress}`}
                                    size={180}
                                    level="H"
                                    includeMargin={false}
                                    fgColor="rgba(223, 111, 59, 0.97)"
                                    bgColor="#121212"
                                />
                            ) : (
                                <div className="w-[180px] h-[180px] bg-[#FF611A]/50 rounded flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white/50 text-[60px]">qr_code_2</span>
                                </div>
                            )}
                            {/* Center logo overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-8 h-8 rounded-xl bg-[#121212] flex items-center justify-center shadow-lg">
                                    <img src={LOGO_PATH} alt="PrivyPay" className="w-6 h-6 object-contain" />
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-[#FF611A] font-bold uppercase tracking-widest">
                            {isAnonymousMode ? 'Scan to Receive' : 'Scan to Receive SOL'}
                        </p>
                    </div>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <img
                                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                                alt="SOL"
                                className="w-5 h-5 object-contain rounded-full"
                            />
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SOL</span>
                        </div>
                        <p className="text-white font-bold text-lg">{currentBalance.toFixed(4)}</p>
                        <p className="text-slate-500 text-xs">${(currentBalance * solPrice).toFixed(2)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <img
                                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                                alt="USDC"
                                className="w-5 h-5 object-contain rounded-full"
                            />
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">USDC</span>
                        </div>
                        <p className="text-white font-bold text-lg">{currentUsdcBalance.toFixed(2)}</p>
                        <p className="text-slate-500 text-xs">${currentUsdcBalance.toFixed(2)}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 px-1">Quick Actions</p>
                    <div className="space-y-3">
                        <Link href="/send" className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 flex items-center justify-between hover:bg-[#262626] transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-[#FF611A]/10 flex items-center justify-center border border-[#FF611A]/20">
                                    <span className="material-symbols-outlined text-[20px] text-[#FF611A]">arrow_outward</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">
                                        {isAnonymousMode ? 'Send Anonymously' : 'Send Privately'}
                                    </span>
                                    <span className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">
                                        {isAnonymousMode ? 'Two-hop transfer' : 'ZK-protected transfer'}
                                    </span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 group-hover:text-[#FF611A] transition-colors">chevron_right</span>
                        </Link>

                        <Link href="/receive" className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 flex items-center justify-between hover:bg-[#262626] transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-[#FF611A]/10 flex items-center justify-center border border-[#FF611A]/20">
                                    <span className="material-symbols-outlined text-[20px] text-[#FF611A] rotate-180">arrow_outward</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">Receive Funds</span>
                                    <span className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">Show QR or address</span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 group-hover:text-[#FF611A] transition-colors">chevron_right</span>
                        </Link>

                        <Link href="/activity" className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 flex items-center justify-between hover:bg-[#262626] transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <span className="material-symbols-outlined text-[20px] text-slate-400">history</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">Transaction History</span>
                                    <span className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">View all activity</span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-500 group-hover:text-[#FF611A] transition-colors">chevron_right</span>
                        </Link>
                    </div>
                </div>

                {/* Footer Badge */}
                <div className="flex justify-center mb-4">
                    <div className="flex items-center gap-2 rounded-full bg-[#262626]/50 px-4 py-2 border border-white/5">
                        <img src={LOGO_PATH} alt="PrivyPay" className="w-4 h-4 object-contain" />
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Secured by PrivyPay</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;

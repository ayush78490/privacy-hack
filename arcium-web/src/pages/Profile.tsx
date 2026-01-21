import React, { useState } from 'react';
import { Link } from 'wouter';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';

const Profile: React.FC = () => {
    const { address, balance, usdcBalance, apiConnected, solPrice } = useWallet();
    const [copied, setCopied] = useState(false);

    const displayAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-6)}`
        : '';

    const copyToClipboard = () => {
        const textToCopy = address || displayAddress;

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

    const totalUsd = (balance * solPrice) + usdcBalance;

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-[#121212]">
            {/* Background blobs - matching Dashboard */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#FF611A]/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[20%] right-[-20%] w-[60vw] h-[60vw] bg-[#FF611A]/5 rounded-full blur-[100px]"></div>
            </div>

            <header className="sticky top-0 z-20 glass-panel border-b border-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link href="/dashboard" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold leading-tight tracking-wide">Profile</h2>
                    <Link href="/settings" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined">settings</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 px-4 pt-6">
                {/* Profile Card */}
                <div className="rounded-3xl border border-[#FF611A]/20 bg-gradient-to-br from-[#FF611A]/10 to-transparent p-6 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF611A]/10 rounded-full blur-[60px]"></div>

                    <div className="relative z-10 flex items-center gap-4 mb-6">
                        <div className="size-20 rounded-full p-[2px] bg-gradient-to-tr from-[#FF611A] via-orange-400 to-yellow-500 shadow-[0_0_20px_rgba(255,97,26,0.4)]">
                            <div className="h-full w-full rounded-full bg-[#1a1a1a] border-2 border-[#121212] overflow-hidden">
                                <img
                                    alt="User profile"
                                    className="h-full w-full object-cover"
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-white text-xl font-bold mb-1">Arcium Explorer</h1>
                            <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${apiConnected ? 'bg-[#FF611A]' : 'bg-amber-500'} animate-pulse`}></div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${apiConnected ? 'text-[#FF611A]' : 'text-amber-500'}`}>
                                    {apiConnected ? 'ShadowWire Connected' : 'RPC Mode'}
                                </span>
                            </div>
                        </div>
                    </div>

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
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Wallet Address</p>
                    <div className="flex items-center gap-3 bg-[#262626] rounded-xl p-3 border border-white/5">
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-mono text-xs leading-relaxed break-all">
                                {displayAddress || 'No wallet connected'}
                            </p>
                        </div>
                        <button
                            onClick={copyToClipboard}
                            disabled={!address}
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
                        <div className="relative bg-[#FF611A] rounded-2xl p-4 mb-4 shadow-[0_0_30px_rgba(255,97,26,0.3)]">
                            {address ? (
                                <QRCodeSVG
                                    value={`solana:${address}`}
                                    size={180}
                                    level="H"
                                    includeMargin={false}
                                    fgColor="#ffffff"
                                    bgColor="#FF611A"
                                />
                            ) : (
                                <div className="w-[180px] h-[180px] bg-[#FF611A]/50 rounded flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white/50 text-[60px]">qr_code_2</span>
                                </div>
                            )}
                            {/* Center logo overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-[#FF611A] text-[24px] filled">shield</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-[#FF611A] font-bold uppercase tracking-widest">Scan to Receive SOL</p>
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
                        <p className="text-white font-bold text-lg">{balance.toFixed(4)}</p>
                        <p className="text-slate-500 text-xs">${(balance * solPrice).toFixed(2)}</p>
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
                        <p className="text-white font-bold text-lg">{usdcBalance.toFixed(2)}</p>
                        <p className="text-slate-500 text-xs">${usdcBalance.toFixed(2)}</p>
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
                                    <span className="text-white font-bold text-sm">Send Privately</span>
                                    <span className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">ZK-protected transfer</span>
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
                        <span className="material-symbols-outlined text-[#FF611A] text-[14px] filled">shield</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Secured by Arcium</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;

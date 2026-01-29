import React, { useState } from 'react';
import { Link } from 'wouter';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';
import { LOGO_PATH } from '../constants/logo';

interface ShieldedReceiveMetadata {
    type: 'shielded';
    recipient: string;
    network: 'solana-mainnet';
    protocol: 'shadowwire';
    version: '1.0';
    label?: string;
}

const Receive: React.FC = () => {
    const { address } = useWallet();
    const [receiveType, setReceiveType] = useState<'shielded' | 'normal'>('shielded');
    const [copied, setCopied] = useState(false);
    const [amount, setAmount] = useState('');
    const [label, setLabel] = useState('');

    const displayAddress = address || '';

    // Generate Solana Pay URL for normal transactions
    // Format: solana:<recipient>?amount=<amount>&label=<label>&message=<message>
    const generateNormalQRData = (): string => {
        const baseUrl = `solana:${displayAddress}`;
        const params = new URLSearchParams();

        if (amount && parseFloat(amount) > 0) {
            params.append('amount', amount);
        }
        if (label) {
            params.append('label', label);
        }
        params.append('message', 'Payment via PrivyPay Wallet');

        const queryString = params.toString();
        return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    };

    // Generate Shielded receive data with protocol metadata
    const generateShieldedQRData = (): string => {
        const metadata: ShieldedReceiveMetadata = {
            type: 'shielded',
            recipient: displayAddress,
            network: 'solana-mainnet',
            protocol: 'shadowwire',
            version: '1.0',
            label: label || undefined,
        };

        // Custom URI scheme for shielded transactions
        // Format: shadowwire://<base64-encoded-metadata>
        const encodedData = btoa(JSON.stringify({
            ...metadata,
            amount: amount && parseFloat(amount) > 0 ? parseFloat(amount) : undefined,
            timestamp: Date.now(),
        }));

        return `shadowwire://${encodedData}`;
    };

    const getQRData = () => {
        return receiveType === 'shielded' ? generateShieldedQRData() : generateNormalQRData();
    };

    const copyToClipboard = () => {
        if (!displayAddress) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(displayAddress).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }

        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'COPY_TO_CLIPBOARD',
                payload: displayAddress
            }));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const copyQRData = () => {
        const qrData = getQRData();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(qrData).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    return (
        <div className="relative flex h-full w-full flex-col overflow-x-hidden bg-[#121212]">
            {/* Background */}
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF611A]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FF611A]/5 rounded-full blur-[120px] pointer-events-none"></div>

            <header className="sticky top-0 z-20 glass-panel border-b border-white/5 px-4 py-3">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <Link href="/dashboard" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold leading-tight tracking-wide">Receive</h2>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="flex-1 px-4 pt-6 pb-32 max-w-md mx-auto w-full">
                {/* Receive Type Toggle */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <button
                        onClick={() => setReceiveType('shielded')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${receiveType === 'shielded' ? 'bg-[#FF611A] text-white shadow-[0_0_20px_rgba(255,97,26,0.3)]' : 'bg-[#1a1a1a] text-slate-400 hover:bg-[#262626]'}`}
                    >
                        <img src={LOGO_PATH} alt="PrivyPay" className="w-4 h-4 object-contain" />
                        Shielded
                    </button>
                    <button
                        onClick={() => setReceiveType('normal')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${receiveType === 'normal' ? 'bg-[#FF611A] text-white shadow-[0_0_20px_rgba(255,97,26,0.3)]' : 'bg-[#1a1a1a] text-slate-400 hover:bg-[#262626]'}`}
                    >
                        <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                        Normal
                    </button>
                </div>

                {/* Info Banner */}
                <div className={`mb-6 rounded-2xl p-4 border ${receiveType === 'shielded' ? 'bg-[#FF611A]/5 border-[#FF611A]/20' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-start gap-3">
                        {receiveType === 'shielded' ? (
                            <img src={LOGO_PATH} alt="PrivyPay" className="w-6 h-6 object-contain" />
                        ) : (
                            <span className={`material-symbols-outlined text-[24px] text-white/60 filled`}>info</span>
                        )}
                        <div>
                            <p className="text-white font-bold text-sm mb-1">
                                {receiveType === 'shielded' ? 'Private Receive' : 'Standard Receive'}
                            </p>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                {receiveType === 'shielded'
                                    ? 'Funds will be deposited directly to your shielded balance. Amount hidden via ZK proof.'
                                    : 'Funds will be deposited to your on-chain wallet. Transaction visible on explorer.'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* QR Code Card */}
                <div className="glass-card rounded-3xl p-6 mb-6 border border-white/5">
                    <div className="flex flex-col items-center">
                        {/* QR Code */}
                        <div className="relative  rounded-2xl p-4 mb-4 bg-[#ff611a]/20 shadow-[0_0_30px_rgba(255,97,26,0.3)]">
                            {displayAddress ? (
                                <QRCodeSVG
                                    value={getQRData()}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                    fgColor="rgba(223, 111, 59, 0.97)"
                                    bgColor="#121212"
                                />
                            ) : (
                                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded">
                                    <span className="text-gray-400 text-sm">No wallet connected</span>
                                </div>
                            )}

                            {/* Center logo overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${receiveType === 'shielded' ? 'bg-[#121212]' : 'bg-[#121212]'}`}>
                                    {receiveType === 'shielded' ? (
                                        <img src={LOGO_PATH} alt="PrivyPay" className="w-6 h-6 object-contain" />
                                    ) : (
                                        <span className="material-symbols-outlined text-white text-[24px] filled">account_balance_wallet</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Protocol Badge */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 ${receiveType === 'shielded' ? 'bg-[#FF611A]/10 border border-[#FF611A]/20' : 'bg-white/5 border border-white/10'}`}>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${receiveType === 'shielded' ? 'text-[#FF611A]' : 'text-slate-400'}`}>
                                {receiveType === 'shielded' ? 'ShadowWire Protocol' : 'Solana Pay'}
                            </span>
                        </div>

                        {/* Wallet Address */}
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Wallet Address</p>
                        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-xl px-4 py-3 w-full">
                            <p className="text-white font-mono text-xs flex-1 truncate">
                                {displayAddress || 'Not connected'}
                            </p>
                            <button
                                onClick={copyToClipboard}
                                className="text-[#FF611A] hover:text-[#FF8A50] transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {copied ? 'done' : 'content_copy'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Optional Amount & Label */}
                <div className="glass-card rounded-2xl p-4 mb-6 border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Optional Request Details</p>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Amount (SOL)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.0"
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#FF611A]/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Label (optional)</label>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g. Payment for services"
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF611A]/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={copyQRData}
                        className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[#1a1a1a] border border-white/10 text-white font-bold hover:bg-[#262626] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">qr_code</span>
                        Copy QR Data
                    </button>
                    <button
                        className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[#FF611A] text-white font-bold shadow-[0_0_20px_rgba(255,97,26,0.3)] hover:shadow-[0_0_30px_rgba(255,97,26,0.5)] transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">share</span>
                        Share
                    </button>
                </div>

                {/* Metadata Preview */}
                {/* <div className="glass-card rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">QR Metadata</p>
                    <div className="bg-[#0f0f0f] rounded-xl p-3 font-mono text-[10px] text-slate-400 overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-all">
                            {receiveType === 'shielded' ? (
                                JSON.stringify({
                                    type: 'shielded',
                                    protocol: 'shadowwire',
                                    network: 'solana-mainnet',
                                    recipient: displayAddress?.slice(0, 8) + '...',
                                    amount: amount || null,
                                    label: label || null,
                                }, null, 2)
                            ) : (
                                `solana:${displayAddress?.slice(0, 8)}...${amount ? `?amount=${amount}` : ''}${label ? `&label=${encodeURIComponent(label)}` : ''}`
                            )}
                        </pre>
                    </div>
                </div> */}
            </main>
        </div>
    );
};

export default Receive;

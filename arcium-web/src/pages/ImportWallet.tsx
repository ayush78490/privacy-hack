import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { validateMnemonic, mnemonicToWallet } from '../utils/wallet';

const ImportWallet: React.FC = () => {
    const [, setLocation] = useLocation();
    const [mnemonic, setMnemonic] = useState('');
    const [error, setError] = useState('');

    const handleImport = () => {
        const cleanMnemonic = mnemonic.trim().toLowerCase();

        if (!validateMnemonic(cleanMnemonic)) {
            setError('Invalid mnemonic phrase. Please check the words and spacing.');
            return;
        }

        try {
            const wallet = mnemonicToWallet(cleanMnemonic);
            const address = wallet.publicKey.toString();

            localStorage.setItem('arcium_wallet_address', address);
            localStorage.setItem('arcium_mnemonic', cleanMnemonic);

            // Dispatch internal update
            window.dispatchEvent(new Event('walletUpdate'));

            setLocation('/dashboard');
        } catch (err) {
            console.error('Import failed:', err);
            setError('Failed to derive wallet. Please try again.');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-obsidian text-white p-6 justify-between">
            <div className="flex flex-col gap-8">
                <header className="flex items-center gap-4">
                    <Link href="/">
                        <button className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    </Link>
                    <h1 className="text-xl font-bold">Import Wallet</h1>
                </header>

                <div className="flex flex-col gap-6">
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        Enter your 12-word secret recovery phrase to restore your Arcium wallet.
                    </p>

                    <div className="flex flex-col gap-4">
                        <textarea
                            value={mnemonic}
                            onChange={(e) => {
                                setMnemonic(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter your 12 words here..."
                            className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-6 text-white font-medium focus:border-primary/50 focus:ring-0 transition-all resize-none"
                        />
                        {error && (
                            <p className="text-red-400 text-xs font-bold pl-2">{error}</p>
                        )}
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-3">
                        <span className="material-symbols-outlined text-primary">info</span>
                        <p className="text-xs text-primary/80 leading-relaxed font-medium">
                            Your phrase is never shared and stays encrypted on your device.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 pb-8">
                <button
                    onClick={handleImport}
                    disabled={!mnemonic.trim()}
                    className="w-full bg-primary text-white font-bold h-16 rounded-2xl shadow-glow transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                >
                    Import Wallet
                </button>
            </div>
        </div>
    );
};

export default ImportWallet;

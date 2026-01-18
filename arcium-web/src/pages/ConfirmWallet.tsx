import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { mnemonicToWallet } from '../utils/wallet';

const ConfirmWallet: React.FC = () => {
    const [, setLocation] = useLocation();
    // In a real app, you'd pass the mnemonic via state or a global store.
    // For this demo, we'll assume it's in history state or just mock the logic.
    const mnemonic = (window.history.state as any)?.mnemonic || '';

    const [inputWords, setInputWords] = useState<string[]>(new Array(3).fill(''));
    const [indices, setIndices] = useState<number[]>([]);

    useEffect(() => {
        if (!mnemonic) {
            setLocation('/create-wallet');
            return;
        }
        // Pick 3 random indices to verify
        const allIndices = Array.from({ length: 12 }, (_, i) => i);
        const shuffled = allIndices.sort(() => 0.5 - Math.random());
        setIndices(shuffled.slice(0, 3).sort((a, b) => a - b));
    }, [mnemonic, setLocation]);

    const handleConfirm = () => {
        const originalWords = mnemonic.split(' ');
        const isCorrect = indices.every((idx, i) => inputWords[i].trim().toLowerCase() === originalWords[idx]);

        if (isCorrect) {
            try {
                // Derive the wallet to get the address
                const wallet = mnemonicToWallet(mnemonic);
                const address = wallet.publicKey.toString();

                // Save to local storage
                localStorage.setItem('arcium_wallet_address', address);
                localStorage.setItem('arcium_mnemonic', mnemonic);

                // Dispatch internal update
                window.dispatchEvent(new Event('walletUpdate'));

                setLocation('/dashboard');
            } catch (err) {
                console.error('Wallet derivation failed:', err);
                alert('Fatal error creating wallet. Please try again.');
            }
        } else {
            alert('Incorrect words. Please check your mnemonic and try again.');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-obsidian text-white p-6 justify-between">
            <div className="flex flex-col gap-8">
                <header className="flex items-center gap-4">
                    <Link href="/create-wallet">
                        <button className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    </Link>
                    <h1 className="text-xl font-bold">Verify Phrase</h1>
                </header>

                <div className="flex flex-col gap-6">
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        Please enter the following words from your recovery phrase to confirm you've saved it.
                    </p>

                    <div className="flex flex-col gap-6">
                        {indices.map((idx, i) => (
                            <div key={idx} className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 pl-1">
                                    Word #{idx + 1}
                                </label>
                                <input
                                    type="text"
                                    value={inputWords[i]}
                                    onChange={(e) => {
                                        const newWords = [...inputWords];
                                        newWords[i] = e.target.value;
                                        setInputWords(newWords);
                                    }}
                                    className="bg-white/5 border border-white/10 rounded-2xl h-14 px-4 focus:border-primary/50 focus:ring-0 transition-all text-white font-medium"
                                    placeholder={`Enter word #${idx + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 pb-8">
                <button
                    onClick={handleConfirm}
                    className="w-full bg-primary text-white font-bold h-16 rounded-2xl shadow-glow transition-all active:scale-[0.98]"
                >
                    Verify & Create Wallet
                </button>
            </div>
        </div>
    );
};

export default ConfirmWallet;

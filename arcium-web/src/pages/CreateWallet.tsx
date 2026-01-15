import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { generateMnemonic } from '../utils/wallet';

const CreateWallet: React.FC = () => {
    const [mnemonic, setMnemonic] = useState<string>('');
    const [, setLocation] = useLocation();

    useEffect(() => {
        setMnemonic(generateMnemonic());
    }, []);

    const copyToClipboard = () => {
        const textToCopy = mnemonic;

        // 1. Try Navigator API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('Copied to clipboard!');
            }).catch(() => {
                fallbackCopy(textToCopy);
            });
        } else {
            fallbackCopy(textToCopy);
        }

        // 2. Also send to native side just in case
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'COPY_TO_CLIPBOARD',
                payload: textToCopy
            }));
        }
    };

    const fallbackCopy = (text: string) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                alert('Copied to clipboard!');
            }
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
    };

    const words = mnemonic.split(' ');

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-obsidian text-white p-6 justify-between">
            <div className="flex flex-col gap-6">
                <header className="flex items-center gap-4">
                    <Link href="/">
                        <button className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    </Link>
                    <h1 className="text-xl font-bold">Secret Recovery Phrase</h1>
                </header>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex gap-3">
                    <span className="material-symbols-outlined text-yellow-500">warning</span>
                    <p className="text-sm text-yellow-200/80 leading-relaxed">
                        This phrase is the only way to recover your wallet. Do not share it with anyone!
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-white/5 p-4 rounded-3xl border border-white/5 shadow-inner">
                    {words.map((word, index) => (
                        <div key={index} className="flex gap-2 items-center bg-obsidian/50 rounded-xl p-3 border border-white/5">
                            <span className="text-zinc-600 text-[10px] font-bold w-4">{index + 1}</span>
                            <span className="text-sm font-semibold tracking-wide">{word}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 text-primary font-bold text-sm py-2 hover:text-primary/80 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">content_copy</span>
                    Copy to clipboard
                </button>
            </div>

            <div className="flex flex-col gap-4 pb-8">
                <button
                    onClick={() => setLocation('/confirm-wallet', { state: { mnemonic } })}
                    className="w-full bg-primary text-white font-bold h-16 rounded-2xl shadow-glow transition-all active:scale-[0.98]"
                >
                    I've written it down
                </button>
            </div>
        </div>
    );
};

export default CreateWallet;

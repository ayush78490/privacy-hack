import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '../context/WalletContext';
import { LOGO_PATH } from '../constants/logo';

const Welcome: React.FC = () => {
    const [, setLocation] = useLocation();
    const { generateNewAnonymousWallet, switchToAnonymousMode } = useWallet();

    // Auto-redirect to dashboard if wallet credentials exist
    useEffect(() => {
        const storedAddress = localStorage.getItem('privypay_wallet_address');
        const storedMnemonic = localStorage.getItem('privypay_mnemonic');
        if (storedAddress && storedMnemonic) {
            setLocation('/dashboard');
        }
    }, [setLocation]);

    // Handle anonymous wallet creation and redirect
    const handleUseAnonymousWallet = () => {
        // Generate a new anonymous wallet (auto-saves to history)
        generateNewAnonymousWallet();
        // Switch to anonymous mode
        switchToAnonymousMode();
        // Redirect to dashboard
        setLocation('/dashboard');
    };

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-obsidian group/design-root touch-none overscroll-none select-none">
            <div className="absolute inset-0 bg-mesh-gradient opacity-80 pointer-events-none"></div>
            <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] bg-electric-purple/20 rounded-full blur-[140px] pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-neon-teal/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
            <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-indigo-900/30 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 flex h-full w-full max-w-md mx-auto p-6 flex-col justify-between overflow-hidden">


                <div className="flex flex-col items-center justify-center  w-full my-auto">
                    <div className="relative w-full aspect-square max-w-[180px] flex items-center justify-center mb-10">
                        <div className="absolute inset-0 border border-electric-purple/10  rounded-full scale-110"></div>
                        <div className="absolute inset-0 border border-neon-teal/5 rounded-full scale-125 border-dashed"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-electric-purple/20 to-neon-teal/20 blur-[50px] rounded-full scale-75 animate-pulse-slow"></div>
                        <div className="relative z-20 w-full h-full p-6 rounded-full bg-gradient-to-b from-white/5 to-transparent border border-white/5 backdrop-blur-sm shadow-2xl shadow-black/50 flex items-center justify-center">
                            <img src={LOGO_PATH} alt="PrivyPay" className="w-full h-full object-contain" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center text-center gap-4 px-4 relative">
                        <h1 className="text-white text-4xl md:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-lg">
                            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/60">Shielded by</span><br />
                            <span className="bg-clip-text text-transparent bg-primary-glow-bg">PrivyPay</span>
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col w-full gap-4 pb-8">
                    {/* Create New Wallet Button */}
                    <Link href="/create-wallet" className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-16 p-[1px] shadow-glow transition-all active:scale-[0.98]">
                        <span className="absolute inset-0 bg-gradient-to-r from-electric-purple via-neon-teal to-electric-purple opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-charcoal/90 backdrop-blur-xl transition-all group-hover:bg-charcoal/80">
                            <span className="text-white text-lg font-bold tracking-wide">Create a new wallet</span>
                            <span className="material-symbols-outlined ml-2 text-white/80 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                    </Link>

                    {/* Use Anonymous Wallet Button */}
                    <button
                        onClick={handleUseAnonymousWallet}
                        className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-14 p-[1px] transition-all active:scale-[0.98]"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-[#FF611A] via-amber-500 to-[#FF611A] opacity-60 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-charcoal/95 backdrop-blur-xl transition-all group-hover:bg-charcoal/85 gap-2">
                            <span className="material-symbols-outlined text-[#FF611A] text-xl">visibility_off</span>
                            <span className="text-white text-base font-bold tracking-wide">Use Anonymous Wallet</span>
                        </div>
                    </button>

                    {/* Import Wallet Button */}
                    <Link href="/import-wallet" className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-14 px-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-zinc-400 hover:text-white text-sm font-semibold tracking-wide backdrop-blur-md">
                        <span className="truncate">I already have a wallet</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Welcome;

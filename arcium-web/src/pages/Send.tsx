import React from 'react';
import { Link } from 'wouter';

const Send: React.FC = () => {
    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-[#020408] pb-24">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-full h-[400px] bg-indigo-900/10 rounded-full blur-[80px] pointer-events-none"></div>

            <header className="relative flex items-center justify-between p-4 pt-8 pb-2 z-10">
                <Link href="/dashboard" className="text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </Link>
                <h2 className="text-white/90 text-lg font-bold leading-tight tracking-wide flex-1 text-center drop-shadow-sm">Private Send</h2>
                <div className="flex w-12 items-center justify-end">
                    <div className="flex items-center justify-center rounded-full h-10 w-10 bg-white/5 backdrop-blur text-primary border border-white/5 shadow-inner">
                        <span className="material-symbols-outlined text-[20px] filled">shield</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col px-6 pt-4 pb-8 relative z-10">
                <div className="flex flex-col items-center justify-center py-6 flex-grow-0 mb-4">
                    <div className="flex items-baseline gap-1 relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-50"></div>
                        <h1 className="relative text-white text-[3.5rem] font-medium tracking-tight drop-shadow-[0_0_15px_rgba(43,108,238,0.2)]">0.00</h1>
                        <span className="relative text-primary/80 text-xl font-semibold mb-2">SOL</span>
                    </div>
                    <p className="text-white/40 text-sm font-medium mt-1 tracking-wide">≈ $0.00 USD</p>
                </div>

                <div className="mb-6 relative group">
                    <label className="block text-white/50 text-[11px] font-bold uppercase tracking-widest mb-2 pl-1">To Shielded Address</label>
                    <div className="glass-input flex w-full items-stretch rounded-2xl overflow-hidden focus-within:border-primary/60 focus-within:shadow-[0_0_25px_rgba(43,108,238,0.2)] transition-all duration-300">
                        <input className="flex-1 bg-transparent border-none text-white placeholder:text-white/20 px-4 py-4 focus:ring-0 text-base font-medium" placeholder="Paste address or ENS..." type="text" />
                        <button className="px-5 flex items-center justify-center text-primary/80 border-l border-white/5 hover:bg-white/5 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
                        </button>
                    </div>
                </div>

                <div className="mb-auto">
                    <div className="glass-card flex items-stretch justify-between gap-4 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none mix-blend-screen opacity-50"></div>
                        <div className="flex flex-col gap-2 flex-[3] relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px] drop-shadow-[0_0_8px_rgba(43,108,238,0.6)] filled">lock</span>
                                <p className="text-white text-sm font-bold leading-tight tracking-wide">Ghost Mode Active</p>
                            </div>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed">
                                Powered by <span className="text-white font-semibold">Arcium</span>. This transaction is encrypted and invisible on public explorers.
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-xl bg-cover bg-center shrink-0 opacity-80 border border-white/10 shadow-lg" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuA_BOfdyJXIqMSy-HsoTqB7YAr6R9aH9L7K9fdA5__e4uYNxvFEp25HmFkDZkhGwseCu0iXWoqTbg-lnw9Kt_SATMVFKJuYsVGWfaLi6x33qUPsYf39uMjEjliTU-e-PxYNc9NuE-aiUuJ9lrxSbPQWkAxewT_MEbZV6krs1U14F8DOeihYExSXOOZ5e0_4BJmKgC9mUIO7_65Pzzh9qzIUgfEe9aU9L9uj73ZyXE-k0cs6hWQyqkP1EUW1Qe36SPl-Pz8XLGVvzN1s")` }}></div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-y-2 gap-x-4 px-2 mb-8 mt-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                        <button key={num} className="flex items-center justify-center h-16 w-full text-2xl font-light text-white/90 transition-all duration-200 rounded-2xl hover:bg-white/5 active:bg-white/10 active:scale-95 select-none">
                            {num}
                        </button>
                    ))}
                    <button className="flex items-center justify-center h-16 w-full text-white/50 hover:text-white transition-all duration-200 rounded-2xl hover:bg-white/5 active:bg-white/10 active:scale-95 select-none">
                        <span className="material-symbols-outlined text-[24px]">backspace</span>
                    </button>
                </div>

                <button className="w-full bg-primary-glow-bg text-white font-bold h-[60px] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(14,165,233,0.35)] hover:shadow-[0_0_45px_rgba(14,165,233,0.5)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 blur-md"></div>
                    <span className="material-symbols-outlined relative z-10">visibility_off</span>
                    <span className="relative z-10 text-lg tracking-wide">Send Privately</span>
                </button>
            </main>
        </div>
    );
};

export default Send;

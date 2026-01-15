import React from 'react';
import { Link } from 'wouter';

const Swap: React.FC = () => {
    return (
        <div className="bg-dark-bg text-white min-h-screen font-display antialiased selection:bg-purple-500/30 selection:text-teal-200 relative pb-24">
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="flex items-center p-4 pb-2 justify-between sticky top-0 z-30 backdrop-blur-xl bg-dark-bg/60 border-b border-white/5">
                <div className="w-12">
                    <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                </div>
                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-bold leading-tight tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Private Swap</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                        <span className="text-[10px] text-teal-400 uppercase tracking-widest font-semibold">Secure Route</span>
                    </div>
                </div>
                <div className="w-12 flex justify-end">
                    <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">tune</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col flex-1 px-4 py-6 max-w-md mx-auto w-full relative z-10">
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#13151f] border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer shadow-lg shadow-black/50">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-[8px] font-bold">E</div>
                        <span className="text-xs font-medium text-gray-300">Ethereum Mainnet</span>
                        <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '16px' }}>expand_more</span>
                    </div>
                </div>

                <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-purple-500/40 via-white/5 to-teal-500/40 shadow-2xl shadow-purple-900/10">
                    <div className="bg-card-bg rounded-[23px] relative overflow-hidden backdrop-blur-xl">
                        <div className="p-5 pt-6 relative input-glow transition-all duration-300">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pay</span>
                                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10">
                                    <span className="material-symbols-outlined text-purple-400" style={{ fontSize: '14px' }}>account_balance_wallet</span>
                                    <span className="text-slate-300 text-xs font-medium">4.20 ETH</span>
                                    <span className="text-purple-400 text-[10px] font-bold uppercase">Max</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <input className="bg-transparent text-4xl font-bold text-white border-none p-0 focus:ring-0 w-full placeholder-slate-700 font-display tracking-tight" placeholder="0.0" type="number" defaultValue="1.5" />
                                    <p className="text-slate-500 text-sm mt-1 font-medium">≈ $2,850.00</p>
                                </div>
                                <button className="flex shrink-0 items-center gap-2 bg-[#1c1f2e] hover:bg-[#25293d] border border-white/10 rounded-full pl-2 pr-3 py-1.5 transition-all group shadow-lg">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">E</div>
                                    <span className="text-lg font-bold">ETH</span>
                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-white transition-colors" style={{ fontSize: '20px' }}>expand_more</span>
                                </button>
                            </div>
                        </div>

                        <div className="relative h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1 flex items-center justify-center z-10">
                            <button className="absolute bg-[#161824] border-[3px] border-[#0f111a] p-2 rounded-xl text-purple-400 hover:text-teal-400 hover:border-[#161824] hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:scale-110 transition-all duration-300 group">
                                <span className="material-symbols-outlined group-hover:-rotate-180 transition-transform duration-500">swap_vert</span>
                            </button>
                        </div>

                        <div className="p-5 pb-6 relative input-glow transition-all duration-300">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Receive</span>
                                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                                    <span className="material-symbols-outlined text-teal-400" style={{ fontSize: '14px' }}>account_balance_wallet</span>
                                    <span className="text-slate-300 text-xs font-medium">--</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <input className="bg-transparent text-4xl font-bold text-teal-400 border-none p-0 focus:ring-0 w-full placeholder-slate-700 font-display tracking-tight" placeholder="0.0" type="number" defaultValue="2850" />
                                    <p className="text-slate-500 text-sm mt-1 font-medium invisible">Placeholder</p>
                                </div>
                                <button className="flex shrink-0 items-center gap-2 bg-[#1c1f2e] hover:bg-[#25293d] border border-white/10 rounded-full pl-2 pr-3 py-1.5 transition-all group shadow-lg">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">$</div>
                                    <span className="text-lg font-bold">USDC</span>
                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-white transition-colors" style={{ fontSize: '20px' }}>expand_more</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-black/30 border-t border-white/5 p-3 flex items-center justify-between relative overflow-hidden backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-teal-500/10"></div>
                            <div className="flex items-center gap-2 z-10">
                                <div className="p-1 rounded bg-teal-500/10 border border-teal-500/20">
                                    <span className="material-symbols-outlined text-teal-400 animate-pulse" style={{ fontSize: '16px' }}>hub</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Route</span>
                                    <span className="text-xs font-semibold text-white">Arcium Private Net</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 z-10 opacity-80">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]"></span>
                                <div className="w-3 h-[1px] bg-slate-700"></div>
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                <div className="w-3 h-[1px] bg-slate-700"></div>
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shadow-[0_0_5px_rgba(20,184,166,0.5)]"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 mb-4">
                    <div className="flex justify-between items-end mb-2 px-1">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Privacy Strength</span>
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-teal-400 filled" style={{ fontSize: '16px' }}>shield</span>
                            <span className="text-xs text-teal-400 font-bold uppercase tracking-wider drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">Untraceable</span>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-[#13151f] rounded-full overflow-hidden p-[2px] shadow-inner border border-white/5">
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-purple-600 via-blue-500 to-teal-400 animate-pulse shadow-[0_0_15px_rgba(45,212,191,0.3)] relative">
                        </div>
                    </div>
                </div>

                <div className="mt-4 mb-6 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-teal-400 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse-slow"></div>
                    <button className="relative w-full h-14 rounded-xl overflow-hidden bg-gradient-to-r from-[#6d28d9] to-[#0d9488] shadow-xl active:scale-[0.98] transition-all border border-white/10">
                        <div className="relative flex items-center justify-center gap-3 text-white z-10">
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>visibility_off</span>
                            <span className="text-lg font-bold tracking-wide">Swap Untraceable</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Swap;

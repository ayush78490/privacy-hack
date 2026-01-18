import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useWallet } from '../context/WalletContext';
import * as txStore from '../utils/txStore';
import { fetchTransactionHistory, OnChainTransaction } from '../utils/solana';

const Activity: React.FC = () => {
    const { address } = useWallet();
    const [localTransactions, setLocalTransactions] = useState<txStore.LocalTransaction[]>([]);
    const [onChainTransactions, setOnChainTransactions] = useState<OnChainTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'normal' | 'private'>('all');

    // Load transactions
    useEffect(() => {
        const loadTransactions = async () => {
            if (!address) {
                setLoading(false);
                return;
            }

            setLoading(true);

            // Load local transactions
            const localTxs = txStore.getTransactions(address);
            setLocalTransactions(localTxs);

            // Fetch on-chain transactions
            try {
                console.log('[Activity] Fetching on-chain transactions...');
                const onChainTxs = await fetchTransactionHistory(address, 20);
                console.log('[Activity] Found transactions:', onChainTxs.length);
                setOnChainTransactions(onChainTxs);
            } catch (err) {
                console.error('[Activity] Failed to fetch on-chain transactions:', err);
            }

            setLoading(false);
        };

        loadTransactions();
    }, [address]);

    // Refresh handler
    const handleRefresh = async () => {
        if (!address) return;

        setLoading(true);
        const localTxs = txStore.getTransactions(address);
        setLocalTransactions(localTxs);

        try {
            const onChainTxs = await fetchTransactionHistory(address, 20);
            setOnChainTransactions(onChainTxs);
        } catch (err) {
            console.error('[Activity] Refresh failed:', err);
        }

        setLoading(false);
    };

    // Format time
    const formatTime = (timestamp: number | null) => {
        if (!timestamp) return 'Just now';
        const now = Date.now();
        const diff = now - timestamp;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    // Get private transactions (from local store, marked as private)
    const privateTransactions = localTransactions.filter(tx => tx.isPrivate);

    // Get normal transactions (on-chain only)
    const normalTransactions = onChainTransactions.map(tx => ({
        id: tx.signature,
        type: 'send' as const,
        status: tx.err ? 'failed' as const : 'confirmed' as const,
        fromToken: 'SOL',
        amount: '–',
        txHash: tx.signature,
        timestamp: tx.timestamp || Date.now(),
        isPrivate: false,
    }));

    // Filter based on active tab
    const displayTransactions = activeTab === 'private'
        ? privateTransactions
        : activeTab === 'normal'
            ? normalTransactions
            : [...privateTransactions, ...normalTransactions].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="bg-[#121212] min-h-screen flex flex-col overflow-hidden text-gray-200 relative pb-24">
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF611A]/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[10%] right-[-10%] w-[70%] h-[70%] bg-[#FF611A]/5 rounded-full blur-[120px]"></div>
            </div>

            <header className="flex-none sticky top-0 z-20 backdrop-blur-xl bg-[#121212]/60 border-b border-white/5">
                <div className="flex items-center px-4 pt-12 pb-4 justify-between">
                    <Link href="/dashboard" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold leading-tight tracking-wide flex-1 text-center">Activity</h2>
                    <div className="flex w-10 items-center justify-end">
                        <button
                            className="flex cursor-pointer items-center justify-center size-10 rounded-full hover:bg-white/10 transition-colors text-white"
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
                                {loading ? 'sync' : 'refresh'}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10">
                {/* Tab Selector */}
                <div className="px-4 py-4">
                    <div className="flex bg-[#1a1a1a] rounded-xl p-1 border border-white/10">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'all' ? 'bg-[#FF611A] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveTab('normal')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1 ${activeTab === 'normal' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[14px]">public</span>
                            Normal
                        </button>
                        <button
                            onClick={() => setActiveTab('private')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1 ${activeTab === 'private' ? 'bg-[#FF611A] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[14px] filled">shield</span>
                            Private
                        </button>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="px-4 pb-4">
                    <div className={`flex items-center justify-center gap-2 py-1.5 px-4 rounded-full w-fit mx-auto border ${activeTab === 'private' ? 'bg-[#FF611A]/5 border-[#FF611A]/20' : activeTab === 'normal' ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                        <span className={`material-symbols-outlined text-[16px] filled ${activeTab === 'private' ? 'text-[#FF611A]' : activeTab === 'normal' ? 'text-green-400' : 'text-slate-400'}`}>
                            {activeTab === 'private' ? 'shield_lock' : activeTab === 'normal' ? 'public' : 'history'}
                        </span>
                        <p className={`text-[11px] font-semibold tracking-widest uppercase ${activeTab === 'private' ? 'text-[#FF611A]' : activeTab === 'normal' ? 'text-green-400' : 'text-slate-400'}`}>
                            {activeTab === 'private' ? `${privateTransactions.length} Private` : activeTab === 'normal' ? `${normalTransactions.length} On-Chain` : `${displayTransactions.length} Total`}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <span className="material-symbols-outlined text-[#FF611A] text-[32px] animate-spin">sync</span>
                        <p className="text-slate-500 text-sm mt-2">Loading transactions...</p>
                    </div>
                ) : displayTransactions.length > 0 ? (
                    <>
                        <div className="px-6 py-2">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                                {activeTab === 'private' ? 'Private Transactions' : activeTab === 'normal' ? 'On-Chain Transactions' : 'Recent Transactions'}
                            </p>
                        </div>
                        {displayTransactions.map(tx => (
                            <div
                                key={tx.id || tx.txHash}
                                className={`mx-4 mb-3 p-4 rounded-2xl border transition-colors cursor-pointer ${tx.isPrivate ? 'bg-[#FF611A]/5 border-[#FF611A]/20 hover:border-[#FF611A]/40' : 'bg-[#1a1a1a] border-white/10 hover:border-white/20'}`}
                                onClick={() => {
                                    if (!tx.isPrivate) {
                                        window.open(`https://solscan.io/tx/${tx.txHash}`, '_blank');
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.isPrivate ? 'bg-[#FF611A]/20' : 'bg-green-500/10'}`}>
                                            <span className={`material-symbols-outlined ${tx.isPrivate ? 'text-[#FF611A]' : 'text-green-400'}`}>
                                                {tx.isPrivate ? 'shield' : 'swap_horiz'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">
                                                {tx.isPrivate ? 'Private Transaction' : 'On-Chain Transfer'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-slate-500">{formatTime(tx.timestamp)}</span>
                                                {tx.isPrivate ? (
                                                    <span className="flex items-center gap-1 text-[#FF611A]">
                                                        <span className="material-symbols-outlined text-[12px] filled">visibility_off</span>
                                                        Hidden
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-green-400">
                                                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                                        View
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-mono text-xs">
                                            {tx.txHash.slice(0, 8)}...
                                        </p>
                                        <p className={`text-xs capitalize ${tx.status === 'confirmed' ? 'text-green-400' : tx.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>
                                            {tx.status}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${activeTab === 'private' ? 'bg-[#FF611A]/10' : 'bg-[#1a1a1a]'}`}>
                            <span className={`material-symbols-outlined text-[36px] ${activeTab === 'private' ? 'text-[#FF611A]' : 'text-slate-500'}`}>
                                {activeTab === 'private' ? 'shield' : 'receipt_long'}
                            </span>
                        </div>
                        <h3 className="text-white text-lg font-bold mb-2">
                            {activeTab === 'private' ? 'No Private Transactions' : 'No Transactions Yet'}
                        </h3>
                        <p className="text-slate-500 text-sm text-center max-w-xs">
                            {activeTab === 'private'
                                ? 'Private transactions will appear here when you use Private Swap.'
                                : 'Your transaction history will appear here after you make a swap or transfer.'
                            }
                        </p>
                        <Link href="/swap" className="mt-6 px-6 py-3 bg-[#FF611A] rounded-xl text-white font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined">swap_horiz</span>
                            {activeTab === 'private' ? 'Try Private Swap' : 'Make Your First Swap'}
                        </Link>
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl bg-[#121212]/90 border-t border-white/5">
                <div className="flex items-center justify-around h-16 max-w-md mx-auto">
                    <Link href="/dashboard" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[22px]">home</span>
                        <span className="text-[10px] font-medium">Home</span>
                    </Link>
                    <Link href="/swap" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
                        <span className="text-[10px] font-medium">Swap</span>
                    </Link>
                    <Link href="/activity" className="flex flex-col items-center gap-1 p-2 text-[#FF611A]">
                        <span className="material-symbols-outlined text-[22px] filled">receipt_long</span>
                        <span className="text-[10px] font-medium">Activity</span>
                    </Link>
                    <Link href="/send" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[22px]">send</span>
                        <span className="text-[10px] font-medium">Send</span>
                    </Link>
                    <Link href="/profile" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[22px]">settings</span>
                        <span className="text-[10px] font-medium">Settings</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
};

export default Activity;

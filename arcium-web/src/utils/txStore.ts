// Local transaction storage utility
// Stores transactions in localStorage since ShadowWire API doesn't have history endpoint yet

export interface LocalTransaction {
    id: string;
    type: 'send' | 'receive' | 'swap';
    status: 'pending' | 'confirmed' | 'failed';
    fromToken: string;
    toToken?: string;
    amount: string;
    toAmount?: string;
    recipient?: string;
    txHash: string;
    timestamp: number;
    isPrivate: boolean;
}

const STORAGE_KEY = 'arcium_transactions';
const MAX_TRANSACTIONS = 50;

// Get all transactions for an address
export const getTransactions = (address: string): LocalTransaction[] => {
    try {
        const stored = localStorage.getItem(`${STORAGE_KEY}_${address}`);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch {
        return [];
    }
};

// Add a new transaction
export const addTransaction = (address: string, tx: Omit<LocalTransaction, 'id' | 'timestamp'>): LocalTransaction => {
    const transactions = getTransactions(address);

    const newTx: LocalTransaction = {
        ...tx,
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
    };

    // Add to beginning and limit to MAX_TRANSACTIONS
    const updated = [newTx, ...transactions].slice(0, MAX_TRANSACTIONS);

    try {
        localStorage.setItem(`${STORAGE_KEY}_${address}`, JSON.stringify(updated));
    } catch (err) {
        console.error('[TxStore] Failed to save transaction:', err);
    }

    return newTx;
};

// Update transaction status
export const updateTransactionStatus = (address: string, txId: string, status: LocalTransaction['status']): void => {
    const transactions = getTransactions(address);
    const updated = transactions.map(tx =>
        tx.id === txId ? { ...tx, status } : tx
    );

    try {
        localStorage.setItem(`${STORAGE_KEY}_${address}`, JSON.stringify(updated));
    } catch (err) {
        console.error('[TxStore] Failed to update transaction:', err);
    }
};

// Clear all transactions for an address
export const clearTransactions = (address: string): void => {
    localStorage.removeItem(`${STORAGE_KEY}_${address}`);
};

// Format relative time
export const formatRelativeTime = (timestamp: number): string => {
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

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Keypair } from '@solana/web3.js';
import { mnemonicToWallet } from '../utils/wallet';
import * as api from '../utils/api';
import { fetchBalance as fetchSolBalance, fetchTokenBalance } from '../utils/solana';

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // Mainnet USDC

interface TokenBalance {
    symbol: string;
    name: string;
    balance: number;
    balanceFormatted: number;
    decimals: number;
}

interface WalletContextType {
    wallet: Keypair | null;
    address: string | null;
    balance: number;
    usdcBalance: number;
    tokenBalances: TokenBalance[];
    tokens: api.Token[];
    loading: boolean;
    refreshBalance: () => Promise<void>;
    mnemonic: string | null;
    error: string | null;
    apiConnected: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wallet, setWallet] = useState<Keypair | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<number>(0);
    const [usdcBalance, setUsdcBalance] = useState<number>(0);
    const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
    const [tokens, setTokens] = useState<api.Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [mnemonic, setMnemonic] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiConnected, setApiConnected] = useState(false);

    // Use a ref to track if we're currently refreshing to avoid overlaps
    const isRefreshing = useRef(false);

    // Check API connection and fetch tokens on mount
    useEffect(() => {
        const initApi = async () => {
            try {
                const health = await api.checkHealth();
                if (health) {
                    console.log('[WalletContext] API connected:', health);
                    setApiConnected(true);

                    // Fetch supported tokens
                    const tokenList = await api.getTokens();
                    if (tokenList.length > 0) {
                        setTokens(tokenList);
                        console.log('[WalletContext] Loaded tokens:', tokenList.length);
                    }
                } else {
                    console.warn('[WalletContext] API not available, using fallback RPC');
                    setApiConnected(false);
                }
            } catch (err) {
                console.warn('[WalletContext] API connection failed:', err);
                setApiConnected(false);
            }
        };
        initApi();
    }, []);

    const refreshBalance = useCallback(async () => {
        // Ensure we have an address in STATE
        if (!address) {
            console.log('[WalletContext] refreshBalance skipped: No address in state');
            return;
        }

        if (isRefreshing.current) return;
        isRefreshing.current = true;

        console.log('[WalletContext] refreshBalance triggered for:', address);

        try {
            setError(null);

            if (apiConnected) {
                // Try ShadowWire API first
                console.log('[WalletContext] Fetching balances from ShadowWire API...');
                const balancesResult = await api.getBalances(address);

                if (balancesResult && balancesResult.balances) {
                    const balances = balancesResult.balances;

                    // Find SOL and USDC from the response
                    const solBalance = balances.find(b => b.token === 'SOL');
                    const usdcBalanceData = balances.find(b => b.token === 'USDC');

                    setBalance(solBalance?.availableFormatted || 0);
                    setUsdcBalance(usdcBalanceData?.availableFormatted || 0);

                    // Map to our token balance format
                    const mappedBalances: TokenBalance[] = balances.map(b => {
                        const tokenInfo = tokens.find(t => t.symbol === b.token);
                        return {
                            symbol: b.token,
                            name: tokenInfo?.name || b.token,
                            balance: b.available,
                            balanceFormatted: b.availableFormatted,
                            decimals: tokenInfo?.decimals || api.getDecimals(b.token),
                        };
                    });
                    setTokenBalances(mappedBalances);

                    console.log('[WalletContext] ShadowWire balances received:', { balances });
                    return;
                }
            }

            // Fallback to direct RPC calls
            console.log('[WalletContext] Using fallback RPC for balances...');
            const [solBal, usdcBal] = await Promise.all([
                fetchSolBalance(address),
                fetchTokenBalance(address, USDC_MINT),
            ]);

            console.log('[WalletContext] Fallback balances received:', { solBal, usdcBal });

            setBalance(solBal);
            setUsdcBalance(usdcBal);
            setTokenBalances([
                { symbol: 'SOL', name: 'Solana', balance: solBal * 1e9, balanceFormatted: solBal, decimals: 9 },
                { symbol: 'USDC', name: 'USD Coin', balance: usdcBal * 1e6, balanceFormatted: usdcBal, decimals: 6 },
            ]);
        } catch (err: any) {
            const errMsg = err.message || 'Failed to fetch balances';
            console.error('[WalletContext] Refresh Error:', errMsg);
            setError(errMsg);
        } finally {
            isRefreshing.current = false;
        }
    }, [address, apiConnected, tokens]);

    // Effect for initial wallet hydration
    useEffect(() => {
        const hydrateWallet = () => {
            const storedMnemonic = localStorage.getItem('arcium_mnemonic');
            const storedAddress = localStorage.getItem('arcium_wallet_address');

            if (storedMnemonic && storedAddress) {
                console.log('[WalletContext] Hydrating wallet from storage:', storedAddress);
                try {
                    const derivedWallet = mnemonicToWallet(storedMnemonic);
                    setWallet(derivedWallet);
                    setAddress(storedAddress);
                    setMnemonic(storedMnemonic);
                } catch (err: any) {
                    console.error('[WalletContext] Hydration failed:', err);
                    setError('Failed to load wallet from storage');
                }
            } else {
                console.log('[WalletContext] No wallet found in storage during hydration');
            }
            setLoading(false);
        };

        hydrateWallet();
    }, []);

    // Effect specifically for balance updates when address changes
    useEffect(() => {
        if (address) {
            console.log('[WalletContext] Address detected, triggering initial fetch...');
            refreshBalance();
        }
    }, [address, refreshBalance]);

    // Fix storage events (they only fire for OTHER tabs)
    useEffect(() => {
        const handleInternalUpdate = () => {
            const storedAddress = localStorage.getItem('arcium_wallet_address');
            const storedMnemonic = localStorage.getItem('arcium_mnemonic');

            if (storedAddress && storedAddress !== address) {
                console.log('[WalletContext] Wallet change detected via internal event');
                const derivedWallet = mnemonicToWallet(storedMnemonic!);
                setWallet(derivedWallet);
                setAddress(storedAddress);
                setMnemonic(storedMnemonic);
            }
        };

        window.addEventListener('walletUpdate', handleInternalUpdate);
        window.addEventListener('storage', handleInternalUpdate);

        return () => {
            window.removeEventListener('walletUpdate', handleInternalUpdate);
            window.removeEventListener('storage', handleInternalUpdate);
        };
    }, [address]);

    return (
        <WalletContext.Provider value={{
            wallet,
            address,
            balance,
            usdcBalance,
            tokenBalances,
            tokens,
            loading,
            refreshBalance,
            mnemonic,
            error,
            apiConnected
        }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};

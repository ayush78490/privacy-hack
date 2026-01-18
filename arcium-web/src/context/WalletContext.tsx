import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Keypair } from '@solana/web3.js';
import { mnemonicToWallet } from '../utils/wallet';
import * as api from '../utils/api';
import { fetchBalance as fetchSolBalance, fetchTokenBalance } from '../utils/solana';
import { fetchSolPrice } from '../utils/prices';

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
    // On-chain balances (from RPC)
    onChainBalance: number;
    onChainUsdcBalance: number;
    // Shielded balances (from ShadowWire API)
    shieldedBalance: number;
    shieldedUsdcBalance: number;
    shieldedTokenBalances: TokenBalance[];
    // Combined for backward compatibility
    balance: number;
    usdcBalance: number;
    tokenBalances: TokenBalance[];
    tokens: api.Token[];
    loading: boolean;
    refreshBalance: () => Promise<void>;
    mnemonic: string | null;
    error: string | null;
    apiConnected: boolean;
    // Live price
    solPrice: number;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wallet, setWallet] = useState<Keypair | null>(null);
    const [address, setAddress] = useState<string | null>(null);

    // On-chain balances (from RPC)
    const [onChainBalance, setOnChainBalance] = useState<number>(0);
    const [onChainUsdcBalance, setOnChainUsdcBalance] = useState<number>(0);

    // Shielded balances (from ShadowWire API)
    const [shieldedBalance, setShieldedBalance] = useState<number>(0);
    const [shieldedUsdcBalance, setShieldedUsdcBalance] = useState<number>(0);
    const [shieldedTokenBalances, setShieldedTokenBalances] = useState<TokenBalance[]>([]);

    const [tokens, setTokens] = useState<api.Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [mnemonic, setMnemonic] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiConnected, setApiConnected] = useState(false);
    const [solPrice, setSolPrice] = useState<number>(140); // Default fallback

    const isRefreshing = useRef(false);

    // Fetch SOL price on mount and every 60 seconds
    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const price = await fetchSolPrice();
                setSolPrice(price);
            } catch (err) {
                console.error('[WalletContext] Failed to fetch SOL price:', err);
            }
        };
        fetchPrice();
        const interval = setInterval(fetchPrice, 60000);
        return () => clearInterval(interval);
    }, []);

    // Check API connection and fetch tokens on mount
    useEffect(() => {
        const initApi = async () => {
            try {
                const health = await api.checkHealth();
                if (health) {
                    console.log('[WalletContext] API connected:', health);
                    setApiConnected(true);

                    const tokenList = await api.getTokens();
                    if (tokenList.length > 0) {
                        setTokens(tokenList);
                        console.log('[WalletContext] Loaded tokens:', tokenList.length);
                    }
                } else {
                    console.warn('[WalletContext] API not available');
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
        if (!address) {
            console.log('[WalletContext] refreshBalance skipped: No address in state');
            return;
        }

        if (isRefreshing.current) return;
        isRefreshing.current = true;

        console.log('[WalletContext] refreshBalance triggered for:', address);

        try {
            setError(null);

            // Always fetch on-chain balances from RPC
            console.log('[WalletContext] Fetching on-chain balances from RPC...');
            const [solBal, usdcBal] = await Promise.all([
                fetchSolBalance(address),
                fetchTokenBalance(address, USDC_MINT),
            ]);
            console.log('[WalletContext] On-chain balances:', { solBal, usdcBal });
            setOnChainBalance(solBal);
            setOnChainUsdcBalance(usdcBal);

            // Fetch shielded balances from ShadowWire API
            if (apiConnected) {
                console.log('[WalletContext] Fetching shielded balances from API...');
                const balancesResult = await api.getBalances(address);

                if (balancesResult && balancesResult.balances) {
                    const balances = balancesResult.balances;

                    const solBalance = balances.find(b => b.token === 'SOL');
                    const usdcBalanceData = balances.find(b => b.token === 'USDC');

                    setShieldedBalance(solBalance?.availableFormatted || 0);
                    setShieldedUsdcBalance(usdcBalanceData?.availableFormatted || 0);

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
                    setShieldedTokenBalances(mappedBalances);

                    console.log('[WalletContext] Shielded balances:', {
                        sol: solBalance?.availableFormatted,
                        usdc: usdcBalanceData?.availableFormatted
                    });
                }
            }
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

    // Effect for balance updates when address changes
    useEffect(() => {
        if (address) {
            console.log('[WalletContext] Address detected, triggering initial fetch...');
            refreshBalance();
        }
    }, [address, refreshBalance]);

    // Storage events
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

    // Combined balances for backward compatibility
    const balance = onChainBalance;
    const usdcBalance = onChainUsdcBalance;
    const tokenBalances = shieldedTokenBalances;

    return (
        <WalletContext.Provider value={{
            wallet,
            address,
            onChainBalance,
            onChainUsdcBalance,
            shieldedBalance,
            shieldedUsdcBalance,
            shieldedTokenBalances,
            balance,
            usdcBalance,
            tokenBalances,
            tokens,
            loading,
            refreshBalance,
            mnemonic,
            error,
            apiConnected,
            solPrice
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

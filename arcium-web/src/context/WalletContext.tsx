import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Keypair } from '@solana/web3.js';
import { mnemonicToWallet } from '../utils/wallet';
import * as api from '../utils/api';
import { fetchBalance as fetchSolBalance, fetchTokenBalance, getNetworkMode, setNetworkMode, NetworkMode } from '../utils/solana';
import { fetchSolPrice } from '../utils/prices';
import {
    generateAnonymousKeypair,
    getPrivateKeyBase58,
    saveToWalletHistory,
    getAnonymousWalletBalance,
} from '../utils/anonymousWallet';

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // Mainnet USDC

interface TokenBalance {
    symbol: string;
    name: string;
    balance: number;
    balanceFormatted: number;
    decimals: number;
}

interface WalletContextType {
    // Main wallet
    wallet: Keypair | null;
    address: string | null;
    mnemonic: string | null;

    // Anonymous wallet (session only)
    anonymousWallet: Keypair | null;
    anonymousAddress: string | null;
    isAnonymousMode: boolean;
    anonymousBalance: number;

    // Active wallet helpers (returns main or anonymous based on mode)
    getActiveWallet: () => Keypair | null;
    getActiveAddress: () => string | null;

    // Mode switching
    switchToAnonymousMode: () => void;
    switchToMainWallet: () => void;
    generateNewAnonymousWallet: () => void;

    // Network
    networkMode: NetworkMode;
    switchNetwork: (mode: NetworkMode) => void;

    // On-chain balances (from RPC)
    onChainBalance: number;
    onChainUsdcBalance: number;
    // Shielded balances (from ShadowWire API)
    shieldedBalance: number;
    shieldedUsdcBalance: number;
    shieldedTokenBalances: TokenBalance[];
    // Pool address for private transactions
    poolAddress: string | null;
    // Combined for backward compatibility
    balance: number;
    usdcBalance: number;
    tokenBalances: TokenBalance[];
    tokens: api.Token[];
    loading: boolean;
    refreshBalance: () => Promise<void>;
    error: string | null;
    apiConnected: boolean;
    // Live price
    solPrice: number;
    // User profile
    userName: string;
    userProfilePic: string;
    updateProfile: (name: string, pic: string) => void;
    // Logout function
    logout: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Main wallet state
    const [wallet, setWallet] = useState<Keypair | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [mnemonic, setMnemonic] = useState<string | null>(null);

    // Anonymous wallet state (session memory only)
    const [anonymousWallet, setAnonymousWallet] = useState<Keypair | null>(null);
    const [anonymousAddress, setAnonymousAddress] = useState<string | null>(null);
    const [isAnonymousMode, setIsAnonymousMode] = useState(false);
    const [anonymousBalance, setAnonymousBalance] = useState<number>(0);

    // Network mode
    const [networkMode, setNetworkModeState] = useState<NetworkMode>(getNetworkMode());

    // On-chain balances (from RPC)
    const [onChainBalance, setOnChainBalance] = useState<number>(0);
    const [onChainUsdcBalance, setOnChainUsdcBalance] = useState<number>(0);

    // Shielded balances (from ShadowWire API)
    const [shieldedBalance, setShieldedBalance] = useState<number>(0);
    const [shieldedUsdcBalance, setShieldedUsdcBalance] = useState<number>(0);
    const [shieldedTokenBalances, setShieldedTokenBalances] = useState<TokenBalance[]>([]);
    const [poolAddress, setPoolAddress] = useState<string | null>(null);

    const [tokens, setTokens] = useState<api.Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [apiConnected, setApiConnected] = useState(false);
    const [solPrice, setSolPrice] = useState<number>(140); // Default fallback
    const [userName, setUserName] = useState<string>('PrivyPay Explorer');
    const [userProfilePic, setUserProfilePic] = useState<string>('https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky');

    const isRefreshing = useRef(false);

    // Get active wallet based on mode
    const getActiveWallet = useCallback((): Keypair | null => {
        return isAnonymousMode ? anonymousWallet : wallet;
    }, [isAnonymousMode, anonymousWallet, wallet]);

    // Get active address based on mode
    const getActiveAddress = useCallback((): string | null => {
        return isAnonymousMode ? anonymousAddress : address;
    }, [isAnonymousMode, anonymousAddress, address]);

    // Generate new anonymous wallet
    const generateNewAnonymousWallet = useCallback(() => {
        const newKeypair = generateAnonymousKeypair();
        const newAddress = newKeypair.publicKey.toBase58();
        const privateKey = getPrivateKeyBase58(newKeypair);

        setAnonymousWallet(newKeypair);
        setAnonymousAddress(newAddress);
        setAnonymousBalance(0);

        // Save to history
        saveToWalletHistory(newAddress, privateKey);

        console.log('[WalletContext] Generated new anonymous wallet:', newAddress);
    }, []);

    // Switch to anonymous mode
    const switchToAnonymousMode = useCallback(() => {
        if (!anonymousWallet) {
            generateNewAnonymousWallet();
        }
        setIsAnonymousMode(true);
        console.log('[WalletContext] Switched to anonymous mode');
        window.dispatchEvent(new Event('walletUpdate'));
    }, [anonymousWallet, generateNewAnonymousWallet]);

    // Switch to main wallet
    const switchToMainWallet = useCallback(() => {
        setIsAnonymousMode(false);
        console.log('[WalletContext] Switched to main wallet mode');
        window.dispatchEvent(new Event('walletUpdate'));
    }, []);

    // Switch network
    const switchNetwork = useCallback((mode: NetworkMode) => {
        setNetworkMode(mode);
        setNetworkModeState(mode);
        console.log('[WalletContext] Network switched to:', mode);
        // Trigger balance refresh on network change
        window.dispatchEvent(new Event('walletUpdate'));
    }, []);

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
        const currentAddress = isAnonymousMode ? anonymousAddress : address;

        if (!currentAddress) {
            console.log('[WalletContext] refreshBalance skipped: No address in state');
            return;
        }

        if (isRefreshing.current) return;
        isRefreshing.current = true;

        console.log('[WalletContext] refreshBalance triggered for:', currentAddress, 'Mode:', isAnonymousMode ? 'anonymous' : 'main');

        try {
            setError(null);

            // Fetch on-chain balances from RPC
            console.log('[WalletContext] Fetching on-chain balances from RPC...');
            const [solBal, usdcBal] = await Promise.all([
                fetchSolBalance(currentAddress),
                fetchTokenBalance(currentAddress, USDC_MINT),
            ]);
            console.log('[WalletContext] On-chain balances:', { solBal, usdcBal });

            if (isAnonymousMode) {
                setAnonymousBalance(solBal);
                // Also fetch main wallet balance (needed for funding anonymous transfers)
                if (address) {
                    const mainSolBal = await fetchSolBalance(address);
                    const mainUsdcBal = await fetchTokenBalance(address, USDC_MINT);
                    setOnChainBalance(mainSolBal);
                    setOnChainUsdcBalance(mainUsdcBal);
                }
            } else {
                setOnChainBalance(solBal);
                setOnChainUsdcBalance(usdcBal);
            }

            // Also fetch anonymous wallet balance if it exists and not in anonymous mode
            if (anonymousAddress && !isAnonymousMode) {
                const anonBal = await getAnonymousWalletBalance(anonymousAddress);
                setAnonymousBalance(anonBal);
            }

            // Fetch shielded balances from ShadowWire API (only for main wallet)
            if (apiConnected && !isAnonymousMode) {
                console.log('[WalletContext] Fetching shielded balances from API...');
                const balancesResult = await api.getBalances(currentAddress);

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

                    // Store pool address for transaction history
                    const poolAddr = solBalance?.pool_address || usdcBalanceData?.pool_address;
                    if (poolAddr) {
                        setPoolAddress(poolAddr);
                        console.log('[WalletContext] Pool address:', poolAddr);
                    }

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
    }, [address, anonymousAddress, isAnonymousMode, apiConnected, tokens]);

    // Update profile
    const updateProfile = useCallback((name: string, pic: string) => {
        setUserName(name);
        setUserProfilePic(pic);
        localStorage.setItem('privypay_user_name', name);
        localStorage.setItem('privypay_user_pic', pic);
    }, []);

    // Logout function - clears all stored data and resets state
    const logout = useCallback(() => {
        console.log('[WalletContext] Logging out...');
        // Clear localStorage
        localStorage.removeItem('privypay_wallet_address');
        localStorage.removeItem('privypay_mnemonic');
        // Reset all state
        setWallet(null);
        setAddress(null);
        setMnemonic(null);
        setAnonymousWallet(null);
        setAnonymousAddress(null);
        setIsAnonymousMode(false);
        setAnonymousBalance(0);
        setOnChainBalance(0);
        setOnChainUsdcBalance(0);
        setShieldedBalance(0);
        setShieldedUsdcBalance(0);
        setShieldedTokenBalances([]);
        setError(null);
        // Dispatch event for any listeners
        window.dispatchEvent(new Event('walletUpdate'));
    }, []);

    // Effect for initial wallet hydration
    useEffect(() => {
        const hydrateWallet = () => {
            const storedMnemonic = localStorage.getItem('privypay_mnemonic');
            const storedAddress = localStorage.getItem('privypay_wallet_address');

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

            // Hydrate profile
            const storedName = localStorage.getItem('privypay_user_name');
            const storedPic = localStorage.getItem('privypay_user_pic');
            if (storedName) setUserName(storedName);
            if (storedPic) setUserProfilePic(storedPic);

            setLoading(false);
        };

        hydrateWallet();
    }, []);

    // Effect for balance updates when address or mode changes
    useEffect(() => {
        const currentAddr = isAnonymousMode ? anonymousAddress : address;
        if (currentAddr) {
            console.log('[WalletContext] Address detected, triggering initial fetch...');
            refreshBalance();
        }
    }, [address, anonymousAddress, isAnonymousMode, refreshBalance]);

    // Storage events
    useEffect(() => {
        const handleInternalUpdate = () => {
            const storedAddress = localStorage.getItem('privypay_wallet_address');
            const storedMnemonic = localStorage.getItem('privypay_mnemonic');

            if (storedAddress && storedAddress !== address) {
                console.log('[WalletContext] Wallet change detected via internal event');
                const derivedWallet = mnemonicToWallet(storedMnemonic!);
                setWallet(derivedWallet);
                setAddress(storedAddress);
                setMnemonic(storedMnemonic);
            }

            // Refresh balance on wallet update event
            refreshBalance();
        };

        window.addEventListener('walletUpdate', handleInternalUpdate);
        window.addEventListener('storage', handleInternalUpdate);

        return () => {
            window.removeEventListener('walletUpdate', handleInternalUpdate);
            window.removeEventListener('storage', handleInternalUpdate);
        };
    }, [address, refreshBalance]);

    // Combined balances for backward compatibility
    const balance = isAnonymousMode ? anonymousBalance : onChainBalance;
    const usdcBalance = isAnonymousMode ? 0 : onChainUsdcBalance;
    const tokenBalances = shieldedTokenBalances;

    return (
        <WalletContext.Provider value={{
            wallet,
            address,
            mnemonic,
            anonymousWallet,
            anonymousAddress,
            isAnonymousMode,
            anonymousBalance,
            getActiveWallet,
            getActiveAddress,
            switchToAnonymousMode,
            switchToMainWallet,
            generateNewAnonymousWallet,
            networkMode,
            switchNetwork,
            onChainBalance,
            onChainUsdcBalance,
            shieldedBalance,
            shieldedUsdcBalance,
            shieldedTokenBalances,
            poolAddress,
            balance,
            usdcBalance,
            tokenBalances,
            tokens,
            loading,
            refreshBalance,
            error,
            apiConnected,
            solPrice,
            userName,
            userProfilePic,
            updateProfile,
            logout
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

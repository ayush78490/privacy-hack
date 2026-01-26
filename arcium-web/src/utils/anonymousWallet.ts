import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getAccount,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { getConnection } from './solana';

// Token mint addresses
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// LocalStorage keys for temp wallet history
const WALLET_HISTORY_KEY = 'arcium_temp_wallet_history';
const MAX_HISTORY_SIZE = 10;

// Interface for wallet history entry
export interface TempWalletHistoryEntry {
    address: string;
    privateKey: string; // Base58 encoded
    timestamp: number;
}

/**
 * Generate a fresh keypair for anonymous transactions
 */
export const generateAnonymousKeypair = (): Keypair => {
    const keypair = Keypair.generate();
    console.log('[AnonymousWallet] Generated new keypair:', keypair.publicKey.toBase58());
    return keypair;
};

/**
 * Get private key as base58 string from keypair
 */
export const getPrivateKeyBase58 = (keypair: Keypair): string => {
    return bs58.encode(keypair.secretKey);
};

/**
 * Restore keypair from base58 private key
 */
export const keypairFromPrivateKey = (privateKeyBase58: string): Keypair => {
    const secretKey = bs58.decode(privateKeyBase58);
    return Keypair.fromSecretKey(secretKey);
};

/**
 * Save temp wallet to history (keeps last 10)
 */
export const saveToWalletHistory = (address: string, privateKey: string): void => {
    try {
        const history = getWalletHistory();

        const newEntry: TempWalletHistoryEntry = {
            address,
            privateKey,
            timestamp: Date.now(),
        };

        const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY_SIZE);
        localStorage.setItem(WALLET_HISTORY_KEY, JSON.stringify(updatedHistory));
        console.log('[AnonymousWallet] Saved to wallet history. Total entries:', updatedHistory.length);
    } catch (error) {
        console.error('[AnonymousWallet] Failed to save wallet history:', error);
    }
};

/**
 * Get temp wallet history from localStorage
 */
export const getWalletHistory = (): TempWalletHistoryEntry[] => {
    try {
        const stored = localStorage.getItem(WALLET_HISTORY_KEY);
        if (!stored) return [];
        return JSON.parse(stored) as TempWalletHistoryEntry[];
    } catch (error) {
        console.error('[AnonymousWallet] Failed to read wallet history:', error);
        return [];
    }
};

/**
 * Clear wallet history
 */
export const clearWalletHistory = (): void => {
    localStorage.removeItem(WALLET_HISTORY_KEY);
    console.log('[AnonymousWallet] Wallet history cleared');
};

/**
 * Estimate gas for a single transaction (5000 lamports base + buffer)
 */
export const estimateTransactionGas = async (
    _connection?: Connection
): Promise<number> => {
    const BASE_FEE_LAMPORTS = 5000;
    const PRIORITY_FEE_BUFFER = 5000;
    return (BASE_FEE_LAMPORTS + PRIORITY_FEE_BUFFER) / LAMPORTS_PER_SOL;
};

/**
 * Estimate total gas for anonymous SOL transfer (2 transactions)
 */
export const estimateTotalAnonymousGas = async (
    connection?: Connection
): Promise<number> => {
    const singleTxGas = await estimateTransactionGas(connection);
    const totalGas = singleTxGas * 2.5;
    console.log('[AnonymousWallet] Total estimated gas:', totalGas, 'SOL');
    return totalGas;
};

/**
 * Estimate gas for SPL token anonymous transfer (more complex)
 * Includes: SOL for gas + potential ATA creation costs
 */
export const estimateSplTokenGas = async (): Promise<number> => {
    // ATA creation costs ~0.00203928 SOL rent each
    // TX fees ~0.00001 SOL each
    // Temp wallet needs to pay for recipient's ATA creation
    // Be generous to avoid failures
    const ATA_CREATION_COST = 0.00204; // Rent for token account
    const TX_FEE = 0.00002;

    // Conservative estimate: 2 ATAs + 3 tx fees + small buffer
    const totalGas = (ATA_CREATION_COST * 2) + (TX_FEE * 3) + 0.0003;
    console.log('[AnonymousWallet] SPL token gas estimate:', totalGas, 'SOL');
    return totalGas;
};

/**
 * Fund anonymous wallet with SOL (amount + gas for next tx)
 */
export const fundAnonymousWallet = async (
    mainWallet: Keypair,
    anonymousAddress: string,
    amount: number,
    connection?: Connection
): Promise<string> => {
    const conn = connection || getConnection();
    const gasForTransfer = await estimateTransactionGas(conn);
    const totalToFund = amount + gasForTransfer;

    console.log('[AnonymousWallet] Funding with SOL:', { amount, gasForTransfer, totalToFund });

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: mainWallet.publicKey,
            toPubkey: new PublicKey(anonymousAddress),
            lamports: Math.floor(totalToFund * LAMPORTS_PER_SOL),
        })
    );

    const signature = await sendAndConfirmTransaction(conn, transaction, [mainWallet]);
    console.log('[AnonymousWallet] Funding confirmed:', signature);
    return signature;
};

/**
 * Fund anonymous wallet with SOL for gas only (used for SPL token transfers)
 */
export const fundAnonymousWalletForGas = async (
    mainWallet: Keypair,
    anonymousAddress: string,
    gasAmount: number,
    connection?: Connection
): Promise<string> => {
    const conn = connection || getConnection();

    console.log('[AnonymousWallet] Funding with gas:', gasAmount, 'SOL');

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: mainWallet.publicKey,
            toPubkey: new PublicKey(anonymousAddress),
            lamports: Math.floor(gasAmount * LAMPORTS_PER_SOL),
        })
    );

    const signature = await sendAndConfirmTransaction(conn, transaction, [mainWallet]);
    console.log('[AnonymousWallet] Gas funding confirmed:', signature);
    return signature;
};

/**
 * Transfer SPL tokens (USDC) from main wallet to anonymous wallet
 */
export const transferSplTokenToAnonymous = async (
    mainWallet: Keypair,
    anonymousWallet: Keypair,
    tokenMint: PublicKey,
    amount: number,
    decimals: number,
    connection?: Connection
): Promise<string> => {
    const conn = connection || getConnection();

    const fromAta = await getAssociatedTokenAddress(tokenMint, mainWallet.publicKey);
    const toAta = await getAssociatedTokenAddress(tokenMint, anonymousWallet.publicKey);

    console.log('[AnonymousWallet] Transferring SPL token to temp:', { amount, from: fromAta.toBase58(), to: toAta.toBase58() });

    const transaction = new Transaction();

    // Check if recipient ATA exists
    try {
        await getAccount(conn, toAta);
    } catch {
        // Create ATA for temp wallet
        transaction.add(
            createAssociatedTokenAccountInstruction(
                mainWallet.publicKey,
                toAta,
                anonymousWallet.publicKey,
                tokenMint
            )
        );
    }

    // Add transfer instruction
    const tokenAmount = Math.floor(amount * Math.pow(10, decimals));
    transaction.add(
        createTransferInstruction(fromAta, toAta, mainWallet.publicKey, tokenAmount)
    );

    const signature = await sendAndConfirmTransaction(conn, transaction, [mainWallet]);
    console.log('[AnonymousWallet] SPL transfer to temp confirmed:', signature);
    return signature;
};

/**
 * Transfer SPL tokens from anonymous wallet to recipient
 */
export const sendSplTokenFromAnonymous = async (
    anonymousWallet: Keypair,
    recipientAddress: string,
    tokenMint: PublicKey,
    amount: number,
    decimals: number,
    connection?: Connection
): Promise<string> => {
    const conn = connection || getConnection();

    const fromAta = await getAssociatedTokenAddress(tokenMint, anonymousWallet.publicKey);
    const recipientPubkey = new PublicKey(recipientAddress);
    const toAta = await getAssociatedTokenAddress(tokenMint, recipientPubkey);

    console.log('[AnonymousWallet] Sending SPL from temp to recipient:', { amount, to: recipientAddress });

    const transaction = new Transaction();

    // Check if recipient ATA exists
    try {
        await getAccount(conn, toAta);
    } catch {
        // Create ATA for recipient (temp wallet pays)
        transaction.add(
            createAssociatedTokenAccountInstruction(
                anonymousWallet.publicKey,
                toAta,
                recipientPubkey,
                tokenMint
            )
        );
    }

    const tokenAmount = Math.floor(amount * Math.pow(10, decimals));
    transaction.add(
        createTransferInstruction(fromAta, toAta, anonymousWallet.publicKey, tokenAmount)
    );

    const signature = await sendAndConfirmTransaction(conn, transaction, [anonymousWallet]);
    console.log('[AnonymousWallet] SPL transfer to recipient confirmed:', signature);
    return signature;
};

/**
 * Execute SOL transfer from anonymous wallet to recipient
 */
export const sendFromAnonymousWallet = async (
    anonymousWallet: Keypair,
    recipientAddress: string,
    amount: number,
    connection?: Connection
): Promise<string> => {
    const conn = connection || getConnection();

    console.log('[AnonymousWallet] Sending SOL from temp:', { amount, to: recipientAddress });

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: anonymousWallet.publicKey,
            toPubkey: new PublicKey(recipientAddress),
            lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
    );

    const signature = await sendAndConfirmTransaction(conn, transaction, [anonymousWallet]);
    console.log('[AnonymousWallet] SOL transfer confirmed:', signature);
    return signature;
};

/**
 * Execute complete anonymous transfer (two-hop: main → temp → receiver)
 * Supports both SOL and USDC
 */
export const executeAnonymousTransfer = async (params: {
    mainWallet: Keypair;
    anonymousWallet: Keypair;
    recipientAddress: string;
    amount: number;
    token?: 'SOL' | 'USDC';
    connection?: Connection;
    onProgress?: (step: 'funding' | 'sending' | 'complete', txHash?: string) => void;
}): Promise<{ fundingTxHash: string; transferTxHash: string }> => {
    const { mainWallet, anonymousWallet, recipientAddress, amount, token = 'SOL', connection, onProgress } = params;
    const conn = connection || getConnection();

    if (token === 'SOL') {
        // SOL Transfer
        onProgress?.('funding');
        const fundingTxHash = await fundAnonymousWallet(
            mainWallet,
            anonymousWallet.publicKey.toBase58(),
            amount,
            conn
        );

        await new Promise(resolve => setTimeout(resolve, 1000));

        onProgress?.('sending', fundingTxHash);
        const transferTxHash = await sendFromAnonymousWallet(
            anonymousWallet,
            recipientAddress,
            amount,
            conn
        );

        onProgress?.('complete', transferTxHash);
        console.log('[AnonymousWallet] SOL transfer complete');
        return { fundingTxHash, transferTxHash };

    } else if (token === 'USDC') {
        // USDC Transfer - requires 3 steps
        const USDC_DECIMALS = 6;

        // Step 1: Fund temp wallet with SOL for gas
        onProgress?.('funding');
        const gasNeeded = await estimateSplTokenGas();
        await fundAnonymousWalletForGas(
            mainWallet,
            anonymousWallet.publicKey.toBase58(),
            gasNeeded,
            conn
        );

        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 2: Transfer USDC from main to temp
        const tokenFundingTxHash = await transferSplTokenToAnonymous(
            mainWallet,
            anonymousWallet,
            USDC_MINT,
            amount,
            USDC_DECIMALS,
            conn
        );

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 3: Transfer USDC from temp to recipient
        onProgress?.('sending', tokenFundingTxHash);
        const transferTxHash = await sendSplTokenFromAnonymous(
            anonymousWallet,
            recipientAddress,
            USDC_MINT,
            amount,
            USDC_DECIMALS,
            conn
        );

        onProgress?.('complete', transferTxHash);
        console.log('[AnonymousWallet] USDC transfer complete');
        return { fundingTxHash: tokenFundingTxHash, transferTxHash };

    } else {
        throw new Error(`Unsupported token: ${token}. Only SOL and USDC are supported.`);
    }
};

/**
 * Get balance of anonymous wallet
 */
export const getAnonymousWalletBalance = async (
    address: string,
    connection?: Connection
): Promise<number> => {
    try {
        const conn = connection || getConnection();
        const pubKey = new PublicKey(address);
        const balance = await conn.getBalance(pubKey);
        return balance / LAMPORTS_PER_SOL;
    } catch (error) {
        console.error('[AnonymousWallet] Failed to get balance:', error);
        return 0;
    }
};

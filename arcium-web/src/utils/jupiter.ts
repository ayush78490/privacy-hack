// Jupiter SDK integration for real token swaps
// Uses Jupiter V6 API for best routes and execution

import { createJupiterApiClient, QuoteResponse, SwapResponse } from '@jup-ag/api';
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';

// Token mint addresses
export const TOKEN_MINTS: Record<string, string> = {
    SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
};

// Jupiter API client
const jupiterApi = createJupiterApiClient();

/**
 * Get token decimals
 */
export const getTokenDecimals = (symbol: string): number => {
    const decimals: Record<string, number> = {
        SOL: 9,
        USDC: 6,
        USDT: 6,
        BONK: 5,
    };
    return decimals[symbol] || 9;
};

/**
 * Convert human-readable amount to lamports/smallest unit
 */
export const toSmallestUnit = (amount: number, symbol: string): number => {
    const decimals = getTokenDecimals(symbol);
    return Math.floor(amount * Math.pow(10, decimals));
};

/**
 * Get a swap quote from Jupiter
 */
export const getSwapQuote = async (
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50 // 0.5% default slippage
): Promise<QuoteResponse | null> => {
    try {
        console.log('[Jupiter] Getting quote...', { inputMint, outputMint, amount, slippageBps });

        const quote = await jupiterApi.quoteGet({
            inputMint,
            outputMint,
            amount,
            slippageBps,
            onlyDirectRoutes: false,
            asLegacyTransaction: false,
        });

        console.log('[Jupiter] Quote received:', {
            inAmount: quote.inAmount,
            outAmount: quote.outAmount,
            priceImpactPct: quote.priceImpactPct,
        });

        return quote;
    } catch (error) {
        console.error('[Jupiter] Quote error:', error);
        return null;
    }
};

/**
 * Get swap transaction from Jupiter
 */
export const getSwapTransaction = async (
    quote: QuoteResponse,
    userPublicKey: string
): Promise<SwapResponse | null> => {
    try {
        console.log('[Jupiter] Getting swap transaction...');

        const swapResult = await jupiterApi.swapPost({
            swapRequest: {
                quoteResponse: quote,
                userPublicKey,
                dynamicComputeUnitLimit: true,
            },
        });

        console.log('[Jupiter] Swap transaction received');
        return swapResult;
    } catch (error) {
        console.error('[Jupiter] Swap transaction error:', error);
        return null;
    }
};

/**
 * Execute a Jupiter swap
 */
export const executeJupiterSwap = async (
    connection: Connection,
    wallet: Keypair,
    fromSymbol: string,
    toSymbol: string,
    amount: number,
    slippageBps: number = 50
): Promise<{ signature: string; inputAmount: string; outputAmount: string } | null> => {
    try {
        const inputMint = TOKEN_MINTS[fromSymbol];
        const outputMint = TOKEN_MINTS[toSymbol];

        if (!inputMint || !outputMint) {
            throw new Error(`Unknown token: ${fromSymbol} or ${toSymbol}`);
        }

        // Convert to smallest unit
        const amountInSmallestUnit = toSmallestUnit(amount, fromSymbol);

        // Get quote
        const quote = await getSwapQuote(inputMint, outputMint, amountInSmallestUnit, slippageBps);
        if (!quote) {
            throw new Error('Failed to get swap quote');
        }

        // Get swap transaction
        const swapResult = await getSwapTransaction(quote, wallet.publicKey.toBase58());
        if (!swapResult) {
            throw new Error('Failed to get swap transaction');
        }

        // Deserialize and sign transaction
        const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

        // Sign with wallet
        transaction.sign([wallet]);

        // Send transaction
        console.log('[Jupiter] Sending swap transaction...');
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: true,
            maxRetries: 3,
        });

        console.log('[Jupiter] Transaction sent:', signature);

        // Confirm transaction
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight,
        });

        console.log('[Jupiter] Swap confirmed:', signature);

        return {
            signature,
            inputAmount: quote.inAmount,
            outputAmount: quote.outAmount,
        };
    } catch (error) {
        console.error('[Jupiter] Swap execution error:', error);
        throw error;
    }
};

/**
 * Get human-readable quote preview
 */
export const getQuotePreview = async (
    fromSymbol: string,
    toSymbol: string,
    amount: number
): Promise<{
    inputAmount: string;
    outputAmount: string;
    priceImpact: string;
    route: string;
} | null> => {
    try {
        const inputMint = TOKEN_MINTS[fromSymbol];
        const outputMint = TOKEN_MINTS[toSymbol];

        if (!inputMint || !outputMint) return null;

        const amountInSmallestUnit = toSmallestUnit(amount, fromSymbol);
        const quote = await getSwapQuote(inputMint, outputMint, amountInSmallestUnit);

        if (!quote) return null;

        const outputDecimals = getTokenDecimals(toSymbol);
        const outputAmount = (parseInt(quote.outAmount) / Math.pow(10, outputDecimals)).toFixed(6);

        return {
            inputAmount: amount.toString(),
            outputAmount,
            priceImpact: quote.priceImpactPct || '0',
            route: quote.routePlan?.map(r => r.swapInfo?.label || 'Unknown').join(' → ') || 'Direct',
        };
    } catch (error) {
        console.error('[Jupiter] Quote preview error:', error);
        return null;
    }
};

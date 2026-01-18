import {
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    Keypair
} from '@solana/web3.js';

// [IMPORTANT] Public RPCs often block requests from localhost (leading to 403 Forbidden).
// To fix this, get a FREE API Key from Helius (https://helius.dev) or QuickNode and paste it below.
const CUSTOM_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=af4b15c2-240b-491b-865a-f7218750ddac';

// Fallback list of public endpoints
const PUBLIC_ENDPOINTS = [
    'https://api.mainnet-beta.solana.com', // Often rate limited
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana'
];

// Combine custom URL with public ones
const RPC_ENDPOINTS = [CUSTOM_RPC_URL, ...PUBLIC_ENDPOINTS].filter(url => url && url.length > 0);

let currentRpcIndex = 0;

/**
 * Creates a connection to the Solana network
 */
export const getConnection = (url?: string) => {
    const targetUrl = url || RPC_ENDPOINTS[currentRpcIndex];
    return new Connection(targetUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: false,
    });
};

/**
 * Rotates to the next RPC if one fails
 */
export const rotateRpc = () => {
    currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length;
    console.warn(`[Solana] Rotating RPC. Now using: ${RPC_ENDPOINTS[currentRpcIndex]}`);
    return getConnection();
};

/**
 * Helper to wrap RPC calls with auto-retry and rotation
 */
const withRetry = async <T>(fn: (conn: Connection) => Promise<T>): Promise<T> => {
    let lastError: any;

    // Attempt each RPC in the list once
    for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
        const url = RPC_ENDPOINTS[currentRpcIndex];
        try {
            console.log(`[Solana] Attempting RPC call on: ${url}`);
            const conn = new Connection(url, 'confirmed');
            return await fn(conn);
        } catch (error: any) {
            console.error(`[Solana] RPC Error on ${url}:`, error.message || error);

            // If it's a 403/429, it's definitely an RPC block
            if (JSON.stringify(error).includes('403') || JSON.stringify(error).includes('429')) {
                console.warn('[Solana] BLOCKED: This public RPC is blocking your request. Please use a Custom RPC URL.');
            }

            lastError = error;
            rotateRpc();
        }
    }
    throw lastError;
};

/**
 * Fetches the SOL balance for a given public key
 */
export const fetchBalance = async (publicKey: string): Promise<number> => {
    try {
        return await withRetry(async (connection) => {
            const pubKey = new PublicKey(publicKey);
            const balance = await connection.getBalance(pubKey);
            return balance / LAMPORTS_PER_SOL;
        });
    } catch (error) {
        console.error('[Solana] All RPCs failed for fetchBalance. Please configure CUSTOM_RPC_URL in utils/solana.ts');
        return 0;
    }
};

/**
 * Fetches the balance for a specific SPL token
 */
export const fetchTokenBalance = async (publicKey: string, mintAddress: string): Promise<number> => {
    try {
        return await withRetry(async (connection) => {
            const pubKey = new PublicKey(publicKey);
            const mintPubKey = new PublicKey(mintAddress);

            const response = await connection.getParsedTokenAccountsByOwner(pubKey, {
                mint: mintPubKey,
            });

            if (response.value.length === 0) {
                return 0;
            }

            const tokenAccount = response.value[0].account.data.parsed.info.tokenAmount;
            return tokenAccount.uiAmount || 0;
        });
    } catch (error) {
        console.error('[Solana] All RPCs failed for fetchTokenBalance. Please configure CUSTOM_RPC_URL in utils/solana.ts');
        return 0;
    }
};

/**
 * Fetches all token accounts for a wallet to discover unknown tokens
 */
export const fetchAllTokenBalances = async (publicKey: string) => {
    try {
        return await withRetry(async (connection) => {
            const pubKey = new PublicKey(publicKey);

            const response = await connection.getParsedTokenAccountsByOwner(pubKey, {
                programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token Program ID
            });

            console.log(`[Solana] Discovered ${response.value.length} token accounts:`);
            response.value.forEach((account, i) => {
                const info = account.account.data.parsed.info;
                console.log(`  #${i}: Mint: ${info.mint}, Balance: ${info.tokenAmount.uiAmount}`);
            });

            return response.value;
        });
    } catch (error) {
        console.error('[Solana] All RPCs failed for fetchAllTokenBalances');
        return [];
    }
};

/**
 * Sends SOL from one account to another
 */
export const sendSol = async (
    fromWallet: Keypair,
    toAddress: string,
    amount: number
): Promise<string> => {
    return await withRetry(async (connection) => {
        const toPubKey = new PublicKey(toAddress);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromWallet.publicKey,
                toPubkey: toPubKey,
                lamports: amount * LAMPORTS_PER_SOL,
            })
        );

        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [fromWallet]
        );

        return signature;
    });
};

/**
 * Mock function for "shielded" sending
 */
export const sendShielded = async (
    fromWallet: Keypair,
    toAddress: string,
    amount: number
): Promise<{ signature: string, ghostId: string }> => {
    console.log(`[Arcium] Shielding transaction for ${amount} SOL to ${toAddress}...`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const signature = await sendSol(fromWallet, toAddress, amount);
        const ghostId = `arc_${Math.random().toString(36).substring(2, 11)}`;

        return { signature, ghostId };
    } catch (error) {
        console.error('[Arcium] Error in shielded transaction:', error);
        throw error;
    }
};

// ShadowWire API Service
// Handles all communication with the backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    errorType?: string;
}

// Token decimals map
const DECIMALS_MAP: Record<string, number> = {
    'SOL': 9, 'RADR': 9, 'USDC': 6, 'ORE': 11, 'BONK': 5,
    'JIM': 9, 'GODL': 11, 'HUSTLE': 9, 'ZEC': 8, 'CRT': 9,
    'BLACKCOIN': 6, 'GIL': 6, 'ANON': 9, 'WLFI': 6, 'USD1': 6,
    'AOL': 6, 'IQLABS': 9
};

export function getDecimals(token: string): number {
    return DECIMALS_MAP[token] || 9;
}

// API call wrapper with error handling
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error(`[API] Error calling ${endpoint}:`, error);
        return {
            success: false,
            error: error.message || 'Network error',
        };
    }
}

// Health check
export async function checkHealth(): Promise<{ status: string; timestamp: string; build: string } | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();
        if (data.status === 'ok') {
            return { status: data.status, timestamp: data.timestamp, build: data.build };
        }
        return null;
    } catch (error) {
        console.error('[API] Health check failed:', error);
        return null;
    }
}

// Get balance for a single token
export interface BalanceResponse {
    wallet: string;
    token: string;
    available: number;
    availableFormatted: number;
    pool_address: string;
}

export async function getBalance(wallet: string, token: string = 'SOL'): Promise<BalanceResponse | null> {
    const result = await apiCall<BalanceResponse>(`/api/balance/${wallet}?token=${token}`);
    return result.success ? result.data! : null;
}

// Get balances for all supported tokens
export interface TokenBalance {
    token: string;
    available: number;
    availableFormatted: number;
    pool_address?: string;
    error?: string;
}

export interface BalancesResponse {
    wallet: string;
    balances: TokenBalance[];
}

export async function getBalances(wallet: string): Promise<BalancesResponse | null> {
    const result = await apiCall<BalancesResponse>(`/api/balances/${wallet}`);
    return result.success ? result.data! : null;
}

// Get supported tokens
export interface Token {
    symbol: string;
    name: string;
    decimals: number;
}

export async function getTokens(): Promise<Token[]> {
    const result = await apiCall<Token[]>('/api/tokens');
    return result.success ? result.data! : [];
}

// Create deposit transaction
export interface DepositRequest {
    wallet: string;
    amount: number;
    token?: string;
}

export interface DepositResponse {
    message: string;
    unsigned_tx_base64: string;
    pool_address: string;
    user_balance_pda: string;
    amount: number;
    token: string;
    token_mint: string;
    amount_smallest_unit: number;
}

export async function createDeposit(request: DepositRequest): Promise<ApiResponse<DepositResponse>> {
    return apiCall<DepositResponse>('/api/deposit', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

// Create withdraw transaction
export interface WithdrawRequest {
    wallet: string;
    amount: number;
    token?: string;
}

export interface WithdrawResponse {
    message: string;
    unsigned_tx_base64: string;
    amount_withdrawn: number;
    fee: number;
    token: string;
    token_mint: string;
    amount_smallest_unit: number;
}

export async function createWithdraw(request: WithdrawRequest): Promise<ApiResponse<WithdrawResponse>> {
    return apiCall<WithdrawResponse>('/api/withdraw', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

// Execute transfer
export interface SignatureAuth {
    signature_base64: string;
    signature_message: string;
}

export interface TransferRequest {
    sender: string;
    recipient: string;
    amount: number;
    token?: string;
    type?: 'internal' | 'external';
    zk_auth?: SignatureAuth;
    transfer_auth?: SignatureAuth;
}

export interface TransferResponse {
    tx_signature: string;
    amount_hidden: boolean;
    amount_sent?: number;
    proof_pda: string;
    type: string;
    token: string;
    amount: number;
    relayer_fee: number;
}

export async function executeTransfer(request: TransferRequest): Promise<ApiResponse<TransferResponse>> {
    return apiCall<TransferResponse>('/api/transfer', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

// Upload proof (for advanced 2-step transfers)
export interface UploadProofRequest {
    sender_wallet: string;
    token?: string;
    amount: number;
}

export interface UploadProofResponse {
    nonce: number;
    message: string;
}

export async function uploadProof(request: UploadProofRequest): Promise<ApiResponse<UploadProofResponse>> {
    return apiCall<UploadProofResponse>('/api/upload-proof', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

// Internal transfer with nonce
export interface InternalTransferRequest {
    sender_wallet: string;
    recipient_wallet: string;
    token?: string;
    nonce: number;
    relayer_fee?: number;
}

export async function internalTransfer(request: InternalTransferRequest): Promise<ApiResponse<any>> {
    return apiCall('/api/internal-transfer', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

// Export API base URL for debugging
export function getApiBaseUrl(): string {
    return API_BASE_URL;
}

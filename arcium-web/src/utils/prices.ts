// Token price fetching utility
// Uses CoinGecko free API for price data

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Cache prices for 60 seconds to avoid rate limits
let priceCache: { [key: string]: { price: number; timestamp: number } } = {};
const CACHE_TTL = 60000; // 60 seconds

// CoinGecko token IDs
const TOKEN_IDS: Record<string, string> = {
    SOL: 'solana',
    USDC: 'usd-coin',
    USDT: 'tether',
    BONK: 'bonk',
    ORE: 'ore',
};

/**
 * Fetch current SOL price in USD
 */
export const fetchSolPrice = async (): Promise<number> => {
    return fetchTokenPrice('SOL');
};

/**
 * Fetch token price in USD
 */
export const fetchTokenPrice = async (symbol: string): Promise<number> => {
    const cached = priceCache[symbol];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.price;
    }

    const coinId = TOKEN_IDS[symbol.toUpperCase()];
    if (!coinId) {
        // USDC/USDT are always ~$1
        if (symbol.toUpperCase() === 'USDC' || symbol.toUpperCase() === 'USDT') {
            return 1;
        }
        console.warn(`[Price] No CoinGecko ID for ${symbol}`);
        return 0;
    }

    try {
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const price = data[coinId]?.usd || 0;

        // Cache the result
        priceCache[symbol] = { price, timestamp: Date.now() };
        console.log(`[Price] ${symbol} = $${price}`);

        return price;
    } catch (error) {
        console.error(`[Price] Failed to fetch ${symbol} price:`, error);

        // Return cached price if available (even if stale)
        if (cached) return cached.price;

        // Fallback prices
        const fallbacks: Record<string, number> = {
            SOL: 140,
            USDC: 1,
            USDT: 1,
            BONK: 0.00002,
        };
        return fallbacks[symbol.toUpperCase()] || 0;
    }
};

/**
 * Fetch multiple token prices at once
 */
export const fetchMultiplePrices = async (symbols: string[]): Promise<Record<string, number>> => {
    const prices: Record<string, number> = {};

    // Filter to tokens we have IDs for
    const validSymbols = symbols.filter(s => TOKEN_IDS[s.toUpperCase()]);
    const coinIds = validSymbols.map(s => TOKEN_IDS[s.toUpperCase()]).join(',');

    if (!coinIds) {
        // Return $1 for stablecoins
        symbols.forEach(s => {
            if (s.toUpperCase() === 'USDC' || s.toUpperCase() === 'USDT') {
                prices[s] = 1;
            }
        });
        return prices;
    }

    try {
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd`
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        validSymbols.forEach(symbol => {
            const coinId = TOKEN_IDS[symbol.toUpperCase()];
            const price = data[coinId]?.usd || 0;
            prices[symbol] = price;
            priceCache[symbol] = { price, timestamp: Date.now() };
        });

        // Add stablecoins
        symbols.forEach(s => {
            if (!prices[s] && (s.toUpperCase() === 'USDC' || s.toUpperCase() === 'USDT')) {
                prices[s] = 1;
            }
        });

        return prices;
    } catch (error) {
        console.error('[Price] Failed to fetch prices:', error);

        // Return fallbacks
        symbols.forEach(s => {
            const cached = priceCache[s];
            if (cached) {
                prices[s] = cached.price;
            } else if (s.toUpperCase() === 'USDC' || s.toUpperCase() === 'USDT') {
                prices[s] = 1;
            } else if (s.toUpperCase() === 'SOL') {
                prices[s] = 140;
            }
        });

        return prices;
    }
};

/**
 * Clear the price cache
 */
export const clearPriceCache = () => {
    priceCache = {};
};

import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({
  fetch: async (url, init) => {
    const headers = new Headers(init?.headers);
    // Emulate a browser to avoid 429 rate limiting
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    return fetch(url, { ...init, headers });
  },
  suppressNotices: ['yahooSurvey']
});

import type { 
  AssetPriceDTO, 
  ExchangeRateDTO, 
  MarketDataStatusDTO,
  Currency,
  CandleData
} from '@/types';
import { NotFoundError, ErrorCode, createErrorResponse } from '@/lib/utils/error.utils';

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface MarketCache {
  prices: Map<string, CacheEntry<{ price: number; currency: Currency }>>;
  exchangeRates: Map<string, CacheEntry<number>>;
}

// Configuration
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Service for retrieving market data (prices, exchange rates)
 * Includes in-memory caching
 */
export class MarketDataService {
  private static instance: MarketDataService;
  private cache: MarketCache;

  private constructor() {
    this.cache = {
      prices: new Map(),
      exchangeRates: new Map(),
    };
  }

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  /**
   * Get current price for an asset
   * @param ticker Asset symbol
   */
  public async getPrice(ticker: string): Promise<AssetPriceDTO> {
    const normalizedTicker = ticker.toUpperCase();
    const now = Date.now();
    
    // Check cache
    const cachedEntry = this.cache.prices.get(normalizedTicker);
    if (cachedEntry && (now - cachedEntry.timestamp < CACHE_TTL_MS)) {
      return {
        ticker: normalizedTicker,
        price: cachedEntry.data.price,
        currency: cachedEntry.data.currency,
        timestamp: new Date(cachedEntry.timestamp).toISOString(),
        cached: true,
      };
    }

    // Fetch from Yahoo Finance (Cache Miss)
    try {
        const data = await this.fetchPrice(normalizedTicker);
        
        // Update cache
        this.cache.prices.set(normalizedTicker, {
          data,
          timestamp: now,
        });

        return {
          ticker: normalizedTicker,
          price: data.price,
          currency: data.currency,
          timestamp: new Date(now).toISOString(),
          cached: false,
        };
    } catch (e) {
        console.error(`Failed to fetch price for ${normalizedTicker}:`, e);
        // Fallback for demo purposes if API fails or rate limited
        // In prod we might want to rethrow or return stored stale data
        if (cachedEntry) {
             return {
                ticker: normalizedTicker,
                price: cachedEntry.data.price,
                currency: cachedEntry.data.currency,
                timestamp: new Date(cachedEntry.timestamp).toISOString(),
                cached: true,
             };
        }
        throw e;
    }
  }

  /**
   * Get historical candle data for an asset
   */
  public async getCandles(ticker: string, range: string = '1y'): Promise<CandleData[]> {
    try {
      const normalizedTicker = ticker.toUpperCase();
      const period1 = new Date();
      period1.setFullYear(period1.getFullYear() - 1); // Default to 1 year ago
      const period2 = new Date(); // Now

      const result = await yahooFinance.historical(normalizedTicker, {
        period1: period1.toISOString().split('T')[0], // yyyy-mm-dd
        period2: period2.toISOString().split('T')[0], // yyyy-mm-dd
        interval: '1d',
      });

      return result.map((item: any) => ({
        time: item.date.toISOString().split('T')[0], // yyyy-mm-dd
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));
    } catch (error) {
      console.error(`Error fetching candles for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  public async getExchangeRate(from: Currency = 'USD', to: Currency = 'PLN'): Promise<ExchangeRateDTO> {
    if (from === to) {
        return {
            from,
            to,
            rate: 1,
            timestamp: new Date().toISOString(),
            cached: true
        };
    }

    const key = `${from}-${to}`;
    const now = Date.now();
    
    // Check cache
    const cachedEntry = this.cache.exchangeRates.get(key);
    if (cachedEntry && (now - cachedEntry.timestamp < CACHE_TTL_MS)) {
      return {
        from,
        to,
        rate: cachedEntry.data,
        timestamp: new Date(cachedEntry.timestamp).toISOString(),
        cached: true,
      };
    }

    // Fetch (Cache Miss)
    const rate = await this.fetchExchangeRate(from, to);

    // Update cache
    this.cache.exchangeRates.set(key, {
      data: rate,
      timestamp: now,
    });

    return {
      from,
      to,
      rate,
      timestamp: new Date(now).toISOString(),
      cached: false,
    };
  }

  /**
   * Get service status
   */
  public getStatus(): MarketDataStatusDTO {
    const now = Date.now();
    // Next refresh is rough estimate based on TTL, assuming valid data
    // In a real scenario, this might check the oldest cache entry
    const nextRefresh = new Date(now + CACHE_TTL_MS).toISOString();

    return {
      status: 'operational',
      last_updated: new Date(now).toISOString(),
      cache_ttl_seconds: CACHE_TTL_MS / 1000,
      next_refresh: nextRefresh,
    };
  }

  // --- Private Helpers ---

  private async fetchPrice(ticker: string): Promise<{ price: number; currency: Currency }> {
    try {
      // Use the imported singleton instance
      const quote = await yahooFinance.quote(ticker) as any;
      
      if (!quote || typeof quote.regularMarketPrice !== 'number') {
         throw new NotFoundError(`Asset ${ticker}`);
      }
      
      const currency = (quote.currency || 'USD').toUpperCase();
      
      return { price: quote.regularMarketPrice, currency };
    } catch (error: any) {
      if (error.message?.includes('Not Found') || error.name === 'NotFoundError') {
        throw new NotFoundError(`Asset ${ticker}`);
      }
      console.error(`Error fetching price for ${ticker}:`, error);
      throw error;
    }
  }

  private async fetchExchangeRate(from: Currency, to: Currency): Promise<number> {
    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !data.rates || typeof data.rates[to] !== 'number') {
        throw new Error('Invalid exchange rate data format');
      }

      return data.rates[to];
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw error;
    }
  }
}

export const marketService = MarketDataService.getInstance();

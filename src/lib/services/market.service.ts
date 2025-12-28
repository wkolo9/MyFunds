import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

import type { 
  AssetPriceDTO, 
  ExchangeRateDTO, 
  MarketDataStatusDTO
} from '@/types';
import { NotFoundError, ErrorCode, createErrorResponse } from '@/lib/utils/error.utils';

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface MarketCache {
  prices: Map<string, CacheEntry<number>>;
  exchangeRate: CacheEntry<number> | null;
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
      exchangeRate: null,
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
        price: cachedEntry.data,
        currency: 'USD', // Defaulting to USD as per plan
        timestamp: new Date(cachedEntry.timestamp).toISOString(),
        cached: true,
      };
    }

    // Fetch from Yahoo Finance (Cache Miss)
    try {
        const price = await this.fetchPrice(normalizedTicker);
        
        // Update cache
        this.cache.prices.set(normalizedTicker, {
          data: price,
          timestamp: now,
        });

        return {
          ticker: normalizedTicker,
          price,
          currency: 'USD',
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
                price: cachedEntry.data,
                currency: 'USD',
                timestamp: new Date(cachedEntry.timestamp).toISOString(),
                cached: true,
             };
        }
        throw e;
    }
  }

  /**
   * Get USD to PLN exchange rate
   */
  public async getExchangeRate(): Promise<ExchangeRateDTO> {
    const now = Date.now();
    
    // Check cache
    if (this.cache.exchangeRate && (now - this.cache.exchangeRate.timestamp < CACHE_TTL_MS)) {
      return {
        from: 'USD',
        to: 'PLN',
        rate: this.cache.exchangeRate.data,
        timestamp: new Date(this.cache.exchangeRate.timestamp).toISOString(),
        cached: true,
      };
    }

    // Fetch from Frankfurter API (Cache Miss)
    const rate = await this.fetchExchangeRate();

    // Update cache
    this.cache.exchangeRate = {
      data: rate,
      timestamp: now,
    };

    return {
      from: 'USD',
      to: 'PLN',
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

  private async fetchPrice(ticker: string): Promise<number> {
    try {
      // Use the imported singleton instance
      const quote = await yahooFinance.quote(ticker) as any;
      
      if (!quote || typeof quote.regularMarketPrice !== 'number') {
         throw new NotFoundError(`Asset ${ticker}`);
      }
      
      return quote.regularMarketPrice;
    } catch (error: any) {
      if (error.message?.includes('Not Found') || error.name === 'NotFoundError') {
        throw new NotFoundError(`Asset ${ticker}`);
      }
      console.error(`Error fetching price for ${ticker}:`, error);
      throw error;
    }
  }

  private async fetchExchangeRate(): Promise<number> {
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=PLN');
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !data.rates || typeof data.rates.PLN !== 'number') {
        throw new Error('Invalid exchange rate data format');
      }

      return data.rates.PLN;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw error;
    }
  }
}

export const marketService = MarketDataService.getInstance();

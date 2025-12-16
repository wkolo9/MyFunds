import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketDataService } from '../market.service';

// Mock yahoo-finance2
vi.mock('yahoo-finance2', () => ({
  default: {
    quote: vi.fn(),
  },
}));

import yahooFinance from 'yahoo-finance2';

// Mock fetch
global.fetch = vi.fn();

describe('MarketDataService', () => {
  let service: MarketDataService;

  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    // Reset singleton instance if possible or just get the instance
    // Since it's a singleton, state might persist. Ideally we would allow resetting it.
    // For this test, we assume fresh state or we will just test logic that is robust enough.
    // However, since we can't easily reset private singleton instance, we rely on mocks being called.
    service = MarketDataService.getInstance();
    
    // Hack to clear cache for testing purposes
    (service as any).cache.prices.clear();
    (service as any).cache.exchangeRate = null;
  });

  describe('getPrice', () => {
    it('should fetch price from yahoo-finance2 and return AssetPriceDTO', async () => {
      const mockTicker = 'AAPL';
      const mockPrice = 150.50;

      (yahooFinance.quote as any).mockResolvedValue({
        regularMarketPrice: mockPrice,
      });

      const result = await service.getPrice(mockTicker);

      expect(yahooFinance.quote).toHaveBeenCalledWith(mockTicker);
      expect(result).toEqual({
        ticker: mockTicker,
        price: mockPrice,
        currency: 'USD',
        timestamp: expect.any(String),
        cached: false,
      });
    });

    it('should return cached price on second call', async () => {
      const mockTicker = 'GOOGL';
      const mockPrice = 2800.00;

      (yahooFinance.quote as any).mockResolvedValue({
        regularMarketPrice: mockPrice,
      });

      // First call - cache miss
      await service.getPrice(mockTicker);
      
      // Second call - cache hit
      const result = await service.getPrice(mockTicker);

      expect(yahooFinance.quote).toHaveBeenCalledTimes(1); // Should only be called once
      expect(result.cached).toBe(true);
      expect(result.price).toBe(mockPrice);
    });

    it('should throw NotFoundError if yahoo-finance2 throws error', async () => {
      const mockTicker = 'INVALID';
      
      (yahooFinance.quote as any).mockRejectedValue(new Error('Not Found'));

      await expect(service.getPrice(mockTicker)).rejects.toThrow('Asset INVALID not found');
    });
  });

  describe('getExchangeRate', () => {
    it('should fetch exchange rate from Frankfurter API', async () => {
      const mockRate = 4.25;
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ rates: { PLN: mockRate } }),
      });

      const result = await service.getExchangeRate();

      expect(global.fetch).toHaveBeenCalledWith('https://api.frankfurter.app/latest?from=USD&to=PLN');
      expect(result).toEqual({
        from: 'USD',
        to: 'PLN',
        rate: mockRate,
        timestamp: expect.any(String),
        cached: false,
      });
    });

    it('should return cached rate on second call', async () => {
      const mockRate = 4.25;
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ rates: { PLN: mockRate } }),
      });

      // First call
      await service.getExchangeRate();
      
      // Second call
      const result = await service.getExchangeRate();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.cached).toBe(true);
      expect(result.rate).toBe(mockRate);
    });
  });

  describe('getStatus', () => {
    it('should return service status', () => {
      const result = service.getStatus();
      
      expect(result).toMatchObject({
        status: 'operational',
        last_updated: expect.any(String),
        next_refresh: expect.any(String),
      });
      expect(result.cache_ttl_seconds).toBeGreaterThan(0);
    });
  });
});


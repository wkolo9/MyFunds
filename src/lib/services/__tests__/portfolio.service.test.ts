import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortfolioService } from '../../../lib/services/portfolio.service';
import { NotFoundError, ConflictError, ValidationError } from '../../../lib/utils/error.utils';

// Use vi.hoisted for hoisted mocks
const { mockMarketService } = vi.hoisted(() => ({
  mockMarketService: {
    getPrice: vi.fn(),
    getExchangeRate: vi.fn(),
  }
}));

// Mock dependencies
const mockSupabase = {
  from: vi.fn(),
} as any;

vi.mock('../../../lib/services/market.service', () => ({
  marketService: mockMarketService
}));

describe('PortfolioService', () => {
  let service: PortfolioService;
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PortfolioService(mockSupabase);
    
    // Reset Supabase mock chain
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      then: vi.fn(), // Make it thenable/awaitable
    };
    // Initialize then to resolve to something default if needed, or leave it to tests
    // But then needs to behave like a promise then
    // Actually, if we mock 'then', we can control what it resolves to using mockResolvedValue on it?
    // No, 'then' on a promise takes callbacks. 
    // If we want it to be awaited, the runner calls .then(resolve, reject).
    // So mocking .then as a simple vi.fn() might not work if we just want to set return value.
    // Better: make the object a Promise-like or use a getter.
    // But for simplicity in tests, we can just assume we configure 'then' implementation or use a helper.
    // However, the easiest way to mock the result of `await chain` is `chain.then.mockImplementation((res) => res(value))`
    
    // Let's use a simpler approach: 
    // We let 'then' be a mock function. We can configure it in tests.
    // But to make it work as a promise by default, we can set default implementation.
    mockBuilder.then.mockImplementation((resolve) => resolve({ data: [], error: null }));
    
    mockSupabase.from.mockReturnValue(mockBuilder);
  });

  describe('getAssets', () => {
    it('should return enriched assets', async () => {
      // Setup
      const mockAssets = [
        { 
            id: '1', 
            ticker: 'AAPL', 
            quantity: '10', 
            sectors: { name: 'Tech' },
            sector_id: 'sec-1'
        }
      ];
      
      mockSupabase.from().select().eq.mockResolvedValue({ 
        data: mockAssets, 
        error: null,
        count: 1 
      });

      mockMarketService.getPrice.mockResolvedValue({ 
        ticker: 'AAPL', 
        price: 150 
      });

      // Execute
      const result = await service.getAssets(userId);

      // Verify
      expect(result.assets).toHaveLength(1);
      expect(result.assets[0].current_value).toBe(1500); // 10 * 150
      expect(result.assets[0].sector_name).toBe('Tech');
      expect(result.total_value).toBe(1500);
    });

    it('should handle currency conversion to PLN', async () => {
        // Setup
        const mockAssets = [
          { 
              id: '1', 
              ticker: 'AAPL', 
              quantity: '10',
              sectors: { name: 'Tech' }
          }
        ];
        
        mockSupabase.from().select().eq.mockResolvedValue({ 
          data: mockAssets, 
          error: null,
          count: 1 
        });
  
        mockMarketService.getExchangeRate.mockResolvedValue({ rate: 4.0 });
        mockMarketService.getPrice.mockResolvedValue({ ticker: 'AAPL', price: 100 });
  
        // Execute
        const result = await service.getAssets(userId, { currency: 'PLN' });
  
        // Verify
        expect(result.currency).toBe('PLN');
        expect(result.assets[0].current_price).toBe(400); // 100 * 4.0
        expect(result.assets[0].current_value).toBe(4000); // 10 * 400
      });
  });

  describe('createAsset', () => {
    it('should create asset if valid', async () => {
      // Setup
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({ data: null }); // No duplicate
      mockMarketService.getPrice.mockResolvedValue({ ticker: 'AAPL', price: 150 }); // Valid ticker
      
      const newAsset = { 
        id: 'new-1', 
        ticker: 'AAPL', 
        quantity: '5', 
        sector_id: null,
        sectors: { name: null }
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({ 
        data: newAsset, 
        error: null 
      });

      // Execute
      const result = await service.createAsset(userId, { ticker: 'AAPL', quantity: '5' });

      // Verify
      expect(result.id).toBe('new-1');
      expect(result.current_value).toBe(750); // 5 * 150
    });

    it('should throw conflict if ticker exists', async () => {
      // Setup
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({ data: { id: 'existing' } });

      // Execute & Verify
      await expect(service.createAsset(userId, { ticker: 'AAPL', quantity: '5' }))
        .rejects.toThrow(ConflictError);
    });

    it('should throw validation error if ticker invalid', async () => {
        // Setup
        mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({ data: null });
        mockMarketService.getPrice.mockRejectedValue(new NotFoundError('Asset'));
  
        // Execute & Verify
        await expect(service.createAsset(userId, { ticker: 'INVALID', quantity: '5' }))
          .rejects.toThrow(ValidationError);
      });
  });

  describe('updateAsset', () => {
      it('should update asset', async () => {
          // Setup
          mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({ data: { id: '1' } }); // Exists
          
          const updatedAsset = {
              id: '1',
              ticker: 'AAPL',
              quantity: '20', // Updated from 10
              sectors: { name: 'Tech' }
          };

          mockSupabase.from().update().eq().eq().select().single.mockResolvedValue({
              data: updatedAsset,
              error: null
          });

          mockMarketService.getPrice.mockResolvedValue({ ticker: 'AAPL', price: 150 });

          // Execute
          const result = await service.updateAsset(userId, '1', { quantity: '20' });

          // Verify
          expect(result.quantity).toBe('20');
          expect(result.current_value).toBe(3000); // 20 * 150
      });
  });

  describe('deleteAsset', () => {
      it('should delete existing asset', async () => {
          // Setup
          mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({ data: { id: '1' } }); // Exists
          // For delete, we await the chain directly. So we configure 'then'.
          // Since 'then' is called by the runtime, we need to mock implementation to call resolve.
          // Or simpler: mockSupabase.from().delete().eq().eq() returns the builder.
          // The builder has 'then'.
          // We can just verify the call happened. The default mock implementation of 'then' (added in beforeEach) resolves to success.
          // If we need specific return:
          // mockSupabase.from().delete().eq().eq().then.mockImplementation((resolve) => resolve({ error: null }));
          
          // Execute
          await service.deleteAsset(userId, '1');

          // Verify
          expect(mockSupabase.from).toHaveBeenCalledWith('portfolio_assets');
      });

      it('should throw not found if asset does not exist', async () => {
        // Setup
        mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({ data: null }); 

        // Execute & Verify
        await expect(service.deleteAsset(userId, '999'))
            .rejects.toThrow(NotFoundError);
    });
  });
});

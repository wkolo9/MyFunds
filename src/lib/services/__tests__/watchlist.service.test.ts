import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import { WatchlistService } from '../watchlist.service';
import { marketService } from '../market.service';
import type { WatchlistItemEntity, WatchlistItemDTO } from '@/types';

// Mock marketService
vi.mock('../market.service', () => ({
  marketService: {
    getPrice: vi.fn(),
  },
}));

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
} as unknown as SupabaseClient<Database>;

describe('WatchlistService', () => {
  let watchlistService: WatchlistService;
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
    watchlistService = new WatchlistService(mockSupabaseClient);
  });

  describe('getWatchlist', () => {
    it('should return watchlist items with prices', async () => {
      const mockItems: WatchlistItemEntity[] = [
        {
          id: 'item-1',
          user_id: userId,
          ticker: 'AAPL',
          grid_position: 0,
          created_at: '2025-12-10T10:00:00Z',
        },
      ];

      // Mock DB response
      const orderMock = vi.fn().mockResolvedValue({ data: mockItems, error: null, count: 1 });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });
      mockSupabaseClient.from = fromMock;

      // Mock Market Service response
      (marketService.getPrice as any).mockResolvedValue({
        ticker: 'AAPL',
        price: 150.0,
      });

      const result = await watchlistService.getWatchlist(userId);

      expect(fromMock).toHaveBeenCalledWith('watchlist_items');
      expect(selectMock).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(eqMock).toHaveBeenCalledWith('user_id', userId);
      expect(marketService.getPrice).toHaveBeenCalledWith('AAPL');
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].ticker).toBe('AAPL');
      expect(result.items[0].current_price).toBe(150.0);
      expect(result.total).toBe(1);
    });

    it('should handle market service errors gracefully', async () => {
      const mockItems = [{
        id: 'item-1',
        user_id: userId,
        ticker: 'AAPL',
        grid_position: 0,
        created_at: '2025-12-10T10:00:00Z',
      }];

      // Mock DB
      const orderMock = vi.fn().mockResolvedValue({ data: mockItems, error: null, count: 1 });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });
      mockSupabaseClient.from = fromMock;

      // Mock Market Service error
      (marketService.getPrice as any).mockRejectedValue(new Error('API Error'));

      const result = await watchlistService.getWatchlist(userId);

      expect(result.items[0].current_price).toBe(0);
    });
  });

  describe('createWatchlistItem', () => {
    it('should create item successfully', async () => {
      const command = { ticker: 'MSFT', grid_position: 1 };
      const createdItem = {
        id: 'item-2',
        user_id: userId,
        ticker: 'MSFT',
        grid_position: 1,
        created_at: '2025-12-10T10:00:00Z',
      };

      // Mock checks
      // 1. Count
      const countEqMock = vi.fn().mockResolvedValue({ count: 5, error: null });
      const countSelectMock = vi.fn().mockReturnValue({ eq: countEqMock });
      
      // 2. Ticker exists
      const tickerMaybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const tickerEqTickerMock = vi.fn().mockReturnValue({ maybeSingle: tickerMaybeSingleMock });
      const tickerEqUserMock = vi.fn().mockReturnValue({ eq: tickerEqTickerMock });
      const tickerSelectMock = vi.fn().mockReturnValue({ eq: tickerEqUserMock });

      // 3. Position occupied
      const posMaybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const posEqPosMock = vi.fn().mockReturnValue({ maybeSingle: posMaybeSingleMock });
      const posEqUserMock = vi.fn().mockReturnValue({ eq: posEqPosMock });
      const posSelectMock = vi.fn().mockReturnValue({ eq: posEqUserMock });

      // 4. Insert
      const insertSingleMock = vi.fn().mockResolvedValue({ data: createdItem, error: null });
      const insertSelectMock = vi.fn().mockReturnValue({ single: insertSingleMock });
      const insertMock = vi.fn().mockReturnValue({ select: insertSelectMock });

      // Main from mock dispatch
      const fromMock = vi.fn()
        .mockReturnValueOnce({ select: countSelectMock }) // Count check
        .mockReturnValueOnce({ select: tickerSelectMock }) // Ticker check
        .mockReturnValueOnce({ select: posSelectMock }) // Position check
        .mockReturnValueOnce({ insert: insertMock }); // Insert

      mockSupabaseClient.from = fromMock;

      // Mock Market Service check
      (marketService.getPrice as any).mockResolvedValue({ price: 300.0 });

      const result = await watchlistService.createWatchlistItem(userId, command);

      expect(result.ticker).toBe('MSFT');
      expect(result.current_price).toBe(300.0);
    });

    it('should throw if max items reached', async () => {
      const command = { ticker: 'MSFT', grid_position: 1 };
      
      const countEqMock = vi.fn().mockResolvedValue({ count: 16, error: null });
      const countSelectMock = vi.fn().mockReturnValue({ eq: countEqMock });
      const fromMock = vi.fn().mockReturnValue({ select: countSelectMock });
      mockSupabaseClient.from = fromMock;

      await expect(watchlistService.createWatchlistItem(userId, command))
        .rejects.toThrow('Maximum limit of 16 watchlist items reached');
    });
  });

  describe('deleteWatchlistItem', () => {
    it('should delete existing item', async () => {
      const itemId = 'item-1';

      // Mock exists check
      const findMaybeSingleMock = vi.fn().mockResolvedValue({ data: { id: itemId }, error: null });
      const findEqIdMock = vi.fn().mockReturnValue({ maybeSingle: findMaybeSingleMock });
      const findEqUserMock = vi.fn().mockReturnValue({ eq: findEqIdMock });
      const findSelectMock = vi.fn().mockReturnValue({ eq: findEqUserMock });

      // Mock delete
      const deleteEqIdMock = vi.fn().mockResolvedValue({ error: null });
      const deleteEqUserMock = vi.fn().mockReturnValue({ eq: deleteEqIdMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqUserMock });

      const fromMock = vi.fn()
        .mockReturnValueOnce({ select: findSelectMock })
        .mockReturnValueOnce({ delete: deleteMock });

      mockSupabaseClient.from = fromMock;

      await watchlistService.deleteWatchlistItem(userId, itemId);

      expect(fromMock).toHaveBeenCalledTimes(2);
      expect(deleteMock).toHaveBeenCalled();
    });
  });
});


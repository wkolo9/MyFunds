import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH } from '../watchlist/index';
import { DELETE } from '../watchlist/[id]';
import { WatchlistService } from '@/lib/services/watchlist.service';
import { createWatchlistService } from '@/lib/services/watchlist.service';
import { ErrorCode } from '@/lib/utils/error.utils';

// Mock dependencies
vi.mock('@/lib/services/watchlist.service', () => ({
  createWatchlistService: vi.fn(),
  WatchlistService: vi.fn(),
}));

// Mock Supabase client injection
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
};

const mockContext = {
  locals: {
    supabase: mockSupabase,
  },
  request: {
    headers: new Map(),
    json: vi.fn(),
  },
  params: {},
} as any;

describe('Watchlist API', () => {
  let mockWatchlistService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.request.headers = new Map();
    
    // Setup Service Mock
    mockWatchlistService = {
      getWatchlist: vi.fn(),
      createWatchlistItem: vi.fn(),
      batchUpdateItems: vi.fn(),
      deleteWatchlistItem: vi.fn(),
    };
    (createWatchlistService as any).mockReturnValue(mockWatchlistService);
  });

  describe('Authentication', () => {
    it('should return 401 if no Authorization header', async () => {
      const response = await GET(mockContext);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe(ErrorCode.MISSING_AUTH_HEADER);
    });

    it('should return 401 if invalid token', async () => {
      mockContext.request.headers.set('Authorization', 'Bearer invalid-token');
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Invalid') });

      const response = await GET(mockContext);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe(ErrorCode.INVALID_TOKEN);
    });
  });

  describe('GET /api/watchlist', () => {
    it('should return watchlist on success', async () => {
      // Auth success
      mockContext.request.headers.set('Authorization', 'Bearer valid-token');
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

      const mockData = { items: [], total: 0 };
      mockWatchlistService.getWatchlist.mockResolvedValue(mockData);

      const response = await GET(mockContext);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockData);
      expect(mockWatchlistService.getWatchlist).toHaveBeenCalledWith('user-1');
    });
  });

  describe('POST /api/watchlist', () => {
    it('should create item on valid input', async () => {
      mockContext.request.headers.set('Authorization', 'Bearer valid-token');
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
      
      const payload = { ticker: 'AAPL', grid_position: 0 };
      mockContext.request.json.mockResolvedValue(payload);
      
      const mockCreated = { ...payload, id: '123' };
      mockWatchlistService.createWatchlistItem.mockResolvedValue(mockCreated);

      const response = await POST(mockContext);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockCreated);
    });

    it('should return 400 on validation error', async () => {
      mockContext.request.headers.set('Authorization', 'Bearer valid-token');
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
      
      const payload = { ticker: '', grid_position: 20 }; // Invalid
      mockContext.request.json.mockResolvedValue(payload);

      const response = await POST(mockContext);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });

  describe('DELETE /api/watchlist/[id]', () => {
    it('should delete item on success', async () => {
      mockContext.request.headers.set('Authorization', 'Bearer valid-token');
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
      mockContext.params = { id: 'item-1' };

      mockWatchlistService.deleteWatchlistItem.mockResolvedValue(undefined);

      const response = await DELETE(mockContext);
      expect(response.status).toBe(204);
      expect(mockWatchlistService.deleteWatchlistItem).toHaveBeenCalledWith('user-1', 'item-1');
    });
  });
});






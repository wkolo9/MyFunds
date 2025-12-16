import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { GET, POST } from '../sectors/index';
import { PATCH, DELETE } from '../sectors/[id]';
import { ErrorCode } from '../../../lib/utils/error.utils';

// Mocks
vi.mock('../../../lib/services/sector.service', () => ({
  createSectorService: vi.fn(() => ({
    listSectors: vi.fn(),
    createSector: vi.fn(),
    updateSector: vi.fn(),
    deleteSector: vi.fn(),
  })),
}));

// Mock auth utils
vi.mock('../../../lib/utils/auth.utils', () => ({
  getAuthenticatedUser: vi.fn(),
}));

import { createSectorService } from '../../../lib/services/sector.service';
import { getAuthenticatedUser } from '../../../lib/utils/auth.utils';

describe('Sectors API', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockContext = {
    request: {
      headers: new Map(),
      json: vi.fn(),
    },
    params: {},
    locals: {
      supabase: {},
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/sectors', () => {
    it('should return 401 if not authenticated', async () => {
      (getAuthenticatedUser as any).mockResolvedValue(null);
      
      const response = await GET(mockContext);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error.code).toBe(ErrorCode.INVALID_TOKEN);
    });

    it('should return sectors list', async () => {
      (getAuthenticatedUser as any).mockResolvedValue(mockUser);
      const mockSectors = { sectors: [], total: 0 };
      const mockService = { listSectors: vi.fn().mockResolvedValue(mockSectors) };
      (createSectorService as any).mockReturnValue(mockService);

      const response = await GET(mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSectors);
      expect(mockService.listSectors).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('POST /api/sectors', () => {
    it('should return 400 for invalid body', async () => {
      (getAuthenticatedUser as any).mockResolvedValue(mockUser);
      mockContext.request.json.mockResolvedValue({ name: '' }); // Empty name

      const response = await POST(mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should create sector', async () => {
      (getAuthenticatedUser as any).mockResolvedValue(mockUser);
      const payload = { name: 'Tech' };
      mockContext.request.json.mockResolvedValue(payload);
      
      const mockSector = { id: '1', ...payload };
      const mockService = { createSector: vi.fn().mockResolvedValue(mockSector) };
      (createSectorService as any).mockReturnValue(mockService);

      const response = await POST(mockContext);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockSector);
      expect(mockService.createSector).toHaveBeenCalledWith(mockUser.id, payload);
    });
  });

  describe('PATCH /api/sectors/[id]', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    
    it('should return 400 for invalid UUID', async () => {
        const context = { ...mockContext, params: { id: 'invalid-id' } };
        const response = await PATCH(context);
        expect(response.status).toBe(400);
    });

    it('should update sector', async () => {
      (getAuthenticatedUser as any).mockResolvedValue(mockUser);
      const context = { ...mockContext, params: { id: validUuid } };
      const payload = { name: 'New Name' };
      context.request.json.mockResolvedValue(payload);

      const mockSector = { id: validUuid, ...payload };
      const mockService = { updateSector: vi.fn().mockResolvedValue(mockSector) };
      (createSectorService as any).mockReturnValue(mockService);

      const response = await PATCH(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSector);
    });
  });

    describe('DELETE /api/sectors/[id]', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should delete sector', async () => {
      (getAuthenticatedUser as any).mockResolvedValue(mockUser);
      const context = { ...mockContext, params: { id: validUuid } };
      
      const mockService = { deleteSector: vi.fn().mockResolvedValue(undefined) };
      (createSectorService as any).mockReturnValue(mockService);

      const response = await DELETE(context);

      expect(response.status).toBe(204);
      expect(mockService.deleteSector).toHaveBeenCalledWith(mockUser.id, validUuid);
    });
  });
});


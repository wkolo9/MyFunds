import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SectorService } from '../sector.service';
import type { Database } from '../../../db/database.types';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
} as unknown as SupabaseClient<Database>;

describe('SectorService', () => {
  let sectorService: SectorService;
  const userId = 'user-123';
  const sectorId = 'sector-123';

  beforeEach(() => {
    vi.clearAllMocks();
    sectorService = new SectorService(mockSupabase);
  });

  describe('listSectors', () => {
    it('should return list of sectors', async () => {
      const mockData = [{ id: '1', name: 'Tech', user_id: userId }];
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null, count: 1 }),
      };
      (mockSupabase.from as any).mockReturnValue(mockChain);

      const result = await sectorService.listSectors(userId);

      expect(result.sectors).toEqual(mockData);
      expect(result.total).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('sectors');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should throw validation error if userId is missing', async () => {
      await expect(sectorService.listSectors('')).rejects.toThrow('User ID is required');
    });

    it('should throw database error on failure', async () => {
       const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' }, count: 0 }),
      };
      (mockSupabase.from as any).mockReturnValue(mockChain);

      await expect(sectorService.listSectors(userId)).rejects.toThrow('Database error: DB Error');
    });
  });

  describe('createSector', () => {
    it('should create a sector if valid', async () => {
      const command = { name: 'Tech' };
      const mockSector = { id: sectorId, ...command, user_id: userId };
      
      const mockCountChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };
      
      const mockUniqueChain = {
         select: vi.fn().mockReturnThis(),
         eq: vi.fn().mockReturnThis(),
         ilike: vi.fn().mockReturnThis(),
         maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      const mockInsertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSector, error: null }),
      };

      // Mock sequence of calls to .from('sectors')
      (mockSupabase.from as any)
        .mockReturnValueOnce(mockCountChain) // 1. Check limit
        .mockReturnValueOnce(mockUniqueChain) // 2. Check uniqueness
        .mockReturnValueOnce(mockInsertChain); // 3. Insert

      const result = await sectorService.createSector(userId, command);

      expect(result).toEqual(mockSector);
      expect(mockInsertChain.insert).toHaveBeenCalledWith({ user_id: userId, name: command.name });
    });

    it('should throw error if sector limit reached', async () => {
       const mockCountChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 32, error: null }),
      };
      
      (mockSupabase.from as any).mockReturnValueOnce(mockCountChain);

      await expect(sectorService.createSector(userId, { name: 'Tech' }))
        .rejects.toThrow('Maximum limit of 32 sectors reached');
    });

    it('should throw error if name already exists', async () => {
      const mockCountChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };
      
      const mockUniqueChain = {
         select: vi.fn().mockReturnThis(),
         eq: vi.fn().mockReturnThis(),
         ilike: vi.fn().mockReturnThis(),
         maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing' }, error: null })
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockCountChain)
        .mockReturnValueOnce(mockUniqueChain);

      await expect(sectorService.createSector(userId, { name: 'Tech' }))
        .rejects.toThrow('Sector with name "Tech" already exists');
    });
  });

  describe('updateSector', () => {
    it('should update sector if valid', async () => {
      const command = { name: 'New Tech' };
      const mockSector = { id: sectorId, ...command, user_id: userId };

      const mockFindChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: sectorId }, error: null }),
      };

      const mockUniqueChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSector, error: null }),
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockFindChain)
        .mockReturnValueOnce(mockUniqueChain)
        .mockReturnValueOnce(mockUpdateChain);

      const result = await sectorService.updateSector(userId, sectorId, command);
      expect(result).toEqual(mockSector);
    });

    it('should throw not found if sector does not exist', async () => {
       const mockFindChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
       (mockSupabase.from as any).mockReturnValueOnce(mockFindChain);

       await expect(sectorService.updateSector(userId, sectorId, { name: 'New' }))
        .rejects.toThrow('Sector not found');
    });
  });

  describe('deleteSector', () => {
    it('should delete sector if exists', async () => {
      const mockFindChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: sectorId }, error: null }),
      };

      const mockDeleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ error: null }) // simulate promise-like behavior if needed, or just return mocks
      };
      
      // Fix for delete chain which doesn't usually return data unless select is used, but for mocking we just need it not to throw
      // In Supabase js client delete() returns a builder that is thenable.
      // We will mock the return value of delete() to be an object with eq() that resolves.
      
      const mockDeleteBuilder = {
         eq: vi.fn().mockReturnThis(),
         then: vi.fn().mockImplementation((callback) => callback({ error: null }))
      };
      
      (mockSupabase.from as any)
        .mockReturnValueOnce(mockFindChain)
        .mockReturnValueOnce({
            delete: vi.fn().mockReturnValue(mockDeleteBuilder)
        });

      await sectorService.deleteSector(userId, sectorId);
      
      // If no error thrown, test passes.
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });
  });
});


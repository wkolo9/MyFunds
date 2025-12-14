import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../db/database.types';
import { ProfileService } from '../profile.service';
import type { ProfileEntity } from '../../../types';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
} as unknown as SupabaseClient<Database>;

describe('ProfileService', () => {
  let profileService: ProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    profileService = new ProfileService(mockSupabaseClient);
  });

  describe('getProfile', () => {
    it('should return profile when found', async () => {
      const mockProfile: ProfileEntity = {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        preferred_currency: 'USD',
        created_at: '2025-12-10T10:00:00Z',
        updated_at: '2025-12-10T10:00:00Z',
      };

      const mockResponse = {
        data: mockProfile,
        error: null,
      };

      // Mock the chain of calls
      const singleMock = vi.fn().mockResolvedValue(mockResponse);
      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      mockSupabaseClient.from = fromMock;

      const result = await profileService.getProfile('550e8400-e29b-41d4-a716-446655440000');

      expect(fromMock).toHaveBeenCalledWith('profiles');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('user_id', '550e8400-e29b-41d4-a716-446655440000');
      expect(singleMock).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it('should throw ValidationError for invalid userId', async () => {
      await expect(
        profileService.getProfile('')
      ).rejects.toThrow('Validation error: User ID is required and must be a string');
    });

    it('should throw ValidationError for invalid UUID format', async () => {
      await expect(
        profileService.getProfile('invalid-uuid')
      ).rejects.toThrow('Validation error: User ID must be a valid UUID format');
    });

    it('should throw error when profile not found', async () => {
      const mockResponse = {
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      };

      const singleMock = vi.fn().mockResolvedValue(mockResponse);
      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      mockSupabaseClient.from = fromMock;

      await expect(
        profileService.getProfile('550e8400-e29b-41d4-a716-446655440000')
      ).rejects.toThrow('Profile not found');
    });

    it('should throw database error for other database errors', async () => {
      const mockResponse = {
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Some database error' },
      };

      const singleMock = vi.fn().mockResolvedValue(mockResponse);
      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      mockSupabaseClient.from = fromMock;

      await expect(
        profileService.getProfile('550e8400-e29b-41d4-a716-446655440000')
      ).rejects.toThrow('Database error: Some database error');
    });
  });
});

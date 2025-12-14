import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../db/database.types';
import { GET } from '../profile';
import type { ProfileEntity } from '../../../types';

// Mock dependencies
vi.mock('../../../lib/services/profile.service', () => ({
  createProfileService: vi.fn(),
}));

vi.mock('../../../db/supabase.client', () => ({
  DEFAULT_USER_ID: '550e8400-e29b-41d4-a716-446655440000',
}));

import { createProfileService } from '../../../lib/services/profile.service';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';

describe('/api/profile', () => {
  let mockSupabaseClient: SupabaseClient<Database>;
  let mockProfileService: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseClient = {} as SupabaseClient<Database>;
    mockProfileService = {
      getProfile: vi.fn(),
    };

    (createProfileService as any).mockReturnValue(mockProfileService);

    mockContext = {
      locals: {
        supabase: mockSupabaseClient,
      },
    };
  });

  describe('GET /api/profile', () => {
    it('should return profile data successfully', async () => {
      const mockProfile: ProfileEntity = {
        user_id: DEFAULT_USER_ID,
        preferred_currency: 'USD',
        created_at: '2025-12-10T10:00:00Z',
        updated_at: '2025-12-10T10:00:00Z',
      };

      mockProfileService.getProfile.mockResolvedValue(mockProfile);

      const response = await GET(mockContext);
      const result = await response.json();

      expect(createProfileService).toHaveBeenCalledWith(mockSupabaseClient);
      expect(mockProfileService.getProfile).toHaveBeenCalledWith(DEFAULT_USER_ID);
      expect(response.status).toBe(200);
      expect(result).toEqual(mockProfile);
    });

    it('should return 500 when supabase client is not available', async () => {
      mockContext.locals.supabase = null;

      const response = await GET(mockContext);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error.code).toBe('INTERNAL_ERROR');
      expect(result.error.message).toBe('Database client not available');
    });

    it('should return 404 when profile not found', async () => {
      mockProfileService.getProfile.mockRejectedValue(new Error('Profile not found'));

      const response = await GET(mockContext);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.error.code).toBe('PROFILE_NOT_FOUND');
      expect(result.error.message).toBe('Profile not found');
    });

    it('should return 500 for database errors', async () => {
      mockProfileService.getProfile.mockRejectedValue(new Error('Database error: Connection failed'));

      const response = await GET(mockContext);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error.code).toBe('DATABASE_ERROR');
      expect(result.error.message).toBe('Internal server error');
    });

    it('should return 500 for unexpected errors', async () => {
      mockProfileService.getProfile.mockRejectedValue(new Error('Unexpected error'));

      const response = await GET(mockContext);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error.code).toBe('INTERNAL_ERROR');
      expect(result.error.message).toBe('Internal server error');
    });

    it('should return 400 for validation errors with proper error messages', async () => {
      mockProfileService.getProfile.mockRejectedValue(new Error('Validation error: User ID must be a valid UUID format'));

      const response = await GET(mockContext);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('User ID must be a valid UUID format');
    });

    it('should return 400 for validation errors with field information', async () => {
      // Test the error handling for validation errors with field info
      const { ValidationError, handleServiceError } = await import('../../../lib/utils/error.utils');
      const validationError = new ValidationError('Invalid currency value', 'preferred_currency');

      const response = handleServiceError(validationError);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('Invalid currency value');
      expect(result.error.field).toBe('preferred_currency');
    });
  });
});

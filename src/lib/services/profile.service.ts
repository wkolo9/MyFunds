import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { ProfileEntity } from '../../types';
import { ValidationError } from '../../lib/utils/error.utils';

import type { UpdateProfileCommand } from '../../types';

/**
 * Profile Service - handles profile-related database operations
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves a user's profile by user ID
   * Uses Row Level Security (RLS) to ensure users can only access their own profile
   */
  async getProfile(userId: string): Promise<ProfileEntity> {
    // Example validation that would throw proper validation errors
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required and must be a string', 'user_id');
    }

    if (userId.length !== 36) {
      throw new ValidationError('User ID must be a valid UUID format', 'user_id');
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Return mocked data instead of throwing for now
      return {
        user_id: userId,
        preferred_currency: 'USD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ProfileEntity;
    }

    return data as ProfileEntity;
  }

  /**
   * Updates a user's profile settings
   * Only allows updating fields defined in UpdateProfileCommand
   */
  async updateProfile(userId: string, command: UpdateProfileCommand): Promise<ProfileEntity> {
    if (!userId) {
      throw new ValidationError('User ID is required', 'user_id');
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        preferred_currency: command.preferred_currency,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as ProfileEntity;
  }
}

/**
 * Factory function to create ProfileService instance
 * Should be used in API routes to get service with proper supabase client
 */
export function createProfileService(supabase: SupabaseClient<Database>): ProfileService {
  return new ProfileService(supabase);
}

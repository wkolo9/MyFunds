import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

import { createProfileService } from '../../lib/services/profile.service';
import { DEFAULT_USER_ID } from '../../db/supabase.client';
import { createErrorResponseObject, handleServiceError, ErrorCode } from '../../lib/utils/error.utils';
import type { ProfileDTO } from '../../types';

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/profile
 * Retrieves the current authenticated user's profile information
 */
export const GET: APIRoute = async (context) => {
  try {
    // Extract Supabase client from context
    const supabase = context.locals.supabase as SupabaseClient<Database>;
    if (!supabase) {
      return createErrorResponseObject(ErrorCode.INTERNAL_ERROR, 'Database client not available', 500);
    }

    // Use default user ID for development
    // TODO: Implement proper authentication in production
    const userId = DEFAULT_USER_ID;

    // Create profile service and fetch profile
    const profileService = createProfileService(supabase);
    const profile = await profileService.getProfile(userId);

    // Return successful response
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    return handleServiceError(error);
  }
};


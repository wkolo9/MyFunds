import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

import { createProfileService } from '../../lib/services/profile.service';
import { DEFAULT_USER_ID } from '../../config/constants';
import { createErrorResponseObject, handleServiceError, ErrorCode } from '../../lib/utils/error.utils';
import type { ProfileDTO } from '../../types';
import { updateProfileCommandSchema } from '../../lib/validation/profile.validation';

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

/**
 * PATCH /api/profile
 * Updates the current authenticated user's profile settings
 */
export const PATCH: APIRoute = async (context) => {
  try {
    // 1. Authentication Check
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponseObject(
        ErrorCode.MISSING_AUTH_HEADER,
        'Missing or invalid Authorization header',
        401
      );
    }

    const token = authHeader.split(' ')[1];
    const supabase = context.locals.supabase as SupabaseClient<Database>;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponseObject(
        ErrorCode.INVALID_TOKEN,
        'Invalid or expired token',
        401
      );
    }

    // 2. Parse Request Body
    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return createErrorResponseObject(
        ErrorCode.VALIDATION_ERROR,
        'Invalid JSON body',
        400
      );
    }

    // 3. Validate Input
    const parseResult = updateProfileCommandSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return createErrorResponseObject(
        ErrorCode.VALIDATION_ERROR,
        firstError.message,
        400,
        firstError.path.join('.')
      );
    }
    const command = parseResult.data;

    // 4. Update Profile
    const profileService = createProfileService(supabase);
    const updatedProfile = await profileService.updateProfile(user.id, command);

    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    return handleServiceError(error);
  }
};


import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

import { createProfileService } from '../../lib/services/profile.service';
import { createErrorResponseObject, handleServiceError, ErrorCode } from '../../lib/utils/error.utils';
import type { ProfileDTO } from '../../types';
import { updateProfileCommandSchema } from '../../lib/validation/profile.validation';
import { getAuthenticatedUser } from '../../lib/utils/auth.utils';

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/profile
 * Retrieves the current authenticated user's profile information
 */
export const GET: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(ErrorCode.MISSING_AUTH_HEADER, 'Missing or invalid authentication', 401);
    }
    const userId = user.id;

    // Extract Supabase client from context
    const supabase = context.locals.supabase as SupabaseClient<Database>;
    
    // Create profile service and fetch profile
    const profileService = createProfileService(supabase);
    let profile = await profileService.getProfile(userId);

    // Auto-create profile if missing (similar to sector logic)
    if (!profile || (profile as any).user_id !== userId) { // Check if mocked data returned or truly missing
         // Try to ensure profile exists
         const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
            .select()
            .maybeSingle();
         
         if (!profileError && newProfile) {
             profile = newProfile;
         }
    }

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
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(ErrorCode.MISSING_AUTH_HEADER, 'Missing or invalid authentication', 401);
    }
    const userId = user.id;

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
    const supabase = context.locals.supabase as SupabaseClient<Database>;
    const profileService = createProfileService(supabase);
    
    try {
        const updatedProfile = await profileService.updateProfile(userId, command);
        return new Response(JSON.stringify(updatedProfile), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (err: any) {
        // Handle PGRST116 (No rows found) - likely missing profile
        if (err.code === 'PGRST116') {
             console.error('Profile missing during update, creating one...');
             // Create profile
             const { error: createError } = await supabase.from('profiles').insert({ 
                 user_id: userId,
                 preferred_currency: command.preferred_currency 
             });
             
             if (createError) {
                 throw createError;
             }
             
             // Fetch created profile to return
             const profile = await profileService.getProfile(userId);
             return new Response(JSON.stringify(profile), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        throw err;
    }

  } catch (error) {
    return handleServiceError(error);
  }
};

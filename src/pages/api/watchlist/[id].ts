import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../db/database.types';
import { createWatchlistService } from '../../../lib/services/watchlist.service';
import { createErrorResponseObject, handleServiceError, ErrorCode } from '../../../lib/utils/error.utils';

export const prerender = false;

// Helper to get authenticated user (duplicated from index.ts - ideally should be shared)
async function getAuthenticatedUser(context: any): Promise<{ userId: string | null; errorResponse: Response | null }> {
  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { 
      userId: null, 
      errorResponse: createErrorResponseObject(ErrorCode.MISSING_AUTH_HEADER, 'Missing or invalid Authorization header', 401) 
    };
  }
  
  const token = authHeader.split(' ')[1];
  const supabase = context.locals.supabase as SupabaseClient<Database>;
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { 
      userId: null, 
      errorResponse: createErrorResponseObject(ErrorCode.INVALID_TOKEN, 'Invalid or expired token', 401) 
    };
  }

  return { userId: user.id, errorResponse: null };
}

/**
 * DELETE /api/watchlist/[id]
 * Delete a watchlist item
 */
export const DELETE: APIRoute = async (context) => {
  try {
    const { userId, errorResponse } = await getAuthenticatedUser(context);
    if (errorResponse) return errorResponse;

    const { id } = context.params;
    if (!id) {
       return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Missing item ID', 400);
    }

    const supabase = context.locals.supabase as SupabaseClient<Database>;
    const watchlistService = createWatchlistService(supabase);
    await watchlistService.deleteWatchlistItem(userId!, id);

    return new Response(null, {
      status: 204
    });
  } catch (error) {
    return handleServiceError(error);
  }
};



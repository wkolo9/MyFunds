import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../db/database.types';
import { createWatchlistService } from '../../../lib/services/watchlist.service';
import { createErrorResponseObject, handleServiceError, ErrorCode } from '../../../lib/utils/error.utils';
import { getAuthenticatedUser } from '../../../lib/utils/auth.utils';

export const prerender = false;

/**
 * DELETE /api/watchlist/[id]
 * Delete a watchlist item
 */
export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(ErrorCode.MISSING_AUTH_HEADER, 'Missing or invalid authentication', 401);
    }
    const userId = user.id;

    const { id } = context.params;
    if (!id) {
        return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Missing item ID', 400);
    }

    const supabase = context.locals.supabase as SupabaseClient<Database>;
    const watchlistService = createWatchlistService(supabase);
    
    // We don't have a specific check for ownership here beyond RLS at DB level, 
    // but the service deleteItem should handle it or the DB will.
    // The spec says user can only manage their own items.
    
    await watchlistService.deleteItem(userId, id);

    return new Response(null, {
      status: 204
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

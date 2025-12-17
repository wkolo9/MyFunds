import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../db/database.types';
import { createWatchlistService } from '../../../lib/services/watchlist.service';
import { createErrorResponseObject, handleServiceError, ErrorCode } from '../../../lib/utils/error.utils';
import { createWatchlistItemSchema, batchUpdateWatchlistItemsSchema } from '../../../lib/validation/watchlist.validation';

export const prerender = false;

// Helper to get authenticated user
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
 * GET /api/watchlist
 * List watchlist items
 */
export const GET: APIRoute = async (context) => {
  try {
    const { userId, errorResponse } = await getAuthenticatedUser(context);
    if (errorResponse) return errorResponse;

    const supabase = context.locals.supabase as SupabaseClient<Database>;
    const watchlistService = createWatchlistService(supabase);
    const watchlist = await watchlistService.getWatchlist(userId!);

    return new Response(JSON.stringify(watchlist), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

/**
 * POST /api/watchlist
 * Create a new watchlist item
 */
export const POST: APIRoute = async (context) => {
  try {
    const { userId, errorResponse } = await getAuthenticatedUser(context);
    if (errorResponse) return errorResponse;

    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Invalid JSON body', 400);
    }

    const parseResult = createWatchlistItemSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return createErrorResponseObject(
        ErrorCode.VALIDATION_ERROR, 
        firstError.message, 
        400, 
        firstError.path.join('.')
      );
    }

    const supabase = context.locals.supabase as SupabaseClient<Database>;
    const watchlistService = createWatchlistService(supabase);
    const newItem = await watchlistService.createWatchlistItem(userId!, parseResult.data);

    return new Response(JSON.stringify(newItem), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

/**
 * PATCH /api/watchlist
 * Batch update watchlist items
 */
export const PATCH: APIRoute = async (context) => {
  try {
    const { userId, errorResponse } = await getAuthenticatedUser(context);
    if (errorResponse) return errorResponse;

    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Invalid JSON body', 400);
    }

    const parseResult = batchUpdateWatchlistItemsSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return createErrorResponseObject(
        ErrorCode.VALIDATION_ERROR, 
        firstError.message, 
        400, 
        firstError.path.join('.')
      );
    }

    const supabase = context.locals.supabase as SupabaseClient<Database>;
    const watchlistService = createWatchlistService(supabase);
    const result = await watchlistService.batchUpdateItems(userId!, parseResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};



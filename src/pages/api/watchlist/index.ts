import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../db/database.types';
import { createWatchlistService } from '../../../lib/services/watchlist.service';
import { createErrorResponseObject, handleServiceError, ErrorCode } from '../../../lib/utils/error.utils';
import { createWatchlistItemSchema, batchUpdateWatchlistItemsSchema } from '../../../lib/validation/watchlist.validation';
import { getAuthenticatedUser } from '../../../lib/utils/auth.utils';

export const prerender = false;

/**
 * GET /api/watchlist
 * List watchlist items
 */
export const GET: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
       return createErrorResponseObject(ErrorCode.MISSING_AUTH_HEADER, 'Missing or invalid authentication', 401);
    }
    const userId = user.id;

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
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(ErrorCode.MISSING_AUTH_HEADER, 'Missing or invalid authentication', 401);
    }
    const userId = user.id;

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
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(ErrorCode.MISSING_AUTH_HEADER, 'Missing or invalid authentication', 401);
    }
    const userId = user.id;

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

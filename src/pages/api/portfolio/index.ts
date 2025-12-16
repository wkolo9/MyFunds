import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import { createPortfolioService } from '@/lib/services/portfolio.service';
import { createErrorResponseObject, handleServiceError, ErrorCode } from '@/lib/utils/error.utils';
import { createAssetSchema, querySchema } from '@/lib/validation/portfolio.validation';
import { getAuthenticatedUser } from '@/lib/utils/auth.utils';

export const prerender = false;

/**
 * GET /api/portfolio
 * List portfolio assets
 */
export const GET: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(ErrorCode.MISSING_AUTH_HEADER, 'Missing or invalid Authorization header', 401);
    }
    const userId = user.id;

    const url = new URL(context.request.url);
    const queryParams = {
      currency: url.searchParams.get('currency') || undefined,
      sector_id: url.searchParams.get('sector_id') || undefined,
    };

    // Validate query params
    const parseResult = querySchema.safeParse(queryParams);
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
    const portfolioService = createPortfolioService(supabase);
    // @ts-ignore
    const result = await portfolioService.getAssets(userId, parseResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

/**
 * POST /api/portfolio
 * Create a new portfolio asset
 */
export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(ErrorCode.MISSING_AUTH_HEADER, 'Missing or invalid Authorization header', 401);
    }
    const userId = user.id;

    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Invalid JSON body', 400);
    }

    const parseResult = createAssetSchema.safeParse(body);
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
    const portfolioService = createPortfolioService(supabase);
    const newAsset = await portfolioService.createAsset(userId, parseResult.data);

    return new Response(JSON.stringify(newAsset), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

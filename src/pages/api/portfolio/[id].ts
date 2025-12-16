import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import { createPortfolioService } from '@/lib/services/portfolio.service';
import { createErrorResponseObject, handleServiceError, ErrorCode } from '@/lib/utils/error.utils';
import { updateAssetSchema } from '@/lib/validation/portfolio.validation';
import { getAuthenticatedUser } from '@/lib/utils/auth.utils';

export const prerender = false;

/**
 * PATCH /api/portfolio/[id]
 * Update a portfolio asset
 */
export const PATCH: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(ErrorCode.MISSING_AUTH_HEADER, 'Missing or invalid Authorization header', 401);
    }
    const userId = user.id;

    const { id } = context.params;
    if (!id) {
       return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Asset ID is required', 400);
    }

    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Invalid JSON body', 400);
    }

    const parseResult = updateAssetSchema.safeParse(body);
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
    const updatedAsset = await portfolioService.updateAsset(userId, id, parseResult.data);

    return new Response(JSON.stringify(updatedAsset), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

/**
 * DELETE /api/portfolio/[id]
 * Delete a portfolio asset
 */
export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(ErrorCode.MISSING_AUTH_HEADER, 'Missing or invalid Authorization header', 401);
    }
    const userId = user.id;

    const { id } = context.params;
    if (!id) {
       return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Asset ID is required', 400);
    }

    const supabase = context.locals.supabase as SupabaseClient<Database>;
    const portfolioService = createPortfolioService(supabase);
    await portfolioService.deleteAsset(userId, id);

    return new Response(null, {
      status: 204
    });
  } catch (error) {
    return handleServiceError(error);
  }
};


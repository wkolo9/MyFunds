import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import { createPortfolioService } from '@/lib/services/portfolio.service';
import { createErrorResponseObject, handleServiceError, ErrorCode } from '@/lib/utils/error.utils';
import { querySchema } from '@/lib/validation/portfolio.validation';
import { getAuthenticatedUser } from '@/lib/utils/auth.utils';

export const prerender = false;

/**
 * GET /api/portfolio/summary
 * Get portfolio summary
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
    };

    // Reuse querySchema but ignore sector_id since summary doesn't filter by sector usually
    const parseResult = querySchema.pick({ currency: true }).safeParse(queryParams);
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
    const result = await portfolioService.getSummary(userId, parseResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

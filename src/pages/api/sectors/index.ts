import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import { createSectorService } from '@/lib/services/sector.service';
import { createErrorResponseObject, ErrorCode, handleServiceError } from '@/lib/utils/error.utils';
import { createSectorSchema } from '@/lib/validation/sector.validation';
import { getAuthenticatedUser } from '@/lib/utils/auth.utils';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(
        ErrorCode.INVALID_TOKEN,
        'Missing or invalid authorization token',
        401
      );
    }

    const supabase = context.locals.supabase as SupabaseClient<Database>;
    const sectorService = createSectorService(supabase);
    
    const result = await sectorService.listSectors(user.id);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(
        ErrorCode.INVALID_TOKEN,
        'Missing or invalid authorization token',
        401
      );
    }

    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Invalid JSON body', 400);
    }

    const validation = createSectorSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return createErrorResponseObject(
        ErrorCode.VALIDATION_ERROR,
        firstError.message,
        400,
        firstError.path.join('.')
      );
    }

    const supabase = context.locals.supabase as SupabaseClient<Database>;
    const sectorService = createSectorService(supabase);

    const sector = await sectorService.createSector(user.id, validation.data);

    return new Response(JSON.stringify(sector), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};


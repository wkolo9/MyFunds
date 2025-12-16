import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import { createSectorService } from '@/lib/services/sector.service';
import { createErrorResponseObject, ErrorCode, handleServiceError } from '@/lib/utils/error.utils';
import { updateSectorSchema } from '@/lib/validation/sector.validation';
import { getAuthenticatedUser } from '@/lib/utils/auth.utils';

export const prerender = false;

export const PATCH: APIRoute = async (context) => {
  try {
    const { id } = context.params;
    if (!id) {
      return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Sector ID is required', 400);
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Invalid Sector ID format', 400);
    }

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

    const validation = updateSectorSchema.safeParse(body);
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

    const sector = await sectorService.updateSector(user.id, id, validation.data);

    return new Response(JSON.stringify(sector), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const { id } = context.params;
    if (!id) {
      return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Sector ID is required', 400);
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return createErrorResponseObject(ErrorCode.VALIDATION_ERROR, 'Invalid Sector ID format', 400);
    }

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

    await sectorService.deleteSector(user.id, id);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleServiceError(error);
  }
};


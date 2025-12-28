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
        ErrorCode.MISSING_AUTH_HEADER,
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
        ErrorCode.MISSING_AUTH_HEADER,
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

    try {
        const sector = await sectorService.createSector(user.id, validation.data);
        return new Response(JSON.stringify(sector), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        // Check for specific database errors that might indicate missing profile
        if (err.message && err.message.includes('foreign key constraint') && err.message.includes('sectors_user_id_fkey')) {
             console.error('Missing profile for user, attempting to create one...');
             // Try to ensure profile exists
             const { error: profileError } = await supabase.from('profiles').upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
             
             if (profileError) {
                 console.error('Failed to create profile:', profileError);
                 throw err;
             }
             
             // Retry sector creation
             const sector = await sectorService.createSector(user.id, validation.data);
             return new Response(JSON.stringify(sector), {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        throw err;
    }

  } catch (error) {
    console.error('Error in POST /api/sectors:', error);
    return handleServiceError(error);
  }
};

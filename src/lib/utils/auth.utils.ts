import type { APIContext } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

/**
 * Retrieves the authenticated user from the request context
 * Returns null if authentication fails
 */
export async function getAuthenticatedUser(context: APIContext) {
  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabase = context.locals.supabase as SupabaseClient<Database>;
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}


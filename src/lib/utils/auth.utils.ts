import type { APIContext } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

/**
 * Retrieves the authenticated user from the request context
 * Returns null if authentication fails
 */
export async function getAuthenticatedUser(context: APIContext) {
  // First, check if middleware has already populated the user (which it should have for SSR with cookies)
  // We use getUser() to ensure the token is still valid
  const supabase = context.locals.supabase as SupabaseClient<Database>;
  
  // Try to get user from the session associated with the request (cookies)
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    return user;
  }

  // Fallback: Check for Authorization header (Bearer token)
  const authHeader = context.request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user: userFromToken } } = await supabase.auth.getUser(token);
    
    if (userFromToken) {
      return userFromToken;
    }
  }

  return null;
}

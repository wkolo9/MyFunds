import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../db/database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be provided in environment variables');
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey);

export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
     return {};
  }
  
  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

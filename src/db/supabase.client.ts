import { createClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;

// Only create the client if we have the URL, otherwise we might be in a context where it's not needed (e.g. client side without public env vars)
// or we want to fail gracefully. However, for now we let it throw if used, but we try to avoid top-level throw if possible
// or just rely on the fact that if this file is imported for the client, it implies intent to use it.
// The issue was importing DEFAULT_USER_ID triggered this side effect.

export const supabaseClient = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '');

export * from '../config/constants';



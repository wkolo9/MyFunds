import { createClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Default user ID for development/testing purposes
// TODO: Remove in production and implement proper authentication
export const DEFAULT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';


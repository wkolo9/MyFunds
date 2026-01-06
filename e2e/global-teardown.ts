import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/db/database.types';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const E2E_USERNAME_ID = process.env.E2E_USERNAME_ID || 'test-user-id';

async function globalTeardown() {
  console.log('Starting global teardown...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing (SUPABASE_URL or SUPABASE_KEY). Skipping database cleanup.');
    return;
  }

  // Using public key as requested. 
  // Note: Deletion will only work if RLS policies allow it for this key/user, 
  // or if running in a local environment where checks might be permissive.
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const tables = [
    'portfolio_assets',
    'watchlist_items',
    'sectors',
    'profiles'
  ] as const;

  try {
    for (const table of tables) {
      // Delete rows for the specific test user
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', E2E_USERNAME_ID);

      if (error) {
        console.error(`Error cleaning up table ${table}:`, error.message);
      } else {
        console.log(`Cleaned up table ${table} for user ${E2E_USERNAME_ID}`);
      }
    }
  } catch (error) {
    console.error('Unexpected error during teardown:', error);
  }
}

export default globalTeardown;

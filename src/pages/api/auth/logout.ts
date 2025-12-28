import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  const { error } = await supabase.auth.signOut();

  if (error) {
    // Even if error, we redirect to login
    return redirect('/auth/login');
  }

  return redirect('/auth/login');
};

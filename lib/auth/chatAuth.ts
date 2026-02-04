// /lib/auth/chatAuth.ts

import { createClient } from '../supabase/server';
import { rateLimit } from '../utils/rateLimit';
import type { SupabaseClient } from '@supabase/supabase-js';

// Discriminated union for precise TypeScript types
export type ChatAuthResult =
  | {
      success: true;
      user: any;
      supabase: SupabaseClient;
    }
  | {
      success: false;
      error: string;
      supabase: SupabaseClient;
      rateLimited?: boolean;
      user?: undefined;
    };

/**
 * Auth check for chat routes
 * Checks: user exists, rate limit not exceeded
 * Returns supabase client to avoid recreating it
 */
export async function getChatAuth(): Promise<ChatAuthResult> {
  const supabase = await createClient();

  // 1. Check if user is authenticated
  const { data, error: authError } = await supabase.auth.getClaims();
  
  const user = data?.claims ? data.claims : null;

  if (authError || !user) {
    return { success: false, error: 'Not authenticated', supabase };
  }

  // 2. Check rate limit
  const { success: rateLimitSuccess } = await rateLimit.limit(user.sub);
  
  if (!rateLimitSuccess) {
    return { 
      success: false, 
      error: 'Too many requests',
      rateLimited: true,
      supabase 
    };
  }

  return { success: true, user, supabase };
}

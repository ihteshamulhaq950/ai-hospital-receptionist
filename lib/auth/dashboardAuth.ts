// lib/auth/dashboardAuth.ts
import { createClient } from '../supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Discriminated union for precise TypeScript types
export type DashboardAuthResult =
  | {
      success: true;
      user: any;
      profile: any;
      supabase: SupabaseClient;
    }
  | {
      success: false;
      error: string;
      supabase: SupabaseClient;
      user?: undefined;
      profile?: undefined;
    };

/**
 * Complete auth check for dashboard routes
 * Checks: user exists, not anonymous, has admin role
 * Returns supabase client to avoid recreating it
 */
export async function getDashboardAuth(): Promise<DashboardAuthResult> {
  const supabase = await createClient();

  // 1. Check if user is authenticated
  const { data, error: authError } = await supabase.auth.getClaims();
  
  const user = data?.claims ? data.claims : null;

  if (authError || !user) {
    return { success: false, error: 'Not authenticated', supabase };
  }

  // 2. Block anonymous users
  if (user.is_anonymous) {
    return { success: false, error: 'Anonymous users not allowed', supabase };
  }

  // 3. Verify admin role from profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Profile not found', supabase };
  }

  if (profile.role !== 'admin') {
    return { success: false, error: 'Admin access required', supabase };
  }

  return { success: true, user, profile, supabase };
}

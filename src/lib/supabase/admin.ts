import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialize admin client to avoid build-time errors
let adminInstance: SupabaseClient | null = null;

// Admin client for server-side operations that bypass RLS
// Only use this for webhook handlers and other trusted server operations
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminInstance) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase admin credentials are not set');
    }
    adminInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminInstance;
}

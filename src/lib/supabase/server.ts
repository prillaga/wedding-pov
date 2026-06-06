import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig, isSupabaseConfigured } from "./config";

/** Server-side Supabase client (service role). Never import from client components. */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  const { url, serviceRoleKey, anonKey } = getSupabaseConfig();
  const key = serviceRoleKey || anonKey;
  if (!key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

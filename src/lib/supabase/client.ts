import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig, isSupabaseConfigured } from "./config";

let browserClient: SupabaseClient | null = null;

/** Browser Supabase client (anon key). Returns null when env is not configured. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;

  const { url, anonKey } = getSupabaseConfig();
  browserClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return browserClient;
}

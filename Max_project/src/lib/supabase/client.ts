import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env";

let browserSupabaseClient: SupabaseClient | null | undefined;

export function getBrowserSupabaseClient() {
  if (browserSupabaseClient !== undefined) {
    return browserSupabaseClient;
  }

  if (!clientEnv.supabaseUrl || !clientEnv.supabaseAnonKey) {
    browserSupabaseClient = null;
    return browserSupabaseClient;
  }

  browserSupabaseClient = createClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return browserSupabaseClient;
}

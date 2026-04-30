import "server-only";

import { createClient } from "@supabase/supabase-js";
import { readiness, serverEnv } from "@/lib/env";

export function getServerSupabaseClient() {
  if (!readiness.supabase) {
    return null;
  }

  return createClient(serverEnv.supabaseUrl!, serverEnv.supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function getServiceSupabaseClient() {
  if (!readiness.supabaseAdmin) {
    return getServerSupabaseClient();
  }

  return createClient(serverEnv.supabaseUrl!, serverEnv.supabaseServiceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

import type { AuthMode } from "@/lib/auth/types";
import { readiness } from "@/lib/env";

export const authReadiness = {
  clerkConfigured: readiness.clerk,
  supabaseConfigured: readiness.supabase
};

export function getAuthMode(): AuthMode {
  if (authReadiness.supabaseConfigured) {
    return "supabase";
  }

  if (authReadiness.clerkConfigured) {
    return "clerk";
  }

  return "demo";
}

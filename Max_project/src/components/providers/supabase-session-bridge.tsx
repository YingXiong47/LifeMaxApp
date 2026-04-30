"use client";

import { useEffect } from "react";
import { syncSupabaseSession } from "@/lib/auth/client-session";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export function SupabaseSessionBridge() {
  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        void syncSupabaseSession(data.session);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        void syncSupabaseSession(null);
        return;
      }

      if (session) {
        void syncSupabaseSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

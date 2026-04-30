"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { syncSupabaseSession } from "@/lib/auth/client-session";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export function SupabaseAccountControls() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <>
      <button
        type="button"
        className="button-link"
        onClick={async () => {
          setPending(true);
          try {
            const supabase = getBrowserSupabaseClient();
            if (supabase) {
              await supabase.auth.signOut();
            }
            await syncSupabaseSession(null);
            router.push("/");
            router.refresh();
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Signing out..." : "Sign out"}
      </button>
    </>
  );
}

"use client";

import type { Session } from "@supabase/supabase-js";

type SyncResponse = {
  ok?: boolean;
  error?: string;
};

async function postJson(url: string, method: "POST" | "DELETE", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as SyncResponse | null;
    throw new Error(payload?.error || "Unable to sync the secure session.");
  }
}

export async function syncSupabaseSession(session: Session | null) {
  if (!session?.access_token) {
    await postJson("/api/auth/session", "DELETE");
    return;
  }

  await postJson("/api/auth/session", "POST", {
    accessToken: session.access_token,
    refreshToken: session.refresh_token || null
  });
}

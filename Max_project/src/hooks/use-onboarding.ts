"use client";

import { useMutation } from "@tanstack/react-query";
import type { AuthMode } from "@/lib/auth/types";
import type { OnboardingAnswers, OnboardingDraft } from "@/lib/schemas/onboarding";

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error || "Request failed.");
    }

    const payload = await response.text();
    throw new Error(payload || "Request failed.");
  }

  return response.json();
}

export function useSaveOnboardingDraft() {
  return useMutation({
    mutationFn: (payload: {
      ownerKey: string;
      authMode: AuthMode;
      lastStep?: string;
      answers: OnboardingDraft;
    }) => postJson<{ ok: true; persistence: unknown }>("/api/onboarding", payload)
  });
}

export function useGeneratePlan() {
  return useMutation({
    mutationFn: (payload: {
      ownerKey: string;
      authMode: AuthMode;
      answers: OnboardingAnswers;
      previousState?: unknown;
      planningMode?: "stable" | "ai";
    }) =>
      postJson<{
        result: any;
      }>("/api/plan/generate", payload)
  });
}

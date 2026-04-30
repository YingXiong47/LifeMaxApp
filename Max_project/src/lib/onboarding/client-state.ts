"use client";

import type { AuthMode } from "@/lib/auth/types";
import {
  getDefaultDemoState,
  loadDemoState,
  saveDemoState,
  type DemoState
} from "@/lib/demo/storage";
import { defaultOnboardingAnswers } from "@/lib/schemas/onboarding";

type LoadResolvedOnboardingStateInput = {
  authMode: AuthMode;
  userId: string | null;
  workspaceAnswers?: Record<string, unknown> | null;
  forceFresh?: boolean;
};

type RemoteDraftPayload = {
  ok: boolean;
  draft?: {
    answers?: Record<string, unknown>;
    lastStep?: string | null;
  } | null;
};

async function loadRemoteDraft(userId: string) {
  const response = await fetch(`/api/onboarding?ownerKey=${encodeURIComponent(userId)}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as RemoteDraftPayload;
  return payload.draft?.answers || null;
}

function mergeOnboardingAnswers(
  workspaceAnswers?: Record<string, unknown> | null,
  remoteDraft?: Record<string, unknown> | null,
  localDraft?: Record<string, unknown> | null
) {
  return {
    ...defaultOnboardingAnswers,
    ...(workspaceAnswers || {}),
    ...(remoteDraft || {}),
    ...(localDraft || {})
  };
}

export async function loadResolvedOnboardingState({
  authMode,
  userId,
  workspaceAnswers,
  forceFresh = false
}: LoadResolvedOnboardingStateInput): Promise<DemoState> {
  const localState = loadDemoState();
  const localAnswers = authMode === "demo" ? localState.onboardingAnswers || null : null;

  if (forceFresh) {
    const freshState = {
      ...getDefaultDemoState(),
      ...localState,
      onboardingAnswers: { ...defaultOnboardingAnswers }
    };

    saveDemoState(freshState);
    return freshState;
  }

  const remoteDraft =
    authMode !== "demo" && userId ? await loadRemoteDraft(userId) : null;
  const mergedState = {
    ...getDefaultDemoState(),
    ...localState,
    onboardingAnswers: mergeOnboardingAnswers(
      workspaceAnswers || null,
      remoteDraft,
      localAnswers
    )
  };

  saveDemoState(mergedState);
  return mergedState;
}

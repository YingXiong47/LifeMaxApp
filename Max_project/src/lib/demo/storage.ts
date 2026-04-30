"use client";

import {
  createDefaultWorkspaceState,
  WorkspaceAppearance,
  WorkspaceCheckIn,
  WorkspaceCheckInReflection,
  WorkspaceCheckInSummary,
  WorkspaceDomainUpdate,
  WorkspacePreferences,
  WorkspaceSession,
  WorkspaceState,
  WorkspaceUser
} from "@/lib/workspace/state";

export type DemoUser = WorkspaceUser;
export type DemoSession = WorkspaceSession;
export type DemoHistoryItem = WorkspaceState["history"][number];
export type DemoAppearance = WorkspaceAppearance;
export type DemoCheckIn = WorkspaceCheckIn;
export type DemoCheckInReflection = WorkspaceCheckInReflection;
export type DemoCheckInSummary = WorkspaceCheckInSummary;
export type DemoDomainUpdate = WorkspaceDomainUpdate;
export type DemoPreferences = WorkspacePreferences;
export type DemoState = WorkspaceState;

const STORAGE_KEY = "lifemax-os-v2";
const WORKSPACE_FALLBACK_KEY = "lifemax-os-workspace-fallback";
const defaultState = createDefaultWorkspaceState();

export function getDefaultDemoState(): DemoState {
  return {
    browserId: defaultState.browserId,
    onboardingAnswers: { ...defaultState.onboardingAnswers },
    buildPackage: defaultState.buildPackage,
    latestRun: defaultState.latestRun,
    history: [...defaultState.history],
    contactMessages: [...defaultState.contactMessages],
    checkIns: [...defaultState.checkIns],
    domainUpdates: [...defaultState.domainUpdates],
    preferences: { ...defaultState.preferences },
    session: {
      authenticated: defaultState.session.authenticated,
      user: defaultState.session.user
    }
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function createBrowserId() {
  return `browser-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadDemoState(): DemoState {
  if (!canUseStorage()) {
    return getDefaultDemoState();
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initialState = {
      ...getDefaultDemoState(),
      browserId: createBrowserId()
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  }
  try {
    const parsed = {
      ...getDefaultDemoState(),
      ...JSON.parse(raw)
    };

    if (!parsed.preferences) {
      parsed.preferences = { ...defaultState.preferences };
    }

    if (!parsed.preferences.appearanceSelection) {
      parsed.preferences.appearanceSelection = "default";
      if (parsed.preferences.appearance === "sunrise") {
        parsed.preferences.appearance = "midnight";
      }
    }

    if (!parsed.preferences.planningMode) {
      parsed.preferences.planningMode = "stable";
    }

    if (!parsed.browserId) {
      parsed.browserId = createBrowserId();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch {
    return getDefaultDemoState();
  }
}

export function saveDemoState(nextState: DemoState) {
  if (!canUseStorage()) {
    return;
  }
  const payload = JSON.stringify({
    ...getDefaultDemoState(),
    ...nextState,
    browserId: nextState.browserId || createBrowserId()
  });
  window.localStorage.setItem(
    STORAGE_KEY,
    payload
  );
  window.dispatchEvent(new CustomEvent("lifemax-demo-state"));
}

export function resetDemoState() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("lifemax-demo-state"));
}

export function loadWorkspaceFallbackState(): DemoState | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(WORKSPACE_FALLBACK_KEY);
  if (!raw) {
    return null;
  }

  try {
    return {
      ...getDefaultDemoState(),
      ...JSON.parse(raw)
    };
  } catch {
    return null;
  }
}

export function saveWorkspaceFallbackState(nextState: DemoState) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    WORKSPACE_FALLBACK_KEY,
    JSON.stringify({
      ...getDefaultDemoState(),
      ...nextState,
      browserId: nextState.browserId || createBrowserId()
    })
  );
}

export function clearWorkspaceFallbackState() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(WORKSPACE_FALLBACK_KEY);
}

export function createDemoSession(name: string, email: string): DemoSession {
  return {
    authenticated: true,
    user: {
      id: `demo-${Date.now()}`,
      name,
      email,
      mode: "demo"
    }
  };
}

export function getOwnerKey(state: DemoState) {
  return state.session.user?.id || state.browserId || "browser-anonymous";
}

export function getPersistenceAuthMode(state: DemoState): "demo" | "clerk" | "supabase" {
  if (state.session.user?.mode === "clerk" || state.session.user?.mode === "supabase") {
    return state.session.user.mode;
  }

  return "demo";
}

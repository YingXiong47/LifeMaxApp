import type { AuthMode } from "@/lib/auth/types";

export type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  mode: AuthMode;
};

export type WorkspaceSession = {
  authenticated: boolean;
  user: WorkspaceUser | null;
};

export type WorkspaceHistoryItem = {
  id: string;
  createdAt: string;
  workflowStatus: string;
  confidence: number;
  title: string;
};

export type WorkspaceAppearance = "sunrise" | "ember" | "midnight";
export type WorkspacePlanningMode = "stable" | "ai";

export type WorkspaceCheckInReflection = {
  category: string;
  answers: Record<string, string>;
  blocker?: string;
  completionRating?: string;
};

export type WorkspaceCheckInSummary = {
  completedActions: string[];
  skippedAreas: string[];
  blockers: string[];
  nextRecommendedActions: string[];
  impactedDomains: string[];
};

export type WorkspaceCheckIn = {
  id: string;
  createdAt: string;
  kind?: "daily" | "weekly";
  energy: string;
  adherence: string;
  clarity: string;
  focus: string;
  focusAreas?: string[];
  win: string;
  blocker: string;
  note: string;
  reflections?: WorkspaceCheckInReflection[];
  summary?: WorkspaceCheckInSummary;
};

export type WorkspaceDomainUpdate = {
  id: string;
  domain: string;
  createdAt: string;
  kind: "proof" | "standard" | "review";
  note: string;
};

export type WorkspacePreferences = {
  appearance: WorkspaceAppearance;
  appearanceSelection?: "default" | "user";
  planningMode?: WorkspacePlanningMode;
};

export type WorkspaceState = {
  browserId: string;
  onboardingAnswers: Record<string, unknown>;
  buildPackage: any | null;
  latestRun: any | null;
  history: WorkspaceHistoryItem[];
  contactMessages: Array<Record<string, string>>;
  checkIns: WorkspaceCheckIn[];
  domainUpdates: WorkspaceDomainUpdate[];
  preferences: WorkspacePreferences;
  session: WorkspaceSession;
};

export type WorkspacePersistenceMode = "supabase" | "demo-local" | "local-fallback";
export type WorkspaceConnectionStatus = "loading" | "connected" | "demo" | "degraded" | "error";

export type WorkspaceDiagnostics = {
  userId: string | null;
  mode: WorkspacePersistenceMode;
  connectionStatus: WorkspaceConnectionStatus;
  tablesUsed: string[];
  lastSuccessfulRead: string | null;
  lastSuccessfulWrite: string | null;
  lastReadSource: string | null;
  lastWriteSource: string | null;
  fallbackLocalStorage: boolean;
  recentSaveErrors: string[];
};

export function createDefaultWorkspaceState(): WorkspaceState {
  return {
    browserId: "",
    onboardingAnswers: {},
    buildPackage: null,
    latestRun: null,
    history: [],
    contactMessages: [],
    checkIns: [],
    domainUpdates: [],
    preferences: {
      appearance: "midnight",
      appearanceSelection: "default",
      planningMode: "stable"
    },
    session: {
      authenticated: false,
      user: null
    }
  };
}

export function createDefaultWorkspaceDiagnostics(userId: string | null): WorkspaceDiagnostics {
  return {
    userId,
    mode: "demo-local",
    connectionStatus: "loading",
    tablesUsed: [],
    lastSuccessfulRead: null,
    lastSuccessfulWrite: null,
    lastReadSource: null,
    lastWriteSource: null,
    fallbackLocalStorage: false,
    recentSaveErrors: []
  };
}

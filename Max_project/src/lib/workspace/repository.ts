import "server-only";

import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type { AuthMode, AuthUser } from "@/lib/auth/types";
import {
  createDefaultWorkspaceDiagnostics,
  createDefaultWorkspaceState,
  type WorkspaceAppearance,
  type WorkspaceCheckIn,
  type WorkspaceDiagnostics,
  type WorkspaceDomainUpdate,
  type WorkspaceState
} from "@/lib/workspace/state";
import type { OnboardingAnswers } from "@/lib/schemas/onboarding";
import { readiness } from "@/lib/env";

const WORKSPACE_TABLES = [
  "profiles",
  "assessments",
  "domains",
  "domain_progress_logs",
  "weekly_plans",
  "agent_runs",
  "reflections",
  "user_settings"
] as const;

type WorkspacePersistenceResponse = {
  state: WorkspaceState;
  diagnostics: WorkspaceDiagnostics;
};

type PersistWorkspaceInput = {
  userId: string;
  authMode: AuthMode;
  user: AuthUser | null;
  state: WorkspaceState;
};

type PersistGeneratedArtifactsInput = {
  userId: string;
  authMode: AuthMode;
  user: AuthUser | null;
  ownerKey: string;
  answers: OnboardingAnswers;
  result: any;
};

type DeleteWorkspaceDataInput = {
  userId: string;
  ownerKey: string;
  includeSettings: boolean;
};

function isDev() {
  return process.env.NODE_ENV !== "production";
}

function debugLog(event: string, payload: Record<string, unknown>) {
  if (!isDev()) {
    return;
  }

  console.info(`[workspace] ${event}`, payload);
}

function toWorkspaceError(message: string) {
  if (message.includes("agent_runs_assessment_id_fkey") || message.includes("violates foreign key constraint")) {
    return new Error(
      "The workspace plan finished, but protected storage could not attach the run to its assessment record. The app can continue with local recovery data while the save path retries."
    );
  }

  if (
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("PGRST205")
  ) {
    return new Error(
      "Supabase workspace tables are missing. Apply the 20260428_workspace_state.sql migration before using protected app storage."
    );
  }

  return new Error(message);
}

function buildDiagnostics(
  userId: string,
  overrides: Partial<WorkspaceDiagnostics>
): WorkspaceDiagnostics {
  return {
    ...createDefaultWorkspaceDiagnostics(userId),
    mode: "supabase",
    connectionStatus: "connected",
    tablesUsed: [...WORKSPACE_TABLES],
    ...overrides
  };
}

function normalizeAppearance(value: unknown): WorkspaceAppearance {
  return value === "sunrise" || value === "ember" || value === "midnight" ? value : "midnight";
}

function mapHistoryItem(row: any) {
  return {
    id: row.id,
    createdAt: row.created_at,
    workflowStatus: row.workflow_status || "Complete",
    confidence: Number(row.confidence || 0),
    title: row.title || row.result_payload?.buildPackage?.profile?.primaryGoal || "LifeMax OS run"
  };
}

function mapReflection(row: any): WorkspaceCheckIn {
  const metrics = row.metrics || {};
  return {
    id: row.id,
    createdAt: row.created_at,
    kind: row.kind || "weekly",
    energy: String(metrics.energy ?? "3"),
    adherence: String(metrics.adherence ?? "3"),
    clarity: String(metrics.clarity ?? "3"),
    focus: String(metrics.focus ?? row.focus_areas?.join(", ") ?? ""),
    focusAreas: Array.isArray(row.focus_areas) ? row.focus_areas : [],
    win: String(metrics.win ?? ""),
    blocker: String(metrics.blocker ?? ""),
    note: String(metrics.note ?? ""),
    reflections: Array.isArray(row.reflections_payload) ? row.reflections_payload : [],
    summary:
      row.summary_payload && typeof row.summary_payload === "object"
        ? row.summary_payload
        : undefined
  };
}

function mapDomainUpdate(row: any): WorkspaceDomainUpdate {
  return {
    id: row.id,
    domain: row.domain_key,
    createdAt: row.created_at,
    kind: row.source_kind || "proof",
    note: row.note || ""
  };
}

function makeSession(userId: string, authMode: AuthMode, user: AuthUser | null) {
  return {
    authenticated: true,
    user: user
      ? {
          id: userId,
          name: user.name,
          email: user.email,
          mode: authMode
        }
      : {
          id: userId,
          name: "LifeMax member",
          email: "No verified email",
          mode: authMode
        }
  };
}

function buildStateFromRows({
  userId,
  authMode,
  user,
  profile,
  settings,
  assessments,
  agentRuns,
  weeklyPlans,
  domains,
  reflections,
  domainProgressLogs
}: {
  userId: string;
  authMode: AuthMode;
  user: AuthUser | null;
  profile: any | null;
  settings: any | null;
  assessments: any[];
  agentRuns: any[];
  weeklyPlans: any[];
  domains: any[];
  reflections: any[];
  domainProgressLogs: any[];
}): WorkspaceState {
  const state = createDefaultWorkspaceState();
  const latestAssessment = assessments[0] || null;
  const latestWeeklyPlan = weeklyPlans[0] || null;
  const latestRun = agentRuns[0]?.result_payload || latestAssessment?.result_payload || null;
  const latestBuildPackage =
    latestRun?.buildPackage ||
    latestAssessment?.result_payload?.buildPackage ||
    (latestWeeklyPlan
      ? {
          plans: latestWeeklyPlan.plan_payload || domains.map((item: any) => item.plan_payload),
          tracker: latestWeeklyPlan.tracker_payload || {},
          executionSystem: latestWeeklyPlan.execution_payload || {}
        }
      : null);

  state.browserId = `user-${userId}`;
  state.onboardingAnswers =
    (profile?.onboarding_answers as Record<string, unknown>) ||
    (latestAssessment?.request_payload as Record<string, unknown>) ||
    {};
  state.buildPackage = latestBuildPackage;
  state.latestRun = latestRun;
  state.history = agentRuns.map(mapHistoryItem);
  state.contactMessages = [];
  state.checkIns = reflections.map(mapReflection);
  state.domainUpdates = domainProgressLogs.map(mapDomainUpdate);
  state.preferences = {
    appearance: normalizeAppearance(settings?.appearance),
    appearanceSelection:
      settings?.settings_payload?.appearanceSelection === "default" ? "default" : "user",
    planningMode: settings?.settings_payload?.planningMode === "ai" ? "ai" : "stable"
  };
  state.session = makeSession(userId, authMode, user);

  return state;
}

function getCurrentRunId(state: WorkspaceState) {
  return (
    state.latestRun?.workflowMeta?.runId ||
    state.latestRun?.runId ||
    state.latestRun?.id ||
    state.history[0]?.id ||
    `run-${Date.now()}`
  );
}

function getCurrentAssessmentId(state: WorkspaceState) {
  return `assessment-${getCurrentRunId(state)}`;
}

function getCurrentPlanId(state: WorkspaceState) {
  return `weekly-${getCurrentRunId(state)}`;
}

function normalizeDeleteError(message: string) {
  if (
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("PGRST205")
  ) {
    return new Error(
      "Supabase workspace tables are missing. Apply the 20260428_workspace_state.sql migration before using protected app storage."
    );
  }

  return new Error(message);
}

function deriveHistoryFromResult(result: any) {
  const buildPackage = result?.buildPackage;
  const createdAt = result?.workflowMeta?.generatedAt || new Date().toISOString();
  const runId = result?.workflowMeta?.runId || `run-${Date.now()}`;

  return {
    id: runId,
    createdAt,
    workflowStatus: result?.workflowStatus || buildPackage?.workflowStatus || "Complete",
    confidence: Number(buildPackage?.buildSummary?.finalConfidenceScore || result?.confidence || 0),
    title: buildPackage?.profile?.primaryGoal || "LifeMax OS plan"
  };
}

export async function loadWorkspaceSnapshot({
  userId,
  authMode,
  user
}: {
  userId: string;
  authMode: AuthMode;
  user: AuthUser | null;
}): Promise<WorkspacePersistenceResponse> {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  debugLog("read:start", { userId, tables: WORKSPACE_TABLES });

  const [
    profileResult,
    settingsResult,
    assessmentResult,
    agentRunsResult,
    weeklyPlansResult,
    domainsResult,
    reflectionsResult,
    domainProgressResult
  ] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("assessments").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("agent_runs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(24),
      supabase.from("weekly_plans").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(8),
      supabase.from("domains").select("*").eq("user_id", userId).order("domain_key", { ascending: true }),
      supabase.from("reflections").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(60),
      supabase
        .from("domain_progress_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200)
    ]);

  const errors = [
    profileResult.error,
    settingsResult.error,
    assessmentResult.error,
    agentRunsResult.error,
    weeklyPlansResult.error,
    domainsResult.error,
    reflectionsResult.error,
    domainProgressResult.error
  ].filter(Boolean);

  if (errors.length) {
    debugLog("read:error", { userId, errors: errors.map((item: any) => item.message) });
    throw toWorkspaceError(errors[0]?.message || "Unable to load workspace.");
  }

  const state = buildStateFromRows({
    userId,
    authMode,
    user,
    profile: profileResult.data,
    settings: settingsResult.data,
    assessments: assessmentResult.data || [],
    agentRuns: agentRunsResult.data || [],
    weeklyPlans: weeklyPlansResult.data || [],
    domains: domainsResult.data || [],
    reflections: reflectionsResult.data || [],
    domainProgressLogs: domainProgressResult.data || []
  });

  const timestamp = new Date().toISOString();
  debugLog("read:success", { userId, lastSuccessfulRead: timestamp });

  return {
    state,
    diagnostics: buildDiagnostics(userId, {
      lastSuccessfulRead: timestamp,
      lastReadSource: "supabase",
      fallbackLocalStorage: false
    })
  };
}

export async function persistWorkspaceSnapshot({
  userId,
  authMode,
  user,
  state
}: PersistWorkspaceInput): Promise<WorkspacePersistenceResponse> {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const now = new Date().toISOString();
  const currentRunId = getCurrentRunId(state);
  const currentAssessmentId = state.latestRun ? getCurrentAssessmentId(state) : null;
  const currentPlanId = getCurrentPlanId(state);

  debugLog("write:start", { userId, tables: WORKSPACE_TABLES, runId: currentRunId });

  const profilePayload = {
    user_id: userId,
    email: user?.email || state.session.user?.email || null,
    full_name: user?.name || state.session.user?.name || null,
    onboarding_answers: state.onboardingAnswers,
    profile_payload: state.buildPackage?.profile || null,
    updated_at: now
  };

  const settingsPayload = {
    user_id: userId,
    appearance: normalizeAppearance(state.preferences.appearance),
    settings_payload: state.preferences,
    updated_at: now
  };

  const assessmentPayload = state.latestRun
    ? {
        id: currentAssessmentId!,
        user_id: userId,
        status: state.latestRun.workflowStatus || "Complete",
        request_payload: state.onboardingAnswers,
        result_payload: state.latestRun,
        diagnostic_report: state.buildPackage?.diagnosticReport || null,
        updated_at: now
      }
    : null;

  const agentRunPayload = state.latestRun
    ? {
        id: currentRunId,
        user_id: userId,
        assessment_id: currentAssessmentId,
        workflow_status: state.latestRun.workflowStatus || "Complete",
        confidence: Number(state.buildPackage?.buildSummary?.finalConfidenceScore || 0),
        backend: state.latestRun.workflowMeta?.backend || null,
        title:
          state.history[0]?.title ||
          state.buildPackage?.profile?.primaryGoal ||
          "LifeMax OS run",
        result_payload: state.latestRun,
        workflow_meta: state.latestRun.workflowMeta || state.buildPackage?.workflowMeta || null,
        updated_at: now
      }
    : null;

  const historyPayload = state.history
    .slice(0, 24)
    .filter((item) => item.id !== currentRunId)
    .map((item) => ({
      id: item.id,
      user_id: userId,
      assessment_id: null,
      workflow_status: item.workflowStatus,
      confidence: Number(item.confidence || 0),
      backend: null,
      title: item.title,
      result_payload: null,
      workflow_meta: null,
      created_at: item.createdAt,
      updated_at: now
    }));

  const weeklyPlanPayload = state.buildPackage
      ? {
        id: currentPlanId,
        user_id: userId,
        assessment_id: currentAssessmentId,
        label: state.buildPackage.profile?.primaryGoal || "Current weekly plan",
        status: state.latestRun?.workflowStatus || "Complete",
        plan_payload: state.buildPackage.plans || [],
        tracker_payload: state.buildPackage.tracker || {},
        execution_payload: state.buildPackage.executionSystem || {},
        updated_at: now
      }
    : null;

  const domainPayload = Array.isArray(state.buildPackage?.plans)
    ? state.buildPackage.plans.map((plan: any) => {
        const progress = Array.isArray(state.buildPackage?.tracker?.domainProgress)
          ? state.buildPackage.tracker.domainProgress.find((item: any) => item.domain === plan.domain)
          : null;

        return {
          id: `${userId}-${plan.domain}`,
          user_id: userId,
          assessment_id: currentAssessmentId,
          domain_key: plan.domain,
          title: plan.targetOutcome || plan.domain,
          progress_score: Number(progress?.score || 0),
          status: progress?.score >= 1 ? "completed" : progress?.score > 0 ? "active" : "not_started",
          summary: plan.rootIssue || plan.targetOutcome || "",
          plan_payload: plan,
          updated_at: now
        };
      })
    : [];

  const reflectionPayload = state.checkIns.slice(0, 80).map((item) => ({
    id: item.id,
    user_id: userId,
    kind: item.kind || "weekly",
    focus_areas: item.focusAreas || [],
    reflections_payload: item.reflections || [],
    summary_payload: item.summary || null,
    metrics: {
      energy: item.energy,
      adherence: item.adherence,
      clarity: item.clarity,
      focus: item.focus,
      win: item.win,
      blocker: item.blocker,
      note: item.note
    },
    domain_changes_payload: item.summary?.impactedDomains || [],
    created_at: item.createdAt,
    updated_at: now
  }));

  const domainProgressPayload = state.domainUpdates.slice(0, 240).map((item) => ({
    id: item.id,
    user_id: userId,
    domain_key: item.domain,
    source_kind: item.kind,
    note: item.note,
    progress_delta: item.kind === "proof" ? 0.08 : item.kind === "standard" ? 0.05 : 0.02,
    payload: item,
    created_at: item.createdAt,
    updated_at: now
  }));

  const independentWrites = await Promise.all([
    supabase.from("profiles").upsert(profilePayload, { onConflict: "user_id" }),
    supabase.from("user_settings").upsert(settingsPayload, { onConflict: "user_id" }),
    reflectionPayload.length
      ? supabase.from("reflections").upsert(reflectionPayload, { onConflict: "id" })
      : Promise.resolve({ error: null }),
    domainProgressPayload.length
      ? supabase.from("domain_progress_logs").upsert(domainProgressPayload, { onConflict: "id" })
      : Promise.resolve({ error: null })
  ]);

  const independentErrors = independentWrites.map((result: any) => result.error).filter(Boolean);
  if (independentErrors.length) {
    debugLog("write:error", { userId, errors: independentErrors.map((item: any) => item.message) });
    throw toWorkspaceError(independentErrors[0]?.message || "Unable to save workspace.");
  }

  if (assessmentPayload) {
    const assessmentResult = await supabase.from("assessments").upsert(assessmentPayload, { onConflict: "id" });
    if (assessmentResult.error) {
      debugLog("write:error", { userId, errors: [assessmentResult.error.message] });
      throw toWorkspaceError(assessmentResult.error.message || "Unable to save assessment.");
    }
  }

  const dependentWrites = await Promise.all([
    agentRunPayload ? supabase.from("agent_runs").upsert(agentRunPayload, { onConflict: "id" }) : Promise.resolve({ error: null }),
    historyPayload.length ? supabase.from("agent_runs").upsert(historyPayload, { onConflict: "id" }) : Promise.resolve({ error: null }),
    weeklyPlanPayload ? supabase.from("weekly_plans").upsert(weeklyPlanPayload, { onConflict: "id" }) : Promise.resolve({ error: null }),
    domainPayload.length ? supabase.from("domains").upsert(domainPayload, { onConflict: "id" }) : Promise.resolve({ error: null })
  ]);

  const dependentErrors = dependentWrites.map((result: any) => result.error).filter(Boolean);
  if (dependentErrors.length) {
    debugLog("write:error", { userId, errors: dependentErrors.map((item: any) => item.message) });
    throw toWorkspaceError(dependentErrors[0]?.message || "Unable to save workspace.");
  }

  const timestamp = new Date().toISOString();
  debugLog("write:success", { userId, lastSuccessfulWrite: timestamp });

  return {
    state: {
      ...state,
      session: makeSession(userId, authMode, user)
    },
    diagnostics: buildDiagnostics(userId, {
      lastSuccessfulWrite: timestamp,
      lastWriteSource: "supabase",
      fallbackLocalStorage: false
    })
  };
}

export async function persistGeneratedWorkspaceArtifacts({
  userId,
  authMode,
  user,
  ownerKey,
  answers,
  result
}: PersistGeneratedArtifactsInput): Promise<void> {
  const state = createDefaultWorkspaceState();
  const historyItem = deriveHistoryFromResult(result);

  state.browserId = ownerKey || `user-${userId}`;
  state.onboardingAnswers = answers;
  state.buildPackage = result?.buildPackage || null;
  state.latestRun = result;
  state.history = [historyItem];
  state.preferences.appearance = "midnight";
  state.preferences.appearanceSelection = "default";
  state.preferences.planningMode = "stable";
  state.session = makeSession(userId, authMode, user);

  await persistWorkspaceSnapshot({
    userId,
    authMode,
    user,
    state
  });
}

export async function deleteWorkspaceData({
  userId,
  ownerKey,
  includeSettings
}: DeleteWorkspaceDataInput) {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  debugLog("delete:start", {
    userId,
    ownerKey,
    includeSettings
  });

  const deletionSteps: Array<{ label: string; task: PromiseLike<{ error: { message?: string | null } | null }> }> = [
    {
      label: "reflections",
      task: supabase.from("reflections").delete().eq("user_id", userId)
    },
    {
      label: "domain_progress_logs",
      task: supabase.from("domain_progress_logs").delete().eq("user_id", userId)
    },
    {
      label: "domains",
      task: supabase.from("domains").delete().eq("user_id", userId)
    },
    {
      label: "weekly_plans",
      task: supabase.from("weekly_plans").delete().eq("user_id", userId)
    },
    {
      label: "agent_runs",
      task: supabase.from("agent_runs").delete().eq("user_id", userId)
    },
    {
      label: "assessments",
      task: supabase.from("assessments").delete().eq("user_id", userId)
    },
    {
      label: "profiles",
      task: supabase.from("profiles").delete().eq("user_id", userId)
    },
    ...(includeSettings
      ? [
          {
            label: "user_settings",
            task: supabase.from("user_settings").delete().eq("user_id", userId)
          }
        ]
      : []),
    {
      label: "onboarding_submissions",
      task: supabase.from("onboarding_submissions").delete().eq("owner_key", ownerKey)
    },
    {
      label: "plan_runs",
      task: supabase.from("plan_runs").delete().eq("owner_key", ownerKey)
    }
  ];

  const deletedTables: string[] = [];

  for (const step of deletionSteps) {
    const result = await step.task;
    if (result.error) {
      debugLog("delete:error", {
        userId,
        table: step.label,
        error: result.error.message || "Unknown delete error."
      });
      throw normalizeDeleteError(result.error.message || `Unable to delete ${step.label}.`);
    }
    deletedTables.push(step.label);
  }

  debugLog("delete:success", {
    userId,
    deletedTables
  });

  return {
    deletedTables
  };
}

export async function deleteSupabaseAccount({
  userId,
  ownerKey
}: {
  userId: string;
  ownerKey: string;
}) {
  if (!readiness.supabaseAdmin) {
    throw new Error("Supabase admin credentials are required before the account can be deleted.");
  }

  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const deletion = await deleteWorkspaceData({
    userId,
    ownerKey,
    includeSettings: true
  });

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    debugLog("delete:error", {
      userId,
      table: "auth.users",
      error: error.message
    });
    throw new Error(error.message || "Unable to delete the account.");
  }

  debugLog("delete:success", {
    userId,
    deletedTables: [...deletion.deletedTables, "auth.users"]
  });

  return {
    deletedTables: [...deletion.deletedTables, "auth.users"]
  };
}

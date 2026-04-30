import "server-only";

import { randomUUID } from "node:crypto";
import type { AuthMode } from "@/lib/auth/types";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type { OnboardingAnswers } from "@/lib/schemas/onboarding";

type CreatePlanRunInput = {
  ownerKey: string;
  authMode: AuthMode;
  request: OnboardingAnswers;
  initialResult?: unknown;
};

type PersistDraftInput = {
  ownerKey: string;
  authMode: AuthMode;
  answers: Partial<OnboardingAnswers>;
  lastStep?: string | null;
};

export type OnboardingDraftRecord = {
  ownerKey: string;
  authMode: AuthMode;
  answers: Partial<OnboardingAnswers>;
  lastStep: string | null;
  updatedAt: string;
};

type PersistPlanRunInput = {
  runId?: string;
  ownerKey: string;
  authMode: AuthMode;
  request: OnboardingAnswers;
  result: unknown;
};

export type PlanRunRecord = {
  id: string;
  ownerKey: string;
  authMode: AuthMode;
  request: OnboardingAnswers;
  result: unknown;
  createdAt: string;
};

type PersistAgentStepInput = {
  runId: string;
  agentName: string;
  stepKey: string;
  status: "ready" | "missing_requirements" | "failed";
  confidence: number;
  payload: unknown;
};

let missingSchemaWarningShown = false;

function isSchemaCacheMiss(error: { code?: string | null } | null | undefined) {
  return error?.code === "PGRST205";
}

function warnMissingSchema(tableName: string) {
  if (missingSchemaWarningShown) {
    return;
  }

  missingSchemaWarningShown = true;
  console.warn(
    `Supabase schema is missing required LifeMax tables (${tableName}). Falling back to local-only persistence until migrations are applied.`
  );
}

export async function persistOnboardingDraft(input: PersistDraftInput) {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    return { persisted: false, backend: "local" as const };
  }

  const existingDraft = await supabase
    .from("onboarding_submissions")
    .select("answers")
    .eq("owner_key", input.ownerKey)
    .maybeSingle();

  if (existingDraft.error) {
    if (isSchemaCacheMiss(existingDraft.error)) {
      warnMissingSchema("onboarding_submissions");
      return { persisted: false, backend: "local" as const };
    }

    console.error("Failed to load existing onboarding draft", existingDraft.error);
    return { persisted: false, backend: "supabase" as const, error: existingDraft.error.message };
  }

  const mergedAnswers = {
    ...((existingDraft.data?.answers as Partial<OnboardingAnswers> | null) || {}),
    ...input.answers
  };

  const { error } = await supabase.from("onboarding_submissions").upsert(
    {
      owner_key: input.ownerKey,
      auth_mode: input.authMode,
      answers: mergedAnswers,
      last_step: input.lastStep ?? null,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "owner_key"
    }
  );

  if (error) {
    if (isSchemaCacheMiss(error)) {
      warnMissingSchema("onboarding_submissions");
      return { persisted: false, backend: "local" as const };
    }

    console.error("Failed to persist onboarding draft", error);
    return { persisted: false, backend: "supabase" as const, error: error.message };
  }

  return { persisted: true, backend: "supabase" as const };
}

export async function getOnboardingDraft(ownerKey: string): Promise<OnboardingDraftRecord | null> {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("onboarding_submissions")
    .select("owner_key, auth_mode, answers, last_step, updated_at")
    .eq("owner_key", ownerKey)
    .maybeSingle();

  if (error) {
    if (isSchemaCacheMiss(error)) {
      warnMissingSchema("onboarding_submissions");
      return null;
    }

    console.error("Failed to load onboarding draft", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    ownerKey: data.owner_key,
    authMode: data.auth_mode,
    answers: (data.answers as Partial<OnboardingAnswers>) || {},
    lastStep: data.last_step,
    updatedAt: data.updated_at
  };
}

export async function createPlanRun(input: CreatePlanRunInput) {
  const supabase = getServiceSupabaseClient();
  const localRunId = randomUUID();

  if (!supabase) {
    return {
      persisted: false,
      backend: "local" as const,
      runId: localRunId
    };
  }

  const initialResult = input.initialResult ?? {
    workflowStatus: "Running",
    buildPackage: null
  };

  const { data, error } = await supabase
    .from("plan_runs")
    .insert({
      owner_key: input.ownerKey,
      auth_mode: input.authMode,
      request_payload: input.request,
      result_payload: initialResult,
      created_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    if (isSchemaCacheMiss(error)) {
      warnMissingSchema("plan_runs");
      return {
        persisted: false,
        backend: "local" as const,
        runId: localRunId
      };
    }

    console.error("Failed to create plan run", error);
    return {
      persisted: false,
      backend: "supabase" as const,
      runId: localRunId,
      error: error?.message || "Unable to create plan run."
    };
  }

  return {
    persisted: true,
    backend: "supabase" as const,
    runId: data.id
  };
}

export async function updatePlanRunResult(runId: string, result: unknown) {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    return { persisted: false, backend: "local" as const, runId };
  }

  const { error } = await supabase
    .from("plan_runs")
    .update({
      result_payload: result
    })
    .eq("id", runId);

  if (error) {
    if (isSchemaCacheMiss(error)) {
      warnMissingSchema("plan_runs");
      return { persisted: false, backend: "local" as const, runId };
    }

    console.error("Failed to update plan run result", error);
    return { persisted: false, backend: "supabase" as const, runId, error: error.message };
  }

  return { persisted: true, backend: "supabase" as const, runId };
}

export async function persistPlanRun(input: PersistPlanRunInput) {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    return { persisted: false, backend: "local" as const };
  }

  const payload = {
    owner_key: input.ownerKey,
    auth_mode: input.authMode,
    request_payload: input.request,
    result_payload: input.result,
    created_at: new Date().toISOString()
  };
  const { error } = input.runId
    ? await supabase.from("plan_runs").upsert(
        {
          id: input.runId,
          ...payload
        },
        { onConflict: "id" }
      )
    : await supabase.from("plan_runs").insert(payload);

  if (error) {
    if (isSchemaCacheMiss(error)) {
      warnMissingSchema("plan_runs");
      return { persisted: false, backend: "local" as const };
    }

    console.error("Failed to persist plan run", error);
    return { persisted: false, backend: "supabase" as const, error: error.message };
  }

  return { persisted: true, backend: "supabase" as const };
}

export async function getPlanRunById(runId: string): Promise<PlanRunRecord | null> {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("plan_runs")
    .select("id, owner_key, auth_mode, request_payload, result_payload, created_at")
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    if (isSchemaCacheMiss(error)) {
      warnMissingSchema("plan_runs");
      return null;
    }

    console.error("Failed to load plan run", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    ownerKey: data.owner_key,
    authMode: data.auth_mode,
    request: data.request_payload as OnboardingAnswers,
    result: data.result_payload,
    createdAt: data.created_at
  };
}

export async function persistAgentStep(input: PersistAgentStepInput) {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    return { persisted: false, backend: "local" as const };
  }

  const { error } = await supabase.from("agent_steps").upsert(
    {
      run_id: input.runId,
      agent_name: input.agentName,
      step_key: input.stepKey,
      status: input.status,
      confidence: input.confidence,
      payload: input.payload,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "run_id,agent_name,step_key"
    }
  );

  if (error) {
    if (isSchemaCacheMiss(error)) {
      warnMissingSchema("agent_steps");
      return { persisted: false, backend: "local" as const };
    }

    console.error("Failed to persist agent step", error);
    return { persisted: false, backend: "supabase" as const, error: error.message };
  }

  return { persisted: true, backend: "supabase" as const };
}

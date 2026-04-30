import "server-only";

import type { AuthMode, AuthUser } from "@/lib/auth/types";
import { persistPlanRun, updatePlanRunResult } from "@/lib/repositories/lifemax";
import { runIntakeAnalyst } from "@/lib/agents/lifemax-agent";
import { runBuilderWorkflow } from "@/lib/agents/openai/builder-workflow";
import { runOpenAiLifeMaxWorkflow } from "@/lib/agents/openai/lifemax-runtime";
import { serverEnv } from "@/lib/env";
import type { OnboardingAnswers } from "@/lib/schemas/onboarding";
import { toWorkflowInput } from "@/lib/schemas/onboarding";
import { runWorkflow } from "@/lib/agents/run-lifemax";
import { persistGeneratedWorkspaceArtifacts } from "@/lib/workspace/repository";

type ExecutePlanGenerationInput = {
  ownerKey: string;
  authMode: AuthMode;
  answers: OnboardingAnswers;
  previousState?: unknown;
  planningMode?: "stable" | "ai";
  userId?: string | null;
  user?: AuthUser | null;
};

export async function executePlanGeneration(input: ExecutePlanGenerationInput) {
  const resolvedPlanningMode =
    input.planningMode ?? (serverEnv.agentBackend === "openai" ? "ai" : "stable");
  const useOpenAiRuntime = resolvedPlanningMode === "ai";
  const agentAssessment = await runIntakeAnalyst(input.answers);
  const builderResult =
    !useOpenAiRuntime && serverEnv.agentBackend === "builder"
      ? await runBuilderWorkflow(input)
      : null;
  const openAiResult =
    useOpenAiRuntime
      ? await runOpenAiLifeMaxWorkflow(input)
      : null;
  const workflowInput = toWorkflowInput(input.answers);
  const result =
    openAiResult?.result ??
    builderResult ??
    (await Promise.resolve((runWorkflow as any)(workflowInput, input.previousState ?? null)));
  const resolvedRunId =
    openAiResult?.runId ||
    result?.workflowMeta?.runId ||
    result?.buildPackage?.workflowMeta?.runId ||
    null;

  const enrichedResult = {
    ...result,
    buildPackage: result.buildPackage
      ? {
          ...result.buildPackage,
          workflowMeta: {
            ...(result.buildPackage.workflowMeta || {}),
            generatedAt: new Date().toISOString(),
            ...(resolvedRunId ? { runId: resolvedRunId } : {}),
            backend: openAiResult ? "openai-agents-runtime" : builderResult ? "agent-builder" : "legacy-orchestrator",
            planningMode: resolvedPlanningMode,
            agentAssessment
          }
        }
      : result.buildPackage,
    workflowMeta: {
      generatedAt: new Date().toISOString(),
      ...(resolvedRunId ? { runId: resolvedRunId } : {}),
      backend: openAiResult ? "openai-agents-runtime" : builderResult ? "agent-builder" : "legacy-orchestrator",
      planningMode: resolvedPlanningMode,
      agentAssessment
    }
  };

  if (openAiResult?.runId) {
    await updatePlanRunResult(openAiResult.runId, enrichedResult);
  } else {
    await persistPlanRun({
      ownerKey: input.ownerKey,
      authMode: input.authMode,
      request: input.answers,
      result: enrichedResult
    });
  }

  if (input.userId && (input.authMode === "supabase" || input.authMode === "clerk")) {
    try {
      await persistGeneratedWorkspaceArtifacts({
        userId: input.userId,
        authMode: input.authMode,
        user: input.user || null,
        ownerKey: input.ownerKey,
        answers: input.answers,
        result: enrichedResult
      });
    } catch (error) {
      console.error("Failed to persist generated workspace artifacts", error);
    }
  }

  return enrichedResult;
}

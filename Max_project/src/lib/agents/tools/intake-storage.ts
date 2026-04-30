import "server-only";

import { z } from "zod";
import { getPlanRunById, persistAgentStep } from "@/lib/repositories/lifemax";
import { intakeSummarySchema } from "@/lib/agents/tools/intake";

export const storedOnboardingAnswersSchema = z.object({
  runId: z.string(),
  found: z.boolean(),
  source: z.enum(["supabase", "local"]),
  answers: z.record(z.string(), z.unknown()).nullable()
});

export type StoredOnboardingAnswers = z.infer<typeof storedOnboardingAnswersSchema>;

export async function getOnboardingAnswers(runId: string): Promise<StoredOnboardingAnswers> {
  const planRun = await getPlanRunById(runId);

  if (!planRun) {
    return {
      runId,
      found: false,
      source: "local",
      answers: null
    };
  }

  return {
    runId,
    found: true,
    source: "supabase",
    answers: planRun.request
  };
}

export async function saveIntakeSummary(runId: string, summary: z.infer<typeof intakeSummarySchema>) {
  const parsedSummary = intakeSummarySchema.parse(summary);

  return persistAgentStep({
    runId,
    agentName: "Intake Agent",
    stepKey: "intake-summary",
    status: parsedSummary.mode,
    confidence: parsedSummary.confidence,
    payload: parsedSummary
  });
}

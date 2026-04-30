import "server-only";

import type { AuthMode } from "@/lib/auth/types";
import type { OnboardingAnswers } from "@/lib/schemas/onboarding";

type BuilderWorkflowInput = {
  ownerKey: string;
  authMode: AuthMode;
  answers: OnboardingAnswers;
  previousState?: unknown;
};

/**
 * Integration seam for the published Agent Builder workflow.
 *
 * Replace the `return null` block with the SDK code exported from Agent Builder,
 * then normalize its final payload into the same build package shape that the app
 * already expects from `executePlanGeneration`.
 */
export async function runBuilderWorkflow(_input: BuilderWorkflowInput) {
  return null;
}

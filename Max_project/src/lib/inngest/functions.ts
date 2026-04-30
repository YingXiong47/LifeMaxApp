import { inngest } from "@/lib/inngest/client";
import { onboardingAnswerSchema } from "@/lib/schemas/onboarding";
import { executePlanGeneration } from "@/lib/workflows/generate-plan";

export const planRequested = inngest.createFunction(
  {
    id: "plan-requested",
    triggers: { event: "lifemax/plan.requested" }
  },
  async ({ event, step }) => {
    const parsed = onboardingAnswerSchema.parse(event.data.answers);

    return step.run("generate-plan", async () =>
      executePlanGeneration({
        ownerKey: event.data.ownerKey,
        authMode: event.data.authMode,
        answers: parsed,
        previousState: event.data.previousState,
        planningMode: event.data.planningMode
      })
    );
  }
);

export const inngestFunctions = [planRequested];

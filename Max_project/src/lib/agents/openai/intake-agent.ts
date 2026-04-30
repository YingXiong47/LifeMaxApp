import "server-only";

import { Agent, run } from "@openai/agents";
import { readiness } from "@/lib/env";
import { buildIntakeSummary, intakeSummarySchema } from "@/lib/agents/tools/intake";
import { getOnboardingAnswers, saveIntakeSummary } from "@/lib/agents/tools/intake-storage";
import { intakeTools } from "@/lib/agents/openai/intake-tools";

export const intakeAgent = new Agent({
  name: "Intake Agent",
  instructions: `You are the first validation gate for LifeMax OS.

For every run:
1. Call intake.get_onboarding_answers with the provided run_id.
2. If no answers are found, return missing_requirements mode with zero confidence.
3. Validate the payload with intake.validate_intake_schema.
4. Inspect missing fields and contradictions with intake.list_missing_requirements.
5. Build the final normalized result with intake.build_intake_summary.
6. Persist that result with intake.save_intake_summary.

Do not invent user inputs. If the payload is incomplete, say exactly what is missing.
Return only the final summary object.`,
  tools: intakeTools,
  outputType: intakeSummarySchema
});

export async function runIntakeAgent(runId: string) {
  const storedAnswers = await getOnboardingAnswers(runId);

  if (!storedAnswers.answers) {
    const summary = {
      mode: "missing_requirements" as const,
      requiredMissing: ["request_payload"],
      optionalMissing: [],
      contradictions: ["No onboarding answers were found for this run."],
      assumptions: ["The plan run must be created before the Intake Agent can inspect it."],
      confidence: 0
    };

    await saveIntakeSummary(runId, summary);
    return {
      provider: "deterministic-fallback" as const,
      ...summary
    };
  }

  const resolvedAnswers = storedAnswers.answers;

  if (!readiness.openai) {
    const summary = buildIntakeSummary(resolvedAnswers);
    await saveIntakeSummary(runId, summary);

    return {
      provider: "deterministic-fallback" as const,
      ...summary
    };
  }

  let provider: "openai-agents" | "deterministic-fallback" = "openai-agents";

  const result = await Promise.race([
    run(
      intakeAgent,
      `Run the Intake Agent for LifeMax plan run ${runId}. Use the intake tools in order and persist the final summary before returning it.`
    ),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Intake Agent timed out."));
      }, 8_000);
    })
  ]).catch(async () => {
    provider = "deterministic-fallback";
    const summary = buildIntakeSummary(resolvedAnswers);
    await saveIntakeSummary(runId, summary);

    return {
      finalOutput: summary
    };
  });

  return {
    provider,
    ...intakeSummarySchema.parse(result.finalOutput)
  };
}

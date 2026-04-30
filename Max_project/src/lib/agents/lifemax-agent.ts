import "server-only";

import { Agent, run } from "@openai/agents";
import { z } from "zod";
import { readiness } from "@/lib/env";
import type { OnboardingAnswers } from "@/lib/schemas/onboarding";

const analysisSchema = z.object({
  summary: z.string(),
  opportunities: z.array(z.string()).max(3),
  risks: z.array(z.string()).max(3)
});

const intakeAnalyst = new Agent({
  name: "LifeMax Intake Analyst",
  instructions:
    "You analyze onboarding inputs for a life operating system. Return a concise synthesis with near-term opportunities and execution risks.",
  outputType: analysisSchema
});

function fallbackAssessment(answers: OnboardingAnswers) {
  return {
    provider: "heuristic-fallback" as const,
    summary: `${answers.transformationMode} mode focused on ${answers.focusDomains.join(", ")} over ${answers.timeHorizon}.`,
    opportunities: [
      `Lean on ${answers.communicationStyle} coaching to keep execution friction low.`,
      `Prioritize ${answers.careerGoal.toLowerCase()} while protecting ${answers.energyBaseline.toLowerCase()} energy.`,
      `Use ${answers.weeklyHoursAvailable} as the planning budget for the initial roadmap.`
    ],
    risks: answers.blockers.slice(0, 3)
  };
}

export async function runIntakeAnalyst(answers: OnboardingAnswers) {
  if (!readiness.openai) {
    return fallbackAssessment(answers);
  }

  try {
    const result = await run(
      intakeAnalyst,
      `Assess this onboarding payload and identify the best operating summary, opportunities, and risks.\n${JSON.stringify(answers)}`
    );

    const output = analysisSchema.parse(result.finalOutput);

    return {
      provider: "openai-agents" as const,
      ...output
    };
  } catch (error) {
    console.error("OpenAI agent analysis failed; falling back to heuristics", error);
    return fallbackAssessment(answers);
  }
}

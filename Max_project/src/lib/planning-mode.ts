import type { WorkspacePlanningMode } from "@/lib/workspace/state";

export const planningModeOptions: Array<{
  id: WorkspacePlanningMode;
  title: string;
  eyebrow: string;
  subtitle: string;
  detail: string;
}> = [
  {
    id: "stable",
    title: "Stable mode",
    eyebrow: "Recommended",
    subtitle: "Uses the proven legacy planning engine for faster and more reliable full-run generation.",
    detail:
      "Best for most users. It prioritizes speed, reliability, and smoother onboarding over experimental multi-agent generation."
  },
  {
    id: "ai",
    title: "AI mode",
    eyebrow: "Experimental",
    subtitle: "Uses the OpenAI multi-agent runtime for a more dynamic run, but it can be slower or less reliable.",
    detail:
      "Use this if you want a more agent-heavy pass and accept longer generation time or occasional fallback behavior."
  }
];

export function getPlanningModeDetails(mode: WorkspacePlanningMode | undefined) {
  return planningModeOptions.find((option) => option.id === mode) || planningModeOptions[0];
}

export function planningModePill(mode: WorkspacePlanningMode | undefined) {
  return mode === "ai" ? "AI mode" : "Stable mode";
}

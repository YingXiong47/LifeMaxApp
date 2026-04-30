import { clamp } from "../../core/utils/scoring.js";

export function assessPersonality(input) {
  if (input.knownPersonalityType) {
    return {
      personalityType: input.knownPersonalityType,
      motivationStyle: "Self-reported",
      decisionPattern: "Uses stated personality framing",
      stressTriggers: [input.procrastinationTrigger || "unclear priorities"],
      confidence: 0.9
    };
  }

  const structure = Number(input.routineConsistency || 3);
  const risk = Number(input.riskTolerance || 3);
  const social = Number(input.socialEnergy || 3);
  const phoneHours = String(input.nightlyPhoneHours || "");
  const avoidancePatterns = Array.isArray(input.avoidancePatterns) ? input.avoidancePatterns : [];
  const distractionSources = Array.isArray(input.distractionSources) ? input.distractionSources : [];

  let personalityType = "Adaptive Builder";
  let motivationStyle = "Responds to clear short-term wins";
  let decisionPattern = "Balances structure with flexibility";

  if (structure >= 4 && risk >= 4) {
    personalityType = "Structured Driver";
    motivationStyle = "Performs best with ambitious milestones and visible scoreboards";
    decisionPattern = "Moves quickly when targets are explicit";
  } else if (structure >= 4 && social <= 2) {
    personalityType = "Reflective Analyst";
    motivationStyle = "Needs reasoned plans and quiet execution time";
    decisionPattern = "Prefers preparation before commitment";
  } else if (risk >= 4 && social >= 4) {
    personalityType = "Momentum Seeker";
    motivationStyle = "Builds energy from novelty, challenge, and fast feedback";
    decisionPattern = "Commits harder when the plan feels alive";
  } else if (avoidancePatterns.includes("I over-plan and under-execute")) {
    personalityType = "Cognitive Staller";
    motivationStyle = "Feels productive when thinking hard, but does not reliably convert clarity into action";
    decisionPattern = "Uses planning as protection when visibility or discomfort rises";
  }

  return {
    personalityType,
    motivationStyle,
    decisionPattern,
    stressTriggers: [
      input.procrastinationTrigger || "diffuse workload",
      distractionSources[0] || "fatigue",
      phoneHours === "3-4 hours" || phoneHours === "5+ hours" ? "night-time attention collapse" : "loss of structure"
    ].filter(Boolean),
    confidence: clamp((structure + risk + social) / 15)
  };
}

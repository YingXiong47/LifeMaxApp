import {
  compactBaseline,
  confidenceFromSignals,
  isFocusDomain,
  isLowEnergy,
  makeAction,
  makeDeadline,
  makeRecommendation,
  parseSleepHours,
  parseTrainingFrequency
} from "../planning/domainPlanToolkit.js";

export function buildHealthPlan(profile) {
  const sleep = parseSleepHours(profile.habits.sleepHours);
  const diet = profile.habits.dietQuality;
  const training = profile.habits.trainingFrequency;
  const trainingSessions = parseTrainingFrequency(training);
  const selected = isFocusDomain(profile, "health");
  const lowEnergy = isLowEnergy(profile);
  const risks = [];

  if (!sleep) {
    risks.push("Sleep baseline is incomplete, so the first review must confirm actual sleep duration.");
  }
  if (diet === "Unknown") {
    risks.push("Diet quality is unclear, which makes energy recommendations less precise.");
  }
  if (trainingSessions === 0) {
    risks.push("Training baseline is effectively zero, so consistency matters more than intensity.");
  }

  return {
    domain: "health",
    targetOutcome: lowEnergy
      ? "Rebuild usable energy, recovery, and training consistency without depending on motivation spikes."
      : "Protect recovery and steadily raise physical capacity with a plan that survives real-life pressure.",
    currentBaseline: compactBaseline([
      `Sleep is currently ${profile.habits.sleepHours || "unknown"} hours.`,
      `Diet quality is reported as ${diet}.`,
      `Eating pattern: ${profile.habits.eatingPattern}.`,
      `Training frequency is ${training}.`,
      lowEnergy ? "Energy is already constrained, so recovery gets treated as the bottleneck." : ""
    ]),
    rootIssue:
      lowEnergy || !sleep || sleep < 6.5
        ? "Recovery is too weak to support reliable discipline."
        : "The health system exists, but it is not scheduled tightly enough to survive busy weeks.",
    whyNow:
      lowEnergy || !sleep || sleep < 6.5
        ? "If recovery stays weak, every other domain will keep feeling harder than it should."
        : "Health already has momentum, so tightening it now creates carryover into work and routine.",
    evidence: [
      `Sleep: ${profile.habits.sleepHours} hours`,
      `Diet quality: ${diet}`,
      `Training frequency: ${training}`
    ],
    actionItems: [
      {
        task: makeAction(
          profile,
          sleep && sleep >= 6.8
            ? "protect a fixed wake time and a 45-minute wind-down block so your current sleep baseline does not slip"
            : "anchor one realistic sleep window with the same wake time for the next seven days"
        ),
        metric:
          sleep && sleep >= 6.8
            ? "wake time held within 30 minutes on 5 of 7 days"
            : "wake time held within 30 minutes on 6 of 7 days",
        deadline: makeDeadline(profile, "5 days", "7 days", "10 days")
      },
      {
        task: makeAction(
          profile,
          diet === "Poor" || diet === "Mixed"
            ? "lock one repeatable protein-forward breakfast or lunch and pair it with a hydration check before noon"
            : "keep one protein-forward meal and one hydration check before noon on workdays"
        ),
        metric: "5 weekdays completed with the meal plus hydration standard",
        deadline: makeDeadline(profile, "5 days", "7 days")
      },
      {
        task: makeAction(
          profile,
          trainingSessions <= 1
            ? "schedule a minimum viable training week with two short sessions before adding anything optional"
            : "schedule your full training week in advance so workouts happen before schedule drift takes over"
        ),
        metric: trainingSessions <= 1 ? "2 sessions blocked and completed" : "all planned sessions placed on the calendar",
        deadline: makeDeadline(profile, "3 days", "5 days", "7 days")
      }
    ],
    kpiMetrics: [
      { name: "average sleep hours", target: sleep >= 7 ? "Maintain 7h+" : "Reach a 7h average" },
      { name: "training consistency", target: trainingSessions >= 3 ? "Keep 3 sessions weekly" : "Reach 2-3 sessions weekly" },
      { name: "midday nutrition adherence", target: "5 workdays weekly" }
    ],
    failurePattern:
      "The health plan fails when sleep gets sacrificed first, meals become reactive, and training is left to leftover energy.",
    adjustmentRule:
      "If you miss the sleep or meal standard twice in one week, reduce training ambition and rebuild recovery before chasing intensity.",
    recommendedTools: [
      makeRecommendation(
        "Cronometer",
        "app",
        "Useful if food quality is mixed and you need objective feedback on calories, protein, and meal consistency.",
        "Use for 7 days, then keep only if it creates honest awareness."
      ),
      makeRecommendation(
        "Hevy or Strong",
        "app",
        "If training is inconsistent, a simple lifting log prevents guessing and makes weekly volume visible.",
        "Log every session."
      ),
      makeRecommendation(
        "Protein-forward default meal",
        "meal",
        "A repeatable breakfast or lunch lowers the decision load when the day gets busy.",
        "5 workdays each week."
      )
    ],
    reviewPeriod: "weekly",
    confidenceScore: confidenceFromSignals(selected ? 0.77 : 0.71, trainingSessions >= 2 ? [0.04] : [], risks.map(() => 0.05)),
    riskFlags: risks
  };
}

import { average } from "../../core/utils/scoring.js";

export function evaluateBuild(profile, plans, testing) {
  const planScores = plans.map((plan) => {
    const specificity = plan.actionItems.length >= 3 ? 0.85 : 0.5;
    const realism = plan.riskFlags.length ? 0.7 : 0.82;
    const actionability = plan.kpiMetrics.length >= 2 ? 0.84 : 0.55;
    const userFit = profile.preferences.communicationStyle ? 0.8 : 0.55;
    const consistency = testing.failedTests.length ? 0.6 : 0.82;
    return average([specificity, realism, actionability, userFit, consistency]);
  });

  const risks = [
    ...new Set(
      plans.flatMap((plan) => plan.riskFlags).concat([
        "Suggestions are recommendations, not diagnoses or financial advice.",
        "Persistent storage is local-only and should be replaced for shared or enterprise use."
      ])
    )
  ];

  return {
    overallConfidence: average(planScores),
    criteria: {
      specificity: average(plans.map((plan) => (plan.actionItems.length >= 3 ? 0.85 : 0.5))),
      realism: average(plans.map((plan) => (plan.riskFlags.length ? 0.7 : 0.82))),
      actionability: average(plans.map((plan) => (plan.kpiMetrics.length >= 2 ? 0.84 : 0.55))),
      userFit: profile.preferences.communicationStyle ? 0.8 : 0.55,
      consistency: testing.failedTests.length ? 0.6 : 0.82
    },
    risks,
    refactors: [
      "Add policy rules for sensitive-domain gating.",
      "Move orchestration state to durable storage with audit trails.",
      "Replace template heuristics with the published Agent Builder workflow once the tool handlers are live."
    ]
  };
}

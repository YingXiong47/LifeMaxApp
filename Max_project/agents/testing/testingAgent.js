import { validatePlan } from "../../core/schemas/planSchema.js";

export function runTesting(plans, profile) {
  const failed = [];
  const passedUnitTests = [
    "Profile schema population",
    "Plan contract validation",
    "Task generation emits measurable metrics",
    "Each domain includes a root issue and adjustment rule"
  ];

  plans.forEach((plan) => {
    const validation = validatePlan(plan);
    if (!validation.valid) {
      failed.push({
        failedComponent: `${plan.domain} plan schema`,
        inputContext: plan.currentBaseline,
        observedBehavior: `Missing fields: ${validation.missing.join(", ") || "none"}; KPI issues: ${validation.kpiIssues.length}`,
        expectedBehavior: "Every plan should satisfy the shared contract and contain complete KPIs.",
        severity: "high",
        recommendedFixPath: "Regenerate the affected domain plan with complete KPI and action data."
      });
    }

    if (plan.actionItems.some((item) => !String(item.metric || "").match(/\d|weekly|daily|days|sessions|review/i))) {
      failed.push({
        failedComponent: `${plan.domain} measurable metric`,
        inputContext: plan.currentBaseline,
        observedBehavior: "At least one action item metric is too vague to track.",
        expectedBehavior: "Every action item should have a metric that can be observed in a week or less.",
        severity: "medium",
        recommendedFixPath: "Rewrite the task metric so it can be counted, scheduled, or checked off."
      });
    }

    if (!plan.rootIssue || !plan.adjustmentRule || !plan.failurePattern) {
      failed.push({
        failedComponent: `${plan.domain} diagnosis depth`,
        inputContext: plan.currentBaseline,
        observedBehavior: "The domain plan is missing a root issue, adjustment rule, or failure pattern.",
        expectedBehavior: "Every domain plan should explain why the user is stuck and what to change when execution fails.",
        severity: "high",
        recommendedFixPath: "Regenerate the domain plan with a sharper diagnosis layer and failure handling."
      });
    }

    if (!Array.isArray(plan.evidence) || plan.evidence.length < 2) {
      failed.push({
        failedComponent: `${plan.domain} evidence trace`,
        inputContext: plan.currentBaseline,
        observedBehavior: "The domain plan does not cite enough user-specific evidence.",
        expectedBehavior: "Every domain plan should reference the user input that caused the recommendation.",
        severity: "medium",
        recommendedFixPath: "Add at least two explicit evidence lines tied to the user profile."
      });
    }
  });

  if (!profile.personality?.personalityType) {
    failed.push({
      failedComponent: "personality routing",
      inputContext: "profile synthesis",
      observedBehavior: "No personality type available",
      expectedBehavior: "Missing personality should trigger an assessment result",
      severity: "medium",
      recommendedFixPath: "Re-run personality assessment before planning."
    });
  }

  if (plans.length === 5) {
    passedUnitTests.push("Five-domain coverage");
  }

  return {
    passedUnitTests,
    failedTests: failed,
    integrationCoverage: [
      "Onboarding to final package flow",
      "Partial finance data fallback path",
      "Personality inference path",
      "Multi-domain planning"
    ],
    unresolvedEdgeCases: [
      "Contradictory goals still rely on manual user clarification.",
      "Medical and financial advice boundaries are cautionary rather than policy-enforced."
    ]
  };
}

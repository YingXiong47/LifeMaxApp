export const planSchema = {
  required: [
    "domain",
    "targetOutcome",
    "currentBaseline",
    "actionItems",
    "kpiMetrics",
    "reviewPeriod",
    "confidenceScore",
    "riskFlags"
  ]
};

export function validatePlan(plan) {
  const missing = planSchema.required.filter((field) => {
    const value = plan[field];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return value === undefined || value === null || value === "";
  });

  const kpiIssues = Array.isArray(plan.kpiMetrics)
    ? plan.kpiMetrics.filter((metric) => !metric.name || !metric.target)
    : [{ name: "", target: "" }];

  return {
    valid: missing.length === 0 && kpiIssues.length === 0,
    missing,
    kpiIssues
  };
}

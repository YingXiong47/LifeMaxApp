import {
  compactBaseline,
  confidenceFromSignals,
  isFocusDomain,
  isHighStress,
  makeAction,
  makeDeadline
} from "../planning/domainPlanToolkit.js";
import { makeRecommendation } from "../planning/domainPlanToolkit.js";

export function buildFinancePlan(profile, options = {}) {
  const snapshot = profile.financialBaseline.snapshot;
  const narrowed = Boolean(options.narrowedScope);
  const hasData = snapshot && snapshot !== "Incomplete";
  const highPriority = isFocusDomain(profile, "finance");
  const highStress = isHighStress(profile);
  const risks = [];

  if (!hasData) {
    risks.push("Financial data incomplete");
    risks.push("Financial baseline is incomplete, so the first step is clarity rather than optimization.");
  }
  if (highStress) {
    risks.push("High money stress means the plan should prioritize control and predictability over ambition.");
  }

  return {
    domain: "finance",
    targetOutcome: hasData
      ? "Stabilize cash flow, stop avoidable leakage, and direct surplus toward the next priority."
      : "Build a truthful money baseline before making any aggressive financial moves.",
    currentBaseline: compactBaseline([
      `Financial snapshot: ${snapshot}.`,
      `Stress level: ${profile.financialBaseline.stressLevel}.`,
      highPriority ? "Finance is a focus domain, so the plan should create visible control quickly." : ""
    ]),
    rootIssue: hasData
      ? "Money decisions are happening without a weekly control loop."
      : "The user cannot manage money honestly yet because the baseline is still blurry.",
    whyNow:
      profile.operatingContext.whyNow || "Financial drift quietly sabotages other domains by shrinking options and increasing stress.",
    evidence: [
      `Stress level: ${profile.financialBaseline.stressLevel}`,
      `Money leaks: ${(profile.behavioralSignals.moneyLeaks || []).join(", ") || "not provided"}`,
      `Snapshot: ${snapshot}`
    ],
    actionItems: [
      {
        task: makeAction(
          profile,
          hasData
            ? "separate fixed costs, variable costs, debt, and savings in one simple tracker you can review weekly"
            : "list income, recurring bills, debt, and current savings balances in one place with real numbers"
        ),
        metric: "1 complete money snapshot",
        deadline: makeDeadline(profile, "5 days", "7 days", "10 days")
      },
      {
        task: makeAction(
          profile,
          narrowed
            ? "set one defensive spending rule for the next two weeks until the baseline is trustworthy"
            : highStress
              ? "choose one stabilizing move: automate a minimum savings transfer or put one bill on autopay"
              : "choose one savings or debt target and automate the first transfer toward it"
        ),
        metric: narrowed ? "1 spending rule active" : "1 automated transfer or autopay rule active",
        deadline: makeDeadline(profile, "7 days", "10 days", "14 days")
      },
      {
        task: makeAction(
          profile,
          "review the tracker once a week, label every avoidable leak, and note the one fix for next week"
        ),
        metric: "1 weekly money review with one fix recorded",
        deadline: "Weekly"
      }
    ],
    kpiMetrics: [
      { name: "weekly money review", target: "1 per week" },
      {
        name: hasData ? "cash-flow direction" : "baseline completeness",
        target: hasData ? "Positive monthly surplus or reduced overspend" : "Baseline completed"
      },
      { name: "money leak reduction", target: "1 avoidable expense reduced each week" }
    ],
    failurePattern:
      "The finance plan fails when money is reviewed only after damage is done, or when convenience spending keeps running unchallenged.",
    adjustmentRule:
      "If the user skips one weekly money review, the next week should remove optimization and return to one single control task: snapshot, leak label, and one automatic rule.",
    recommendedTools: [
      makeRecommendation(
        "YNAB-style budget or a simple spreadsheet",
        "money-system",
        "The goal is visibility, not sophistication. The user needs one place where cash flow stops being a mystery.",
        "Review weekly."
      ),
      makeRecommendation(
        "Bank transfer automation",
        "service",
        "Automation removes the need for discipline on savings or debt payments once the target is chosen.",
        "Set once and review weekly."
      ),
      makeRecommendation(
        "Subscription audit",
        "habit",
        "Useful if leaks are silent recurring charges rather than one-time mistakes.",
        "Run once this week."
      )
    ],
    reviewPeriod: "weekly",
    confidenceScore: hasData
      ? confidenceFromSignals(highPriority ? 0.77 : 0.72, highStress ? [] : [0.03], risks.map(() => 0.03))
      : confidenceFromSignals(narrowed ? 0.66 : 0.57, [], risks.map(() => 0.03)),
    riskFlags: risks
  };
}

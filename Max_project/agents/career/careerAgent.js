import {
  compactBaseline,
  confidenceFromSignals,
  isFocusDomain,
  isTightCapacity,
  makeAction,
  makeDeadline,
  makeRecommendation,
  parseWeeklyHours
} from "../planning/domainPlanToolkit.js";

export function buildCareerPlan(profile) {
  const goal = profile.goals.careerGoal || "clarify next career move";
  const normalizedGoal = goal.replace(/^move\s+(into|toward)\s+/i, "").trim();
  const occupation = profile.occupation;
  const selected = isFocusDomain(profile, "career");
  const weeklyHours = parseWeeklyHours(profile.schedule.weeklyHoursAvailable);
  const lowCapacity = isTightCapacity(profile);
  const risks = [];

  if (goal === "clarify next career move" || goal === "New role") {
    risks.push("Career target is still broad, so the first checkpoint must sharpen the destination.");
  }
  if (weeklyHours < 5) {
    risks.push("Career execution time is limited, so the plan must favor high-leverage actions over volume.");
  }

  return {
    domain: "career",
    targetOutcome: selected
      ? `Move from the current ${occupation} position toward ${normalizedGoal || goal} with visible proof of momentum.`
      : `Strengthen career optionality for a ${occupation} without turning the week into a second full-time job.`,
    currentBaseline: compactBaseline([
      `Current role: ${occupation}.`,
      `Declared goal: ${goal}.`,
      `Weekly improvement budget: ${profile.schedule.weeklyHoursAvailable}.`
    ]),
    rootIssue:
      goal === "clarify next career move" || goal === "New role"
        ? "The career target is too broad, so action is leaking into vague effort instead of visible proof."
        : "The target exists, but the week is not yet organized around proof and outreach.",
    whyNow:
      profile.operatingContext.whyNow || "If career pressure is real, the user needs visible movement instead of more internal debate.",
    evidence: [
      `Role: ${occupation}`,
      `Goal: ${goal}`,
      `Weekly budget: ${profile.schedule.weeklyHoursAvailable}`
    ],
    actionItems: [
      {
        task: makeAction(
          profile,
          "write one target-role checkpoint, one sentence on why it matters, and the top three capabilities it requires"
        ),
        metric: "1 target-role statement plus 3 required capabilities written down",
        deadline: makeDeadline(profile, "4 days", "5 days", "7 days")
      },
      {
        task: makeAction(
          profile,
          lowCapacity
            ? "produce one small proof-of-work artifact that can be shared publicly or with a trusted contact"
            : "ship one visible proof-of-work artifact tied directly to that checkpoint"
        ),
        metric: lowCapacity ? "1 artifact drafted and shared" : "1 artifact published or sent",
        deadline: makeDeadline(profile, "10 days", "14 days", "17 days")
      },
      {
        task: makeAction(
          profile,
          lowCapacity
            ? "protect one weekly outreach or application block so career momentum does not depend on spare energy"
            : "schedule one outreach conversation or application block every week and track the outcome"
        ),
        metric: lowCapacity ? "1 outbound block weekly" : "1 outreach block weekly with outcome logged",
        deadline: "Weekly"
      }
    ],
    kpiMetrics: [
      { name: "proof-of-work cadence", target: lowCapacity ? "1 artifact per month" : "2 artifacts per month" },
      { name: "career pipeline activity", target: lowCapacity ? "2 outreach actions monthly" : "4 outreach actions monthly" },
      { name: "role clarity", target: "1 current target role with 3 mapped capability gaps" }
    ],
    failurePattern:
      "The career plan fails when the user consumes career content, updates materials endlessly, or waits for confidence before shipping visible work.",
    adjustmentRule:
      "If no visible proof or outreach happens in 7 days, shrink the task to one ugly but public artifact or one direct message to a real person.",
    recommendedTools: [
      makeRecommendation(
        "LinkedIn",
        "app",
        "Useful if the user needs visible outreach and recruiter surface area instead of private planning.",
        "Use for one scheduled outreach block each week."
      ),
      makeRecommendation(
        "Notion or a plain spreadsheet",
        "app",
        "A simple tracker keeps target roles, capability gaps, and outreach outcomes visible.",
        "Review weekly."
      ),
      makeRecommendation(
        "Calendar time block",
        "environment",
        "Career work usually dies when it is left to leftover energy. It needs a named slot before the week starts.",
        "Lock one block weekly."
      )
    ],
    reviewPeriod: "bi-weekly",
    confidenceScore: confidenceFromSignals(selected ? 0.76 : 0.69, weeklyHours >= 6 ? [0.04] : [], risks.map(() => 0.04)),
    riskFlags: risks
  };
}

import {
  compactBaseline,
  confidenceFromSignals,
  hasBlocker,
  hasVariableSchedule,
  isFocusDomain,
  makeAction,
  makeDeadline,
  makeRecommendation
} from "../planning/domainPlanToolkit.js";

export function buildRoutinePlan(profile) {
  const schedule = profile.schedule.workSchedule;
  const trigger = profile.personality.stressTriggers[0];
  const selected = isFocusDomain(profile, "routine");
  const phoneDistraction = hasBlocker(profile, ["phone", "scroll", "distraction"]);
  const variableSchedule = hasVariableSchedule(profile);
  const risks = [];

  if (variableSchedule) {
    risks.push("Variable scheduling increases the chance that routines drift unless anchors are very simple.");
  }
  if (phoneDistraction) {
    risks.push("Phone distraction is a declared blocker, so environment controls matter as much as motivation.");
  }

  return {
    domain: "routine",
    targetOutcome: selected
      ? "Create a repeatable execution system that lowers start friction and keeps the day from fragmenting."
      : "Stabilize daily execution enough to support the higher-priority domains.",
    currentBaseline: compactBaseline([
      `Schedule: ${schedule}.`,
      `Primary friction: ${trigger}.`,
      phoneDistraction ? "Phone distraction is explicitly present in the baseline." : ""
    ]),
    rootIssue:
      phoneDistraction
        ? "Attention is too easy to steal, so the day gets fragmented before real work begins."
        : "There is no stable daily operating sequence strong enough to survive a normal stressful day.",
    whyNow:
      profile.operatingContext.whyNow || "Without a reliable routine, every other plan becomes aspiration instead of execution.",
    evidence: [
      `Schedule: ${schedule}`,
      `Night phone time: ${profile.operatingContext.nightlyPhoneHours}`,
      `Avoidance: ${(profile.behavioralSignals.avoidancePatterns || []).join(", ")}`
    ],
    actionItems: [
      {
        task: makeAction(
          profile,
          variableSchedule
            ? "set a daily anchor ritual that defines the top two priorities before the first major transition of the day"
            : "build a daily top-three list before work starts and review it once at midday"
        ),
        metric: variableSchedule ? "5 days with a written top-two" : "5 workdays with a written top-three and midday review",
        deadline: makeDeadline(profile, "5 days", "7 days")
      },
      {
        task: makeAction(
          profile,
          phoneDistraction
            ? "protect one distraction-free block with phone friction in place before the highest-leverage task"
            : "protect one focused work block for the highest-leverage task before reactive work takes over"
        ),
        metric: phoneDistraction ? "4 focus blocks weekly with phone blocked or removed" : "4 focus blocks weekly",
        deadline: "Weekly"
      },
      {
        task: makeAction(
          profile,
          "use a short shutdown ritual that clears tomorrow’s first task, resets the workspace, and closes open loops"
        ),
        metric: "5 shutdown rituals completed weekly",
        deadline: makeDeadline(profile, "5 days", "7 days")
      }
    ],
    kpiMetrics: [
      { name: "focus block cadence", target: "4 sessions weekly" },
      { name: "plan adherence", target: variableSchedule ? "70% top-two completion" : "80% top-three completion" },
      { name: "shutdown consistency", target: "5 days weekly" }
    ],
    failurePattern:
      "The routine plan fails when the first task is unclear, the phone stays within reach, and shutdown never happens so tomorrow starts in confusion.",
    adjustmentRule:
      "If the focus block is missed twice in a week, cut the block length in half and make the first task smaller until completion becomes normal.",
    recommendedTools: [
      makeRecommendation(
        "Freedom or a built-in app blocker",
        "app",
        "Useful if phone distraction is explicit and the user cannot rely on willpower alone.",
        "Use during every deep-work block."
      ),
      makeRecommendation(
        "Calendar time block",
        "app",
        "Routine gets real when the work block is named before the week starts.",
        "Place at least 4 each week."
      ),
      makeRecommendation(
        "Written shutdown checklist",
        "habit",
        "A shutdown ritual prevents tomorrow from starting in leftover chaos.",
        "5 days weekly."
      )
    ],
    reviewPeriod: "weekly",
    confidenceScore: confidenceFromSignals(selected ? 0.78 : 0.72, phoneDistraction ? [] : [0.03], risks.map(() => 0.03)),
    riskFlags: risks
  };
}

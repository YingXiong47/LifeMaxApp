import { average } from "../../core/utils/scoring.js";
import {
  focusRank,
  hasBlocker,
  isHighStress,
  isLowEnergy,
  isTightCapacity,
  parseWeeklyHours,
  summarizeBlockers
} from "./domainPlanToolkit.js";

function getPriorityScore(domain, focusDomains) {
  if (focusDomains.includes(domain)) {
    return focusRank(domain, focusDomains) === 1 ? 0.95 : 0.9;
  }
  if (domain === "routine") {
    return 0.78;
  }
  if (domain === "health") {
    return 0.74;
  }
  return 0.5;
}

function buildWhatToIgnore(profile, focusDomains, lowCapacity) {
  const ignores = [
    "Do not add a fourth active goal until the first weekly review shows completed proof, not effort alone.",
    "Do not optimize appearance, supplements, or advanced tooling before sleep, attention, and the first core deliverable are under control."
  ];

  if (lowCapacity) {
    ignores.push("Do not start side quests, extra courses, or optional projects during the first two weeks.");
  }

  if (!focusDomains.includes("finance")) {
    ignores.push("Do not treat investing or optimization as urgent until cash flow and money leaks are actually visible.");
  }

  return ignores.slice(0, 5);
}

export function buildStrategyRoadmap(profile) {
  const focusDomains = profile.goals.focusDomains || [];
  const blockers = profile.constraints;
  const highStress = isHighStress(profile);
  const lowEnergy = isLowEnergy(profile);
  const lowCapacity = isTightCapacity(profile);
  const weeklyHours = parseWeeklyHours(profile.schedule.weeklyHoursAvailable);
  const phoneDistraction = hasBlocker(profile, ["phone", "scroll", "distraction"]);

  const priorities = ["career", "finance", "health", "looks", "routine"].map((domain) => ({
    domain,
    score: getPriorityScore(domain, focusDomains),
    why:
      focusDomains.includes(domain)
        ? `Explicitly selected during intake${focusRank(domain, focusDomains) === 1 ? " and ranked as the lead pressure point." : "."}`
        : domain === "routine"
          ? "Routine is the bridge between knowing what to do and doing it on a bad day."
          : domain === "health"
            ? "Energy controls how much usable discipline the week actually contains."
            : "This stays in maintenance mode until the lead domains produce proof."
  }));

  return {
    operatingSystem: lowEnergy || phoneDistraction ? "stabilize-then-scale" : "narrow-compounding",
    executiveSummary:
      lowEnergy || phoneDistraction || lowCapacity
        ? "This user should not be pushed with a heroic plan. The first job is to reduce attention leakage, stabilize the week, and earn proof inside one or two core domains."
        : "This user can handle a narrow but serious plan: one lead work push, one body/recovery standard, and one weekly review loop that catches drift early.",
    assumptions: [
      blockers.length ? `Primary blockers: ${summarizeBlockers(profile)}.` : "No major blockers were selected, so sequencing stays conservative.",
      `Weekly execution budget is roughly ${weeklyHours} hours.`,
      `The user described the week as: "${profile.operatingContext.weeklyScheduleReality}".`
    ],
    phases: [
      {
        name: "Phase 1: Stop the obvious leak",
        duration: lowCapacity ? "Weeks 1-3" : "Weeks 1-2",
        goals: [
          "Cut the behavior that keeps wrecking the evening or first work block.",
          "Lock one minimum viable standard in the top two domains.",
          "Create visible proof in 7 days, not theoretical momentum."
        ],
        exitCriteria: "At least one measurable action closed in the lead domain and one clear attention-control rule held for most of the week."
      },
      {
        name: "Phase 2: Make the week repeatable",
        duration: lowCapacity ? "Weeks 4-7" : "Weeks 3-6",
        goals: [
          "Repeat the lead actions on the same days and under the same conditions.",
          "Track misses without drama and adjust the plan size immediately.",
          "Add only one stretch action if the first layer holds."
        ],
        exitCriteria: "Two consecutive weeks of believable execution, not just planning effort."
      },
      {
        name: "Phase 3: Scale only what earned it",
        duration: "Weeks 7-12",
        goals: [
          "Increase ambition only in domains that already produced proof.",
          "Keep neglected domains in maintenance mode instead of pretending they are priority work.",
          "Protect review loops so success does not become sloppiness."
        ],
        exitCriteria: "The system survives a stressful week without collapsing into chaos."
      }
    ],
    priorities,
    whyNow: profile.operatingContext.whyNow,
    realityCheck:
      weeklyHours <= 5
        ? "A 3-5 hour weekly budget is not enough for a total life overhaul. The plan must be brutally selective."
        : lowEnergy
          ? "The plan cannot assume strong willpower if the user is already under-recovered."
          : "More effort is not the answer unless the user first proves they can hold a small system under pressure.",
    whatToIgnore: buildWhatToIgnore(profile, focusDomains, lowCapacity),
    confidence: average(priorities.map((priority) => priority.score))
  };
}

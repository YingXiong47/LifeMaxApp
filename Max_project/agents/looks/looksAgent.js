import {
  compactBaseline,
  confidenceFromSignals,
  isFocusDomain,
  isLowEnergy,
  makeAction,
  makeDeadline,
  makeRecommendation
} from "../planning/domainPlanToolkit.js";

export function buildLooksPlan(profile) {
  const grooming = profile.physicalBaseline.groomingHabits;
  const build = profile.physicalBaseline.build;
  const selected = isFocusDomain(profile, "looks");
  const lowEnergy = isLowEnergy(profile);
  const risks = [];
  const groomingIsWeak = grooming === "Basic" || grooming === "Needs review";

  if (groomingIsWeak) {
    risks.push("Presentation baseline is under-defined, so the first week should focus on standards before upgrades.");
  }
  if (lowEnergy) {
    risks.push("Low recovery will make appearance habits fall apart unless the routine stays lightweight.");
  }

  return {
    domain: "looks",
    targetOutcome: selected
      ? "Build a presentation system that makes you look put together with almost no daily decision friction."
      : "Raise visible self-respect through a lighter grooming and wardrobe maintenance system.",
    currentBaseline: compactBaseline([
      `Current build is logged as ${build}.`,
      `Grooming habits are ${grooming}.`,
      selected
        ? "Appearance is a chosen focus domain, so the plan should create visible changes within the first two weeks."
        : "Appearance is supporting the broader system rather than being the main driver."
    ]),
    rootIssue: groomingIsWeak
      ? "Presentation is being handled reactively, which means confidence and self-respect are left to chance."
      : "Appearance already has a baseline, but it lacks a lightweight maintenance system.",
    whyNow:
      selected
        ? "Looks was selected as a focus domain, so the plan needs a visible standard quickly rather than vague confidence talk."
        : "A cleaner presentation system supports credibility without stealing energy from more urgent domains.",
    evidence: [
      `Grooming habits: ${grooming}`,
      `Build: ${build}`,
      `Sleep baseline: ${profile.habits.sleepHours} hours`
    ],
    actionItems: [
      {
        task: makeAction(
          profile,
          groomingIsWeak
            ? "define a non-negotiable grooming standard for workdays: hair, face, and one finishing check before leaving"
            : "turn your current grooming routine into a written standard you can repeat without thinking"
        ),
        metric: groomingIsWeak
          ? "6 workdays completed with the full grooming standard"
          : "1 written grooming checklist used on 6 days this week",
        deadline: makeDeadline(profile, "5 days", "7 days", "10 days")
      },
      {
        task: makeAction(
          profile,
          "audit your default outfits, remove one weak-link item, and lock three reliable combinations for work or class"
        ),
        metric: "3 repeatable outfits documented and 1 weak item removed or flagged for replacement",
        deadline: makeDeadline(profile, "7 days", "10 days", "14 days")
      },
      {
        task: makeAction(
          profile,
          "capture one consistent weekly mirror or camera baseline so changes in grooming and clothing are visible over time"
        ),
        metric: "1 comparison photo added each week in the same lighting",
        deadline: "Weekly"
      }
    ],
    kpiMetrics: [
      { name: "grooming adherence", target: selected ? "6 of 7 days weekly" : "5 of 7 days weekly" },
      { name: "outfit readiness", target: "3 locked-in default outfits with no poor-fit fallback pieces" },
      { name: "appearance review cadence", target: "1 weekly baseline review" }
    ],
    failurePattern:
      "The looks plan fails when grooming is treated as optional, outfits remain random, and changes are never made visible enough to compare.",
    adjustmentRule:
      "If the user misses the grooming standard twice in one week, strip the routine down to one non-negotiable visible standard before adding anything cosmetic.",
    recommendedTools: [
      makeRecommendation(
        "Phone camera baseline album",
        "app",
        "A simple weekly photo removes the tendency to guess whether presentation is improving.",
        "1 photo each week."
      ),
      makeRecommendation(
        "Wardrobe checklist in Notes",
        "app",
        "Useful if the user defaults to weak outfits under time pressure.",
        "Review before workdays."
      )
    ],
    reviewPeriod: "weekly",
    confidenceScore: confidenceFromSignals(selected ? 0.75 : 0.68, groomingIsWeak ? [] : [0.06], risks.map(() => 0.05)),
    riskFlags: risks
  };
}

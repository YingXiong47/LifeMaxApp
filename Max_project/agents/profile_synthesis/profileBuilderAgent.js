import { average } from "../../core/utils/scoring.js";
import { summarizeBlockers } from "../planning/domainPlanToolkit.js";

function includesAny(items = [], keywords = []) {
  const haystack = items.join(" ").toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function evidenceLine(label, value) {
  return `${label}: ${value}`;
}

function detectMainBottleneck(profile) {
  const phoneHours = String(profile.operatingContext.nightlyPhoneHours || "");
  const distractions = profile.behavioralSignals.distractionSources || [];
  const avoidance = profile.behavioralSignals.avoidancePatterns || [];
  const leaks = profile.behavioralSignals.moneyLeaks || [];
  const sleep = Number(profile.habits.sleepHours || 0);

  if (
    phoneHours === "3-4 hours" ||
    phoneHours === "5+ hours" ||
    includesAny(distractions, ["phone", "stream", "gaming"])
  ) {
    return "Uncontrolled attention is eating the hours you think you do not have.";
  }

  if (sleep > 0 && sleep < 6.5) {
    return "Low recovery is flattening discipline before the day has even started.";
  }

  if (includesAny(avoidance, ["over-plan", "wait", "avoid visibility"])) {
    return "You are protecting yourself from discomfort instead of protecting execution time.";
  }

  if (profile.financialBaseline.stressLevel === "High" || leaks.length >= 2) {
    return "Financial leakage is stealing bandwidth and making the rest of the plan harder to trust.";
  }

  return "Your problem is not knowledge. It is inconsistent execution under normal-life pressure.";
}

function detectFalseAssumption(profile, bottleneck) {
  if (bottleneck.includes("attention")) {
    return "You may be telling yourself you need more motivation, but the data says you need tighter control over attention at night.";
  }
  if (bottleneck.includes("recovery")) {
    return "You may think intensity is the answer, but your body is already under-recovered.";
  }
  if (bottleneck.includes("Financial")) {
    return "You may think the main issue is ambition, but money friction is quietly dictating your risk tolerance.";
  }

  return "You may think the problem is lack of clarity, but the bigger issue is what you do when discomfort shows up.";
}

function detectUncomfortableTruth(profile, bottleneck) {
  const whyNow = profile.operatingContext.whyNow;

  if (bottleneck.includes("attention")) {
    return "If you keep losing the night to screens, no planner can manufacture progress for you.";
  }
  if (bottleneck.includes("recovery")) {
    return "You do not currently have the sleep and energy profile to brute-force your way into a better life.";
  }
  if (bottleneck.includes("Financial")) {
    return "You cannot build long-term freedom while tolerating recurring money leaks you already know about.";
  }

  return whyNow
    ? `Your own urgency statement already says the cost of drift is real: ${whyNow}`
    : "The current version of you is still choosing comfort over proof.";
}

function detectLeverage(profile, bottleneck) {
  if (bottleneck.includes("attention")) {
    return "Protect one non-negotiable deep-work block before entertainment for the next 7 days and treat phone friction as the first habit, not the last.";
  }
  if (bottleneck.includes("recovery")) {
    return "Stabilize wake time before trying to add more ambition, training volume, or side goals.";
  }
  if (bottleneck.includes("Financial")) {
    return "Create one truthful money snapshot and one automatic transfer rule before setting any bigger targets.";
  }

  return "Reduce the weekly plan until it survives a normal bad day instead of only working on your best day.";
}

export function buildProfileIntel(profile) {
  const focusDomains = profile.goals.focusDomains || [];
  const blockers = profile.constraints || [];
  const strengths = [];
  const bottlenecks = [];
  const evidence = [
    evidenceLine("Weekly time", profile.schedule.weeklyHoursAvailable),
    evidenceLine("Night phone time", profile.operatingContext.nightlyPhoneHours),
    evidenceLine("Sleep", `${profile.habits.sleepHours} hours`),
    evidenceLine("Avoidance pattern", (profile.behavioralSignals.avoidancePatterns || []).join(", ")),
    evidenceLine("Blockers", summarizeBlockers(profile)),
    evidenceLine("Why now", profile.operatingContext.whyNow)
  ].filter((item) => !item.endsWith(": "));

  if (profile.habits.routineConsistency >= 4) {
    strengths.push("You already know how to hold structure when the plan is simple enough.");
  }
  if ((profile.behavioralSignals.distractionSources || []).length > 0) {
    strengths.push("You can name your distractions instead of pretending they do not exist.");
  }
  if (profile.goals.focusDomains.length >= 2) {
    strengths.push("You can distinguish priority areas instead of trying to fix everything at once.");
  }
  if (!strengths.length) {
    strengths.push("You were willing to answer uncomfortable questions instead of asking for vague motivation.");
  }

  const mainBottleneck = detectMainBottleneck(profile);
  const falseAssumption = detectFalseAssumption(profile, mainBottleneck);
  const uncomfortableTruth = detectUncomfortableTruth(profile, mainBottleneck);
  const highestLeverageBehaviorChange = detectLeverage(profile, mainBottleneck);

  bottlenecks.push(mainBottleneck);
  bottlenecks.push(...blockers.map((item) => `Pressure point: ${item}`));
  if ((profile.behavioralSignals.avoidancePatterns || []).length) {
    bottlenecks.push(`Avoidance loop: ${(profile.behavioralSignals.avoidancePatterns || []).join(", ")}`);
  }

  const confidence = average([
    profile.personality.confidence,
    profile.confidence || 0.7,
    focusDomains.length ? 0.88 : 0.55
  ]);

  return {
    identityStatement: `${profile.occupation} operating inside ${profile.schedule.workSchedule.toLowerCase()} constraints, trying to improve ${focusDomains.join(", ") || "core life systems"} without lying about ${summarizeBlockers(profile).toLowerCase()}.`,
    strengths: strengths.slice(0, 6),
    bottlenecks: bottlenecks.slice(0, 6),
    preferredCoachingMode: `${profile.preferences.communicationStyle} tone with ${profile.preferences.supportIntensity} accountability and weekly proof, not motivational fluff`,
    missingInfo: profile.schemaIssues || [],
    currentDiagnosis: `${mainBottleneck} The pattern is reinforced by ${summarizeBlockers(profile).toLowerCase()} and the schedule described as "${profile.operatingContext.weeklyScheduleReality}".`,
    mainBottleneck,
    falseAssumption,
    uncomfortableTruth,
    highestLeverageBehaviorChange,
    evidence: evidence.slice(0, 8),
    tailoredMessage: `You said you want ${profile.goals.longTermDirection.toLowerCase()}, but the first fight is smaller: stop letting ${mainBottleneck.toLowerCase()}.`,
    confidence
  };
}

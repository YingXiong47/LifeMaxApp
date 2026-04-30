import { clamp } from "../../core/utils/scoring.js";
import { formatTone, listToSentence } from "../../core/utils/formatting.js";

export function parseWeeklyHours(value) {
  if (!value) {
    return 6;
  }

  const explicitRange = String(value).match(/(\d+)\s*-\s*(\d+)/);
  if (explicitRange) {
    return (Number(explicitRange[1]) + Number(explicitRange[2])) / 2;
  }

  const minimum = String(value).match(/(\d+)\+/);
  if (minimum) {
    return Number(minimum[1]) + 3;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 6;
}

export function parseSleepHours(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function parseTrainingFrequency(value) {
  if (!value) {
    return 0;
  }

  const numbers = String(value).match(/\d+/g);
  if (!numbers?.length) {
    return 0;
  }

  return Math.max(...numbers.map(Number));
}

export function parseNightlyPhoneHours(value) {
  if (!value) {
    return 0;
  }

  const numbers = String(value).match(/\d+/g);
  if (!numbers?.length) {
    return 0;
  }

  return Math.max(...numbers.map(Number));
}

export function isLowEnergy(profile) {
  return profile.habits.energyBaseline === "Low" || parseSleepHours(profile.habits.sleepHours) < 6.5;
}

export function isHighStress(profile) {
  return profile.financialBaseline.stressLevel === "High";
}

export function isTightCapacity(profile) {
  return parseWeeklyHours(profile.schedule.weeklyHoursAvailable) <= 5;
}

export function hasVariableSchedule(profile) {
  const schedule = String(profile.schedule.workSchedule || "").toLowerCase();
  return schedule.includes("shift") || schedule.includes("variable") || schedule.includes("overtime");
}

export function focusRank(domain, focusDomains = []) {
  const index = focusDomains.indexOf(domain);
  return index === -1 ? null : index + 1;
}

export function isFocusDomain(profile, domain) {
  return focusRank(domain, profile.goals.focusDomains || []) !== null;
}

export function makeDeadline(profile, fastLabel, normalLabel, slowLabel = normalLabel) {
  if (isLowEnergy(profile) || isTightCapacity(profile)) {
    return slowLabel;
  }

  if (hasVariableSchedule(profile)) {
    return normalLabel;
  }

  return fastLabel;
}

export function makeAction(profile, text) {
  return formatTone(profile.preferences.communicationStyle, profile.preferences.supportIntensity, text);
}

export function summarizeBlockers(profile) {
  const blockers = Array.isArray(profile.constraints) ? profile.constraints : [];
  return blockers.length ? listToSentence(blockers) : "No major blockers were declared.";
}

export function hasBlocker(profile, keywords) {
  const blockers = Array.isArray(profile.constraints) ? profile.constraints : [];
  const haystack = blockers.join(" ").toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

export function confidenceFromSignals(baseScore, boosts = [], penalties = []) {
  const total = baseScore + boosts.reduce((sum, value) => sum + value, 0) - penalties.reduce((sum, value) => sum + value, 0);
  return clamp(Number(total.toFixed(2)), 0.35, 0.94);
}

export function compactBaseline(parts) {
  return parts.filter(Boolean).join(" ");
}

export function makeRecommendation(name, category, reason, cadence) {
  return {
    name,
    category,
    reason,
    ...(cadence ? { cadence } : {})
  };
}

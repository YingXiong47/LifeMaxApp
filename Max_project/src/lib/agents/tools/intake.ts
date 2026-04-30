import "server-only";

import { z } from "zod";
import type { OnboardingAnswers, OnboardingDraft } from "@/lib/schemas/onboarding";
import { onboardingAnswerSchema } from "@/lib/schemas/onboarding";

const REQUIRED_FIELDS = [
  "focusDomains",
  "transformationMode",
  "timeHorizon",
  "communicationStyle",
  "supportIntensity",
  "consentProfileData",
  "ageBracket",
  "occupationCategory",
  "occupation",
  "workSchedule",
  "weeklyHoursAvailable",
  "weeklyScheduleReality",
  "financialStress",
  "routineConsistency",
  "energyBaseline",
  "sleepHours",
  "dietQuality",
  "eatingPattern",
  "trainingFrequency",
  "gymAccess",
  "groomingHabits",
  "build",
  "socialEnergy",
  "riskTolerance",
  "nightlyPhoneHours",
  "distractionSources",
  "avoidancePatterns",
  "stressResponse",
  "socialEnvironment",
  "careerGoal",
  "longTermDirection",
  "blockers",
  "moneyLeaks",
  "whyNow",
  "selfNarrative"
] as const satisfies ReadonlyArray<keyof OnboardingAnswers>;

const OPTIONAL_FIELDS = [
  "financialSnapshot",
  "currentTrackingTools",
  "optionalNote",
  "dataPersistence",
  "autonomousDecisions"
] as const satisfies ReadonlyArray<keyof OnboardingAnswers>;

const CONTRADICTION_CHECKS = [
  {
    message: "Consent is required before a profile or plan can be generated.",
    test: (payload: OnboardingDraft) => payload.consentProfileData !== true
  },
  {
    message: "At least two focus domains are required for the initial roadmap.",
    test: (payload: OnboardingDraft) =>
      Array.isArray(payload.focusDomains) && payload.focusDomains.length > 0 && payload.focusDomains.length < 2
  },
  {
    message: "At least one blocker is required so the planner can model execution friction.",
    test: (payload: OnboardingDraft) =>
      Array.isArray(payload.blockers) && payload.blockers.length === 0
  },
  {
    message: "A 3-5 hour weekly budget cannot realistically support four or five focus domains at once.",
    test: (payload: OnboardingDraft) =>
      payload.weeklyHoursAvailable === "3-5 hours" &&
      Array.isArray(payload.focusDomains) &&
      payload.focusDomains.length >= 4
  },
  {
    message: "Reset mode conflicts with high ambition if the user is sleeping under 6 hours and losing most nights to screens.",
    test: (payload: OnboardingDraft) =>
      payload.transformationMode === "climb" &&
      payload.sleepHours === "5.5" &&
      (payload.nightlyPhoneHours === "3-4 hours" || payload.nightlyPhoneHours === "5+ hours")
  }
] as const;

export const intakeIssueSchema = z.object({
  path: z.string(),
  message: z.string()
});

export const intakeValidationResultSchema = z.object({
  ok: z.boolean(),
  issues: z.array(intakeIssueSchema),
  normalized: onboardingAnswerSchema.nullable()
});

export const intakeMissingRequirementsSchema = z.object({
  requiredMissing: z.array(z.string()),
  optionalMissing: z.array(z.string()),
  contradictions: z.array(z.string()),
  ready: z.boolean()
});

export const intakeSummarySchema = z.object({
  mode: z.enum(["ready", "missing_requirements"]),
  requiredMissing: z.array(z.string()),
  optionalMissing: z.array(z.string()),
  contradictions: z.array(z.string()),
  assumptions: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

export type IntakeValidationResult = z.infer<typeof intakeValidationResultSchema>;
export type IntakeMissingRequirements = z.infer<typeof intakeMissingRequirementsSchema>;
export type IntakeSummary = z.infer<typeof intakeSummarySchema>;

function hasValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null;
}

function scoreCompleteness(requiredMissing: string[], optionalMissing: string[]) {
  const totalFields = REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length;
  const populatedFields = totalFields - requiredMissing.length - optionalMissing.length;

  return Number((populatedFields / totalFields).toFixed(2));
}

export function validateIntakeSchema(payload: unknown): IntakeValidationResult {
  const result = onboardingAnswerSchema.safeParse(payload);

  if (result.success) {
    return {
      ok: true,
      issues: [],
      normalized: result.data
    };
  }

  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    })),
    normalized: null
  };
}

export function listMissingRequirements(payload: OnboardingDraft): IntakeMissingRequirements {
  const requiredMissing = REQUIRED_FIELDS.filter((field) => !hasValue(payload[field]));
  const optionalMissing = OPTIONAL_FIELDS.filter((field) => !hasValue(payload[field]));
  const contradictions = CONTRADICTION_CHECKS.filter((entry) => entry.test(payload)).map(
    (entry) => entry.message
  );

  return {
    requiredMissing,
    optionalMissing,
    contradictions,
    ready: requiredMissing.length === 0 && contradictions.length === 0
  };
}

export function buildIntakeSummary(payload: OnboardingDraft): IntakeSummary {
  const missing = listMissingRequirements(payload);
  const assumptions = [
    payload.autonomousDecisions
      ? "System is configured to propose stronger sequencing and execution defaults."
      : "System should stay in recommendation-first mode until the user approves changes.",
    payload.whyNow && payload.whyNow.trim().length > 0
      ? `Urgency signal: ${payload.whyNow.trim()}`
      : "No urgency signal was supplied, so downstream agents should not assume the user feels immediate pain.",
    payload.dataPersistence
      ? "Progress may be stored for later check-ins and revision cycles."
      : "Profile context should be treated as session-scoped until persistence is approved.",
    Array.isArray(payload.focusDomains) && payload.focusDomains.length > 0
      ? `Selected focus domains: ${payload.focusDomains.join(", ")}.`
      : "No focus domains were supplied, so the planner should avoid domain-specific sequencing."
  ];

  return {
    mode: missing.ready ? "ready" : "missing_requirements",
    requiredMissing: missing.requiredMissing,
    optionalMissing: missing.optionalMissing,
    contradictions: missing.contradictions,
    assumptions,
    confidence: scoreCompleteness(missing.requiredMissing, missing.optionalMissing)
  };
}

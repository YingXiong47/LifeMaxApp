import { z } from "zod";
import type { StepDefinition } from "@/lib/content/onboarding";

export const onboardingAnswerSchema = z.object({
  focusDomains: z.array(z.string()).min(2),
  transformationMode: z.string(),
  timeHorizon: z.string(),
  communicationStyle: z.string(),
  supportIntensity: z.string(),
  consentProfileData: z.literal(true, "Consent is required to build the first plan."),
  ageBracket: z.string(),
  occupationCategory: z.string(),
  occupation: z.string().min(1),
  workSchedule: z.string(),
  weeklyHoursAvailable: z.string(),
  weeklyScheduleReality: z.string().min(1),
  financialStress: z.string(),
  routineConsistency: z.number().min(1).max(5),
  energyBaseline: z.string(),
  sleepHours: z.string(),
  dietQuality: z.string(),
  eatingPattern: z.string(),
  trainingFrequency: z.string(),
  gymAccess: z.string(),
  groomingHabits: z.string(),
  build: z.string(),
  socialEnergy: z.number().min(1).max(5),
  riskTolerance: z.number().min(1).max(5),
  nightlyPhoneHours: z.string(),
  distractionSources: z.array(z.string()).min(1),
  avoidancePatterns: z.array(z.string()).min(1),
  stressResponse: z.array(z.string()).min(1),
  socialEnvironment: z.string(),
  careerGoal: z.string(),
  longTermDirection: z.string(),
  blockers: z.array(z.string()).min(1),
  moneyLeaks: z.array(z.string()).min(1),
  whyNow: z.string().min(1),
  selfNarrative: z.string().min(1),
  financialSnapshot: z.string().optional(),
  currentTrackingTools: z.string().optional(),
  optionalNote: z.string().optional(),
  dataPersistence: z.boolean().optional(),
  autonomousDecisions: z.boolean().optional()
});

export type OnboardingAnswers = z.infer<typeof onboardingAnswerSchema>;
export type OnboardingDraft = Partial<OnboardingAnswers>;

export const defaultOnboardingAnswers: OnboardingDraft = {
  focusDomains: ["career", "health"],
  transformationMode: "reset",
  timeHorizon: "90 days",
  communicationStyle: "direct",
  supportIntensity: "steady",
  consentProfileData: false as never,
  ageBracket: "25-34",
  occupationCategory: "Operator",
  occupation: "",
  workSchedule: "Structured weekdays",
  weeklyHoursAvailable: "6-10 hours",
  weeklyScheduleReality: "",
  financialStress: "Medium",
  routineConsistency: 3,
  energyBaseline: "Medium",
  sleepHours: "6.5",
  dietQuality: "Mixed",
  eatingPattern: "Mostly reactive",
  trainingFrequency: "1-2 sessions",
  gymAccess: "Basic gym access",
  groomingHabits: "Basic",
  build: "Average",
  socialEnergy: 3,
  riskTolerance: 3,
  nightlyPhoneHours: "3-4 hours",
  distractionSources: ["Phone / social media"],
  avoidancePatterns: ["I wait until I feel like it"],
  stressResponse: ["Stay up too late and numb out with screens"],
  socialEnvironment: "Neutral but not strongly supportive",
  careerGoal: "New role",
  longTermDirection: "Freedom",
  blockers: ["Phone distraction"],
  moneyLeaks: ["Food delivery / convenience spending"],
  whyNow: "",
  selfNarrative: "",
  financialSnapshot: "",
  currentTrackingTools: "",
  optionalNote: "",
  dataPersistence: true,
  autonomousDecisions: false
};

export const onboardingStepSchemas = {
  focus: onboardingAnswerSchema.pick({
    focusDomains: true,
    transformationMode: true,
    timeHorizon: true,
    communicationStyle: true,
    supportIntensity: true,
    consentProfileData: true
  }),
  baseline: onboardingAnswerSchema.pick({
    ageBracket: true,
    occupationCategory: true,
    occupation: true,
    workSchedule: true,
    weeklyHoursAvailable: true,
    weeklyScheduleReality: true,
    financialStress: true,
    routineConsistency: true,
    energyBaseline: true
  }),
  habits: onboardingAnswerSchema.pick({
    sleepHours: true,
    dietQuality: true,
    eatingPattern: true,
    trainingFrequency: true,
    gymAccess: true,
    groomingHabits: true,
    build: true,
    socialEnergy: true,
    riskTolerance: true
  }),
  reality: onboardingAnswerSchema.pick({
    nightlyPhoneHours: true,
    distractionSources: true,
    avoidancePatterns: true,
    stressResponse: true,
    socialEnvironment: true,
    selfNarrative: true
  }),
  constraints: onboardingAnswerSchema.pick({
    careerGoal: true,
    longTermDirection: true,
    blockers: true,
    moneyLeaks: true,
    whyNow: true,
    financialSnapshot: true,
    currentTrackingTools: true,
    optionalNote: true,
    dataPersistence: true,
    autonomousDecisions: true
  })
} satisfies Record<Exclude<StepDefinition["id"], "welcome" | "review" | "processing" | "complete">, z.ZodType<OnboardingDraft>>;

export function ageBracketToAge(bracket: string) {
  return {
    "18-24": 22,
    "25-34": 29,
    "35-44": 39,
    "45+": 49
  }[bracket] || 29;
}

export function toWorkflowInput(answers: OnboardingAnswers) {
  const blockers = answers.blockers || [];
  const primaryGoal =
    answers.transformationMode === "reset"
      ? "Stabilize daily life and rebuild control across the highest-pressure domains"
      : answers.transformationMode === "climb"
        ? "Create upward momentum across the highest-leverage domains"
        : "Protect gains and refine weak spots without adding chaos";

  return {
    objective: `Improve life across ${answers.focusDomains.join(", ")} over ${answers.timeHorizon}.`,
    primaryGoal,
    focusDomains: answers.focusDomains,
    transformationMode: answers.transformationMode,
    timeHorizon: answers.timeHorizon,
    age: String(ageBracketToAge(answers.ageBracket)),
    occupationCategory: answers.occupationCategory,
    occupation: answers.occupation,
    workSchedule: answers.workSchedule,
    weeklyHoursAvailable: answers.weeklyHoursAvailable,
    weeklyScheduleReality: answers.weeklyScheduleReality,
    financialStress: answers.financialStress,
    financialSnapshot: answers.financialSnapshot || "",
    routineConsistency: String(answers.routineConsistency),
    energyBaseline: answers.energyBaseline,
    sleepHours: answers.sleepHours,
    dietQuality: answers.dietQuality,
    eatingPattern: answers.eatingPattern,
    trainingFrequency: answers.trainingFrequency,
    gymAccess: answers.gymAccess,
    groomingHabits: answers.groomingHabits,
    build: answers.build,
    socialEnergy: String(answers.socialEnergy),
    riskTolerance: String(answers.riskTolerance),
    nightlyPhoneHours: answers.nightlyPhoneHours,
    distractionSources: answers.distractionSources,
    avoidancePatterns: answers.avoidancePatterns,
    stressResponse: answers.stressResponse,
    socialEnvironment: answers.socialEnvironment,
    careerGoal: answers.careerGoal,
    longTermDirection: answers.longTermDirection,
    blockers,
    moneyLeaks: answers.moneyLeaks,
    whyNow: answers.whyNow,
    selfNarrative: answers.selfNarrative,
    currentTrackingTools: answers.currentTrackingTools || "",
    constraintOne: blockers[0] || "",
    constraintTwo: blockers[1] || "",
    constraintThree: blockers[2] || "",
    procrastinationTrigger: answers.avoidancePatterns[0] || blockers[0] || "unclear priorities",
    communicationStyle: answers.communicationStyle,
    supportIntensity: answers.supportIntensity,
    consentProfileData: Boolean(answers.consentProfileData),
    dataPersistence: Boolean(answers.dataPersistence),
    autonomousDecisions: Boolean(answers.autonomousDecisions),
    existingProgress: answers.optionalNote || "",
    knownPersonalityType: ""
  };
}

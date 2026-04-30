import { z } from "zod";
import type { StepDefinition } from "@/lib/content/onboarding";

const requiredSelection = (message: string) => z.string().trim().min(1, message);
const requiredText = (message: string) => z.string().trim().min(1, message);

export const onboardingAnswerSchema = z.object({
  focusDomains: z.array(z.string()).min(2, "Pick at least two focus domains."),
  transformationMode: requiredSelection("Choose the kind of help you need."),
  timeHorizon: requiredSelection("Choose the planning window."),
  communicationStyle: requiredSelection("Choose how the system should speak to you."),
  supportIntensity: requiredSelection("Choose how intense the recommendations should feel."),
  consentProfileData: z.boolean().refine((value) => value === true, {
    message: "Consent is required to build the first plan."
  }),
  occupationCategory: requiredSelection("Choose your current role context."),
  occupation: requiredText("Enter your specific role."),
  workSchedule: requiredSelection("Choose your work pattern."),
  weeklyHoursAvailable: requiredSelection("Choose how much improvement time you have each week."),
  weeklyScheduleReality: requiredText("Describe what a normal week actually looks like."),
  financialStress: requiredSelection("Choose your current financial pressure."),
  routineConsistency: z.number().min(1).max(5),
  energyBaseline: requiredSelection("Choose your typical daily energy."),
  sleepHours: requiredSelection("Choose your current sleep baseline."),
  dietQuality: requiredSelection("Choose your current diet quality."),
  eatingPattern: requiredSelection("Choose your current eating pattern."),
  trainingFrequency: requiredSelection("Choose your current training frequency."),
  gymAccess: requiredSelection("Choose your current training setup."),
  groomingHabits: requiredSelection("Choose your current grooming baseline."),
  build: requiredSelection("Choose the body description that fits best right now."),
  socialEnergy: z.number().min(1).max(5),
  riskTolerance: z.number().min(1).max(5),
  nightlyPhoneHours: requiredSelection("Choose how much phone time usually leaks into your nights."),
  distractionSources: z.array(z.string()).min(1, "Choose at least one distraction source."),
  avoidancePatterns: z.array(z.string()).min(1, "Choose at least one avoidance pattern."),
  stressResponse: z.array(z.string()).min(1, "Choose at least one stress response."),
  socialEnvironment: requiredSelection("Choose the social environment that fits best."),
  careerGoal: requiredText("Enter the career goal the system should optimize around."),
  longTermDirection: requiredText("Enter the longer-term direction you care about."),
  blockers: z.array(z.string()).min(1, "Choose at least one blocker."),
  moneyLeaks: z.array(z.string()).min(1, "Choose at least one money leak."),
  whyNow: requiredText("Explain why this needs to change now."),
  selfNarrative: requiredText("Describe the story you keep telling yourself."),
  financialSnapshot: z.string().optional(),
  currentTrackingTools: z.string().optional(),
  optionalNote: z.string().optional(),
  dataPersistence: z.boolean().optional(),
  autonomousDecisions: z.boolean().optional()
});

export type OnboardingAnswers = z.infer<typeof onboardingAnswerSchema>;
export type OnboardingDraft = Partial<OnboardingAnswers>;

export const defaultOnboardingAnswers: OnboardingDraft = {
  focusDomains: [],
  transformationMode: "",
  timeHorizon: "",
  communicationStyle: "",
  supportIntensity: "",
  consentProfileData: false,
  occupationCategory: "",
  occupation: "",
  workSchedule: "",
  weeklyHoursAvailable: "",
  weeklyScheduleReality: "",
  financialStress: "",
  routineConsistency: 3,
  energyBaseline: "",
  sleepHours: "",
  dietQuality: "",
  eatingPattern: "",
  trainingFrequency: "",
  gymAccess: "",
  groomingHabits: "",
  build: "",
  socialEnergy: 3,
  riskTolerance: 3,
  nightlyPhoneHours: "",
  distractionSources: [],
  avoidancePatterns: [],
  stressResponse: [],
  socialEnvironment: "",
  careerGoal: "",
  longTermDirection: "",
  blockers: [],
  moneyLeaks: [],
  whyNow: "",
  selfNarrative: "",
  financialSnapshot: "",
  currentTrackingTools: "",
  optionalNote: "",
  dataPersistence: false,
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
    age: "29",
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

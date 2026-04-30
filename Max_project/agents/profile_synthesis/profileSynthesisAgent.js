import { validateProfile } from "../../core/schemas/profileSchema.js";
import { scoreCompleteness } from "../../core/utils/scoring.js";

export function synthesizeProfile(input, personality) {
  const profile = {
    demographic: {
      age: input.age,
      occupation: input.occupation
    },
    age: input.age,
    occupation: input.occupation,
    schedule: {
      workSchedule: input.workSchedule,
      weeklyHoursAvailable: input.weeklyHoursAvailable || "Not specified"
    },
    occupationCategory: input.occupationCategory || "Generalist",
    physicalBaseline: {
      height: input.height || "Not provided",
      eyeColor: input.eyeColor || "Not provided",
      build: input.build || "Not provided",
      groomingHabits: input.groomingHabits || "Needs review"
    },
    financialBaseline: {
      snapshot: input.financialSnapshot || "Incomplete",
      stressLevel: input.financialStress || "Unknown"
    },
    habits: {
      sleepHours: input.sleepHours || "Unknown",
      dietQuality: input.dietQuality || "Unknown",
      eatingPattern: input.eatingPattern || "Unknown",
      trainingFrequency: input.trainingFrequency || "Unknown",
      gymAccess: input.gymAccess || "Unknown",
      routineConsistency: Number(input.routineConsistency || 3),
      energyBaseline: input.energyBaseline || "Medium"
    },
    operatingContext: {
      weeklyScheduleReality: input.weeklyScheduleReality || "Not provided",
      nightlyPhoneHours: input.nightlyPhoneHours || "Unknown",
      socialEnvironment: input.socialEnvironment || "Unknown",
      whyNow: input.whyNow || "Not provided",
      selfNarrative: input.selfNarrative || "Not provided",
      currentTrackingTools: input.currentTrackingTools || "None"
    },
    behavioralSignals: {
      distractionSources: input.distractionSources || [],
      avoidancePatterns: input.avoidancePatterns || [],
      stressResponse: input.stressResponse || [],
      moneyLeaks: input.moneyLeaks || []
    },
    personality,
    goals: {
      primaryGoal: input.primaryGoal,
      careerGoal: input.careerGoal,
      longTermDirection: input.longTermDirection,
      focusDomains: input.focusDomains || [],
      timeHorizon: input.timeHorizon || "90 days",
      transformationMode: input.transformationMode || "reset"
    },
    constraints: (input.blockers && input.blockers.length
      ? input.blockers
      : [input.constraintOne, input.constraintTwo, input.constraintThree]
    ).filter(Boolean),
    preferences: {
      communicationStyle: input.communicationStyle || "direct",
      supportIntensity: input.supportIntensity || "steady",
      autonomousDecisions: Boolean(input.autonomousDecisions)
    },
    progressHistory: input.existingProgress ? [input.existingProgress] : []
  };

  const completeness = scoreCompleteness([
    input.age,
    input.occupation,
    input.workSchedule,
    input.primaryGoal,
    input.sleepHours,
    input.nightlyPhoneHours,
    input.weeklyScheduleReality,
    input.financialSnapshot,
    input.weeklyHoursAvailable
  ]);
  const validation = validateProfile(profile);

  return {
    profile,
    confidence: validation.valid ? completeness : completeness * 0.8,
    schemaIssues: validation.missing
  };
}

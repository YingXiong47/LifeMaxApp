import { scoreCompleteness } from "../../core/utils/scoring.js";

const REQUIRED_FIELDS = [
  "objective",
  "age",
  "occupation",
  "workSchedule",
  "primaryGoal",
  "focusDomains",
  "weeklyScheduleReality",
  "nightlyPhoneHours",
  "distractionSources",
  "avoidancePatterns",
  "whyNow",
  "selfNarrative"
];
const OPTIONAL_FIELDS = [
  "groomingHabits",
  "sleepHours",
  "dietQuality",
  "eatingPattern",
  "trainingFrequency",
  "financialSnapshot",
  "knownPersonalityType",
  "blockers",
  "timeHorizon",
  "moneyLeaks",
  "currentTrackingTools"
];

export function runIntake(input) {
  if (!input.consentProfileData) {
    return {
      mode: "missing_requirements",
      requiredMissing: ["consentProfileData"],
      optionalMissing: [],
      confidence: 0,
      assumptions: ["No personal profile data can be processed without explicit consent."]
    };
  }

  const requiredMissing = REQUIRED_FIELDS.filter((field) => !input[field]);
  const optionalMissing = OPTIONAL_FIELDS.filter((field) => !input[field]);
  const confidence = scoreCompleteness(
    REQUIRED_FIELDS.map((field) => input[field]).concat(
      OPTIONAL_FIELDS.map((field) => input[field])
    )
  );

  return {
    mode: requiredMissing.length ? "missing_requirements" : "ready",
    requiredMissing,
    optionalMissing,
    confidence,
    assumptions: [
      input.autonomousDecisions
        ? "System is configured for recommendation-first behavior with user approval gates."
        : "System will stay in recommendation-only mode.",
      input.dataPersistence
        ? "Profile data may be stored locally in the browser for iterative use."
        : "Profile data should be treated as session-scoped.",
      input.whyNow
        ? `Urgency statement captured: ${input.whyNow}`
        : "No urgency statement captured, so downstream planners should challenge passive goals.",
      input.focusDomains?.length
        ? `Primary focus domains selected: ${input.focusDomains.join(", ")}.`
        : "No explicit focus domains selected, so the planner will balance the core domains."
    ]
  };
}

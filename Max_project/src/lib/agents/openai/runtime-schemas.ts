import { z } from "zod";

const confidenceSchema = z.number().min(0).max(1);
const domainSchema = z.enum(["looks", "health", "career", "finance", "routine"]);

export const recommendationToolSchema = z.object({
  name: z.string(),
  category: z.enum(["app", "service", "habit", "meal", "training", "money-system", "environment"]),
  reason: z.string(),
  cadence: z.string().optional()
});

export const personalityAssessmentSchema = z.object({
  personalityType: z.string(),
  motivationStyle: z.string(),
  decisionPattern: z.string(),
  stressTriggers: z.array(z.string()).max(6),
  coachingLevers: z.array(z.string()).max(6),
  blindSpots: z.array(z.string()).max(6),
  confidence: confidenceSchema
});

export const structuredProfileSchema = z.object({
  demographic: z.object({
    age: z.string(),
    occupation: z.string()
  }),
  age: z.string(),
  occupation: z.string(),
  schedule: z.object({
    workSchedule: z.string(),
    weeklyHoursAvailable: z.string()
  }),
  occupationCategory: z.string(),
  physicalBaseline: z.object({
    height: z.string(),
    eyeColor: z.string(),
    build: z.string(),
    groomingHabits: z.string()
  }),
  financialBaseline: z.object({
    snapshot: z.string(),
    stressLevel: z.string()
  }),
  habits: z.object({
    sleepHours: z.string(),
    dietQuality: z.string(),
    eatingPattern: z.string(),
    trainingFrequency: z.string(),
    gymAccess: z.string(),
    routineConsistency: z.number().min(1).max(5),
    energyBaseline: z.string()
  }),
  operatingContext: z.object({
    weeklyScheduleReality: z.string(),
    nightlyPhoneHours: z.string(),
    socialEnvironment: z.string(),
    whyNow: z.string(),
    selfNarrative: z.string(),
    currentTrackingTools: z.string()
  }),
  behavioralSignals: z.object({
    distractionSources: z.array(z.string()).min(1),
    avoidancePatterns: z.array(z.string()).min(1),
    stressResponse: z.array(z.string()).min(1),
    moneyLeaks: z.array(z.string()).min(1)
  }),
  personality: personalityAssessmentSchema,
  goals: z.object({
    primaryGoal: z.string(),
    careerGoal: z.string(),
    longTermDirection: z.string(),
    focusDomains: z.array(domainSchema).min(2).max(5),
    timeHorizon: z.string(),
    transformationMode: z.string()
  }),
  constraints: z.array(z.string()),
  preferences: z.object({
    communicationStyle: z.string(),
    supportIntensity: z.string(),
    autonomousDecisions: z.boolean()
  }),
  progressHistory: z.array(z.string())
});

export const structuredProfileResultSchema = z.object({
  profile: structuredProfileSchema,
  confidence: confidenceSchema,
  schemaIssues: z.array(z.string())
});

export const profileIntelSchema = z.object({
  identityStatement: z.string(),
  strengths: z.array(z.string()).min(1).max(6),
  bottlenecks: z.array(z.string()).min(1).max(6),
  preferredCoachingMode: z.string(),
  missingInfo: z.array(z.string()),
  currentDiagnosis: z.string(),
  mainBottleneck: z.string(),
  falseAssumption: z.string(),
  uncomfortableTruth: z.string(),
  highestLeverageBehaviorChange: z.string(),
  evidence: z.array(z.string()).min(3).max(8),
  tailoredMessage: z.string(),
  confidence: confidenceSchema
});

export const strategyPhaseSchema = z.object({
  name: z.string(),
  duration: z.string(),
  goals: z.array(z.string()).min(1).max(5),
  exitCriteria: z.string()
});

export const strategyPrioritySchema = z.object({
  domain: domainSchema,
  score: confidenceSchema,
  why: z.string()
});

export const strategyRoadmapSchema = z.object({
  operatingSystem: z.string(),
  executiveSummary: z.string(),
  assumptions: z.array(z.string()).min(1).max(6),
  phases: z.array(strategyPhaseSchema).length(3),
  priorities: z.array(strategyPrioritySchema).length(5),
  whyNow: z.string(),
  realityCheck: z.string(),
  whatToIgnore: z.array(z.string()).min(2).max(6),
  confidence: confidenceSchema
});

export const planActionItemSchema = z.object({
  task: z.string(),
  metric: z.string(),
  deadline: z.string()
});

export const planMetricSchema = z.object({
  name: z.string(),
  target: z.string()
});

export const domainPlanSchema = z.object({
  domain: domainSchema,
  targetOutcome: z.string(),
  currentBaseline: z.string(),
  rootIssue: z.string(),
  whyNow: z.string(),
  evidence: z.array(z.string()).min(2).max(5),
  actionItems: z.array(planActionItemSchema).min(3).max(4),
  kpiMetrics: z.array(planMetricSchema).min(2).max(4),
  failurePattern: z.string(),
  adjustmentRule: z.string(),
  recommendedTools: z.array(recommendationToolSchema).min(1).max(4),
  reviewPeriod: z.string(),
  confidenceScore: confidenceSchema,
  riskFlags: z.array(z.string()).max(6)
});

export const domainPlanningResultSchema = z.object({
  plans: z.array(domainPlanSchema).length(5),
  crossDomainRisks: z.array(z.string()).max(8),
  confidence: confidenceSchema
});

export const trackerReviewSchema = z.object({
  headline: z.string(),
  focusForNextWeek: z.string(),
  ratio: confidenceSchema
});

export const trackerOverlaySchema = z.object({
  weeklyReview: trackerReviewSchema,
  executionNotes: z.array(z.string()).max(6),
  dailyCheckpoints: z.array(z.string()).min(3).max(6),
  weeklyFocuses: z.array(z.string()).min(2).max(5),
  failureTriggers: z.array(z.string()).min(3).max(6),
  adjustmentRules: z.array(z.string()).min(3).max(6),
  nextReviewQuestions: z.array(z.string()).min(4).max(8),
  confidence: confidenceSchema
});

export const failedTestSchema = z.object({
  failedComponent: z.string(),
  inputContext: z.string(),
  observedBehavior: z.string(),
  expectedBehavior: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  recommendedFixPath: z.string()
});

export const testingSummarySchema = z.object({
  passedUnitTests: z.array(z.string()),
  failedTests: z.array(failedTestSchema),
  integrationCoverage: z.array(z.string()),
  unresolvedEdgeCases: z.array(z.string()),
  confidence: confidenceSchema
});

export const evaluationCriteriaSchema = z.object({
  specificity: confidenceSchema,
  realism: confidenceSchema,
  actionability: confidenceSchema,
  userFit: confidenceSchema,
  consistency: confidenceSchema
});

export const evaluationResultSchema = z.object({
  overallConfidence: confidenceSchema,
  criteria: evaluationCriteriaSchema,
  risks: z.array(z.string()).min(1),
  refactors: z.array(z.string()).min(1).max(6),
  confidence: confidenceSchema
});

export const compilerResultSchema = z.object({
  workflowStatus: z.enum(["Complete", "Clarification recommended"]),
  technicalDebtReport: z.array(z.string()).min(3).max(6),
  suggestedNextIterationRoadmap: z.array(z.string()).min(3).max(6),
  operatorMessage: z.string(),
  confidence: confidenceSchema
});

export type PersonalityAssessment = z.infer<typeof personalityAssessmentSchema>;
export type StructuredProfileResult = z.infer<typeof structuredProfileResultSchema>;
export type ProfileIntel = z.infer<typeof profileIntelSchema>;
export type StrategyRoadmap = z.infer<typeof strategyRoadmapSchema>;
export type DomainPlanningResult = z.infer<typeof domainPlanningResultSchema>;
export type TrackerOverlay = z.infer<typeof trackerOverlaySchema>;
export type TestingSummary = z.infer<typeof testingSummarySchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type CompilerResult = z.infer<typeof compilerResultSchema>;

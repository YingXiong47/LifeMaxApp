import assert from "node:assert/strict";
import { runWorkflow } from "../../agents/orchestrator/orchestratorAgent.js";
import { updatePlanProgress } from "../../agents/tracking/progressTrackerAgent.js";

const completeInput = {
  objective: "Improve life systems",
  primaryGoal: "More structure and better health",
  careerGoal: "Move into a higher-leverage role",
  longTermDirection: "Create long-term stability",
  focusDomains: ["career", "finance", "health"],
  blockers: ["Phone distraction", "Money pressure"],
  timeHorizon: "90 days",
  transformationMode: "reset",
  age: "30",
  occupation: "Engineer",
  occupationCategory: "Operator",
  workSchedule: "Weekdays 9-6",
  weeklyHoursAvailable: "10",
  height: "182 cm",
  eyeColor: "Brown",
  build: "Athletic",
  groomingHabits: "Consistent",
  sleepHours: "7",
  dietQuality: "Mostly clean",
  trainingFrequency: "3 sessions weekly",
  eatingPattern: "Two reliable meals, dinner often late",
  gymAccess: "Full gym",
  financialSnapshot: "Income, debt, and savings tracked",
  financialStress: "Medium",
  energyBaseline: "Medium",
  routineConsistency: "4",
  riskTolerance: "4",
  socialEnergy: "3",
  weeklyScheduleReality: "Weekdays are front-loaded with meetings; evenings are inconsistent if sleep slips.",
  nightlyPhoneHours: "2-3 hours",
  distractionSources: ["Phone", "YouTube"],
  avoidancePatterns: ["Overplanning", "Task switching"],
  stressResponse: ["Doom scrolling", "Delay the hard task"],
  socialEnvironment: "Supportive partner, peers are not highly disciplined",
  moneyLeaks: ["Delivery food", "Small impulse purchases"],
  whyNow: "Current pace is creating stress and visible slippage.",
  selfNarrative: "I tell myself I work better under pressure, but it usually means I delayed too long.",
  currentTrackingTools: "Apple Notes and calendar reminders",
  procrastinationTrigger: "Too many open loops",
  communicationStyle: "analytical",
  supportIntensity: "steady",
  consentProfileData: true,
  dataPersistence: true,
  autonomousDecisions: false
};

const missingConsentInput = {
  ...completeInput,
  primaryGoal: "More structure",
  consentProfileData: false
};

const partialFinanceInput = {
  ...completeInput,
  financialSnapshot: "",
  financialStress: ""
};

function run() {
  const full = runWorkflow(completeInput);
  assert.equal(full.workflowStatus, "Complete");
  assert.ok(full.buildPackage);
  assert.equal(full.buildPackage.plans.length, 5);
  assert.ok(full.buildPackage.tasks.every((task) => task.metric));
  assert.equal(full.buildPackage.tracker.summary.totalTasks, full.buildPackage.tasks.length);
  assert.ok(full.buildPackage.profileIntel.identityStatement);
  assert.ok(full.buildPackage.strategyRoadmap.phases.length >= 3);

  const missingConsent = runWorkflow(missingConsentInput);
  assert.equal(missingConsent.workflowStatus, "Missing Requirements mode");
  assert.deepEqual(missingConsent.missingRequirements, ["consentProfileData"]);

  const partial = runWorkflow(partialFinanceInput);
  const financePlan = partial.buildPackage.plans.find((plan) => plan.domain === "finance");
  assert.ok(financePlan);
  assert.ok(financePlan.confidenceScore >= 0.59);
  assert.ok(financePlan.riskFlags.includes("Financial data incomplete"));

  assert.ok(
    full.buildPackage.testResultsSummary.passedUnitTests.includes("Profile schema population")
  );

  const firstTask = full.buildPackage.tracker.tasks[0];
  const updated = updatePlanProgress(full.buildPackage, firstTask.id, "done");
  assert.equal(updated.tracker.summary.completedCount, 1);
  assert.equal(updated.tracker.tasks[0].status, "done");

  console.log("All LifeMax OS tests passed.");
}

run();

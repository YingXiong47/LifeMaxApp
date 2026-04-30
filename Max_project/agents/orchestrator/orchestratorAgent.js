import { createLog } from "../../core/utils/logger.js";
import { runIntake } from "../intake/intakeAgent.js";
import { assessPersonality } from "../personality/personalityAgent.js";
import { synthesizeProfile } from "../profile_synthesis/profileSynthesisAgent.js";
import { buildProfileIntel } from "../profile_synthesis/profileBuilderAgent.js";
import { buildLooksPlan } from "../looks/looksAgent.js";
import { buildCareerPlan } from "../career/careerAgent.js";
import { buildFinancePlan } from "../finance/financeAgent.js";
import { buildRoutinePlan } from "../routine/routineAgent.js";
import { buildHealthPlan } from "../health/healthAgent.js";
import { buildStrategyRoadmap } from "../planning/strategyPlannerAgent.js";
import { initializeTracker } from "../tracking/progressTrackerAgent.js";
import { runTesting } from "../testing/testingAgent.js";
import { evaluateBuild } from "../evaluation/evaluationAgent.js";
import { compileBuildPackage } from "../compiler/recommendationCompilerAgent.js";

const milestones = [
  "User intake and consent",
  "Core profile generation",
  "Domain-specific assessment",
  "Personalized planning",
  "Task generation",
  "Evaluation and refinement",
  "Output packaging"
];

export function runWorkflow(input, previousState = null) {
  const logs = [];
  const errorsEncountered = [];
  const executionDurations = {};
  const agentsInvoked = [];
  const iterationLog = [];
  const agentRoster = [];

  function invoke(agentName, inputSummary, handler) {
    const startedAt = new Date().toISOString();
    try {
      const result = handler();
      const log = createLog(agentName, inputSummary, "completed", startedAt, true);
      logs.push(log);
      agentsInvoked.push(agentName);
      executionDurations[agentName] = log.durationMs;
      agentRoster.push({
        agentName,
        status: "ready",
        confidence: typeof result?.confidence === "number" ? result.confidence : null
      });
      return result;
    } catch (error) {
      const log = createLog(agentName, inputSummary, "failed", startedAt, false, {
        errorMessage: error.message
      });
      logs.push(log);
      agentsInvoked.push(agentName);
      executionDurations[agentName] = log.durationMs;
      agentRoster.push({
        agentName,
        status: "failed",
        confidence: null
      });
      errorsEncountered.push(`${agentName}: ${error.message}`);
      throw error;
    }
  }

  const intake = invoke("Intake Agent", "Validate consent and baseline inputs", () => runIntake(input));
  if (intake.mode === "missing_requirements") {
    iterationLog.push("Iteration 1: routed to Missing Requirements mode");
    return {
      milestones,
      milestoneStatus: milestones.map((step, index) => ({
        step,
        status: index === 0 ? "attention" : "pending"
      })),
      workflowStatus: "Missing Requirements mode",
      missingRequirements: intake.requiredMissing,
      assumptions: intake.assumptions,
      logs,
      iterationLog,
      buildPackage: null
    };
  }

  const personality = invoke("Personality Assessment Agent", "Assess user tendencies", () =>
    assessPersonality(input)
  );
  const synthesis = invoke("Profile Synthesis Agent", "Merge input into structured profile", () =>
    synthesizeProfile(input, personality)
  );
  synthesis.profile.confidence = synthesis.confidence;
  synthesis.profile.schemaIssues = synthesis.schemaIssues;
  const profileIntel = invoke("Profile Builder Agent", "Turn profile data into actionable user intelligence", () =>
    buildProfileIntel(synthesis.profile)
  );
  const strategy = invoke("Strategy Planner Agent", "Sequence phases and priorities", () =>
    buildStrategyRoadmap(synthesis.profile)
  );

  let plans = invoke("Domain Planning Layer", "Generate specialist domain plans", () => [
    buildLooksPlan(synthesis.profile),
    buildHealthPlan(synthesis.profile),
    buildCareerPlan(synthesis.profile),
    buildFinancePlan(synthesis.profile),
    buildRoutinePlan(synthesis.profile)
  ]);

  const lowConfidenceFinance = plans.find(
    (plan) => plan.domain === "finance" && plan.confidenceScore < 0.55
  );

  if (lowConfidenceFinance) {
    iterationLog.push("Iteration 1: finance plan retried with narrowed scope due to incomplete baseline");
    plans = plans.map((plan) =>
      plan.domain === "finance" ? buildFinancePlan(synthesis.profile, { narrowedScope: true }) : plan
    );
  }

  const tracker = invoke("Progress Tracker Agent", "Create persistent task tracker and weekly review state", () =>
    initializeTracker(plans, previousState?.latestRun?.buildPackage)
  );

  const testing = invoke("Testing Agent", "Validate contracts and output coverage", () =>
    runTesting(plans, synthesis.profile)
  );
  const evaluation = invoke("Evaluation Agent", "Score quality, risk, and maintainability", () =>
    evaluateBuild(synthesis.profile, plans, testing)
  );

  if (evaluation.overallConfidence < 0.6) {
    iterationLog.push("Iteration 2: confidence below threshold, clarification recommended before escalation");
  }

  const metadata = {
    userId: previousState?.session?.userId || `user-${Date.now()}`,
    agentsInvoked,
    numberOfIterations: iterationLog.length || 1,
    errorsEncountered,
    executionDurations,
    workflowStatus: evaluation.overallConfidence < 0.6 ? "Clarification recommended" : "Complete",
    schemaIssues: synthesis.schemaIssues,
    agentRoster
  };

  const buildPackage = invoke("Recommendation Compiler Agent", "Compile final package", () =>
    compileBuildPackage(
      synthesis.profile,
      plans,
      strategy,
      profileIntel,
      tracker,
      evaluation,
      testing,
      metadata
    )
  );

  return {
    milestones,
    milestoneStatus: milestones.map((step, index) => ({
      step,
      status:
        index < milestones.length - 1
          ? "complete"
          : buildPackage.workflowStatus === "Complete"
            ? "complete"
            : "attention"
    })),
    workflowStatus: buildPackage.workflowStatus,
    missingRequirements: [],
    assumptions: intake.assumptions,
    logs,
    iterationLog: iterationLog.length ? iterationLog : ["Iteration 1: completed without retries"],
    buildPackage
  };
}

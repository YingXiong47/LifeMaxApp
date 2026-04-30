import "server-only";

import { Agent, run } from "@openai/agents";
import { createLog } from "../../../../core/utils/logger.js";
import { average, clamp } from "../../../../core/utils/scoring.js";
import { compileBuildPackage } from "../../../../agents/compiler/recommendationCompilerAgent.js";
import { buildFinancePlan } from "../../../../agents/finance/financeAgent.js";
import { buildHealthPlan } from "../../../../agents/health/healthAgent.js";
import { runIntake } from "../../../../agents/intake/intakeAgent.js";
import { buildLooksPlan } from "../../../../agents/looks/looksAgent.js";
import { assessPersonality } from "../../../../agents/personality/personalityAgent.js";
import { buildStrategyRoadmap } from "../../../../agents/planning/strategyPlannerAgent.js";
import { buildProfileIntel } from "../../../../agents/profile_synthesis/profileBuilderAgent.js";
import { synthesizeProfile } from "../../../../agents/profile_synthesis/profileSynthesisAgent.js";
import { buildCareerPlan } from "../../../../agents/career/careerAgent.js";
import { buildRoutinePlan } from "../../../../agents/routine/routineAgent.js";
import { evaluateBuild } from "../../../../agents/evaluation/evaluationAgent.js";
import { initializeTracker } from "../../../../agents/tracking/progressTrackerAgent.js";
import { runTesting } from "../../../../agents/testing/testingAgent.js";
import { readiness } from "@/lib/env";
import { runIntakeAgent } from "@/lib/agents/openai/intake-agent";
import {
  compilerResultSchema,
  domainPlanSchema,
  domainPlanningResultSchema,
  evaluationResultSchema,
  personalityAssessmentSchema,
  profileIntelSchema,
  strategyRoadmapSchema,
  structuredProfileResultSchema,
  testingSummarySchema,
  trackerOverlaySchema,
  type CompilerResult,
  type DomainPlanningResult,
  type EvaluationResult,
  type PersonalityAssessment,
  type ProfileIntel,
  type StrategyRoadmap,
  type StructuredProfileResult,
  type TestingSummary,
  type TrackerOverlay
} from "@/lib/agents/openai/runtime-schemas";
import { createPlanRun, persistAgentStep, updatePlanRunResult } from "@/lib/repositories/lifemax";
import type { AuthMode } from "@/lib/auth/types";
import type { OnboardingAnswers } from "@/lib/schemas/onboarding";
import { toWorkflowInput } from "@/lib/schemas/onboarding";

const milestones = [
  "User intake and consent",
  "Core profile generation",
  "Domain-specific assessment",
  "Personalized planning",
  "Task generation",
  "Evaluation and refinement",
  "Output packaging"
];

const standardReasoningModel = "gpt-5-mini";

const standardReasoningModelSettings = {
  reasoning: {
    effort: "medium" as const,
    summary: "detailed" as const
  },
  text: {
    verbosity: "medium" as const
  }
};

const lightweightPlanningModel = "gpt-5-mini";
const stageTimeoutMs = 12_000;

const lightweightPlanningModelSettings = {
  reasoning: {
    effort: "medium" as const,
    summary: "detailed" as const
  },
  text: {
    verbosity: "medium" as const
  }
};

const baseLifecycleInstructions = `You are part of the LifeMax OS planning stack.

Rules:
- Use only the provided user data and deterministic draft artifacts.
- Do not invent credentials, finances, diagnoses, achievements, schedule capacity, or compliance.
- Explain why the user is stuck before prescribing what to do.
- Cite user-specific evidence inside the structured fields whenever the schema allows it.
- Make plans specific, measurable, and realistic inside the user's actual capacity.
- Include tradeoffs, failure triggers, and plan adjustments instead of generic encouragement.
- Challenge weak assumptions directly when the user's goals and baseline do not match.
- Avoid empty phrases like "stay consistent" unless you define exactly what consistency means in this case.
- Use behavioral diagnosis, not clinical diagnosis.
- Return only data that matches the requested schema.`;

const personalityAgent = new Agent({
  name: "Personality Assessment Agent",
  instructions: `${baseLifecycleInstructions}

You analyze motivation style, stress patterns, likely blind spots, and the coaching style that will land best.
Keep the framing practical and behavior-based, not clinical.
Name the avoidance style, the stress response, and the condition under which this user usually lies to themselves.`,
  model: standardReasoningModel,
  modelSettings: standardReasoningModelSettings,
  outputType: personalityAssessmentSchema
});

const profileSynthesisAgent = new Agent({
  name: "Profile Synthesis Agent",
  instructions: `${baseLifecycleInstructions}

You refine the canonical LifeMax structured profile. Preserve the existing structure and sharpen weak text fields so they are useful to downstream planners.
Keep the profile faithful to the onboarding data and the draft profile.
Do not smooth over ugly baseline details. Preserve the user's real schedule, recovery, avoidance, and money friction.`,
  model: standardReasoningModel,
  modelSettings: standardReasoningModelSettings,
  outputType: structuredProfileResultSchema
});

const profileBuilderAgent = new Agent({
  name: "Profile Builder Agent",
  instructions: `${baseLifecycleInstructions}

You are the Diagnostic Agent hiding inside the Profile Builder stage.
Convert the structured profile into actionable user intelligence:
- a grounded identity statement
- the current diagnosis
- the main bottleneck
- the false assumption the user is likely making
- one uncomfortable truth
- the highest-leverage behavior change
- evidence lines that directly quote or paraphrase the user's inputs
- the best coaching mode for this user`,
  model: standardReasoningModel,
  modelSettings: standardReasoningModelSettings,
  outputType: profileIntelSchema
});

const strategyPlannerAgent = new Agent({
  name: "Strategy Planner Agent",
  instructions: `${baseLifecycleInstructions}

You are the Strategy Agent.
Create the strategic roadmap. Keep the phase logic narrow, credible, and linked to actual capacity, blockers, and focus domains.
If the user has low capacity or incomplete data, explicitly narrow scope instead of pretending high ambition is feasible.
State what the user should ignore for now. Include one reality check that pushes back on unrealistic ambition.`,
  model: lightweightPlanningModel,
  modelSettings: lightweightPlanningModelSettings,
  outputType: strategyRoadmapSchema
});

const domainPlanningAgent = new Agent({
  name: "Domain Planning Layer",
  instructions: `${baseLifecycleInstructions}

You generate or refine domain plans for looks, health, career, finance, and routine.
Each plan must:
- state a believable target outcome
- describe the current baseline truthfully
- explain the root issue in that domain
- explain why the domain matters now
- cite user evidence that caused the recommendation
- include 3 or 4 action items
- include measurable KPIs
- include a failure pattern and an adjustment rule
- include practical tools, apps, meals, systems, or environment changes when they are useful
- surface risk flags when uncertainty or friction is high

Do not give medical diagnoses or investment advice. Keep recommendations behavioral and operational.`,
  model: lightweightPlanningModel,
  modelSettings: lightweightPlanningModelSettings,
  outputType: domainPlanningResultSchema
});

const financePlannerAgent = new Agent({
  name: "Finance Planner Agent",
  instructions: `${baseLifecycleInstructions}

You refine only the finance plan.
Push for realism, visibility, spending control, automation, and practical money systems.
Do not give investing, tax, or legal advice.`,
  model: lightweightPlanningModel,
  modelSettings: lightweightPlanningModelSettings,
  outputType: domainPlanSchema
});

const looksAgent = new Agent({
  name: "Looks Agent",
  instructions: `${baseLifecycleInstructions}

You refine only the looks plan.
Focus on presentation standards, grooming consistency, style simplicity, and credibility-supporting presentation.
Avoid vanity fluff and keep the routine lightweight enough to survive low-energy weeks.`,
  model: lightweightPlanningModel,
  modelSettings: lightweightPlanningModelSettings,
  outputType: domainPlanSchema
});

const progressTrackerAgent = new Agent({
  name: "Progress Tracker Agent",
  instructions: `${baseLifecycleInstructions}

You are the Execution and Accountability Agent.
Refine the weekly review layer for the existing task tracker. Do not change task ids or task structure.
Return:
- a sharper weekly headline
- a multi-focus weekly emphasis list
- daily checkpoints
- failure triggers
- adjustment rules
- next review questions
- short execution notes that help the user stay on plan.`,
  model: standardReasoningModel,
  modelSettings: standardReasoningModelSettings,
  outputType: trackerOverlaySchema
});

const testingAgent = new Agent({
  name: "Testing Agent",
  instructions: `${baseLifecycleInstructions}

You review the deterministic validation output and return a cleaner test summary.
Be strict about vagueness, missing metrics, missing evidence, and contradictions, but keep the language operational rather than academic.`,
  model: standardReasoningModel,
  modelSettings: standardReasoningModelSettings,
  outputType: testingSummarySchema
});

const evaluationAgent = new Agent({
  name: "Evaluation Agent",
  instructions: `${baseLifecycleInstructions}

You are the Reality Check Agent.
Score quality, risk, and maintainability of the current run.
If confidence is low, say so directly. If a domain is weak because the user's baseline is incomplete, reflect that instead of inflating the score.
Challenge unrealistic goals, excuses, and overbuilt plans.`,
  model: lightweightPlanningModel,
  modelSettings: lightweightPlanningModelSettings,
  outputType: evaluationResultSchema
});

const recommendationCompilerAgent = new Agent({
  name: "Recommendation Compiler Agent",
  instructions: `${baseLifecycleInstructions}

You finalize the operator-facing package notes:
- overall workflow status
- technical debt report
- next-iteration roadmap
- a short operator message describing what this build is strongest at right now

Do not produce motivational filler. The final note should sound like a serious coach who actually read the case.`,
  model: lightweightPlanningModel,
  modelSettings: lightweightPlanningModelSettings,
  outputType: compilerResultSchema
});

type OpenAiWorkflowInput = {
  ownerKey: string;
  authMode: AuthMode;
  answers: OnboardingAnswers;
  previousState?: unknown;
};

type StageArtifact<T> = {
  provider: "openai-agents" | "deterministic-fallback";
  output: T;
};

type AgentRosterItem = {
  agentName: string;
  status: string;
  confidence: number | null;
};

type StageRunnerOptions<T> = {
  runId: string;
  agentName: string;
  stepKey: string;
  inputSummary: string;
  prompt: string;
  agent: any;
  fallback: () => T;
  confidenceOf: (output: T) => number;
  outputSummary: (output: T) => string;
};

function makePrompt(stageGoal: string, payload: unknown) {
  return `${stageGoal}

Return only the structured output requested by the schema.
- Use the user's own inputs as evidence, not generic self-improvement language.
- If the baseline and ambition conflict, side with reality and say so.

Context:
${JSON.stringify(payload, null, 2)}`;
}

function normalizeConfidence(value: number) {
  return clamp(Number.isFinite(value) ? value : 0, 0, 1);
}

async function runWithTimeout<T>(task: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms.`));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function makePersonalityFallback(input: ReturnType<typeof toWorkflowInput>) {
  const draft = assessPersonality(input);
  const coachingLevers = [
    `Use ${String(input.communicationStyle || "direct").toLowerCase()} feedback tied to visible weekly wins.`,
    input.supportIntensity === "intensive"
      ? "Lean into accountability and scoreboards because the user tolerates stronger pressure."
      : "Keep accountability steady and simple so friction does not spike.",
    input.procrastinationTrigger
      ? `Design around ${String(input.procrastinationTrigger).toLowerCase()} because that already shows up as a blocker.`
      : "Reduce ambiguity before asking for more discipline."
  ];
  const blindSpots = [
    "Can drift when the plan stays conceptual for too long.",
    draft.stressTriggers[0] ? `Execution may break around ${draft.stressTriggers[0].toLowerCase()}.` : "Execution can break when friction is hidden.",
    "May overestimate motivation and underestimate environment design."
  ];

  return personalityAssessmentSchema.parse({
    ...draft,
    coachingLevers,
    blindSpots,
    confidence: normalizeConfidence(draft.confidence)
  });
}

function makeStructuredProfileFallback(input: ReturnType<typeof toWorkflowInput>, personality: PersonalityAssessment) {
  const draft = synthesizeProfile(input, personality);
  return structuredProfileResultSchema.parse({
    profile: draft.profile,
    confidence: normalizeConfidence(draft.confidence),
    schemaIssues: draft.schemaIssues || []
  });
}

function makeProfileIntelFallback(profileResult: StructuredProfileResult) {
  const draft = buildProfileIntel({
    ...profileResult.profile,
    confidence: profileResult.confidence,
    schemaIssues: profileResult.schemaIssues
  });
  return profileIntelSchema.parse({
    ...draft,
    strengths: draft.strengths.slice(0, 6),
    bottlenecks: draft.bottlenecks.slice(0, 6),
    missingInfo: draft.missingInfo || [],
    confidence: normalizeConfidence(draft.confidence)
  });
}

function makeStrategyFallback(profileResult: StructuredProfileResult) {
  const draft = buildStrategyRoadmap(profileResult.profile);
  return strategyRoadmapSchema.parse({
    ...draft,
    confidence: normalizeConfidence(draft.confidence)
  });
}

function makeDomainPlanningFallback(profileResult: StructuredProfileResult) {
  const plans = [
    buildLooksPlan(profileResult.profile),
    buildHealthPlan(profileResult.profile),
    buildCareerPlan(profileResult.profile),
    buildFinancePlan(profileResult.profile),
    buildRoutinePlan(profileResult.profile)
  ];

  return domainPlanningResultSchema.parse({
    plans,
    crossDomainRisks: [
      ...new Set(plans.flatMap((plan) => plan.riskFlags))
    ].slice(0, 8),
    confidence: normalizeConfidence(average(plans.map((plan) => plan.confidenceScore)))
  });
}

function normalizeDomainPlans(plans: DomainPlanningResult["plans"]) {
  return plans.map((plan) => {
    if (plan.riskFlags.length > 0) {
      return plan;
    }

    const fallbackRiskByDomain: Record<DomainPlanningResult["plans"][number]["domain"], string> = {
      looks: "Appearance gains will drift if the standard becomes too heavy to maintain on normal weekdays.",
      health: "Health progress will slip unless sleep, meals, and training sessions are placed on the calendar before the week starts.",
      career: "Career progress will stay abstract unless each week produces one visible artifact or one logged outreach action.",
      finance: "Financial progress is fragile until the real baseline is quantified and reviewed on a fixed cadence.",
      routine: "Routine stability depends on active phone friction and a visible shutdown ritual, not motivation alone."
    };

    return {
      ...plan,
      riskFlags: [fallbackRiskByDomain[plan.domain]]
    };
  });
}

function replaceDomainPlan(
  plans: DomainPlanningResult["plans"],
  nextPlan: DomainPlanningResult["plans"][number]
) {
  return plans.map((plan) => (plan.domain === nextPlan.domain ? nextPlan : plan));
}

function makeTrackerFallback(
  plans: DomainPlanningResult["plans"],
  previousBuildPackage: any
) {
  const tracker = initializeTracker(plans, previousBuildPackage);
  const leadPlans = plans.slice(0, 2);
  return {
    tracker,
    overlay: trackerOverlaySchema.parse({
      weeklyReview: tracker.weeklyReview,
      executionNotes: [
        "Close one visible task inside the next 24 hours before adding anything new.",
        "Treat misses as design feedback, not a cue to make the plan more inspiring.",
        "If the night collapses, protect the first clean work block the next morning instead of trying to rescue the whole day."
      ],
      dailyCheckpoints: [
        "Write the first important task before checking entertainment apps.",
        "Protect one block with the phone physically out of reach.",
        "End the day with a two-minute shutdown: next task, workspace reset, alarms set."
      ],
      weeklyFocuses: leadPlans.map((plan) => `Protect ${plan.domain}`).slice(0, 2),
      failureTriggers: [
        "Two missed lead-domain actions in the same week.",
        "Night phone use expands and steals the next morning.",
        "The user keeps planning or organizing instead of shipping visible work."
      ],
      adjustmentRules: [
        "If two misses happen, cut the task size before adding more accountability.",
        "If evenings collapse, move the lead task earlier rather than demanding better discipline at night.",
        "If the week feels chaotic, drop every non-lead task for 7 days and protect only the top domains."
      ],
      nextReviewQuestions: [
        "Which action created visible proof this week?",
        "What did you avoid because it felt exposing, boring, or difficult?",
        "Where did attention leak first?",
        "What needs to be cut next week so the plan becomes harder to ignore?"
      ],
      confidence: normalizeConfidence(tracker.summary.momentumScore)
    })
  };
}

function makeTestingFallback(plans: DomainPlanningResult["plans"], profileResult: StructuredProfileResult) {
  const draft = runTesting(plans, profileResult.profile);
  return testingSummarySchema.parse({
    ...draft,
    confidence: normalizeConfidence(draft.failedTests.length ? 0.62 : 0.82)
  });
}

function makeEvaluationFallback(
  profileResult: StructuredProfileResult,
  plans: DomainPlanningResult["plans"],
  testing: TestingSummary
) {
  const draft = evaluateBuild(profileResult.profile, plans, testing);
  return evaluationResultSchema.parse({
    ...draft,
    confidence: normalizeConfidence(draft.overallConfidence)
  });
}

function makeCompilerFallback(buildPackage: any) {
  return compilerResultSchema.parse({
    workflowStatus: buildPackage.workflowStatus === "Clarification recommended" ? "Clarification recommended" : "Complete",
    technicalDebtReport: buildPackage.technicalDebtReport,
    suggestedNextIterationRoadmap: buildPackage.suggestedNextIterationRoadmap,
    operatorMessage: buildPackage.tracker.weeklyReview.headline,
    confidence: normalizeConfidence(buildPackage.buildSummary.finalConfidenceScore)
  });
}

async function runStage<T>({
  runId,
  agentName,
  stepKey,
  inputSummary,
  prompt,
  agent,
  fallback,
  confidenceOf,
  outputSummary
}: StageRunnerOptions<T>): Promise<StageArtifact<T>> {
  const startedAt = new Date().toISOString();
  let provider: StageArtifact<T>["provider"] = "deterministic-fallback";
  let output: T;

  try {
    if (readiness.openai) {
      const result = await runWithTimeout(run(agent, prompt), stageTimeoutMs, agentName);
      output = result.finalOutput as T;
      provider = "openai-agents";
    } else {
      output = fallback();
    }
  } catch (error) {
    console.error(`${agentName} failed; using deterministic fallback`, error);
    output = fallback();
  }

  const confidence = normalizeConfidence(confidenceOf(output));

  await persistAgentStep({
    runId,
    agentName,
    stepKey,
    status: "ready",
    confidence,
    payload: {
      provider,
      output
    }
  });

  return {
    provider,
    output
  };
}

export async function runOpenAiLifeMaxWorkflow(input: OpenAiWorkflowInput) {
  const previousBuildPackage = (input.previousState as any)?.latestRun?.buildPackage || null;
  const workflowInput = toWorkflowInput(input.answers);
  const logs: any[] = [];
  const iterationLog: string[] = [];
  const agentRoster: AgentRosterItem[] = [];
  const agentsInvoked: string[] = [];
  const executionDurations: Record<string, number> = {};
  const errorsEncountered: string[] = [];

  const runRecord = await createPlanRun({
    ownerKey: input.ownerKey,
    authMode: input.authMode,
    request: input.answers,
    initialResult: {
      workflowStatus: "Running",
      buildPackage: null
    }
  });
  const runId = runRecord.runId;

  function recordStage(agentName: string, inputSummary: string, outputSummary: string, startedAt: string) {
    const log = createLog(agentName, inputSummary, outputSummary, startedAt, true);
    logs.push(log);
    agentsInvoked.push(agentName);
    executionDurations[agentName] = log.durationMs;
    return log;
  }

  function recordFailure(agentName: string, inputSummary: string, startedAt: string, error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    const log = createLog(agentName, inputSummary, "failed", startedAt, false, {
      errorMessage: message
    });
    logs.push(log);
    agentsInvoked.push(agentName);
    executionDurations[agentName] = log.durationMs;
    errorsEncountered.push(`${agentName}: ${message}`);
  }

  try {
    const intakeStartedAt = new Date().toISOString();
    const deterministicIntake = runIntake(workflowInput);
    const intake = runRecord.persisted
      ? await runIntakeAgent(runId)
      : {
          provider: "deterministic-fallback" as const,
          contradictions: [],
          ...deterministicIntake
        };

    recordStage(
      "Intake Agent",
      "Validate consent and baseline inputs",
      intake.mode === "ready" ? "Intake cleared for planning." : "Missing requirements detected.",
      intakeStartedAt
    );
    agentRoster.push({
      agentName: "Intake Agent",
      status: intake.mode === "ready" ? "ready" : "attention",
      confidence: intake.confidence
    });

    if (intake.mode !== "ready") {
      const result = {
        milestones,
        milestoneStatus: milestones.map((step, index) => ({
          step,
          status: index === 0 ? "attention" : "pending"
        })),
        workflowStatus: "Missing Requirements mode",
        missingRequirements: intake.requiredMissing,
        assumptions: intake.assumptions,
        logs,
        agentRoster,
        iterationLog: ["Iteration 1: routed to Missing Requirements mode"],
        buildPackage: null,
        testResultsSummary: null,
        riskAssessment: intake.contradictions || [],
        suggestedNextIterationRoadmap: [
          "Collect the missing intake fields before any planning stage runs.",
          "Resolve contradictions around consent, blockers, or focus domains.",
          "Retry plan generation once the baseline is complete."
        ]
      };

      await updatePlanRunResult(runId, result);
      return { runId, result };
    }

    const personalityStartedAt = new Date().toISOString();
    const personalityStage = await runStage({
      runId,
      agentName: "Personality Assessment Agent",
      stepKey: "personality-assessment",
      inputSummary: "Assess user tendencies and coaching fit",
      prompt: makePrompt(
        "Assess the user's likely motivation pattern, stress triggers, coaching levers, blind spots, and the specific way they avoid discomfort.",
        {
          onboarding: input.answers,
          intake
        }
      ),
      agent: personalityAgent,
      fallback: () => makePersonalityFallback(workflowInput),
      confidenceOf: (output) => personalityAssessmentSchema.parse(output).confidence,
      outputSummary: (output) => personalityAssessmentSchema.parse(output).personalityType
    });
    const personality = personalityAssessmentSchema.parse(personalityStage.output);
    recordStage(
      "Personality Assessment Agent",
      "Assess user tendencies",
      `${personality.personalityType} with ${personality.motivationStyle.toLowerCase()}.`,
      personalityStartedAt
    );
    agentRoster.push({
      agentName: "Personality Assessment Agent",
      status: "ready",
      confidence: personality.confidence
    });

    const profileStartedAt = new Date().toISOString();
    const profileStage = await runStage({
      runId,
      agentName: "Profile Synthesis Agent",
      stepKey: "profile-synthesis",
      inputSummary: "Merge intake into a structured profile",
      prompt: makePrompt(
        "Refine the structured user profile while preserving its schema and keeping every field grounded in the intake data. Do not sanitize ugly details from the baseline.",
        {
          onboarding: input.answers,
          workflowInput,
          deterministicDraft: makeStructuredProfileFallback(workflowInput, personality),
          personality
        }
      ),
      agent: profileSynthesisAgent,
      fallback: () => makeStructuredProfileFallback(workflowInput, personality),
      confidenceOf: (output) => structuredProfileResultSchema.parse(output).confidence,
      outputSummary: (output) => structuredProfileResultSchema.parse(output).profile.goals.primaryGoal,
    });
    const profileResult = structuredProfileResultSchema.parse(profileStage.output);
    recordStage(
      "Profile Synthesis Agent",
      "Merge input into structured profile",
      `Profile ready for ${profileResult.profile.goals.focusDomains.join(", ")}.`,
      profileStartedAt
    );
    agentRoster.push({
      agentName: "Profile Synthesis Agent",
      status: "ready",
      confidence: profileResult.confidence
    });

    const intelStartedAt = new Date().toISOString();
    const intelStage = await runStage({
      runId,
      agentName: "Profile Builder Agent",
      stepKey: "profile-intel",
      inputSummary: "Turn profile data into actionable intelligence",
      prompt: makePrompt(
        "Build the diagnosis layer so downstream planners understand the user's strengths, bottlenecks, false assumptions, uncomfortable truths, and coaching mode.",
        {
          profile: profileResult.profile,
          deterministicDraft: makeProfileIntelFallback(profileResult)
        }
      ),
      agent: profileBuilderAgent,
      fallback: () => makeProfileIntelFallback(profileResult),
      confidenceOf: (output) => profileIntelSchema.parse(output).confidence,
      outputSummary: (output) => profileIntelSchema.parse(output).identityStatement,
    });
    const profileIntel = profileIntelSchema.parse(intelStage.output);
    recordStage(
      "Profile Builder Agent",
      "Turn profile data into actionable user intelligence",
      profileIntel.identityStatement,
      intelStartedAt
    );
    agentRoster.push({
      agentName: "Profile Builder Agent",
      status: "ready",
      confidence: profileIntel.confidence
    });

    const strategyStartedAt = new Date().toISOString();
    const strategyStage = await runStage({
      runId,
      agentName: "Strategy Planner Agent",
      stepKey: "strategy-roadmap",
      inputSummary: "Sequence phases and priorities",
      prompt: makePrompt(
        "Refine the strategic roadmap so the phases, priorities, assumptions, and what-to-ignore list stay realistic for this user. Push back on unrealistic scope.",
        {
          profile: profileResult.profile,
          profileIntel,
          deterministicDraft: makeStrategyFallback(profileResult)
        }
      ),
      agent: strategyPlannerAgent,
      fallback: () => makeStrategyFallback(profileResult),
      confidenceOf: (output) => strategyRoadmapSchema.parse(output).confidence,
      outputSummary: (output) => strategyRoadmapSchema.parse(output).executiveSummary,
    });
    const strategy = strategyRoadmapSchema.parse(strategyStage.output);
    recordStage(
      "Strategy Planner Agent",
      "Sequence phases and priorities",
      strategy.executiveSummary,
      strategyStartedAt
    );
    agentRoster.push({
      agentName: "Strategy Planner Agent",
      status: "ready",
      confidence: strategy.confidence
    });

    const domainStartedAt = new Date().toISOString();
    const domainStage = await runStage({
      runId,
      agentName: "Domain Planning Layer",
      stepKey: "domain-plans",
      inputSummary: "Generate specialist domain plans",
      prompt: makePrompt(
        "Refine the five domain plans using the structured profile, strategy roadmap, and deterministic draft plans. Every recommendation must trace back to the user data and include what failure looks like.",
        {
          profile: profileResult.profile,
          profileIntel,
          strategy,
          deterministicDraft: makeDomainPlanningFallback(profileResult)
        }
      ),
      agent: domainPlanningAgent,
      fallback: () => makeDomainPlanningFallback(profileResult),
      confidenceOf: (output) => domainPlanningResultSchema.parse(output).confidence,
      outputSummary: (output) => {
        const parsed = domainPlanningResultSchema.parse(output);
        return `${parsed.plans.length} domain plans ready.`;
      },
    });
    const rawDomainPlanning = domainPlanningResultSchema.parse(domainStage.output);
    let domainPlanning = domainPlanningResultSchema.parse({
      ...rawDomainPlanning,
      plans: normalizeDomainPlans(rawDomainPlanning.plans)
    });
    recordStage(
      "Domain Planning Layer",
      "Generate specialist domain plans",
      `${domainPlanning.plans.length} plans generated across looks, health, career, finance, and routine.`,
      domainStartedAt
    );
    agentRoster.push({
      agentName: "Domain Planning Layer",
      status: "ready",
      confidence: domainPlanning.confidence
    });

    const currentLooksPlan = domainPlanning.plans.find((plan) => plan.domain === "looks");
    if (currentLooksPlan) {
      const looksStartedAt = new Date().toISOString();
      const looksStage = await runStage({
        runId,
        agentName: "Looks Agent",
        stepKey: "looks-refinement",
        inputSummary: "Refine the looks plan with lightweight model pass",
        prompt: makePrompt(
          "Refine only the looks domain plan. Keep it practical, low-friction, and tied to confidence-supporting presentation rather than vanity.",
          {
            profile: profileResult.profile,
            profileIntel,
            strategy,
            currentPlan: currentLooksPlan
          }
        ),
        agent: looksAgent,
        fallback: () => currentLooksPlan,
        confidenceOf: (output) => domainPlanSchema.parse(output).confidenceScore,
        outputSummary: (output) => domainPlanSchema.parse(output).targetOutcome
      });
      const refinedLooksPlan = domainPlanSchema.parse(looksStage.output);
      domainPlanning = domainPlanningResultSchema.parse({
        ...domainPlanning,
        plans: replaceDomainPlan(domainPlanning.plans, refinedLooksPlan)
      });
      recordStage(
        "Looks Agent",
        "Refine the looks plan",
        refinedLooksPlan.targetOutcome,
        looksStartedAt
      );
      agentRoster.push({
        agentName: "Looks Agent",
        status: "ready",
        confidence: refinedLooksPlan.confidenceScore
      });
    }

    const currentFinancePlan = domainPlanning.plans.find((plan) => plan.domain === "finance");
    if (currentFinancePlan) {
      const financeStartedAt = new Date().toISOString();
      const financeStage = await runStage({
        runId,
        agentName: "Finance Planner Agent",
        stepKey: "finance-refinement",
        inputSummary: "Refine the finance plan with lightweight model pass",
        prompt: makePrompt(
          "Refine only the finance domain plan. Focus on clarity, money leaks, basic budgeting, debt/savings behavior, and automation where useful.",
          {
            profile: profileResult.profile,
            profileIntel,
            strategy,
            currentPlan: currentFinancePlan
          }
        ),
        agent: financePlannerAgent,
        fallback: () => currentFinancePlan,
        confidenceOf: (output) => domainPlanSchema.parse(output).confidenceScore,
        outputSummary: (output) => domainPlanSchema.parse(output).targetOutcome
      });
      const refinedFinancePlan = domainPlanSchema.parse(financeStage.output);
      domainPlanning = domainPlanningResultSchema.parse({
        ...domainPlanning,
        plans: replaceDomainPlan(domainPlanning.plans, refinedFinancePlan)
      });
      recordStage(
        "Finance Planner Agent",
        "Refine the finance plan",
        refinedFinancePlan.targetOutcome,
        financeStartedAt
      );
      agentRoster.push({
        agentName: "Finance Planner Agent",
        status: "ready",
        confidence: refinedFinancePlan.confidenceScore
      });
    }

    const trackerStartedAt = new Date().toISOString();
    const trackerFallback = makeTrackerFallback(domainPlanning.plans, previousBuildPackage);
    const trackerStage = await runStage({
      runId,
      agentName: "Progress Tracker Agent",
      stepKey: "progress-tracker",
      inputSummary: "Create persistent task tracker and weekly review state",
      prompt: makePrompt(
        "Refine the weekly review and accountability layer for the tracker without changing task ids or domain progress structure. Return daily checkpoints, failure triggers, adjustment rules, and next review questions.",
        {
          tracker: trackerFallback.tracker,
          plans: domainPlanning.plans,
          strategy,
          previousBuildPackage: previousBuildPackage
            ? {
                tracker: previousBuildPackage.tracker?.summary,
                buildSummary: previousBuildPackage.buildSummary
              }
            : null
        }
      ),
      agent: progressTrackerAgent,
      fallback: () => trackerFallback.overlay,
      confidenceOf: (output) => trackerOverlaySchema.parse(output).confidence,
      outputSummary: (output) => trackerOverlaySchema.parse(output).weeklyReview.headline,
    });
    const trackerOverlay = trackerOverlaySchema.parse(trackerStage.output);
    const tracker = {
      ...trackerFallback.tracker,
      weeklyReview: trackerOverlay.weeklyReview,
      coachNotes: trackerOverlay.executionNotes,
      dailyCheckpoints: trackerOverlay.dailyCheckpoints,
      weeklyFocuses: trackerOverlay.weeklyFocuses,
      failureTriggers: trackerOverlay.failureTriggers,
      adjustmentRules: trackerOverlay.adjustmentRules,
      nextReviewQuestions: trackerOverlay.nextReviewQuestions
    };
    recordStage(
      "Progress Tracker Agent",
      "Create persistent task tracker and weekly review state",
      tracker.weeklyReview.headline,
      trackerStartedAt
    );
    agentRoster.push({
      agentName: "Progress Tracker Agent",
      status: "ready",
      confidence: trackerOverlay.confidence
    });

    const testingStartedAt = new Date().toISOString();
    const testingStage = await runStage({
      runId,
      agentName: "Testing Agent",
      stepKey: "testing-summary",
      inputSummary: "Validate contracts and output coverage",
      prompt: makePrompt(
        "Review the validation output and return a clean testing summary with clear failed checks and fix paths.",
        {
          profile: profileResult.profile,
          plans: domainPlanning.plans,
          deterministicDraft: makeTestingFallback(domainPlanning.plans, profileResult)
        }
      ),
      agent: testingAgent,
      fallback: () => makeTestingFallback(domainPlanning.plans, profileResult),
      confidenceOf: (output) => testingSummarySchema.parse(output).confidence,
      outputSummary: (output) => {
        const parsed = testingSummarySchema.parse(output);
        return parsed.failedTests.length ? `${parsed.failedTests.length} checks need attention.` : "All checks passed cleanly.";
      },
    });
    const testing = testingSummarySchema.parse(testingStage.output);
    recordStage(
      "Testing Agent",
      "Validate contracts and output coverage",
      testing.failedTests.length ? `${testing.failedTests.length} validation issues surfaced.` : "Validation checks passed.",
      testingStartedAt
    );
    agentRoster.push({
      agentName: "Testing Agent",
      status: "ready",
      confidence: testing.confidence
    });

    const evaluationStartedAt = new Date().toISOString();
    const evaluationStage = await runStage({
      runId,
      agentName: "Evaluation Agent",
      stepKey: "evaluation",
      inputSummary: "Score quality, risk, and maintainability",
      prompt: makePrompt(
        "Evaluate confidence, risk, and maintainability of this run. Keep the score conservative when user data is incomplete or plans still carry risk flags.",
        {
          profile: profileResult.profile,
          strategy,
          plans: domainPlanning.plans,
          testing,
          deterministicDraft: makeEvaluationFallback(profileResult, domainPlanning.plans, testing)
        }
      ),
      agent: evaluationAgent,
      fallback: () => makeEvaluationFallback(profileResult, domainPlanning.plans, testing),
      confidenceOf: (output) => evaluationResultSchema.parse(output).confidence,
      outputSummary: (output) => {
        const parsed = evaluationResultSchema.parse(output);
        return `Overall confidence ${Math.round(parsed.overallConfidence * 100)}%.`;
      },
    });
    const evaluation = evaluationResultSchema.parse(evaluationStage.output);
    recordStage(
      "Evaluation Agent",
      "Score quality, risk, and maintainability",
      `Overall confidence ${Math.round(evaluation.overallConfidence * 100)}%.`,
      evaluationStartedAt
    );
    agentRoster.push({
      agentName: "Evaluation Agent",
      status: "ready",
      confidence: evaluation.confidence
    });

    if (evaluation.overallConfidence < 0.66) {
      iterationLog.push("Iteration 1: evaluation confidence is below the deployment threshold; clarification is recommended.");
    }

    const metadata = {
      userId: input.ownerKey,
      agentsInvoked: [
        "Intake Agent",
        "Personality Assessment Agent",
        "Profile Synthesis Agent",
        "Profile Builder Agent",
        "Strategy Planner Agent",
        "Domain Planning Layer",
        "Looks Agent",
        "Finance Planner Agent",
        "Progress Tracker Agent",
        "Testing Agent",
        "Evaluation Agent",
        "Recommendation Compiler Agent"
      ],
      numberOfIterations: iterationLog.length ? iterationLog.length + 1 : 1,
      errorsEncountered,
      executionDurations,
      workflowStatus: evaluation.overallConfidence < 0.66 ? "Clarification recommended" : "Complete",
      schemaIssues: profileResult.schemaIssues,
      agentRoster
    };

    const draftBuildPackage = compileBuildPackage(
      {
        ...profileResult.profile,
        confidence: profileResult.confidence,
        schemaIssues: profileResult.schemaIssues
      },
      domainPlanning.plans,
      strategy,
      profileIntel,
      tracker,
      evaluation,
      testing,
      metadata
    );

    const compilerStartedAt = new Date().toISOString();
    const compilerStage = await runStage({
      runId,
      agentName: "Recommendation Compiler Agent",
      stepKey: "compiler",
      inputSummary: "Compile final package",
      prompt: makePrompt(
        "Finalize the operator-facing package notes and next-iteration guidance.",
        {
          buildPackage: draftBuildPackage,
          evaluation,
          testing
        }
      ),
      agent: recommendationCompilerAgent,
      fallback: () => makeCompilerFallback(draftBuildPackage),
      confidenceOf: (output) => compilerResultSchema.parse(output).confidence,
      outputSummary: (output) => compilerResultSchema.parse(output).operatorMessage,
    });
    const compiler = compilerResultSchema.parse(compilerStage.output);
    recordStage(
      "Recommendation Compiler Agent",
      "Compile final package",
      compiler.operatorMessage,
      compilerStartedAt
    );
    agentRoster.push({
      agentName: "Recommendation Compiler Agent",
      status: "ready",
      confidence: compiler.confidence
    });

    const buildPackage = {
      ...draftBuildPackage,
      workflowStatus: compiler.workflowStatus,
      technicalDebtReport: compiler.technicalDebtReport,
      suggestedNextIterationRoadmap: compiler.suggestedNextIterationRoadmap,
      buildSummary: {
        ...draftBuildPackage.buildSummary,
        agentsInvoked: metadata.agentsInvoked,
        numberOfIterations: metadata.numberOfIterations,
        errorsEncountered: metadata.errorsEncountered,
        executionDurations: metadata.executionDurations,
        finalConfidenceScore: normalizeConfidence(
          average(
            domainPlanning.plans.map((plan) => plan.confidenceScore).concat([evaluation.overallConfidence, compiler.confidence])
          )
        )
      }
    };

    const result = {
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
      agentRoster,
      iterationLog: iterationLog.length ? iterationLog : ["Iteration 1: completed without retries"],
      buildPackage,
      testResultsSummary: testing,
      riskAssessment: evaluation.risks,
      suggestedNextIterationRoadmap: compiler.suggestedNextIterationRoadmap
    };

    await updatePlanRunResult(runId, result);
    return { runId, result };
  } catch (error) {
    recordFailure("OpenAI planning runtime", "Execute staged planning workflow", new Date().toISOString(), error);

    const failedResult = {
      milestones,
      milestoneStatus: milestones.map((step) => ({
        step,
        status: "attention"
      })),
      workflowStatus: "Clarification recommended",
      missingRequirements: [],
      assumptions: ["The staged agent runtime failed before the package could be completed."],
      logs,
      agentRoster,
      iterationLog,
      buildPackage: null,
      testResultsSummary: null,
      riskAssessment: ["The OpenAI runtime failed before it could compile a complete package."],
      suggestedNextIterationRoadmap: [
        "Inspect the persisted agent step outputs for the last successful stage.",
        "Retry the run after correcting the failing stage or model output.",
        "Fall back to the deterministic planner if the account is rate limited."
      ]
    };

    await updatePlanRunResult(runId, failedResult);
    throw error;
  }
}

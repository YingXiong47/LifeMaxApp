import "server-only";

import OpenAI from "openai";
import { readiness, serverEnv } from "@/lib/env";

export const interactiveAgentKeys = [
  "Strategy Planner Agent",
  "Domain Planning Layer",
  "Finance Planner Agent",
  "Looks Agent",
  "Evaluation Agent",
  "Recommendation Compiler Agent"
] as const;

export type InteractiveAgentKey = (typeof interactiveAgentKeys)[number];

type AgentChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AgentChatRequest = {
  agentKey: InteractiveAgentKey;
  message: string;
  history: AgentChatMessage[];
  buildPackage: any;
};

const lightweightInteractiveModel = "gpt-5-mini";

let client: OpenAI | null = null;

function getClient() {
  if (!readiness.openai || !serverEnv.openAiApiKey) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: serverEnv.openAiApiKey
    });
  }

  return client;
}

function trimHistory(history: AgentChatMessage[]) {
  return history
    .filter((item) => item.content.trim().length)
    .slice(-6)
    .map((item) => `${item.role === "assistant" ? "Agent" : "User"}: ${item.content}`)
    .join("\n");
}

function getDomainPlan(buildPackage: any, domain: string) {
  return Array.isArray(buildPackage?.plans) ? buildPackage.plans.find((plan: any) => plan.domain === domain) : null;
}

function makeContext(agentKey: InteractiveAgentKey, buildPackage: any) {
  const shared = {
    diagnosis: buildPackage?.diagnosticReport,
    executionSystem: buildPackage?.executionSystem,
    strategyRoadmap: buildPackage?.strategyRoadmap,
    profile: {
      occupation: buildPackage?.profile?.occupation,
      focusDomains: buildPackage?.profile?.goals?.focusDomains,
      weeklyHoursAvailable: buildPackage?.profile?.schedule?.weeklyHoursAvailable,
      workSchedule: buildPackage?.profile?.schedule?.workSchedule,
      nightlyPhoneHours: buildPackage?.profile?.operatingContext?.nightlyPhoneHours,
      financialStress: buildPackage?.profile?.financialBaseline?.stressLevel
    }
  };

  if (agentKey === "Finance Planner Agent") {
    return {
      ...shared,
      financePlan: getDomainPlan(buildPackage, "finance")
    };
  }

  if (agentKey === "Looks Agent") {
    return {
      ...shared,
      looksPlan: getDomainPlan(buildPackage, "looks")
    };
  }

  if (agentKey === "Domain Planning Layer") {
    return {
      ...shared,
      plans: buildPackage?.plans
    };
  }

  if (agentKey === "Evaluation Agent") {
    return {
      ...shared,
      risks: buildPackage?.riskAssessment,
      testResultsSummary: buildPackage?.testResultsSummary
    };
  }

  if (agentKey === "Recommendation Compiler Agent") {
    return {
      ...shared,
      suggestedNextIterationRoadmap: buildPackage?.suggestedNextIterationRoadmap,
      technicalDebtReport: buildPackage?.technicalDebtReport
    };
  }

  return shared;
}

function makeInstructions(agentKey: InteractiveAgentKey) {
  const base = `You are ${agentKey} inside LifeMax OS.

Rules:
- Be blunt, useful, and concrete.
- Ground every answer in the supplied user context.
- If the user's plan is unrealistic, say so directly.
- Prefer operational advice: what to do, when to do it, what to track, what failure looks like.
- Avoid motivational filler.
- Keep answers concise enough for an in-app agent panel.
- If asked for recommendations, include practical tools, systems, or behaviors only when they fit the context.`;

  const outputContract = `

Output format:
- Use exactly these section headings in this order:
  Title
  Key Issue
  Constraints
  Plan
  Action Steps
  Risks
  Next Move
- Keep each section compact.
- Under Action Steps, use 2 to 4 numbered items.
- Use polished professional language.
- No slang, no typos, no filler, no emojis.`;

  const byAgent: Record<InteractiveAgentKey, string> = {
    "Strategy Planner Agent":
      "Focus on scope, priorities, sequencing, tradeoffs, and what to ignore.",
    "Domain Planning Layer":
      "Translate diagnosis into domain-specific actions with clear tradeoffs and adjustment rules.",
    "Finance Planner Agent":
      "Focus on money leaks, budgeting, debt, savings behavior, and reducing financial ambiguity without pretending to be an investment advisor.",
    "Looks Agent":
      "Focus on grooming, style, presentation, and confidence-supporting routines without vanity fluff.",
    "Evaluation Agent":
      "Challenge weak assumptions, identify risk, and explain what is still fragile in the plan.",
    "Recommendation Compiler Agent":
      "Turn the whole system into a clear next-move recommendation the user can actually execute this week."
  };

  return `${base}\n\n${byAgent[agentKey]}\n\n${outputContract}`;
}

function normalizeAgentReply(reply: string) {
  const lines = reply
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const normalized = lines
    .map((line) =>
      line
        .replace(/^(title|key issue|constraints|plan|action steps|risks|next move)\s*:/i, (_, heading) => {
          const title = String(heading)
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
          return `## ${title}`;
        })
        .replace(/\s+/g, " ")
    )
    .join("\n\n");

  return normalized.trim();
}

function makeFallbackReply(agentKey: InteractiveAgentKey, buildPackage: any, message: string) {
  const diagnosis = buildPackage?.diagnosticReport;
  const execution = buildPackage?.executionSystem;

  switch (agentKey) {
    case "Finance Planner Agent": {
      const plan = getDomainPlan(buildPackage, "finance");
      return normalizeAgentReply(`
## Title
Finance control pass

## Key Issue
${plan?.rootIssue || diagnosis?.mainBottleneck || "Money visibility is weak."}

## Constraints
${buildPackage?.profile?.financialBaseline?.stressLevel || "Financial stress level is not fully captured."}

## Plan
Reduce ambiguity first, then automate what repeats.

## Action Steps
1. ${plan?.actionItems?.[0]?.task || "Set up one simple money tracker today."}
2. ${plan?.actionItems?.[1]?.task || "Separate fixed costs, variable costs, debt, and savings."}

## Risks
${plan?.adjustmentRule || "If the system is too complex, you will stop using it."}

## Next Move
${message ? `Answer the user's actual question: ${message}` : "Make the next money action visible before the day ends."}
      `);
    }
    case "Looks Agent": {
      const plan = getDomainPlan(buildPackage, "looks");
      return normalizeAgentReply(`
## Title
Presentation control pass

## Key Issue
${plan?.rootIssue || "Presentation is too reactive."}

## Constraints
${cleanSummary(buildPackage?.profile?.hints?.workSchedule) || "Your standard has to survive rushed real-life mornings."}

## Plan
Lower decision friction and make the baseline visible.

## Action Steps
1. ${plan?.actionItems?.[0]?.task || "Define one grooming standard for workdays."}
2. ${plan?.actionItems?.[1]?.task || "Remove one weak outfit and keep three reliable combinations ready."}

## Risks
${plan?.failurePattern || "This area collapses when standards rely on mood instead of preparation."}

## Next Move
Protect tomorrow morning by preparing tonight.
      `);
    }
    case "Evaluation Agent":
      return normalizeAgentReply(`
## Title
Reality check

## Key Issue
${Array.isArray(buildPackage?.riskAssessment) && buildPackage.riskAssessment.length ? buildPackage.riskAssessment[0] : "The plan still depends on honest follow-through."}

## Constraints
${diagnosis?.falseAssumption || "Some parts of the plan still rely on assumptions."}

## Plan
Keep the plan narrow enough to survive normal bad days.

## Action Steps
1. Cut anything that depends on ideal motivation.
2. Keep the first weekly action measurable and visible.

## Risks
${execution?.failureTriggers?.[0] || "Attention drift will break the system before lack of knowledge does."}

## Next Move
Challenge the first weak assumption before expanding the plan.
      `);
    case "Recommendation Compiler Agent":
      return normalizeAgentReply(`
## Title
Next move briefing

## Key Issue
${diagnosis?.currentDiagnosis || "The current package needs a sharper weekly operating rhythm."}

## Constraints
${diagnosis?.falseAssumption || "The system should fit real weekly capacity."}

## Plan
Protect the highest-leverage change and ignore decorative work.

## Action Steps
1. ${diagnosis?.highestLeverageBehaviorChange || "Protect one measurable weekly action."}
2. ${execution?.sevenDayExecutionPlan?.[0]?.action || "Keep the first day small enough to finish."}

## Risks
${execution?.failureTriggers?.[0] || "If the first action stays vague, the whole week softens."}

## Next Move
${execution?.nextReviewQuestions?.[0] || "Ask what would break first if the week gets busy."}
      `);
    default:
      return normalizeAgentReply(`
## Title
Plan refinement

## Key Issue
${diagnosis?.currentDiagnosis || "The plan should stay tied to the user's actual bottleneck."}

## Constraints
${diagnosis?.falseAssumption || "Real capacity matters more than ideal identity."}

## Plan
Keep the next move specific, measurable, and survivable.

## Action Steps
1. ${execution?.sevenDayExecutionPlan?.[0]?.action || "Start with one named action."}
2. ${execution?.sevenDayExecutionPlan?.[1]?.action || "Keep the follow-up action visible on the calendar."}

## Risks
${execution?.adjustmentRules?.[0] || "If the step is vague, it will be avoided."}

## Next Move
Answer the question by narrowing the next action, not broadening the ambition.
      `);
  }
}

function cleanSummary(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export async function runInteractiveAgentChat({
  agentKey,
  message,
  history,
  buildPackage
}: AgentChatRequest) {
  const apiClient = getClient();

  if (!apiClient) {
    return {
      reply: makeFallbackReply(agentKey, buildPackage, message),
      model: "deterministic-fallback",
      provider: "fallback" as const
    };
  }

  const context = makeContext(agentKey, buildPackage);
  const priorTranscript = trimHistory(history);

  const response = await apiClient.responses.create({
    model: lightweightInteractiveModel,
    reasoning: {
      effort: "medium"
    },
    text: {
      verbosity: "medium"
    },
    instructions: makeInstructions(agentKey),
    input: [
      `Conversation so far:\n${priorTranscript || "No earlier messages."}`,
      `Current user context:\n${JSON.stringify(context, null, 2)}`,
      `User question:\n${message}`
    ].join("\n\n")
  });

  return {
    reply: normalizeAgentReply(response.output_text?.trim() || makeFallbackReply(agentKey, buildPackage, message)),
    model: lightweightInteractiveModel,
    provider: "openai" as const
  };
}

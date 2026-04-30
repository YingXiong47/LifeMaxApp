"use client";

import { useEffect, useMemo, useState } from "react";
import { updatePlanProgress } from "../../../agents/tracking/progressTrackerAgent.js";
import { useAppAuthSummary } from "@/components/providers/app-providers";
import { useWorkspaceState } from "@/components/providers/workspace-provider";
import {
  ReflectionOverviewCard,
  ReflectionWorkspace,
  checkInFocusLabel
} from "@/components/dashboard/reflection-workspace";
import { SettingsDangerZone } from "@/components/dashboard/settings-danger-zone";
import { Progress } from "@/components/ui/progress";
import {
  DemoAppearance,
  DemoCheckIn,
  DemoCheckInReflection,
  DemoCheckInSummary,
  DemoDomainUpdate
} from "@/lib/demo/storage";
import { getPlanningModeDetails, planningModeOptions, planningModePill } from "@/lib/planning-mode";
import { stableListKey } from "@/lib/ui/stable-list-key";
import type { WorkspaceState } from "@/lib/workspace/state";

type View =
  | "overview"
  | "profile"
  | "plan"
  | "reflection"
  | "progress"
  | "agent-runs"
  | "history"
  | "settings";

type DemoState = WorkspaceState;
type AgentChatMessage = {
  role: "user" | "assistant";
  content: string;
  model?: string;
};
type AgentRunsSection = "overview" | "support" | "trace" | "risk";
type ProfileSection = "diagnosis" | "baseline" | "signals";
type PlanSection = "overview" | "week" | "playbooks" | "tools";
type ProgressSection = "domains" | "tracker" | "reflections";
type HistorySection = "runs" | "reflections";
type HistoryFilter = "all" | "daily" | "weekly";
type CheckInMode = "daily" | "weekly";
type ReflectionDraft = {
  answers: Record<string, string>;
  blocker: string;
  completionRating: string;
};
type DomainMilestone = {
  id: string;
  label: string;
  detail: string;
  completed: boolean;
  source: "task" | "proof";
  taskId?: string;
  proofKind?: DemoDomainUpdate["kind"];
};

type ReflectionQuestion = {
  key: string;
  label: string;
  placeholder: string;
};

type ReflectionCategory = {
  id: string;
  label: string;
  domain: string;
  dailyQuestions: ReflectionQuestion[];
  weeklyQuestions: ReflectionQuestion[];
};

const appearanceOptions: Array<{
  id: DemoAppearance;
  title: string;
  subtitle: string;
  colors: string[];
}> = [
  {
    id: "sunrise",
    title: "Light",
    subtitle: "Soft daylight with warmer contrast and cleaner surfaces.",
    colors: ["#ffb36b", "#ff7a59", "#ffd36e", "#fff2d8"]
  },
  {
    id: "ember",
    title: "Warm",
    subtitle: "Copper warmth with a moodier work surface.",
    colors: ["#ff875f", "#ff5b3d", "#ffb26b", "#302017"]
  },
  {
    id: "midnight",
    title: "Default blue",
    subtitle: "The same cool blue direction used by onboarding and the main landing experience.",
    colors: ["#57d8ff", "#6ea8ff", "#8ef6bf", "#09111a"]
  }
];

const reflectionCategories: ReflectionCategory[] = [
  {
    id: "protect-looks",
    label: "Protect looks",
    domain: "looks",
    dailyQuestions: [
      {
        key: "completed",
        label: "What did you do today for grooming, skin, hair, posture, or clothing?",
        placeholder: "Example: shaved, moisturized, fixed posture, wore one reliable outfit."
      },
      {
        key: "slipped",
        label: "What did you neglect today?",
        placeholder: "Example: went out looking rushed, ignored grooming, wore default clothes."
      },
      {
        key: "next",
        label: "What visible improvement needs attention tomorrow?",
        placeholder: "Example: lay out clothes tonight and fix the morning grooming standard."
      }
    ],
    weeklyQuestions: [
      {
        key: "completed",
        label: "What did you do this week for grooming, skin, hair, posture, or clothing?",
        placeholder: "Example: held the grooming standard 4 workdays, cleaned up wardrobe, fixed posture."
      },
      {
        key: "slipped",
        label: "What did you neglect this week?",
        placeholder: "Example: let weekend sloppiness spill into Monday, skipped grooming when rushed."
      },
      {
        key: "next",
        label: "What is one visible improvement to make next week?",
        placeholder: "Example: remove one weak-link item and lock three reliable outfits."
      }
    ]
  },
  {
    id: "protect-health",
    label: "Protect health",
    domain: "health",
    dailyQuestions: [
      {
        key: "completed",
        label: "Did you move, hydrate, eat properly, and avoid obvious health damage today?",
        placeholder: "Example: hit protein target, walked, hydrated, skipped the junk binge."
      },
      {
        key: "slipped",
        label: "What health habit slipped today?",
        placeholder: "Example: skipped water, ate trash at night, sat too long, ignored recovery."
      },
      {
        key: "next",
        label: "What is the smallest correction for tomorrow?",
        placeholder: "Example: prep lunch tonight and schedule a 20-minute walk before dinner."
      }
    ],
    weeklyQuestions: [
      {
        key: "completed",
        label: "What improved in your movement, hydration, meals, or recovery this week?",
        placeholder: "Example: walked 5 days, hit protein most lunches, stopped missing water."
      },
      {
        key: "slipped",
        label: "What health habit slipped this week?",
        placeholder: "Example: weekend binge eating, no meal structure, skipped movement entirely."
      },
      {
        key: "next",
        label: "What is the smallest correction for next week?",
        placeholder: "Example: repeat one easy breakfast and one easy lunch every weekday."
      }
    ]
  },
  {
    id: "protect-attention",
    label: "Protect attention",
    domain: "routine",
    dailyQuestions: [
      {
        key: "completed",
        label: "What did you actually focus on today?",
        placeholder: "Example: one deep work block, one class assignment, one admin block."
      },
      {
        key: "slipped",
        label: "What stole your attention today?",
        placeholder: "Example: scrolling at lunch, random YouTube, too many tabs, unnecessary messaging."
      },
      {
        key: "next",
        label: "What distraction needs to be removed tomorrow?",
        placeholder: "Example: phone stays out of sight until the first work block ends."
      }
    ],
    weeklyQuestions: [
      {
        key: "completed",
        label: "What did you actually focus on this week?",
        placeholder: "Example: finished one assignment, shipped one proof-of-work piece, did one hard admin task."
      },
      {
        key: "slipped",
        label: "What stole your attention this week?",
        placeholder: "Example: late-night scrolling, fragmented mornings, reactive messaging."
      },
      {
        key: "next",
        label: "What distraction needs to be removed next week?",
        placeholder: "Example: block social apps until noon and move the phone out of the room at night."
      }
    ]
  },
  {
    id: "repair-sleep",
    label: "Repair sleep",
    domain: "health",
    dailyQuestions: [
      {
        key: "completed",
        label: "What time did you actually sleep and wake up today?",
        placeholder: "Example: asleep by 12:15, up at 7:10."
      },
      {
        key: "slipped",
        label: "What disrupted sleep today?",
        placeholder: "Example: phone in bed, caffeine too late, gaming, anxious overthinking."
      },
      {
        key: "next",
        label: "What boundary will protect sleep tomorrow?",
        placeholder: "Example: phone out of the room by 10:30 and no caffeine after 2 PM."
      }
    ],
    weeklyQuestions: [
      {
        key: "completed",
        label: "What time did you actually sleep and wake most nights this week?",
        placeholder: "Example: most nights in bed by midnight, wake time was stable on weekdays."
      },
      {
        key: "slipped",
        label: "What caused poor sleep this week?",
        placeholder: "Example: revenge bedtime scrolling, unplanned evenings, late food, social drift."
      },
      {
        key: "next",
        label: "What rule will protect sleep next week?",
        placeholder: "Example: hard phone cutoff at 10 PM and same wake time all 7 days."
      }
    ]
  },
  {
    id: "execute-career-work",
    label: "Execute career work",
    domain: "career",
    dailyQuestions: [
      {
        key: "completed",
        label: "What career-building work did you complete today?",
        placeholder: "Example: resume edit, outreach, project artifact, application block."
      },
      {
        key: "slipped",
        label: "What career work did you avoid today?",
        placeholder: "Example: kept the task vague, stayed in research mode, chose easy admin instead."
      },
      {
        key: "next",
        label: "What is the next measurable career step tomorrow?",
        placeholder: "Example: send one outreach message and publish one artifact draft."
      }
    ],
    weeklyQuestions: [
      {
        key: "completed",
        label: "What career-building work did you actually complete this week?",
        placeholder: "Example: shipped one artifact, applied to three roles, had one networking conversation."
      },
      {
        key: "slipped",
        label: "What career work did you avoid this week?",
        placeholder: "Example: kept polishing instead of shipping, avoided outreach, skipped applications."
      },
      {
        key: "next",
        label: "What is the next measurable career step next week?",
        placeholder: "Example: lock a two-hour proof-of-work block before entertainment every Tuesday."
      }
    ]
  },
  {
    id: "train-consistently",
    label: "Train consistently",
    domain: "health",
    dailyQuestions: [
      {
        key: "completed",
        label: "What training did you do today?",
        placeholder: "Example: 45-minute lift, run, mobility session, sport practice."
      },
      {
        key: "slipped",
        label: "What caused you to miss or weaken training today?",
        placeholder: "Example: no plan, low sleep, schedule drift, fake busyness."
      },
      {
        key: "next",
        label: "What is the next training target?",
        placeholder: "Example: upper-body session tomorrow at 5 PM before dinner."
      }
    ],
    weeklyQuestions: [
      {
        key: "completed",
        label: "How many workouts did you complete this week and what type were they?",
        placeholder: "Example: 3 lifts, 1 walk, 1 short mobility session."
      },
      {
        key: "slipped",
        label: "What caused training to slip this week?",
        placeholder: "Example: no scheduled sessions, poor sleep, over-optimistic plan."
      },
      {
        key: "next",
        label: "What is the next training target for next week?",
        placeholder: "Example: schedule 3 sessions now and protect the first one above everything optional."
      }
    ]
  },
  {
    id: "eat-like-an-adult",
    label: "Eat like an adult",
    domain: "health",
    dailyQuestions: [
      {
        key: "completed",
        label: "Did you eat enough protein and real meals today?",
        placeholder: "Example: hit two real meals and kept protein consistent."
      },
      {
        key: "slipped",
        label: "What low-quality food pattern showed up today?",
        placeholder: "Example: skipped meals, snacked junk late, drank calories, ate reactively."
      },
      {
        key: "next",
        label: "What meal habit needs to improve tomorrow?",
        placeholder: "Example: prep one easy lunch and one default high-protein breakfast."
      }
    ],
    weeklyQuestions: [
      {
        key: "completed",
        label: "Did you eat enough protein and real meals this week?",
        placeholder: "Example: 5 weekdays with real lunch, protein target hit 4 days."
      },
      {
        key: "slipped",
        label: "What low-quality food pattern kept showing up?",
        placeholder: "Example: skipped breakfast, takeout at night, no vegetables, random snacking."
      },
      {
        key: "next",
        label: "What meal habit needs to improve next week?",
        placeholder: "Example: repeat the same grocery list and prep one default lunch."
      }
    ]
  },
  {
    id: "stop-overspending",
    label: "Stop overspending",
    domain: "finance",
    dailyQuestions: [
      {
        key: "completed",
        label: "What spending decision did you handle well today?",
        placeholder: "Example: skipped an impulse purchase, cooked instead of ordering, tracked spending."
      },
      {
        key: "slipped",
        label: "What unnecessary spending happened today?",
        placeholder: "Example: convenience spending, subscriptions, food delivery, random online shopping."
      },
      {
        key: "next",
        label: "What spending rule should you use tomorrow?",
        placeholder: "Example: no food delivery, no app purchases, 24-hour pause on non-essentials."
      }
    ],
    weeklyQuestions: [
      {
        key: "completed",
        label: "What spending did you avoid or control this week?",
        placeholder: "Example: no delivery all week, cancelled a subscription, tracked every expense."
      },
      {
        key: "slipped",
        label: "What unnecessary spending happened this week?",
        placeholder: "Example: convenience food, impulse shopping, random small leaks."
      },
      {
        key: "next",
        label: "What spending rule should you use next week?",
        placeholder: "Example: 24-hour rule on non-essentials and cash cap for eating out."
      }
    ]
  }
];

const interactiveAgents = [
  "Strategy Planner Agent",
  "Domain Planning Layer",
  "Finance Planner Agent",
  "Looks Agent",
  "Evaluation Agent",
  "Recommendation Compiler Agent"
] as const;

const agentBlueprints: Record<
  string,
  {
    output: string;
    gate: string;
    confidence: string;
  }
> = {
  "Intake Agent": {
    output: "Validates consent, baseline structure, and missing inputs.",
    gate: "Stops downstream planning if required intake fields are incomplete.",
    confidence: "Higher when the intake is complete, contradictions are low, and the baseline is specific."
  },
  "Personality Assessment Agent": {
    output: "Infers motivation style, stress triggers, and coaching shape.",
    gate: "Must return confidence and observable reasoning inputs.",
    confidence: "Higher when behavior patterns are consistent instead of vague or self-contradictory."
  },
  "Profile Synthesis Agent": {
    output: "Builds the structured user profile and baseline summary.",
    gate: "Schema and field coverage check.",
    confidence: "Higher when the intake covers schedule, money, sleep, routines, and failure patterns cleanly."
  },
  "Profile Builder Agent": {
    output: "Turns raw intake into diagnosis, bottlenecks, false assumptions, and leverage points.",
    gate: "Must explain why the user is stuck, not just summarize their goals.",
    confidence: "Higher when the diagnosis is clearly supported by evidence from the user's own answers."
  },
  "Strategy Planner Agent": {
    output: "Decides what matters now, what to ignore, and what ambition is unrealistic.",
    gate: "Must map the plan to real capacity instead of desired identity.",
    confidence: "Higher when priorities fit available time, recovery capacity, and the user's real bottleneck."
  },
  "Domain Planning Layer": {
    output: "Generates domain plans with root issues, evidence, tools, failure patterns, and adjustment rules.",
    gate: "Every domain plan should include KPIs, actions, evidence, and what failure looks like.",
    confidence: "Higher when each domain has realistic actions, measurable proof, and clear adjustment rules."
  },
  "Finance Planner Agent": {
    output: "Pressure-tests the finance plan and turns money ambiguity into a simple operating system.",
    gate: "Must reduce confusion, specify the tracker, and name the first money-control move.",
    confidence: "Higher when cash flow visibility, leaks, and next money actions are explicit rather than assumed."
  },
  "Looks Agent": {
    output: "Converts presentation goals into a lightweight grooming and style system that survives real life.",
    gate: "Must keep the standard visible, maintainable, and free of vanity fluff.",
    confidence: "Higher when the grooming standard is simple, repeated, and not dependent on rare motivation spikes."
  },
  "Progress Tracker Agent": {
    output: "Creates the execution system: daily checkpoints, weekly focus areas, failure triggers, and review questions.",
    gate: "Tracker must convert strategy into a week the user can actually survive.",
    confidence: "Higher when the plan has clear review loops, fewer loose ends, and observable weekly proof."
  },
  "Testing Agent": {
    output: "Checks contract integrity, coverage, and downstream assumptions.",
    gate: "Must surface failed components and recommended fixes.",
    confidence: "Higher when required sections are present and no structural gaps or contract failures remain."
  },
  "Evaluation Agent": {
    output: "Scores confidence, risk, and maintainability of the generated package.",
    gate: "Raises risk notes before the final package is accepted.",
    confidence: "Higher when the plan is specific, realistic, internally consistent, and still passes review under stress."
  },
  "Recommendation Compiler Agent": {
    output: "Packages the final user-facing workspace.",
    gate: "Final bundle should be coherent, navigable, and measurable.",
    confidence: "Higher when the final package keeps the diagnosis, plan, metrics, and next steps aligned."
  }
};

const historyPageSize = 6;

function percent(value: number) {
  return `${Math.round((value || 0) * 100)}%`;
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function titleize(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function toggleSelection(items: string[], value: string) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function groupToolsByDomain(tools: any[]) {
  return tools.reduce(
    (map, tool) => {
      const key = tool.domain || "shared";
      map[key] = map[key] || [];
      map[key].push(tool);
      return map;
    },
    {} as Record<string, any[]>
  );
}

function getReflectionCategory(id: string) {
  return reflectionCategories.find((item) => item.id === id);
}

function buildEmptyReflectionDraft(): ReflectionDraft {
  return {
    answers: {},
    blocker: "",
    completionRating: "3"
  };
}

function buildCheckInSummary(reflections: DemoCheckInReflection[]): DemoCheckInSummary {
  const completedActions = reflections
    .map((item) => item.answers.completed?.trim())
    .filter(Boolean) as string[];
  const skippedAreas = reflections
    .map((item) => item.answers.slipped?.trim())
    .filter(Boolean) as string[];
  const nextRecommendedActions = reflections
    .map((item) => item.answers.next?.trim())
    .filter(Boolean) as string[];
  const blockers = reflections
    .map((item) => item.blocker?.trim())
    .concat(skippedAreas)
    .filter(Boolean) as string[];
  const impactedDomains = Array.from(
    new Set(
      reflections
        .map((item) => getReflectionCategory(item.category)?.domain)
        .filter(Boolean)
    )
  ) as string[];

  return {
    completedActions,
    skippedAreas,
    blockers,
    nextRecommendedActions,
    impactedDomains
  };
}

function buildDomainUpdatesFromReflection(
  createdAt: string,
  reflections: DemoCheckInReflection[]
): DemoDomainUpdate[] {
  return reflections.flatMap((item, index) => {
    const category = getReflectionCategory(item.category);
    if (!category) {
      return [];
    }

    const updates: DemoDomainUpdate[] = [];
    const completed = item.answers.completed?.trim();
    const next = item.answers.next?.trim();

    if (completed) {
      updates.push({
        id: `${category.domain}-proof-${createdAt}-${index}`,
        domain: category.domain,
        kind: "proof",
        createdAt,
        note: `${category.label}: ${completed}`
      });
    }

    if (Number(item.completionRating || "0") >= 4) {
      updates.push({
        id: `${category.domain}-standard-${createdAt}-${index}`,
        domain: category.domain,
        kind: "standard",
        createdAt,
        note: `${category.label}: weekly standard held strongly.`
      });
    }

    if (next) {
      updates.push({
        id: `${category.domain}-review-${createdAt}-${index}`,
        domain: category.domain,
        kind: "review",
        createdAt,
        note: `${category.label}: ${next}`
      });
    }

    return updates;
  });
}

function getRecentDomainUpdates(state: DemoState, domain: string) {
  return listOf<DemoDomainUpdate>(state.domainUpdates)
    .filter((item) => item.domain === domain)
    .sort((left, right) => Number(new Date(right.createdAt)) - Number(new Date(left.createdAt)));
}

function hasDomainUpdate(state: DemoState, domain: string, kind: DemoDomainUpdate["kind"]) {
  return getRecentDomainUpdates(state, domain).some((item) => item.kind === kind);
}

function buildDomainMilestones(state: DemoState, plan: any, tasks: any[]): DomainMilestone[] {
  const proofKinds: Array<{ kind: DemoDomainUpdate["kind"]; label: string; detail: string }> = [
    {
      kind: "proof",
      label: "Log one honest proof from this week",
      detail: "Record what actually moved, not what you meant to do."
    },
    {
      kind: "standard",
      label: "Hold the weekly standard at least once",
      detail: "Show that the domain survived real life, not just planning."
    },
    {
      kind: "review",
      label: "Review what slipped and set the next correction",
      detail: "Prevent the same miss from repeating next week."
    }
  ];

  const taskMilestones: DomainMilestone[] = tasks.map((task) => ({
    id: task.id,
    label: task.taskText,
    detail: `${task.metric} • ${task.deadline}`,
    completed: task.status === "done",
    source: "task" as const,
    taskId: task.id
  }));

  const proofMilestones: DomainMilestone[] = proofKinds.map((item) => ({
    id: `${plan.domain}-${item.kind}`,
    label: item.label,
    detail: item.detail,
    completed: hasDomainUpdate(state, plan.domain, item.kind),
    source: "proof" as const,
    proofKind: item.kind
  }));

  return taskMilestones.concat(proofMilestones);
}

function listOf<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function textOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length ? value : fallback;
}

function getStrategyRoadmap(buildPackage: any) {
  const primaryGoal = textOrFallback(
    buildPackage?.profile?.goals?.primaryGoal,
    "Build a usable weekly system around the highest-pressure domains."
  );

  return {
    operatingSystem: textOrFallback(
      buildPackage?.strategyRoadmap?.operatingSystem,
      "Stabilize, then compound"
    ),
    executiveSummary: textOrFallback(
      buildPackage?.strategyRoadmap?.executiveSummary,
      primaryGoal
    ),
    realityCheck: textOrFallback(
      buildPackage?.strategyRoadmap?.realityCheck,
      primaryGoal
    ),
    priorities: listOf<any>(buildPackage?.strategyRoadmap?.priorities),
    phases: listOf<any>(buildPackage?.strategyRoadmap?.phases)
  };
}

function getProfileIntel(buildPackage: any) {
  const fallbackIdentity = textOrFallback(
    buildPackage?.profile?.goals?.primaryGoal,
    "Build a usable weekly system around the highest-pressure domains."
  );

  return {
    identityStatement: textOrFallback(
      buildPackage?.profileIntel?.identityStatement,
      fallbackIdentity
    ),
    preferredCoachingMode: textOrFallback(
      buildPackage?.profileIntel?.preferredCoachingMode,
      "Direct and operational"
    ),
    strengths: listOf<string>(buildPackage?.profileIntel?.strengths),
    bottlenecks: listOf<string>(buildPackage?.profileIntel?.bottlenecks)
  };
}

function getProfile(buildPackage: any) {
  return {
    occupation: textOrFallback(buildPackage?.profile?.occupation, "Not captured"),
    goals: {
      primaryGoal: textOrFallback(
        buildPackage?.profile?.goals?.primaryGoal,
        "Build a usable weekly system around the highest-pressure domains."
      ),
      timeHorizon: textOrFallback(buildPackage?.profile?.goals?.timeHorizon, "90 days"),
      focusDomains: listOf<string>(buildPackage?.profile?.goals?.focusDomains)
    },
    schedule: {
      weeklyHoursAvailable: textOrFallback(
        buildPackage?.profile?.schedule?.weeklyHoursAvailable,
        "Not captured"
      )
    },
    financialBaseline: {
      stressLevel: textOrFallback(
        buildPackage?.profile?.financialBaseline?.stressLevel,
        "Not captured"
      )
    },
    habits: {
      energyBaseline: textOrFallback(
        buildPackage?.profile?.habits?.energyBaseline,
        "Not captured"
      ),
      trainingFrequency: textOrFallback(
        buildPackage?.profile?.habits?.trainingFrequency,
        "Not captured"
      )
    },
    operatingContext: {
      nightlyPhoneHours: textOrFallback(
        buildPackage?.profile?.operatingContext?.nightlyPhoneHours,
        "Not captured"
      ),
      weeklyScheduleReality: textOrFallback(
        buildPackage?.profile?.operatingContext?.weeklyScheduleReality,
        "Not captured."
      )
    },
    behavioralSignals: {
      avoidancePatterns: listOf<string>(buildPackage?.profile?.behavioralSignals?.avoidancePatterns),
      distractionSources: listOf<string>(buildPackage?.profile?.behavioralSignals?.distractionSources),
      stressResponse: listOf<string>(buildPackage?.profile?.behavioralSignals?.stressResponse)
    }
  };
}

function getBuildSummary(buildPackage: any) {
  return {
    finalConfidenceScore:
      typeof buildPackage?.buildSummary?.finalConfidenceScore === "number"
        ? buildPackage.buildSummary.finalConfidenceScore
        : 0,
    numberOfIterations:
      typeof buildPackage?.buildSummary?.numberOfIterations === "number"
        ? buildPackage.buildSummary.numberOfIterations
        : 1
  };
}

function getTracker(buildPackage: any) {
  return {
    tasks: listOf<any>(buildPackage?.tracker?.tasks),
    domainProgress: listOf<any>(buildPackage?.tracker?.domainProgress),
    weeklyReview: {
      headline: textOrFallback(
        buildPackage?.tracker?.weeklyReview?.headline,
        "Fresh plan. Start with one visible win in the next 24 hours."
      ),
      focusForNextWeek: textOrFallback(
        buildPackage?.tracker?.weeklyReview?.focusForNextWeek,
        "Protect the highest-leverage domain before adding anything new."
      ),
      ratio:
        typeof buildPackage?.tracker?.weeklyReview?.ratio === "number"
          ? buildPackage.tracker.weeklyReview.ratio
          : 0
    },
    summary: {
      momentumScore:
        typeof buildPackage?.tracker?.summary?.momentumScore === "number"
          ? buildPackage.tracker.summary.momentumScore
          : 0,
      completedCount:
        typeof buildPackage?.tracker?.summary?.completedCount === "number"
          ? buildPackage.tracker.summary.completedCount
          : 0,
      inProgressCount:
        typeof buildPackage?.tracker?.summary?.inProgressCount === "number"
          ? buildPackage.tracker.summary.inProgressCount
          : 0,
      adherenceScore:
        typeof buildPackage?.tracker?.summary?.adherenceScore === "number"
          ? buildPackage.tracker.summary.adherenceScore
          : 0
    }
  };
}

function getAgentRoster(buildPackage: any) {
  return listOf<any>(buildPackage?.agentRoster);
}

function statusTone(value: string) {
  if (value === "done" || value === "ready" || value === "complete") {
    return "good";
  }
  if (value === "in-progress" || value === "running") {
    return "warn";
  }
  return "";
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + pageSize)
  };
}

function cleanSentence(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || fallback;
}

function renderSummaryText(value: unknown, fallback = "No summary recorded.") {
  return cleanSentence(value, fallback);
}

function Panel({
  title,
  eyebrow,
  aside,
  className,
  children
}: {
  title: string;
  eyebrow?: string;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`workspace-panel${className ? ` ${className}` : ""}`}>
      <div className="panel-head">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
      {children}
    </article>
  );
}

function SectionTabs<T extends string>({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="quick-chip-grid workspace-subnav" role="tablist" aria-label={label}>
      {options.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`choice-chip ${value === item.value ? "active" : ""}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  onPageChange
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-controls">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <div className="workspace-pills">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            type="button"
            className={`choice-chip compact-chip ${page === index + 1 ? "active" : ""}`}
            onClick={() => onPageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Next
      </button>
    </div>
  );
}

function parseAgentReply(content: string) {
  const sections: Array<{ title: string; body: string[] }> = [];
  let current: { title: string; body: string[] } | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const headingMatch = trimmed.match(/^#{1,3}\s*(.+)$/);
    const labelMatch = trimmed.match(/^(Title|Key Issue|Constraints|Plan|Action Steps|Risks|Next Move)\s*:\s*(.*)$/i);

    if (headingMatch) {
      current = {
        title: headingMatch[1].trim(),
        body: []
      };
      sections.push(current);
      continue;
    }

    if (labelMatch) {
      current = {
        title: labelMatch[1].trim(),
        body: labelMatch[2] ? [labelMatch[2].trim()] : []
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = { title: "Response", body: [] };
      sections.push(current);
    }

    current.body.push(trimmed.replace(/^[-*]\s*/, ""));
  }

  return sections.length ? sections : [{ title: "Response", body: [content.trim()] }];
}

function AgentReply({ content }: { content: string }) {
  const sections = parseAgentReply(content);

  return (
    <div className="agent-reply-block">
      {sections.map((section) => (
        <div key={`${section.title}-${section.body.join("-")}`} className="agent-reply-section">
          <span className="muted">{section.title}</span>
          {section.body.map((line) => (
            <p key={`${section.title}-${line}`}>{line}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <div className="workspace-stack">
      <section className="workspace-hero workspace-hero-accent">
        <div className="hero-copy-block">
          <p className="eyebrow">No active workspace</p>
          <h2>Finish the assessment and initialize your first operating system.</h2>
          <p>
            The app pages sharpen up once there is a real plan to work from. Right now the workspace is waiting on
            your first completed run.
          </p>
        </div>
        <div className="workspace-hero-art">
          <div className="workspace-orb large" />
          <div className="workspace-orb small" />
          <div className="workspace-wave" />
        </div>
      </section>
    </div>
  );
}

export function AppDataView({ view }: { view: View }) {
  const authSummary = useAppAuthSummary();
  const { state, saveState, status, diagnostics } = useWorkspaceState();
  const [agentConversations, setAgentConversations] = useState<Record<string, AgentChatMessage[]>>({});
  const [agentRunsSection, setAgentRunsSection] = useState<AgentRunsSection>("overview");
  const [profileSection, setProfileSection] = useState<ProfileSection>("diagnosis");
  const [planSection, setPlanSection] = useState<PlanSection>("overview");
  const [progressSection, setProgressSection] = useState<ProgressSection>("domains");
  const [historySection, setHistorySection] = useState<HistorySection>("runs");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [domainDrafts, setDomainDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setHistoryPage(1);
  }, [historySection, historyFilter, historySearch]);

  function setAndSave(nextState: DemoState) {
    void saveState(nextState);
  }

  const buildPackage = state.buildPackage;
  const latestRun = state.latestRun;
  const fallbackAppearance = appearanceOptions.find((option) => option.id === "midnight") || appearanceOptions[0];
  const currentAppearanceTitle =
    appearanceOptions.find((option) => option.id === state.preferences.appearance)?.title ||
    fallbackAppearance.title;
  const selectedAppearance =
    appearanceOptions.find((option) => option.id === state.preferences.appearance) || fallbackAppearance;
  const planningMode = state.preferences?.planningMode === "ai" ? "ai" : "stable";
  const planningModeDetails = getPlanningModeDetails(planningMode);
  const authModeLabel =
    authSummary.mode === "supabase"
      ? "Supabase account"
      : authSummary.mode === "clerk"
        ? "Clerk account"
        : state.session.authenticated
          ? "Signed in demo"
          : "Demo mode";
  const accountStatusLabel =
    authSummary.mode === "supabase"
      ? authSummary.user
        ? "Email/password account"
        : "Sign-in required"
      : authSummary.mode === "clerk"
        ? authSummary.user
          ? "Protected account"
          : "Sign-in required"
        : state.session.authenticated
      ? "Demo account"
      : "Anonymous demo";
  const dataHandlingCopy =
    authSummary.mode === "supabase"
      ? "Your plan inputs are sent to selected agents during generation and your workspace runs persist in a protected Supabase-backed database tied to your signed-in account."
      : authSummary.mode === "clerk"
        ? "Your plan inputs are sent to selected agents during generation. Signed-in sessions are protected, but this environment still needs durable database-backed workspace storage."
        : "Demo mode still sends plan inputs to the selected agents for generation, but browser state stays local until you sign in for protected storage.";
  const planningModeDescription =
    planningMode === "ai"
      ? "AI mode uses the OpenAI multi-agent runtime for a more dynamic planning pass, but it can be slower or less reliable."
      : "Stable mode uses the proven legacy planning engine for a faster, more reliable full-run generation pass.";

  if (status === "loading") {
    return <WorkspaceLoadingState />;
  }

  if (!buildPackage && !["settings", "history", "reflection"].includes(view)) {
    return <EmptyWorkspace />;
  }

  if (view === "overview" && buildPackage) {
    const tracker = getTracker(buildPackage);
    const buildSummary = getBuildSummary(buildPackage);
    const topTasks = tracker.tasks.slice(0, 4);
    const strategyRoadmap = getStrategyRoadmap(buildPackage);
    const profileIntel = getProfileIntel(buildPackage);
    const profile = getProfile(buildPackage);
    const agentRoster = getAgentRoster(buildPackage);
    const priorityDomains = strategyRoadmap.priorities.slice(0, 3);
    const diagnosis = buildPackage.diagnosticReport;

    return (
      <div className="workspace-stack">
        <section className="workspace-hero workspace-hero-accent">
          <div className="hero-copy-block">
            <p className="eyebrow">Current operating summary</p>
            <h2>{diagnosis?.mainBottleneck || profileIntel.identityStatement}</h2>
            <p>{diagnosis?.currentDiagnosis || tracker.weeklyReview.headline}</p>
            <div className="workspace-pills">
              <span className="pill">Plan reliability {percent(buildSummary.finalConfidenceScore)}</span>
              <span className="pill">Momentum {percent(tracker.summary.momentumScore)}</span>
              <span className={`pill ${planningMode === "ai" ? "warn" : "good"}`}>{planningModePill(planningMode)}</span>
              <span className="pill">{profile.goals.timeHorizon} horizon</span>
            </div>
          </div>
          <div className="hero-metric-grid">
            <article className="hero-metric-card">
              <span className="muted">Highest leverage change</span>
              <strong>{diagnosis?.highestLeverageBehaviorChange || tracker.weeklyReview.focusForNextWeek}</strong>
            </article>
            <article className="hero-metric-card">
              <span className="muted">False assumption</span>
              <strong>{diagnosis?.falseAssumption || "No diagnostic challenge attached yet."}</strong>
            </article>
            <article className="hero-metric-card">
              <span className="muted">This week</span>
              <strong>{tracker.weeklyReview.focusForNextWeek}</strong>
            </article>
            <article className="hero-metric-card">
              <span className="muted">Planning mode</span>
              <strong>{planningModeDetails.title}</strong>
            </article>
          </div>
        </section>

        <div className="workspace-columns">
          <div className="workspace-main-column">
            <Panel title="Next best actions" eyebrow="Action lane">
              <div className="action-list">
                {topTasks.map((task: any) => (
                  <div key={task.id} className="action-row">
                    <div>
                      <strong>{task.taskText}</strong>
                      <p className="muted">
                        {titleize(task.planDomain)} • {task.metric}
                      </p>
                    </div>
                    <span className={`pill ${statusTone(task.status)}`}>{task.status}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="Priority stack"
              eyebrow="Strategy"
              aside={<span className="pill good">{strategyRoadmap.operatingSystem}</span>}
            >
              <div className="priority-grid">
                {priorityDomains.map((item: any) => (
                  <article key={item.domain} className="mini-stat-card">
                    <span className="muted">{titleize(item.domain)}</span>
                    <strong>{percent(item.score)}</strong>
                    <p>{item.why}</p>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel title="Domain momentum" eyebrow="Tracker">
              <div className="stack-list">
                {tracker.domainProgress.map((item: any) => (
                  <div key={item.domain} className="progress-row">
                    <div className="line-between">
                      <strong>{titleize(item.domain)}</strong>
                      <span className="muted">
                        {item.completed}/{item.total}
                      </span>
                    </div>
                    <Progress value={item.score * 100} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="workspace-side-column">
            <ReflectionOverviewCard state={state} />

            <Panel title="Agent orchestration" eyebrow="Live run">
              <div className="stack-list">
                {agentRoster.slice(0, 5).map((agent: any) => (
                  <div key={agent.agentName} className="line-between">
                    <div>
                      <strong>{agent.agentName}</strong>
                      <p className="muted">{agentBlueprints[agent.agentName]?.output || "Agent output ready."}</p>
                    </div>
                    <span className={`pill ${statusTone(agent.status)}`}>{agent.status}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    );
  }

  if (view === "profile" && buildPackage) {
    const agentAssessment = buildPackage.workflowMeta?.agentAssessment || {
      summary: "This run is missing a synthesized evaluation summary.",
      risks: [] as string[],
      opportunities: [] as string[]
    };
    const diagnosis = buildPackage.diagnosticReport;
    const profileIntel = getProfileIntel(buildPackage);
    const profile = getProfile(buildPackage);

    return (
      <div className="workspace-stack">
        <section className="workspace-hero workspace-hero-soft">
          <div className="hero-copy-block">
            <p className="eyebrow">Profile intelligence</p>
            <h2>{diagnosis?.mainBottleneck || profileIntel.identityStatement}</h2>
            <p>{diagnosis?.currentDiagnosis || agentAssessment.summary}</p>
          </div>
          <div className="hero-metric-grid">
            <article className="hero-metric-card">
              <span className="muted">Role</span>
              <strong>{profile.occupation}</strong>
            </article>
            <article className="hero-metric-card">
              <span className="muted">Uncomfortable truth</span>
              <strong>{diagnosis?.uncomfortableTruth || profile.habits.energyBaseline}</strong>
            </article>
            <article className="hero-metric-card">
              <span className="muted">Coaching mode</span>
              <strong>{profileIntel.preferredCoachingMode}</strong>
            </article>
          </div>
        </section>

        <SectionTabs
          label="Profile sections"
          value={profileSection}
          onChange={setProfileSection}
          options={[
            { value: "diagnosis", label: "Diagnosis" },
            { value: "baseline", label: "Baseline" },
            { value: "signals", label: "Signals and risk" }
          ]}
        />

        {profileSection === "diagnosis" ? (
          <div className="workspace-grid workspace-grid-two">
            <Panel title="Diagnosis" eyebrow="Why you are stuck">
              <div className="stack-list">
                <div>
                  <strong>Main bottleneck</strong>
                  <p>{diagnosis?.mainBottleneck}</p>
                </div>
                <div>
                  <strong>False assumption</strong>
                  <p>{diagnosis?.falseAssumption}</p>
                </div>
                <div>
                  <strong>Highest leverage change</strong>
                  <p>{diagnosis?.highestLeverageBehaviorChange}</p>
                </div>
              </div>
            </Panel>
            <Panel title="Strengths" eyebrow="What to lean on">
              <ul className="clean-list">
                {profileIntel.strengths.map((item: string, index: number) => (
                  <li key={stableListKey("profile-strength", item, index)}>{item}</li>
                ))}
              </ul>
            </Panel>
            <Panel title="Pressure points" eyebrow="Where the drag is">
              <ul className="clean-list">
                {profileIntel.bottlenecks.map((item: string, index: number) => (
                  <li key={stableListKey("profile-bottleneck", item, index)}>{item}</li>
                ))}
              </ul>
            </Panel>
            <Panel title="Evidence trail" eyebrow="What the agents used">
              <ul className="clean-list">
                {listOf<string>(diagnosis?.evidence).map((item: string, index: number) => (
                  <li key={stableListKey("profile-evidence", item, index)}>{item}</li>
                ))}
              </ul>
            </Panel>
          </div>
        ) : null}

        {profileSection === "baseline" ? (
          <div className="workspace-grid workspace-grid-two">
            <Panel title="Baseline snapshot" eyebrow="Current state">
              <div className="stack-list">
                <div className="line-between">
                  <span>Focus domains</span>
                  <span className="muted">{profile.goals.focusDomains.join(", ") || "Not captured"}</span>
                </div>
                <div className="line-between">
                  <span>Weekly time</span>
                  <span className="muted">{profile.schedule.weeklyHoursAvailable}</span>
                </div>
                <div className="line-between">
                  <span>Financial stress</span>
                  <span className="muted">{profile.financialBaseline.stressLevel}</span>
                </div>
                <div className="line-between">
                  <span>Training</span>
                  <span className="muted">{profile.habits.trainingFrequency}</span>
                </div>
                <div className="line-between">
                  <span>Phone drift</span>
                  <span className="muted">{profile.operatingContext.nightlyPhoneHours}</span>
                </div>
              </div>
            </Panel>
            <Panel title="Operating context" eyebrow="Reality on the ground">
              <div className="stack-list">
                <div>
                  <strong>Schedule reality</strong>
                  <p>{profile.operatingContext.weeklyScheduleReality}</p>
                </div>
                <div>
                  <strong>Occupation</strong>
                  <p>{profile.occupation}</p>
                </div>
                <div>
                  <strong>Primary goal</strong>
                  <p>{profile.goals.primaryGoal}</p>
                </div>
              </div>
            </Panel>
          </div>
        ) : null}

        {profileSection === "signals" ? (
          <div className="workspace-grid workspace-grid-two">
            <Panel title="Behavioral pattern" eyebrow="Reality audit">
              <div className="stack-list">
                <div>
                  <strong>Avoidance patterns</strong>
                  <p>{profile.behavioralSignals.avoidancePatterns.join(", ") || "None captured."}</p>
                </div>
                <div>
                  <strong>Distraction sources</strong>
                  <p>{profile.behavioralSignals.distractionSources.join(", ") || "None captured."}</p>
                </div>
                <div>
                  <strong>Stress response</strong>
                  <p>{profile.behavioralSignals.stressResponse.join(", ") || "None captured."}</p>
                </div>
              </div>
            </Panel>
            <Panel title="Risks and opportunities" eyebrow="Evaluation">
              <div className="stack-list">
                <div>
                  <strong>Risk notes</strong>
                  <ul className="clean-list">
                    {listOf<string>(agentAssessment.risks).map((item: string, index: number) => (
                      <li key={stableListKey("profile-risk", item, index)}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Opportunities</strong>
                  <ul className="clean-list">
                    {listOf<string>(agentAssessment.opportunities).map((item: string, index: number) => (
                      <li key={stableListKey("profile-opportunity", item, index)}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>
          </div>
        ) : null}
      </div>
    );
  }

  if (view === "plan" && buildPackage) {
    const plans = listOf<any>(buildPackage.plans);
    const strategyRoadmap = getStrategyRoadmap(buildPackage);
    const phases = strategyRoadmap.phases;
    const diagnosis = buildPackage.diagnosticReport || {};
    const groupedTools = groupToolsByDomain(listOf<any>(buildPackage.executionSystem?.recommendedTools));
    const executionSystem = buildPackage.executionSystem || {
      sevenDayExecutionPlan: [],
      metricsToTrack: [],
      failureTriggers: [],
      adjustmentRules: [],
      whatToIgnore: [],
      nextReviewQuestions: [],
      dailyCheckpoints: [],
      weeklyFocuses: [],
      recommendedTools: []
    };

    return (
      <div className="workspace-stack">
        <section className="workspace-hero workspace-hero-soft">
          <div className="hero-copy-block">
            <p className="eyebrow">Roadmap</p>
            <h2>{strategyRoadmap.executiveSummary}</h2>
            <p>{strategyRoadmap.realityCheck}</p>
          </div>
          <div className="roadmap-phase-grid">
            {phases.length ? (
              phases.map((phase: any) => (
                <details key={phase.name} className="hero-metric-card roadmap-phase-card">
                  <summary className="line-between">
                    <div>
                      <span className="muted">{phase.duration}</span>
                      <strong>{phase.name}</strong>
                    </div>
                    <span className="pill">View details</span>
                  </summary>
                  <p>{textOrFallback(phase.exitCriteria, "Advance when the weekly system is holding.")}</p>
                </details>
              ))
            ) : (
              <article className="hero-metric-card roadmap-phase-card">
                <span className="muted">Phase plan unavailable</span>
                <strong>Using the current weekly system until a fresh roadmap is generated.</strong>
                <p>{textOrFallback(buildPackage?.tracker?.weeklyReview?.focusForNextWeek, "Regenerate the plan to refresh phase sequencing.")}</p>
              </article>
            )}
          </div>
        </section>

        <SectionTabs
          label="Plan sections"
          value={planSection}
          onChange={setPlanSection}
          options={[
            { value: "overview", label: "Overview" },
            { value: "week", label: "This week" },
            { value: "playbooks", label: "Playbooks" },
            { value: "tools", label: "Tools and review" }
          ]}
        />

        {planSection === "overview" ? (
          <>
            <div className="plan-summary-grid">
              <Panel title="Current diagnosis" eyebrow="Why this plan exists">
                <div className="stack-list">
                  <div>
                    <strong>Main bottleneck</strong>
                    <p>{diagnosis.mainBottleneck}</p>
                  </div>
                  <div>
                    <strong>False assumption</strong>
                    <p>{diagnosis.falseAssumption}</p>
                  </div>
                  <div>
                    <strong>Uncomfortable truth</strong>
                    <p>{diagnosis.uncomfortableTruth}</p>
                  </div>
                </div>
              </Panel>

              <Panel title="Data handling" eyebrow="Agent and storage notice">
                <div className="stack-list">
                  <p>{dataHandlingCopy}</p>
                  <p>
                    <strong>{planningModeDetails.title}:</strong> {planningModeDescription}
                  </p>
                </div>
              </Panel>
            </div>

            <div className="plan-summary-grid">
              <Panel title="Scoreboard" eyebrow="What you actually track">
                <div className="stack-list">
                  <div>
                    <strong>Metrics</strong>
                    <ul className="clean-list">
                      {listOf<string>(executionSystem.metricsToTrack).map((item: string, index: number) => (
                        <li key={stableListKey("plan-metric", item, index)}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Failure triggers</strong>
                    <ul className="clean-list">
                      {listOf<string>(executionSystem.failureTriggers).map((item: string, index: number) => (
                        <li key={stableListKey("plan-trigger", item, index)}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>

              <Panel title="Adjustment rules" eyebrow="How the system adapts">
                <div className="stack-list">
                  <div>
                    <strong>Adjustment rules</strong>
                    <ul className="clean-list">
                      {listOf<string>(executionSystem.adjustmentRules).map((item: string, index: number) => (
                        <li key={stableListKey("plan-adjustment", item, index)}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Ignore for now</strong>
                    <ul className="clean-list">
                      {listOf<string>(executionSystem.whatToIgnore).map((item: string, index: number) => (
                        <li key={stableListKey("plan-ignore", item, index)}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>
            </div>
          </>
        ) : null}

        {planSection === "week" ? (
          <>
            <Panel title="7-day execution plan" eyebrow="Operational plan">
              <div className="plan-day-grid">
                {listOf<any>(executionSystem.sevenDayExecutionPlan).map((item: any) => (
                  <article key={`${item.dayLabel}-${item.action}`} className="history-card">
                    <div className="line-between">
                      <strong>{item.dayLabel}</strong>
                      <span className="pill">{titleize(item.focus)}</span>
                    </div>
                    <p>{item.action}</p>
                    <p className="muted">
                      {item.window} • {item.metric}
                    </p>
                    <p className="muted">Failure: {item.failureLooksLike}</p>
                    <p className="muted">Adjust: {item.adjustmentIfMissed}</p>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel title="Review loop" eyebrow="Daily and weekly prompts">
              <div className="plan-summary-grid">
                <div className="history-card">
                  <strong>Daily checkpoints</strong>
                  <ul className="clean-list">
                    {listOf<string>(executionSystem.dailyCheckpoints).map((item: string, index: number) => (
                      <li key={stableListKey("plan-daily-checkpoint", item, index)}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="history-card">
                  <strong>Next review questions</strong>
                  <ul className="clean-list">
                    {listOf<string>(executionSystem.nextReviewQuestions).map((item: string, index: number) => (
                      <li key={stableListKey("plan-review-question", item, index)}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>
          </>
        ) : null}

        {planSection === "playbooks" ? (
          <Panel title="Domain playbooks" eyebrow="Collapsed by default">
            <div className="history-stack">
              {plans.map((plan: any) => (
                <details key={plan.domain} className="history-card compact-plan">
                  <summary className="line-between">
                    <div>
                      <strong>{titleize(plan.domain)}</strong>
                      <p className="muted">{plan.targetOutcome}</p>
                    </div>
                    <span className="pill">{percent(plan.confidenceScore || 0)}</span>
                  </summary>
                  <div className="stack-list compact-plan-body">
                    <p className="muted">{plan.currentBaseline}</p>
                    <div className="stack-list">
                      <div>
                        <strong>Root issue</strong>
                        <p>{plan.rootIssue}</p>
                      </div>
                      <div>
                        <strong>Why now</strong>
                        <p>{plan.whyNow}</p>
                      </div>
                    </div>
                    <div className="workspace-pills plan-kpi-list">
                      {listOf<any>(plan.kpiMetrics).map((metric: any) => (
                        <span key={metric.name} className="pill">
                          {metric.name}: {metric.target}
                        </span>
                      ))}
                    </div>
                    <div className="action-list">
                      {listOf<any>(plan.actionItems).map((item: any) => (
                        <div key={item.task} className="action-row">
                          <div>
                            <strong>{item.task}</strong>
                            <p className="muted">
                              {item.metric} • {item.deadline}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <strong>Evidence</strong>
                      <ul className="clean-list">
                        {listOf<string>(plan.evidence).map((item: string, index: number) => (
                          <li key={stableListKey(`plan-evidence-${plan.domain}`, item, index)}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    {listOf<string>(plan.riskFlags).length ? (
                      <div>
                        <strong>Watchouts</strong>
                        <ul className="clean-list">
                          {listOf<string>(plan.riskFlags).map((item: string, index: number) => (
                            <li key={stableListKey(`plan-risk-${plan.domain}`, item, index)}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div>
                      <strong>Failure pattern</strong>
                      <p>{plan.failurePattern}</p>
                    </div>
                    <div>
                      <strong>Adjustment rule</strong>
                      <p>{plan.adjustmentRule}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </Panel>
        ) : null}

        {planSection === "tools" ? (
          <>
            <Panel title="Recommended tools" eyebrow="Use systems, not just willpower">
              <div className="tool-cluster-grid">
                {Object.entries(groupedTools).map(([domain, tools]) => {
                  const scopedTools = tools as any[];
                  return (
                    <article key={domain} className="history-card">
                      <div className="line-between">
                        <strong>{titleize(domain)}</strong>
                        <span className="pill">{scopedTools.length} tools</span>
                      </div>
                      <ul className="clean-list">
                        {scopedTools.map((tool: any) => (
                          <li key={`${domain}-${tool.name}`}>
                            <strong>{tool.name}</strong>: {tool.reason}
                            {tool.cadence ? <span className="muted"> {tool.cadence}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </Panel>
          </>
        ) : null}
      </div>
    );
  }

  if (view === "reflection") {
    return <ReflectionWorkspace state={state} onUpdate={setAndSave} />;
  }

  if (view === "progress" && buildPackage) {
    const tracker = getTracker(buildPackage);
    return (
      <div className="workspace-stack">
        <SectionTabs
          label="Progress sections"
          value={progressSection}
          onChange={setProgressSection}
          options={[
            { value: "domains", label: "Domain progress" },
            { value: "tracker", label: "Tracker health" },
            { value: "reflections", label: "Reflection loop" }
          ]}
        />

        {progressSection === "domains" ? (
          <Panel title="Domain progress" eyebrow="Weekly evidence board">
            <div className="history-stack">
              {tracker.domainProgress.map((item: any) => {
                const plan = listOf<any>(buildPackage.plans).find((entry: any) => entry.domain === item.domain);
                const domainTasks = tracker.tasks.filter(
                  (task: any) => task.planDomain === item.domain
                );
                const milestones = plan ? buildDomainMilestones(state, plan, domainTasks) : [];
                const completedMilestones = milestones.filter((entry) => entry.completed).length;
                const progressScore = milestones.length ? completedMilestones / milestones.length : item.score;
                const recentUpdates = getRecentDomainUpdates(state, item.domain).slice(0, 3);

                return (
                  <details key={item.domain} className="history-card compact-plan">
                    <summary className="line-between">
                      <div>
                        <strong>{titleize(item.domain)}</strong>
                        <p className="muted">
                          {completedMilestones}/{milestones.length || item.total} weekly proofs captured
                        </p>
                      </div>
                      <span className="pill">{percent(progressScore)}</span>
                    </summary>
                    {plan ? (
                      <div className="stack-list compact-plan-body">
                        <Progress value={progressScore * 100} />
                        <p>{plan.rootIssue}</p>
                        <p className="muted">{plan.targetOutcome}</p>
                        <div className="domain-milestone-list">
                          {milestones.map((milestone) => (
                            <button
                              key={milestone.id}
                              type="button"
                              className={`milestone-row ${milestone.completed ? "done" : ""}`}
                              onClick={() => {
                                if (milestone.source === "task" && milestone.taskId) {
                                  const targetTask = domainTasks.find((task: any) => task.id === milestone.taskId);
                                  if (!targetTask) {
                                    return;
                                  }
                                  const nextStatus = targetTask.status === "done" ? "pending" : "done";
                                  setAndSave(
                                    withUpdatedBuildPackage(state, updatePlanProgress(buildPackage, targetTask.id, nextStatus))
                                  );
                                  return;
                                }

                                if (!milestone.proofKind) {
                                  return;
                                }

                                if (hasDomainUpdate(state, item.domain, milestone.proofKind)) {
                                  setAndSave({
                                    ...state,
                                    domainUpdates: state.domainUpdates.filter(
                                      (entry) => !(entry.domain === item.domain && entry.kind === milestone.proofKind)
                                    )
                                  });
                                  return;
                                }

                                setAndSave({
                                  ...state,
                                  domainUpdates: [
                                    {
                                      id: `${item.domain}-${milestone.proofKind}-${Date.now()}`,
                                      domain: item.domain,
                                      kind: milestone.proofKind,
                                      createdAt: new Date().toISOString(),
                                      note: `${titleize(item.domain)} ${milestone.proofKind} logged.`
                                    },
                                    ...state.domainUpdates
                                  ]
                                });
                              }}
                            >
                              <div>
                                <strong>{milestone.label}</strong>
                                <p className="muted">{milestone.detail}</p>
                              </div>
                              <span className={`pill ${milestone.completed ? "good" : ""}`}>
                                {milestone.completed ? "Done" : "Open"}
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="field-group">
                          <label htmlFor={`domain-proof-${item.domain}`}>What actually happened this week?</label>
                          <textarea
                            id={`domain-proof-${item.domain}`}
                            className="text-area"
                            rows={3}
                            placeholder={`Example: I completed the first ${item.domain} step, where it broke, and what I will change next week.`}
                            value={domainDrafts[item.domain] || ""}
                            onChange={(event) =>
                              setDomainDrafts((current) => ({
                                ...current,
                                [item.domain]: event.target.value
                              }))
                            }
                          />
                        </div>
                        <div className="controls">
                          <button
                            type="button"
                            className="primary"
                            onClick={() => {
                              const note = (domainDrafts[item.domain] || "").trim();
                              if (!note) {
                                return;
                              }

                              const proofTask = domainTasks.find((task: any) => task.taskKind === "proof" && task.status !== "done");
                              const nextBuildPackage = proofTask
                                ? updatePlanProgress(buildPackage, proofTask.id, "done")
                                : buildPackage;

                              setAndSave({
                                ...withUpdatedBuildPackage(state, nextBuildPackage),
                                domainUpdates: [
                                  {
                                    id: `${item.domain}-proof-${Date.now()}`,
                                    domain: item.domain,
                                    kind: "proof",
                                    createdAt: new Date().toISOString(),
                                    note
                                  },
                                  ...state.domainUpdates
                                ]
                              });

                              setDomainDrafts((current) => ({
                                ...current,
                                [item.domain]: ""
                              }));
                            }}
                          >
                            Save weekly proof
                          </button>
                        </div>
                        {recentUpdates.length ? (
                          <div className="stack-list">
                            <strong>Recent proof</strong>
                            <div className="history-stack">
                              {recentUpdates.map((entry) => (
                                <article key={entry.id} className="history-card compact-history-card">
                                  <div className="line-between">
                                    <strong>{titleize(entry.kind)}</strong>
                                    <span className="pill">{formatDate(entry.createdAt)}</span>
                                  </div>
                                  <p>{entry.note}</p>
                                </article>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </details>
                );
              })}
            </div>
          </Panel>
        ) : null}

        {progressSection === "tracker" ? (
          <div className="workspace-grid workspace-grid-two">
            <Panel title="Tracker health" eyebrow="Execution">
              <div className="priority-grid">
                <article className="mini-stat-card">
                  <span className="muted">Completed</span>
                  <strong>{tracker.summary.completedCount}</strong>
                  <p>Tasks fully closed.</p>
                </article>
                <article className="mini-stat-card">
                  <span className="muted">In progress</span>
                  <strong>{tracker.summary.inProgressCount}</strong>
                  <p>Tasks currently moving.</p>
                </article>
                <article className="mini-stat-card">
                  <span className="muted">Adherence</span>
                  <strong>{percent(tracker.summary.adherenceScore)}</strong>
                  <p>Execution consistency across the plan.</p>
                </article>
              </div>
            </Panel>

            <Panel title="Run history" eyebrow="Reliability over time">
              <div className="history-stack">
                {state.history.length ? (
                  state.history.slice(0, 6).map((item: any) => (
                    <details key={item.id} className="history-card compact-plan">
                      <summary className="line-between">
                        <div>
                          <strong>{item.title}</strong>
                          <p className="muted">{formatDate(item.createdAt)}</p>
                        </div>
                        <span className={`pill ${statusTone(item.workflowStatus.toLowerCase())}`}>{item.workflowStatus}</span>
                      </summary>
                      <div className="compact-plan-body">
                        <p className="muted">Reliability {percent(item.confidence)}</p>
                      </div>
                    </details>
                  ))
                ) : (
                  <p className="muted">No saved runs yet.</p>
                )}
              </div>
            </Panel>
          </div>
        ) : null}

        {progressSection === "reflections" ? (
          <Panel title="Recent check-ins" eyebrow="Reflection loop">
            <div className="history-stack">
              {state.checkIns.length ? (
                state.checkIns.slice(0, 6).map((item) => (
                  <details key={item.id} className="history-card compact-plan">
                    <summary className="line-between">
                      <div>
                        <strong>{checkInFocusLabel(item)}</strong>
                        <p className="muted">
                          {titleize(item.kind || "weekly")} • {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <span className="pill">
                        {item.energy}/{item.adherence}/{item.clarity}
                      </span>
                    </summary>
                    <div className="compact-plan-body stack-list">
                      {item.win ? <p>Completed: {item.win}</p> : null}
                      {item.blocker ? <p className="muted">Blocker: {item.blocker}</p> : null}
                      {item.note ? <p>Next: {item.note}</p> : null}
                    </div>
                  </details>
                ))
              ) : (
                <p className="muted">No check-ins saved yet.</p>
              )}
            </div>
          </Panel>
        ) : null}
      </div>
    );
  }

  if (view === "agent-runs" && buildPackage && latestRun) {
    const buildSummary = getBuildSummary(buildPackage);
    const agentAssessment = buildPackage.workflowMeta?.agentAssessment || {
      summary: "Evaluation details are still sparse for this run."
    };
    const failedTests = listOf<any>(latestRun.testResultsSummary?.failedTests);
    const passedTests = listOf<string>(latestRun.testResultsSummary?.passedUnitTests);
    const workflowMeta = latestRun.workflowMeta || buildPackage.workflowMeta || {};
    const normalizedAgentRoster = getAgentRoster(buildPackage);
    const agentRoster = normalizedAgentRoster.length
      ? normalizedAgentRoster
      : listOf<any>(latestRun.agentRoster);
    const logs = listOf<any>(latestRun.logs);
    const riskAssessment = listOf<string>(latestRun.riskAssessment).length
      ? listOf<string>(latestRun.riskAssessment)
      : listOf<string>(buildPackage.workflowMeta?.agentAssessment?.risks);
    const nextIteration = listOf<string>(latestRun.suggestedNextIterationRoadmap).length
      ? listOf<string>(latestRun.suggestedNextIterationRoadmap)
      : [
          "Tighten evaluation gates before domain planners finalize output.",
          "Persist richer traces so agent outputs are inspectable after the run.",
          "Add stronger recovery paths when a downstream step partially completes."
        ];

    return (
      <div className="workspace-stack">
        <section className="workspace-hero workspace-hero-accent">
          <div className="hero-copy-block">
            <p className="eyebrow">Agent orchestration workspace</p>
            <h2>{latestRun.workflowStatus}</h2>
            <p>
              This view now shows what each agent owns, how reliable its output looks, and where the current package
              is still weak.
            </p>
          </div>
          <div className="hero-metric-grid">
            <article className="hero-metric-card">
              <span className="muted">Run reliability</span>
              <strong>{percent(buildSummary.finalConfidenceScore)}</strong>
              <p>Input quality + specificity + evaluation coverage, not your odds of becoming successful.</p>
            </article>
            <article className="hero-metric-card">
              <span className="muted">Iterations</span>
              <strong>{buildSummary.numberOfIterations}</strong>
              <p>How many internal passes the system made before compiling this run.</p>
            </article>
            <article className="hero-metric-card">
              <span className="muted">Backend</span>
              <strong>{textOrFallback(workflowMeta.backend, "Demo pipeline")}</strong>
              <p>The system currently mixes deterministic logic with agent passes instead of one black-box response.</p>
            </article>
          </div>
        </section>

        <div className="quick-chip-grid workspace-subnav" role="tablist" aria-label="Agent workspace sections">
          {[
            ["overview", "Agent roster"],
            ["support", "Interactive support"],
            ["trace", "Trace and gates"],
            ["risk", "Risk and next steps"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`choice-chip ${agentRunsSection === value ? "active" : ""}`}
              onClick={() => setAgentRunsSection(value as AgentRunsSection)}
            >
              {label}
            </button>
          ))}
        </div>

        {agentRunsSection === "overview" ? (
          <div className="workspace-columns">
            <div className="workspace-main-column">
              <Panel title="Agent roster" eyebrow="Ownership map">
                <div className="agent-grid">
                  {agentRoster.map((agent: any) => {
                    const blueprint = agentBlueprints[agent.agentName];
                    return (
                      <article key={agent.agentName} className="agent-card">
                        <div className="line-between">
                          <strong>{agent.agentName}</strong>
                          <span className={`pill ${statusTone(agent.status)}`}>{agent.status}</span>
                        </div>
                        <p>{blueprint?.output || "Agent output ready."}</p>
                        <p className="muted">
                          Reliability score {agent.confidence !== null ? percent(agent.confidence) : "n/a"}
                        </p>
                        <p className="muted">{blueprint?.confidence || "Reliability score explanation unavailable."}</p>
                        <p className="muted">Gate: {blueprint?.gate || "Review generated output for coherence."}</p>
                      </article>
                    );
                  })}
                </div>
              </Panel>
            </div>

            <div className="workspace-side-column">
              <Panel title="Pipeline snapshot" eyebrow="What the run is doing">
                <div className="stack-list">
                  <div className="pipeline-list compact-pipeline-list">
                    {agentRoster.map((agent: any, index: number) => (
                      <div key={`${agent.agentName}-${index}`} className="pipeline-item">
                        <div>
                          <strong>{agent.agentName}</strong>
                          <p className="muted">
                            {agentBlueprints[agent.agentName]?.gate || "Check output quality before moving downstream."}
                          </p>
                        </div>
                        <span className={`pill ${statusTone(agent.status)}`}>{agent.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="history-card">
                    <strong>Last run summary</strong>
                    <p>{agentAssessment.summary}</p>
                    <p className="muted">
                      Reliability {percent(buildSummary.finalConfidenceScore)} • Backend{" "}
                      {textOrFallback(latestRun.workflowMeta?.backend, "OpenAI runtime")}
                    </p>
                  </div>
                  <div>
                    <strong>What the confidence score means</strong>
                    <p>
                      Confidence is the system&apos;s estimate of how reliable the output is given the quality of your
                      inputs, the amount of contradiction in your baseline, and how well the result survived evaluation.
                    </p>
                  </div>
                  <p>
                    High confidence means the plan is specific, realistic, and internally consistent. Medium confidence
                    means parts of the run still rely on assumptions. Low confidence means the system is missing data or
                    the plan is still fragile.
                  </p>
                </div>
              </Panel>
            </div>
          </div>
        ) : null}

        {agentRunsSection === "support" ? (
          <div className="workspace-columns">
            <div className="workspace-main-column">
              <AgentConversationPanel
                buildPackage={buildPackage}
                conversations={agentConversations}
                onChange={setAgentConversations}
              />
            </div>
            <div className="workspace-side-column">
              <Panel title="Before you ask an agent" eyebrow="Data handling">
                <div className="stack-list">
                  <p>{dataHandlingCopy}</p>
                  <p className="muted">
                    Your saved planning mode is <strong>{planningModeDetails.title}</strong>. Direct agent
                    conversations still use a lighter GPT-5 mini response path with medium reasoning so replies stay
                    faster and grounded in your current plan.
                  </p>
                </div>
              </Panel>
            </div>
          </div>
        ) : null}

        {agentRunsSection === "trace" ? (
          <div className="workspace-columns">
            <div className="workspace-main-column">
              <Panel title="Execution trace" eyebrow="Observed run">
                {logs.length ? (
                  <div className="history-stack">
                    {logs.map((log: any, index: number) => (
                      <article key={log.id || `${log.agentName || "agent"}-${index}`} className="history-card">
                        <div className="line-between">
                          <strong>{textOrFallback(log.agentName, "Unnamed agent")}</strong>
                          <span className="pill">{Number(log.durationMs || 0)} ms</span>
                        </div>
                        <p>{textOrFallback(log.inputSummary, "No input summary recorded.")}</p>
                        <p className="muted">{textOrFallback(log.outputSummary, "No output summary recorded.")}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No execution trace was captured for this run.</p>
                )}
              </Panel>
            </div>
            <div className="workspace-side-column">
              <Panel title="What still needs work" eyebrow="Evaluation gates">
                <div className="stack-list">
                  <div>
                    <strong>Passed checks</strong>
                    <ul className="clean-list">
                      {passedTests.map((item: string, index: number) => (
                        <li key={stableListKey("agent-passed-check", item, index)}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Failed checks</strong>
                    {failedTests.length ? (
                      <div className="history-stack">
                        {failedTests.map((item: any) => (
                          <article key={item.failedComponent} className="history-card">
                            <div className="line-between">
                              <strong>{item.failedComponent}</strong>
                              <span className="pill warn">{item.severity}</span>
                            </div>
                            <p>{item.observedBehavior}</p>
                            <p className="muted">{item.recommendedFixPath}</p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">No failed checks reported.</p>
                    )}
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        ) : null}

        {agentRunsSection === "risk" ? (
          <div className="workspace-columns">
            <div className="workspace-main-column">
              <Panel title="Risk assessment" eyebrow="Guardrails">
                {riskAssessment.length ? (
                  <ul className="clean-list">
                    {riskAssessment.map((item: string, index: number) => (
                      <li key={stableListKey("agent-risk", item, index)}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No explicit risk notes were attached to this run.</p>
                )}
              </Panel>
            </div>
            <div className="workspace-side-column">
              <Panel title="Suggested next iteration" eyebrow="Improve the stack">
                <ul className="clean-list">
                  {nextIteration.map((item: string, index: number) => (
                    <li key={stableListKey("agent-next-iteration", item, index)}>{item}</li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (view === "history") {
    const filteredCheckIns = state.checkIns.filter((item) => {
      const typeMatches = historyFilter === "all" || item.kind === historyFilter;
      const query = historySearch.trim().toLowerCase();
      if (!query) {
        return typeMatches;
      }

      const haystack = [
        checkInFocusLabel(item),
        item.win,
        item.note,
        item.blocker,
        item.summary?.completedActions?.join(" "),
        item.summary?.nextRecommendedActions?.join(" ")
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return typeMatches && haystack.includes(query);
    });

    const filteredRuns = state.history.filter((item: any) => {
      const query = historySearch.trim().toLowerCase();
      if (!query) {
        return true;
      }
      return `${item.title} ${item.workflowStatus}`.toLowerCase().includes(query);
    });

    const runPage = paginate(filteredRuns, historyPage, historyPageSize);
    const reflectionPage = paginate(filteredCheckIns, historyPage, historyPageSize);

    return (
      <div className="workspace-stack">
        <SectionTabs
          label="History sections"
          value={historySection}
          onChange={setHistorySection}
          options={[
            { value: "runs", label: "Runs" },
            { value: "reflections", label: "Reflections" }
          ]}
        />

        <Panel title="History filters" eyebrow="Reduce visible content">
          <div className="history-toolbar">
            <div className="field-group">
              <label htmlFor="history-search">Search</label>
              <input
                id="history-search"
                className="text-input"
                placeholder="Search by title, category, blocker, or next action"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
              />
            </div>
            {historySection === "reflections" ? (
              <div className="field-group">
                <label htmlFor="history-filter-type">Type</label>
                <select
                  id="history-filter-type"
                  className="select-input"
                  value={historyFilter}
                  onChange={(event) => setHistoryFilter(event.target.value as HistoryFilter)}
                >
                  <option value="all">All</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            ) : null}
          </div>
        </Panel>

        {historySection === "runs" ? (
          <Panel title="Saved run history" eyebrow="Previous workspaces">
            <div className="history-stack">
              {runPage.items.length ? (
                runPage.items.map((item: any) => (
                  <details key={item.id} className="history-card compact-plan">
                    <summary className="line-between">
                      <div>
                        <strong>{item.title}</strong>
                        <p className="muted">{formatDate(item.createdAt)}</p>
                      </div>
                      <span className={`pill ${statusTone(item.workflowStatus.toLowerCase())}`}>{item.workflowStatus}</span>
                    </summary>
                    <div className="compact-plan-body stack-list">
                      <p className="muted">
                        Reliability {percent(item.confidence)} • Submitted {formatDateTime(item.createdAt)}
                      </p>
                      <p>{renderSummaryText(item.title, "Saved run.")}</p>
                    </div>
                  </details>
                ))
              ) : (
                <p className="muted">No saved runs found for the current search.</p>
              )}
            </div>
            <PaginationControls page={runPage.page} totalPages={runPage.totalPages} onPageChange={setHistoryPage} />
          </Panel>
        ) : null}

        {historySection === "reflections" ? (
          <Panel title="Reflection archive" eyebrow="Daily and weekly check-ins">
            <div className="history-stack">
              {reflectionPage.items.length ? (
                reflectionPage.items.map((item) => (
                  <details key={item.id} className="history-card compact-plan">
                    <summary className="line-between">
                      <div>
                        <strong>{checkInFocusLabel(item)}</strong>
                        <p className="muted">
                          {titleize(item.kind || "weekly")} • {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <span className="pill">
                        {item.energy}/{item.adherence}/{item.clarity}
                      </span>
                    </summary>
                    <div className="compact-plan-body stack-list">
                      {item.summary?.completedActions?.length ? (
                        <div>
                          <strong>Completed</strong>
                          <p>{item.summary.completedActions.slice(0, 3).join(" • ")}</p>
                        </div>
                      ) : null}
                      {item.summary?.blockers?.length ? (
                        <div>
                          <strong>Blockers</strong>
                          <p className="muted">{item.summary.blockers.slice(0, 3).join(" • ")}</p>
                        </div>
                      ) : null}
                      {item.summary?.nextRecommendedActions?.length ? (
                        <div>
                          <strong>Next actions</strong>
                          <p>{item.summary.nextRecommendedActions.slice(0, 3).join(" • ")}</p>
                        </div>
                      ) : item.note ? (
                        <p>{item.note}</p>
                      ) : null}
                    </div>
                  </details>
                ))
              ) : (
                <p className="muted">No reflections found for the current filters.</p>
              )}
            </div>
            <PaginationControls
              page={reflectionPage.page}
              totalPages={reflectionPage.totalPages}
              onPageChange={setHistoryPage}
            />
          </Panel>
        ) : null}
      </div>
    );
  }

  if (view === "settings") {
    return (
      <div className="workspace-stack">
        <section className="workspace-hero workspace-hero-soft">
          <div className="hero-copy-block">
            <p className="eyebrow">Workspace settings</p>
            <h2>Appearance, protected storage status, and workspace controls in one place.</h2>
            <p>
              Theme, planning mode, persistence health, and account context now live in one operational page instead of
              being hidden behind scaffold copy.
            </p>
          </div>
          <div className="hero-metric-grid">
            <article className="hero-metric-card">
              <span className="muted">Current theme</span>
              <strong>{currentAppearanceTitle}</strong>
            </article>
            <article className="hero-metric-card">
              <span className="muted">Planning mode</span>
              <strong>{planningModeDetails.title}</strong>
            </article>
            <article className="hero-metric-card">
              <span className="muted">Mode</span>
              <strong>{authModeLabel}</strong>
            </article>
            <article className="hero-metric-card">
              <span className="muted">Saved check-ins</span>
              <strong>{state.checkIns.length}</strong>
            </article>
          </div>
        </section>

        <div className="workspace-columns">
          <div className="workspace-main-column">
            <Panel title="Appearance" eyebrow="Theme options">
              <div className="stack-list">
                <div className="field-group">
                  <label htmlFor="appearance-select">Appearance</label>
                  <select
                    id="appearance-select"
                    className="select-input"
                    value={state.preferences.appearance}
                    onChange={(event) =>
                      setAndSave({
                        ...state,
                        preferences: {
                          ...state.preferences,
                          appearance: event.target.value as DemoAppearance,
                          appearanceSelection: "user"
                        }
                      })
                    }
                  >
                    {appearanceOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="theme-card theme-card-preview active">
                  <div className="theme-swatches">
                    {selectedAppearance.colors.map((color) => (
                      <span key={color} style={{ background: color }} />
                    ))}
                  </div>
                  <strong>{selectedAppearance.title}</strong>
                  <p>{selectedAppearance.subtitle}</p>
                </div>
              </div>
            </Panel>

            <Panel title="Plan generation mode" eyebrow="Run behavior">
              <div className="stack-list">
                <p className="muted">
                  Choose whether new plans should prioritize reliability or a more experimental multi-agent run.
                </p>
                <div className="choice-grid">
                  {planningModeOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`choice-card ${planningMode === option.id ? "active" : ""}`}
                      onClick={() =>
                        setAndSave({
                          ...state,
                          preferences: {
                            ...state.preferences,
                            planningMode: option.id
                          }
                        })
                      }
                    >
                      <strong>
                        {option.title} <small>{option.eyebrow}</small>
                      </strong>
                      <small>{option.subtitle}</small>
                    </button>
                  ))}
                </div>
                <p className="field-note">
                  Current selection: <strong>{planningModeDetails.title}</strong>. {planningModeDetails.detail}
                </p>
              </div>
            </Panel>

            <Panel title="Persistence" eyebrow="Data layer">
              <div className="stack-list">
                <div className="line-between">
                  <span>Current storage</span>
                  <span
                    className={`pill ${
                      diagnostics.mode === "supabase"
                        ? "good"
                        : diagnostics.mode === "local-fallback"
                          ? "warn"
                          : ""
                    }`}
                  >
                    {diagnostics.mode === "supabase"
                      ? "Supabase"
                      : diagnostics.mode === "local-fallback"
                        ? "Local recovery cache"
                        : "Browser local storage"}
                  </span>
                </div>
                <p className="muted">
                  {authSummary.mode === "supabase"
                    ? "Assessment results, weekly plans, reflections, settings, progress logs, and agent runs are persisted against the authenticated Supabase user id. If that write path fails, the app switches into visible recovery-cache mode instead of pretending the save succeeded."
                    : "The demo workspace is intentionally local-first and should not be confused with protected production storage."}
                </p>
              </div>
            </Panel>

            <Panel title="Agent infrastructure" eyebrow="Production shape">
              <ul className="clean-list">
                <li>OpenAI Agents SDK for agent contracts and structured output.</li>
                <li>Inngest for workflow retries, async orchestration, and durable events.</li>
                <li>Evaluation gates before downstream planning and before final package assembly.</li>
                <li>Structured traces tied to each run so failures are inspectable instead of opaque.</li>
              </ul>
            </Panel>

            <Panel title="Danger zone" eyebrow="Account controls">
              <SettingsDangerZone />
            </Panel>
          </div>

          <div className="workspace-side-column">
            <Panel title="Authentication" eyebrow="Account status">
              <div className="stack-list">
                <div className="line-between">
                  <span>Current mode</span>
                  <span className="pill">{accountStatusLabel}</span>
                </div>
                <p className="muted">
                  {authSummary.mode === "supabase"
                    ? "Supabase email/password auth is active. Workspace ownership, onboarding, and plan runs are keyed to the authenticated user id."
                    : "Production mode should use Supabase Auth or Clerk with protected server routes and durable user sessions."}
                </p>
              </div>
            </Panel>

            {process.env.NODE_ENV !== "production" ? (
              <Panel title="Developer diagnostics" eyebrow="Debug storage">
                <div className="stack-list">
                  <div className="line-between">
                    <span>Authenticated user</span>
                    <span className="pill">{diagnostics.userId || "none"}</span>
                  </div>
                  <div className="line-between">
                    <span>Supabase connection</span>
                    <span className={`pill ${diagnostics.connectionStatus === "connected" ? "good" : ""}`}>
                      {diagnostics.connectionStatus}
                    </span>
                  </div>
                  <div className="line-between">
                    <span>Last successful read</span>
                    <span className="muted">{diagnostics.lastSuccessfulRead || "None yet"}</span>
                  </div>
                  <div className="line-between">
                    <span>Last successful write</span>
                    <span className="muted">{diagnostics.lastSuccessfulWrite || "None yet"}</span>
                  </div>
                  <div className="line-between">
                    <span>Fallback local storage</span>
                    <span className="pill">{diagnostics.fallbackLocalStorage ? "active" : "off"}</span>
                  </div>
                  <div>
                    <strong>Tables in use</strong>
                    <div className="workspace-pills">
                      {diagnostics.tablesUsed.length ? (
                        diagnostics.tablesUsed.map((table) => (
                          <span key={table} className="pill">
                            {table}
                          </span>
                        ))
                      ) : (
                        <span className="muted">Demo mode does not hit Supabase tables.</span>
                      )}
                    </div>
                  </div>
                  {diagnostics.recentSaveErrors.length ? (
                    <div>
                      <strong>Recent save errors</strong>
                      <ul className="clean-list">
                        {diagnostics.recentSaveErrors.map((item, index) => (
                          <li key={stableListKey("settings-save-error", item, index)}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </Panel>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (buildPackage) {
    return <TaskPanel buildPackage={buildPackage} onUpdate={setAndSave} state={state} />;
  }

  return null;
}

function WorkspaceLoadingState() {
  return (
    <div className="workspace-stack">
      <section className="workspace-hero workspace-hero-soft">
        <div className="hero-copy-block">
          <p className="eyebrow">Loading workspace</p>
          <h2>Syncing your latest plan, history, and reflections.</h2>
          <p>The app is pulling your saved workspace before it renders the command center.</p>
        </div>
        <div className="hero-metric-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <article key={index} className="hero-metric-card skeleton-card">
              <span className="muted">Loading</span>
              <strong>...</strong>
              <p className="muted">Preparing your workspace.</p>
            </article>
          ))}
        </div>
      </section>
      <div className="workspace-grid workspace-grid-two">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="workspace-panel skeleton-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Loading</p>
                <h2>Workspace card</h2>
              </div>
            </div>
            <div className="stack-list">
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function TaskPanel({
  buildPackage,
  onUpdate,
  state
}: {
  buildPackage: any;
  onUpdate: (next: DemoState) => void;
  state: DemoState;
}) {
  const tracker = getTracker(buildPackage);
  return (
    <Panel title="Task board" eyebrow="Execution queue">
      <div className="history-stack">
        {tracker.tasks.map((task: any) => (
          <article key={task.id} className="history-card">
            <div className="line-between">
              <div>
                <strong>{task.taskText}</strong>
                <p className="muted">
                  {titleize(task.planDomain)} • {task.metric} • {task.deadline}
                </p>
              </div>
              <span className={`pill ${statusTone(task.status)}`}>{task.status}</span>
            </div>
            <div className="controls">
              <button
                type="button"
                onClick={() => onUpdate(withUpdatedBuildPackage(state, updatePlanProgress(buildPackage, task.id, "in-progress")))}
              >
                Start
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => onUpdate(withUpdatedBuildPackage(state, updatePlanProgress(buildPackage, task.id, "done")))}
              >
                Mark done
              </button>
              <button
                type="button"
                onClick={() => onUpdate(withUpdatedBuildPackage(state, updatePlanProgress(buildPackage, task.id, "pending")))}
              >
                Reset
              </button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function CheckInPanel({
  state,
  onUpdate
}: {
  state: DemoState;
  onUpdate: (nextState: DemoState) => void;
}) {
  const buildPackage = state.buildPackage;
  const executionSystem = buildPackage?.executionSystem || {};
  const failureTriggers = listOf<string>(executionSystem.failureTriggers);
  const [kind, setKind] = useState<CheckInMode>("weekly");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "protect-attention",
    "repair-sleep",
    "execute-career-work"
  ]);
  const [reflectionDrafts, setReflectionDrafts] = useState<Record<string, ReflectionDraft>>({});
  const [energy, setEnergy] = useState("3");
  const [adherence, setAdherence] = useState("3");
  const [clarity, setClarity] = useState("3");

  useEffect(() => {
    setReflectionDrafts((current) =>
      selectedCategories.reduce(
        (next, categoryId) => {
          next[categoryId] = current[categoryId] || buildEmptyReflectionDraft();
          return next;
        },
        {} as Record<string, ReflectionDraft>
      )
    );
  }, [selectedCategories]);

  const averages = useMemo(() => {
    return {
      energy: average(state.checkIns.map((item) => Number(item.energy))),
      adherence: average(state.checkIns.map((item) => Number(item.adherence))),
      clarity: average(state.checkIns.map((item) => Number(item.clarity)))
    };
  }, [state.checkIns]);

  const latestSummary = state.checkIns[0]?.summary;

  return (
    <div className="workspace-grid workspace-grid-two">
      <Panel title="Reflection" eyebrow="Daily and weekly review">
        <div className="stack-list check-in-form">
          <p className="muted">
            {kind === "weekly"
              ? "Weekly check-in looks at the whole week. Choose the categories that mattered, then answer each section directly."
              : "Daily check-in is for today only. Record what got done, what slipped, and what needs protection tomorrow."}
          </p>
          <div className="quick-chip-grid">
            {(["daily", "weekly"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`choice-chip ${kind === option ? "active" : ""}`}
                onClick={() => setKind(option)}
              >
                {titleize(option)} check-in
              </button>
            ))}
          </div>
          <div className="stack-list">
            <strong>{kind === "weekly" ? "Select the areas to review this week" : "Select the areas that mattered today"}</strong>
            <div className="quick-chip-grid">
              {reflectionCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`choice-chip ${selectedCategories.includes(category.id) ? "active" : ""}`}
                  onClick={() =>
                    setSelectedCategories((current) => {
                      const next = toggleSelection(current, category.id);
                      return next.length ? next : current;
                    })
                  }
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
          <div className="quick-chip-grid">
            <span className="pill">Daily = today only</span>
            <span className="pill">Weekly = full-week review</span>
            <span className="pill">One section per selected category</span>
          </div>
          <div className="priority-grid">
            <MetricSlider label="Energy" value={energy} onChange={setEnergy} />
            <MetricSlider label="Adherence" value={adherence} onChange={setAdherence} />
            <MetricSlider label="Clarity" value={clarity} onChange={setClarity} />
          </div>
          <div className="history-stack">
            {selectedCategories.map((categoryId) => {
              const category = getReflectionCategory(categoryId);
              if (!category) {
                return null;
              }

              const draft = reflectionDrafts[categoryId] || buildEmptyReflectionDraft();
              const questions = kind === "weekly" ? category.weeklyQuestions : category.dailyQuestions;

              return (
                <article key={category.id} className="history-card reflection-section-card">
                  <div className="line-between">
                    <div>
                      <strong>{category.label}</strong>
                      <p className="muted">{titleize(category.domain)} domain</p>
                    </div>
                    <span className="pill">{titleize(kind)}</span>
                  </div>
                  <div className="stack-list">
                    {questions.map((question) => (
                      <div key={question.key} className="field-group">
                        <label htmlFor={`${category.id}-${question.key}`}>{question.label}</label>
                        <textarea
                          id={`${category.id}-${question.key}`}
                          className="text-area"
                          rows={3}
                          placeholder={question.placeholder}
                          value={draft.answers[question.key] || ""}
                          onChange={(event) =>
                            setReflectionDrafts((current) => ({
                              ...current,
                              [category.id]: {
                                ...(current[category.id] || buildEmptyReflectionDraft()),
                                answers: {
                                  ...(current[category.id]?.answers || {}),
                                  [question.key]: event.target.value
                                }
                              }
                            }))
                          }
                        />
                      </div>
                    ))}
                    <div className="field-group">
                      <label htmlFor={`${category.id}-blocker`}>
                        {kind === "weekly" ? "Main blocker in this area" : "What got in the way today?"}
                      </label>
                      <input
                        id={`${category.id}-blocker`}
                        className="text-input"
                        placeholder="Name the actual blocker, not a vague feeling."
                        value={draft.blocker}
                        onChange={(event) =>
                          setReflectionDrafts((current) => ({
                            ...current,
                            [category.id]: {
                              ...(current[category.id] || buildEmptyReflectionDraft()),
                              blocker: event.target.value
                            }
                          }))
                        }
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor={`${category.id}-rating`}>
                        {kind === "weekly" ? "How well did you hold this area this week?" : "How well did you hold this area today?"}
                      </label>
                      <select
                        id={`${category.id}-rating`}
                        className="select-input"
                        value={draft.completionRating}
                        onChange={(event) =>
                          setReflectionDrafts((current) => ({
                            ...current,
                            [category.id]: {
                              ...(current[category.id] || buildEmptyReflectionDraft()),
                              completionRating: event.target.value
                            }
                          }))
                        }
                      >
                        <option value="1">1 - Fell apart</option>
                        <option value="2">2 - Weak</option>
                        <option value="3">3 - Mixed</option>
                        <option value="4">4 - Solid</option>
                        <option value="5">5 - Strong</option>
                      </select>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {failureTriggers.length ? (
            <div className="stack-list">
              <strong>Failure triggers to watch</strong>
              <ul className="clean-list">
                {failureTriggers.map((item: string, index: number) => (
                  <li key={stableListKey("legacy-reflection-trigger", item, index)}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <button
            type="button"
            className="button-link primary"
            onClick={() => {
              const chosenCategories = selectedCategories.length
                ? selectedCategories
                : [reflectionCategories[0]?.id].filter(Boolean) as string[];
              const reflections: DemoCheckInReflection[] = chosenCategories.map((categoryId) => {
                const draft = reflectionDrafts[categoryId] || buildEmptyReflectionDraft();
                return {
                  category: categoryId,
                  answers: draft.answers,
                  blocker: draft.blocker,
                  completionRating: draft.completionRating
                };
              });
              const createdAt = new Date().toISOString();
              const summary = buildCheckInSummary(reflections);
              const entry: DemoCheckIn = {
                id: `check-in-${Date.now()}`,
                createdAt,
                kind,
                energy,
                adherence,
                clarity,
                focus: chosenCategories
                  .map((categoryId) => getReflectionCategory(categoryId)?.label)
                  .filter(Boolean)
                  .join(", "),
                focusAreas: chosenCategories.map((categoryId) => getReflectionCategory(categoryId)?.label).filter(Boolean) as string[],
                win: summary.completedActions[0] || "",
                blocker: summary.blockers[0] || "",
                note: summary.nextRecommendedActions[0] || "",
                reflections,
                summary
              };

              onUpdate({
                ...state,
                checkIns: [entry, ...state.checkIns],
                domainUpdates: buildDomainUpdatesFromReflection(createdAt, reflections).concat(state.domainUpdates)
              });

              setReflectionDrafts(
                chosenCategories.reduce(
                  (next, categoryId) => {
                    next[categoryId] = buildEmptyReflectionDraft();
                    return next;
                  },
                  {} as Record<string, ReflectionDraft>
                )
              );
            }}
          >
            Save {kind} check-in
          </button>
        </div>
      </Panel>

      <Panel title="Recent check-ins" eyebrow="Summary and history">
        <div className="priority-grid">
          <article className="mini-stat-card">
            <span className="muted">Average energy</span>
            <strong>{state.checkIns.length ? `${averages.energy.toFixed(1)}/5` : "n/a"}</strong>
            <p>How strong the week felt.</p>
          </article>
          <article className="mini-stat-card">
            <span className="muted">Average adherence</span>
            <strong>{state.checkIns.length ? `${averages.adherence.toFixed(1)}/5` : "n/a"}</strong>
            <p>How well execution matched intent.</p>
          </article>
          <article className="mini-stat-card">
            <span className="muted">Average clarity</span>
            <strong>{state.checkIns.length ? `${averages.clarity.toFixed(1)}/5` : "n/a"}</strong>
            <p>How clean the plan felt in practice.</p>
          </article>
        </div>
        {latestSummary ? (
          <article className="history-card">
            <div className="line-between">
              <strong>Latest generated summary</strong>
              <span className="pill">{titleize(state.checkIns[0]?.kind || "weekly")}</span>
            </div>
            <div className="stack-list">
              <div>
                <strong>Completed actions</strong>
                <ul className="clean-list">
                  {latestSummary.completedActions.map((item, index) => (
                    <li key={stableListKey("legacy-reflection-completed", item, index)}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Skipped areas</strong>
                <ul className="clean-list">
                  {latestSummary.skippedAreas.map((item, index) => (
                    <li key={stableListKey("legacy-reflection-skipped", item, index)}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Next recommended actions</strong>
                <ul className="clean-list">
                  {latestSummary.nextRecommendedActions.map((item, index) => (
                    <li key={stableListKey("legacy-reflection-next", item, index)}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="workspace-pills">
                {latestSummary.impactedDomains.map((item, index) => (
                  <span key={stableListKey("legacy-reflection-domain", item, index)} className="pill">
                    Progress update: {titleize(item)}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ) : null}
        <div className="history-stack">
          {state.checkIns.length ? (
            state.checkIns.map((item) => (
              <article key={item.id} className="history-card">
                <div className="line-between">
                  <strong>{checkInFocusLabel(item)}</strong>
                  <span className="pill">
                    {titleize(item.kind || "weekly")} • {formatDate(item.createdAt)}
                  </span>
                </div>
                <p className="muted">
                  Energy {item.energy}/5 • Adherence {item.adherence}/5 • Clarity {item.clarity}/5
                </p>
                {item.summary?.completedActions?.length ? (
                  <p>Completed: {item.summary.completedActions.join(" | ")}</p>
                ) : item.win ? (
                  <p>Completed: {item.win}</p>
                ) : null}
                {item.summary?.blockers?.length ? (
                  <p className="muted">Blockers: {item.summary.blockers.join(" | ")}</p>
                ) : item.blocker ? (
                  <p className="muted">Blocker: {item.blocker}</p>
                ) : null}
                {item.summary?.nextRecommendedActions?.length ? (
                  <p>Next: {item.summary.nextRecommendedActions.join(" | ")}</p>
                ) : item.note ? (
                  <p>Next: {item.note}</p>
                ) : null}
                {Array.isArray(item.reflections) && item.reflections.length ? (
                  <div className="workspace-pills">
                    {item.reflections.map((reflection) => {
                      const category = getReflectionCategory(reflection.category);
                      return category ? (
                        <span key={`${item.id}-${reflection.category}`} className="pill">
                          {category.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <p className="muted">No check-ins saved yet.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}

function AgentConversationPanel({
  buildPackage,
  conversations,
  onChange
}: {
  buildPackage: any;
  conversations: Record<string, AgentChatMessage[]>;
  onChange: (value: Record<string, AgentChatMessage[]> | ((current: Record<string, AgentChatMessage[]>) => Record<string, AgentChatMessage[]>)) => void;
}) {
  const [selectedAgent, setSelectedAgent] = useState<string>(interactiveAgents[0]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messages = conversations[selectedAgent] || [];

  async function sendMessage() {
    const trimmed = draft.trim();
    if (!trimmed || isSending) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    onChange((current) => ({
      ...current,
      [selectedAgent]: nextMessages
    }));
    setDraft("");
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/agent-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          agentKey: selectedAgent,
          message: trimmed,
          history: nextMessages.slice(-6),
          buildPackage
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Agent reply failed.");
      }

      onChange((current) => ({
        ...current,
        [selectedAgent]: [
          ...(current[selectedAgent] || nextMessages),
          {
            role: "assistant",
            content: payload.reply,
            model: payload.model
          }
        ]
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Agent reply failed.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Panel title="Talk to an agent" eyebrow="Interactive support">
      <div className="stack-list">
        <div className="quick-chip-grid">
          {interactiveAgents.map((agent) => (
            <button
              key={agent}
              type="button"
              className={`choice-chip ${selectedAgent === agent ? "active" : ""}`}
              onClick={() => setSelectedAgent(agent)}
            >
              {agent.replace(" Agent", "")}
            </button>
          ))}
        </div>
        <p className="muted">
          Ask for sharper next steps, tradeoffs, critique, or domain-specific adjustments. Replies use a lighter
          planning model at medium reasoning and stay grounded in your current run.
        </p>
        <div className="agent-chat-thread">
          {messages.length ? (
            messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`agent-chat-bubble ${message.role === "assistant" ? "assistant" : "user"}`}
              >
                <strong>{message.role === "assistant" ? selectedAgent : "You"}</strong>
                {message.role === "assistant" ? <AgentReply content={message.content} /> : <p>{message.content}</p>}
                {message.model ? <span className="muted">{message.model}</span> : null}
              </article>
            ))
          ) : (
            <p className="muted">No conversation yet. Ask the selected agent to challenge or refine the plan.</p>
          )}
        </div>
        <div className="field-group">
          <label htmlFor="agent-draft">Message</label>
          <textarea
            id="agent-draft"
            className="text-area"
            rows={4}
            placeholder="Example: Challenge this career plan if my real bottleneck is attention at night."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        {error ? <p className="warn">{error}</p> : null}
        <div className="controls">
          <button type="button" className="primary" onClick={sendMessage} disabled={isSending}>
            {isSending ? "Agent thinking..." : "Send to agent"}
          </button>
        </div>
      </div>
    </Panel>
  );
}

function MetricSlider({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <article className="mini-stat-card metric-slider">
      <div className="line-between">
        <span className="muted">{label}</span>
        <span className="pill">{value}/5</span>
      </div>
      <strong>{value}/5</strong>
      <input type="range" min="1" max="5" value={value} onChange={(event) => onChange(event.target.value)} />
    </article>
  );
}

function withUpdatedBuildPackage(state: DemoState, nextBuildPackage: any): DemoState {
  return {
    ...state,
    buildPackage: nextBuildPackage,
    latestRun: state.latestRun
      ? {
          ...state.latestRun,
          buildPackage: nextBuildPackage
        }
      : state.latestRun
  };
}

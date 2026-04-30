import { average } from "../../core/utils/scoring.js";

function uniqueStrings(items) {
  return [...new Set(items.filter(Boolean))];
}

function prioritizeByStrategy(items, strategy, selector) {
  const priorities = strategy?.priorities || [];
  const ranking = new Map(priorities.map((item, index) => [item.domain, index]));

  return [...items].sort((left, right) => {
    const leftRank = ranking.get(selector(left)) ?? 999;
    const rightRank = ranking.get(selector(right)) ?? 999;
    return leftRank - rightRank;
  });
}

function buildSevenDayPlan(tasks, tracker, profileIntel, strategy) {
  const leadTasks = prioritizeByStrategy(tasks, strategy, (task) => task.planDomain).slice(0, 7);

  return leadTasks.map((task, index) => ({
    dayLabel: `Day ${index + 1}`,
    focus: task.planDomain,
    action: task.taskText,
    metric: task.metric,
    window:
      index === 0
        ? "First clean block of the day"
        : index <= 2
          ? "Before entertainment or low-value admin"
          : "Scheduled block already named on the calendar",
    failureLooksLike:
      index === 0
        ? "You delay the task until the evening and tell yourself you will catch up later."
        : "The task stays vague, gets postponed, or gets replaced by easy admin.",
    adjustmentIfMissed:
      index === 0
        ? "Cut the block in half and start anyway. The point is proof, not perfection."
        : "Shrink the scope until it can be finished inside one focused block."
  }));
}

function buildMetrics(plans, tracker) {
  return uniqueStrings(
    plans.flatMap((plan) => plan.kpiMetrics.map((metric) => `${metric.name}: ${metric.target}`)).concat([
      `adherence score: ${Math.round((tracker.summary.adherenceScore || 0) * 100)}% current baseline`,
      `momentum score: ${Math.round((tracker.summary.momentumScore || 0) * 100)}% current baseline`
    ])
  ).slice(0, 8);
}

function buildRecommendedTools(plans, strategy) {
  const tools = [];
  const prioritizedPlans = prioritizeByStrategy(plans, strategy, (plan) => plan.domain);

  prioritizedPlans.forEach((plan) => {
    plan.recommendedTools.forEach((tool) => {
      if (!tools.find((item) => item.name === tool.name)) {
        tools.push({
          ...tool,
          domain: plan.domain
        });
      }
    });
  });

  return tools.slice(0, 8);
}

export function compileBuildPackage(profile, plans, strategy, profileIntel, tracker, evaluation, testing, metadata) {
  const tasks = tracker.tasks;
  const incompleteSections = uniqueStrings(
    plans
      .filter((plan) => plan.riskFlags.length)
      .flatMap((plan) => plan.riskFlags)
      .concat(metadata.schemaIssues)
  );

  const executionSystem = {
    sevenDayExecutionPlan: buildSevenDayPlan(tasks, tracker, profileIntel, strategy),
    metricsToTrack: buildMetrics(plans, tracker),
    failureTriggers: tracker.failureTriggers || [
      "Two missed planned work blocks in a week.",
      "Sleep and phone use both collapse in the same three-day span.",
      "The user is planning more than shipping."
    ],
    adjustmentRules: tracker.adjustmentRules || [
      "If two misses happen in the same domain, shrink the plan size before adding effort.",
      "If the week becomes chaotic, return to one lead domain and one recovery standard.",
      "If the task is repeatedly delayed, schedule it earlier or reduce it until it can be finished."
    ],
    whatToIgnore: strategy.whatToIgnore,
    nextReviewQuestions: tracker.nextReviewQuestions || [
      "Which task created visible proof this week?",
      "Where did attention leak first?",
      "What did you avoid because it felt exposing or uncomfortable?",
      "What should be cut before next week begins?"
    ],
    dailyCheckpoints: tracker.dailyCheckpoints || [
      "Write the first important task before the day fragments.",
      "Protect one block before entertainment.",
      "Run the shutdown ritual before sleep."
    ],
    weeklyFocuses: tracker.weeklyFocuses || ["Protect attention", "Close one visible win"],
    recommendedTools: buildRecommendedTools(plans, strategy)
  };

  return {
    userId: metadata.userId,
    profile,
    profileIntel,
    strategyRoadmap: strategy,
    plans,
    tasks,
    tracker,
    diagnosticReport: {
      currentDiagnosis: profileIntel.currentDiagnosis,
      mainBottleneck: profileIntel.mainBottleneck,
      falseAssumption: profileIntel.falseAssumption,
      uncomfortableTruth: profileIntel.uncomfortableTruth,
      highestLeverageBehaviorChange: profileIntel.highestLeverageBehaviorChange,
      evidence: profileIntel.evidence
    },
    executionSystem,
    agentRoster: metadata.agentRoster,
    workflowStatus: metadata.workflowStatus,
    buildSummary: {
      agentsInvoked: metadata.agentsInvoked,
      numberOfIterations: metadata.numberOfIterations,
      errorsEncountered: metadata.errorsEncountered,
      incompleteSections,
      executionDurations: metadata.executionDurations,
      finalConfidenceScore: average(
        plans.map((plan) => plan.confidenceScore).concat([evaluation.overallConfidence])
      )
    },
    testResultsSummary: testing,
    riskAssessment: evaluation.risks,
    technicalDebtReport: [
      "The system is stronger on diagnosis and execution, but still lacks live integrations for calendar, wearables, and bank feeds.",
      "Persistence is still falling back to local mode until the Supabase schema is fully applied.",
      "Recommendations are only as sharp as the intake honesty; weak user answers still degrade the plan.",
      "No consequence engine exists yet for repeated failure beyond plan resizing and weekly review pressure."
    ],
    suggestedNextIterationRoadmap: [
      "Persist every agent step and weekly check-in to Supabase so future runs can challenge drift with real history.",
      "Add calendar-aware scheduling so the execution plan uses actual day and time windows instead of generic blocks.",
      "Introduce daily check-ins and automated review reminders before the weekly plan slips into theory.",
      "Add stronger contradiction checks when the user asks for aggressive goals on a low-capacity baseline.",
      "Connect domain-specific knowledge packs so meal, training, and money advice become even more tailored."
    ]
  };
}

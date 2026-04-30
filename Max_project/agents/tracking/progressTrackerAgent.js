import { average, clamp } from "../../core/utils/scoring.js";

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildTaskId(domain, index, task) {
  return `${domain}-${index + 1}-${slugify(task).slice(0, 24)}`;
}

function buildSupportTasks(plan) {
  const firstMetric = Array.isArray(plan.kpiMetrics) && plan.kpiMetrics.length ? plan.kpiMetrics[0] : null;

  return [
    {
      task: `Log one proof that ${plan.domain} improved this week.`,
      metric: firstMetric
        ? `${firstMetric.name}: collect one honest weekly proof point`
        : "One honest weekly proof point captured",
      deadline: "End of week",
      taskKind: "proof"
    },
    {
      task: `Review what broke first in ${plan.domain} and adjust next week before it repeats.`,
      metric: plan.adjustmentRule || "One concrete adjustment chosen for next week",
      deadline: "Weekly review",
      taskKind: "review"
    }
  ];
}

function carryStatus(previousBuildPackage, signature) {
  const previousTasks = previousBuildPackage?.tracker?.tasks || [];
  return previousTasks.find((task) => task.signature === signature);
}

function computeDomainProgress(tasks) {
  const grouped = tasks.reduce((map, task) => {
    map[task.planDomain] = map[task.planDomain] || [];
    map[task.planDomain].push(task);
    return map;
  }, {});

  return Object.entries(grouped).map(([domain, domainTasks]) => {
    const completed = domainTasks.filter((task) => task.status === "done").length;
    const inFlight = domainTasks.filter((task) => task.status === "in-progress").length;
    const score = clamp((completed + inFlight * 0.5) / domainTasks.length);
    return {
      domain,
      completed,
      total: domainTasks.length,
      score
    };
  });
}

function buildWeeklyReview(tasks, plans) {
  const completed = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "in-progress").length;
  const ratio = tasks.length ? completed / tasks.length : 0;
  const riskyDomains = plans.filter((plan) => plan.riskFlags.length).map((plan) => plan.domain);

  let headline = "Launch week: close one ugly but real win before you ask for confidence.";
  if (ratio >= 0.6) {
    headline = "Momentum is real. Protect closure and do not reward yourself with extra complexity.";
  } else if (inProgress >= 2) {
    headline = "The plan is alive, but you are carrying too many open loops. Close something before you add more.";
  }

  return {
    headline,
    focusForNextWeek:
      riskyDomains.length > 0
        ? `Watch ${riskyDomains.join(", ")} because those domains will break first if the week gets sloppy.`
        : "Protect the highest-leverage task and one recovery standard before adding anything optional.",
    ratio
  };
}

function summarize(tasks, domainProgress, review) {
  const completedCount = tasks.filter((task) => task.status === "done").length;
  const inProgressCount = tasks.filter((task) => task.status === "in-progress").length;
  const adherenceScore = tasks.length ? completedCount / tasks.length : 0;
  return {
    totalTasks: tasks.length,
    completedCount,
    inProgressCount,
    pendingCount: tasks.length - completedCount - inProgressCount,
    adherenceScore,
    momentumScore: clamp(average(domainProgress.map((item) => item.score).concat([review.ratio]))),
    streakSignal: completedCount >= 3 ? "building" : completedCount > 0 ? "starting" : "cold"
  };
}

function enrichTasks(plans, previousBuildPackage) {
  return plans.flatMap((plan) =>
    plan.actionItems
      .map((item) => ({
        task: item.task,
        metric: item.metric,
        deadline: item.deadline,
        taskKind: "action"
      }))
      .concat(buildSupportTasks(plan))
      .map((item, index) => {
        const signature = `${plan.domain}:${item.task}:${item.metric}`;
        const carried = carryStatus(previousBuildPackage, signature);
        return {
          id: buildTaskId(plan.domain, index, item.task),
          signature,
          planDomain: plan.domain,
          taskText: item.task,
          metric: item.metric,
          deadline: item.deadline,
          taskKind: item.taskKind,
          status: carried?.status || "pending",
          createdAt: carried?.createdAt || new Date().toISOString(),
          completedAt: carried?.completedAt || null
        };
      })
  );
}

export function initializeTracker(plans, previousBuildPackage = null) {
  const tasks = enrichTasks(plans, previousBuildPackage);
  const domainProgress = computeDomainProgress(tasks);
  const weeklyReview = buildWeeklyReview(tasks, plans);
  return {
    tasks,
    domainProgress,
    weeklyReview,
    summary: summarize(tasks, domainProgress, weeklyReview)
  };
}

export function updatePlanProgress(buildPackage, taskId, nextStatus) {
  const tasks = buildPackage.tracker.tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }
    return {
      ...task,
      status: nextStatus,
      completedAt: nextStatus === "done" ? new Date().toISOString() : null
    };
  });

  const domainProgress = computeDomainProgress(tasks);
  const weeklyReview = buildWeeklyReview(tasks, buildPackage.plans);
  const tracker = {
    ...buildPackage.tracker,
    tasks,
    domainProgress,
    weeklyReview,
    summary: summarize(tasks, domainProgress, weeklyReview)
  };

  return {
    ...buildPackage,
    tasks,
    tracker
  };
}

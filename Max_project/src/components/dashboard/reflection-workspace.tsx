"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  DemoCheckIn,
  DemoCheckInReflection,
  DemoCheckInSummary,
  DemoDomainUpdate,
  DemoState
} from "@/lib/demo/storage";
import { stableListKey } from "@/lib/ui/stable-list-key";

type CheckInMode = "daily" | "weekly";
type ResultsTab = "summary" | "history";
type ReflectionStep = "type" | "categories" | "questions" | "review" | "results";

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

type ReflectionDraft = {
  answers: Record<string, string>;
  blocker: string;
  completionRating: string;
};

type ReflectionResult = {
  entryId: string;
  createdAt: string;
  kind: CheckInMode;
  categories: string[];
  summary: DemoCheckInSummary;
  domainChanges: Array<{
    domain: string;
    before: number;
    after: number;
    note: string;
  }>;
};

const reflectionCategories: ReflectionCategory[] = [
  {
    id: "protect-looks",
    label: "Protect looks",
    domain: "looks",
    dailyQuestions: [
      {
        key: "completed",
        label: "What did you do today for grooming, skin, hair, posture, or clothing?",
        placeholder: "Example: shaved, moisturized, wore one reliable outfit, fixed posture."
      },
      {
        key: "slipped",
        label: "What did you neglect today?",
        placeholder: "Example: looked rushed, skipped grooming, wore default sloppy clothes."
      },
      {
        key: "next",
        label: "What visible improvement needs attention tomorrow?",
        placeholder: "Example: lay out clothes tonight and do the full grooming standard before leaving."
      }
    ],
    weeklyQuestions: [
      {
        key: "completed",
        label: "What did you do this week for grooming, skin, hair, posture, or clothing?",
        placeholder: "Example: held the standard 4 workdays, fixed one weak-link item, improved posture."
      },
      {
        key: "slipped",
        label: "What did you neglect this week?",
        placeholder: "Example: weekend sloppiness bled into Monday, skipped grooming when rushed."
      },
      {
        key: "next",
        label: "What is one visible improvement to make next week?",
        placeholder: "Example: remove one weak outfit and lock three reliable combinations."
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
        placeholder: "Example: hit protein, hydrated, walked, avoided junk at night."
      },
      {
        key: "slipped",
        label: "What health habit slipped today?",
        placeholder: "Example: skipped water, ate trash late, sat too long, ignored recovery."
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
        placeholder: "Example: one deep work block, one assignment, one hard admin task."
      },
      {
        key: "slipped",
        label: "What stole your attention today?",
        placeholder: "Example: scrolling at lunch, random YouTube, reactive messaging."
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
        placeholder: "Example: finished one assignment, shipped one artifact, handled one hard admin item."
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
        label: "What time did you actually sleep and wake today?",
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
        placeholder: "Example: most nights in bed by midnight, wake time stable on weekdays."
      },
      {
        key: "slipped",
        label: "What caused poor sleep this week?",
        placeholder: "Example: revenge bedtime scrolling, unplanned evenings, late food."
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
        placeholder: "Example: resume edit, outreach, artifact, application block."
      },
      {
        key: "slipped",
        label: "What career work did you avoid today?",
        placeholder: "Example: stayed vague, chose easy admin, researched instead of shipping."
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
        placeholder: "Example: protect a two-hour proof-of-work block before entertainment every Tuesday."
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
        placeholder: "Example: 3 lifts, 1 walk, 1 mobility session."
      },
      {
        key: "slipped",
        label: "What caused training to slip this week?",
        placeholder: "Example: no scheduled sessions, poor sleep, over-optimistic plan."
      },
      {
        key: "next",
        label: "What is the next training target for next week?",
        placeholder: "Example: schedule 3 sessions now and protect the first one above optional plans."
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
        placeholder: "Example: skipped breakfast, takeout at night, random snacking."
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
        placeholder: "Example: convenience spending, subscriptions, delivery, random shopping."
      },
      {
        key: "next",
        label: "What spending rule should you use tomorrow?",
        placeholder: "Example: no food delivery and a 24-hour pause on non-essentials."
      }
    ],
    weeklyQuestions: [
      {
        key: "completed",
        label: "What spending did you avoid or control this week?",
        placeholder: "Example: no delivery all week, canceled a subscription, tracked every expense."
      },
      {
        key: "slipped",
        label: "What unnecessary spending happened this week?",
        placeholder: "Example: convenience food, impulse shopping, recurring leaks."
      },
      {
        key: "next",
        label: "What spending rule should you use next week?",
        placeholder: "Example: 24-hour rule on non-essentials and a cash cap for eating out."
      }
    ]
  }
];

const reflectionDefaults: string[] = ["protect-attention", "repair-sleep", "execute-career-work"];
const proofKinds: DemoDomainUpdate["kind"][] = ["proof", "standard", "review"];

function titleize(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = (day + 6) % 7;
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - diff);
  return next;
}

function isSameDay(left: string, right: Date) {
  const date = new Date(left);
  return (
    date.getFullYear() === right.getFullYear() &&
    date.getMonth() === right.getMonth() &&
    date.getDate() === right.getDate()
  );
}

function isSameWeek(left: string, right: Date) {
  return startOfWeek(new Date(left)).getTime() === startOfWeek(right).getTime();
}

function listOf<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
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

export function checkInFocusLabel(item: DemoCheckIn) {
  if (Array.isArray(item.focusAreas) && item.focusAreas.length) {
    return item.focusAreas.join(", ");
  }

  if (Array.isArray(item.reflections) && item.reflections.length) {
    return item.reflections
      .map((reflection) => getReflectionCategory(reflection.category)?.label)
      .filter(Boolean)
      .join(", ");
  }

  return item.focus || "No focus tagged";
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

function buildDomainUpdatesFromReflection(createdAt: string, reflections: DemoCheckInReflection[]): DemoDomainUpdate[] {
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

function domainProgressSnapshot(state: DemoState) {
  const buildPackage = state.buildPackage;
  if (!buildPackage) {
    return {} as Record<string, number>;
  }

  const tasks = listOf<any>(buildPackage.tracker?.tasks);
  const plans = listOf<any>(buildPackage.plans);

  return plans.reduce(
    (map, plan) => {
      const domainTasks = tasks.filter((task) => task.planDomain === plan.domain);
      const completedTasks = domainTasks.filter((task) => task.status === "done").length;
      const completedProofs = proofKinds.filter((kind) =>
        state.domainUpdates.some((entry) => entry.domain === plan.domain && entry.kind === kind)
      ).length;
      const total = domainTasks.length + proofKinds.length;
      map[plan.domain] = total ? (completedTasks + completedProofs) / total : 0;
      return map;
    },
    {} as Record<string, number>
  );
}

function percent(value: number) {
  return `${Math.round((value || 0) * 100)}%`;
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

function ReflectionPanel({
  title,
  eyebrow,
  children,
  aside
}: {
  title: string;
  eyebrow?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="workspace-panel">
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

export function ReflectionOverviewCard({ state }: { state: DemoState }) {
  const latest = state.checkIns[0];
  const now = new Date();
  const todayDone = state.checkIns.some((item) => item.kind === "daily" && isSameDay(item.createdAt, now));
  const weeklyDone = state.checkIns.some((item) => item.kind === "weekly" && isSameWeek(item.createdAt, now));
  const selectedCategories = latest?.reflections
    ?.map((item) => getReflectionCategory(item.category)?.label)
    .filter(Boolean) as string[] | undefined;
  const visibleCategories = selectedCategories?.slice(0, 3) || [];
  const hiddenCategoryCount = Math.max((selectedCategories?.length || 0) - visibleCategories.length, 0);
  const completedSummary =
    latest?.summary?.completedActions.slice(0, 2).join(" • ") || "No completed actions logged yet.";
  const nextSummary =
    latest?.summary?.nextRecommendedActions.slice(0, 2).join(" • ") || "No next actions logged yet.";
  const lastCompletedSummary = visibleCategories.length
    ? `${visibleCategories.join(", ")}${hiddenCategoryCount > 0 ? ` +${hiddenCategoryCount} more` : ""}`
    : "Start with the area that is currently leaking.";

  return (
    <ReflectionPanel
      title="Reflection"
      eyebrow="Check-in control"
      aside={<span className={`pill ${todayDone && weeklyDone ? "good" : ""}`}>{todayDone && weeklyDone ? "Up to date" : "Needs review"}</span>}
    >
      <div className="reflection-status-grid">
        <article className="mini-stat-card">
          <span className="muted">Today</span>
          <strong>{todayDone ? "Daily check-in done" : "Daily check-in open"}</strong>
          <p>{todayDone ? "You have already logged today." : "Capture what held and what slipped before the day blurs."}</p>
        </article>
        <article className="mini-stat-card">
          <span className="muted">This week</span>
          <strong>{weeklyDone ? "Weekly review done" : "Weekly review open"}</strong>
          <p>{weeklyDone ? "The week has a fresh review." : "Close the week with blockers, proof, and next actions."}</p>
        </article>
        <article className="mini-stat-card">
          <span className="muted">Last completed</span>
          <strong>{latest ? formatDate(latest.createdAt) : "No reflection yet"}</strong>
          <p>{lastCompletedSummary}</p>
        </article>
      </div>

      <div className="workspace-pills">
        {(visibleCategories.length ? visibleCategories : ["No categories selected yet"]).map((item, index) => (
          <span key={stableListKey("reflection-overview-category", item, index)} className="pill">
            {item}
          </span>
        ))}
        {hiddenCategoryCount > 0 ? <span className="pill">+{hiddenCategoryCount} more</span> : null}
      </div>

      {latest?.summary ? (
        <div className="stack-list">
          <div>
            <strong>Last reflection summary</strong>
            <p className="muted">Completed: {completedSummary}</p>
            <p className="muted">Next: {nextSummary}</p>
          </div>
        </div>
      ) : null}

      <div className="controls">
        <Link className="button-link primary" href="/app/reflection?mode=daily">
          Start daily check-in
        </Link>
        <Link className="button-link" href="/app/reflection?mode=weekly">
          Start weekly review
        </Link>
        <Link className="button-link" href="/app/reflection?tab=history">
          View history
        </Link>
      </div>
    </ReflectionPanel>
  );
}

export function ReflectionWorkspace({
  state,
  onUpdate
}: {
  state: DemoState;
  onUpdate: (nextState: DemoState) => void;
}) {
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get("mode") === "daily" ? "daily" : searchParams.get("mode") === "weekly" ? "weekly" : null;
  const requestedTab: ResultsTab = searchParams.get("tab") === "history" ? "history" : "summary";
  const latest = state.checkIns[0];
  const latestCategories = latest?.reflections?.map((item) => item.category).filter(Boolean);

  const [kind, setKind] = useState<CheckInMode>(requestedMode || "daily");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    latestCategories?.length ? latestCategories : reflectionDefaults
  );
  const [reflectionDrafts, setReflectionDrafts] = useState<Record<string, ReflectionDraft>>({});
  const [energy, setEnergy] = useState("3");
  const [adherence, setAdherence] = useState("3");
  const [clarity, setClarity] = useState("3");
  const [step, setStep] = useState<ReflectionStep>(
    requestedTab === "history" && state.checkIns.length ? "results" : requestedMode ? "categories" : "type"
  );
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [resultsTab, setResultsTab] = useState<ResultsTab>(requestedTab);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(state.checkIns[0]?.id || null);
  const [latestResult, setLatestResult] = useState<ReflectionResult | null>(null);

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

  useEffect(() => {
    if (requestedMode) {
      setKind(requestedMode);
      if (step === "type") {
        setStep("categories");
      }
    }
  }, [requestedMode, step]);

  useEffect(() => {
    if (requestedTab === "history" && state.checkIns.length) {
      setResultsTab("history");
      setStep("results");
    }
  }, [requestedTab, state.checkIns.length]);

  const averages = useMemo(
    () => ({
      energy: average(state.checkIns.map((item) => Number(item.energy))),
      adherence: average(state.checkIns.map((item) => Number(item.adherence))),
      clarity: average(state.checkIns.map((item) => Number(item.clarity)))
    }),
    [state.checkIns]
  );

  const activeCategoryId = selectedCategories[activeCategoryIndex];
  const activeCategory = activeCategoryId ? getReflectionCategory(activeCategoryId) : null;
  const activeDraft = activeCategoryId ? reflectionDrafts[activeCategoryId] || buildEmptyReflectionDraft() : buildEmptyReflectionDraft();
  const questions = activeCategory ? (kind === "weekly" ? activeCategory.weeklyQuestions : activeCategory.dailyQuestions) : [];
  const historyEntry =
    state.checkIns.find((item) => item.id === selectedHistoryId) ||
    state.checkIns[0] ||
    null;

  const stepLabels: Array<{ id: ReflectionStep; label: string }> = [
    { id: "type", label: "Choose type" },
    { id: "categories", label: "Select categories" },
    { id: "questions", label: "Answer prompts" },
    { id: "review", label: "Review answers" },
    { id: "results", label: "Summary and history" }
  ];

  const reviewReflections: DemoCheckInReflection[] = selectedCategories.map((categoryId) => {
    const draft = reflectionDrafts[categoryId] || buildEmptyReflectionDraft();
    return {
      category: categoryId,
      answers: draft.answers,
      blocker: draft.blocker,
      completionRating: draft.completionRating
    };
  });

  return (
    <div className="workspace-stack">
      <section className="workspace-hero workspace-hero-soft">
        <div className="hero-copy-block">
          <p className="eyebrow">Reflection workspace</p>
          <h2>Handle reflection as a focused workflow, not a giant box on the dashboard.</h2>
          <p>
            Daily check-ins capture today. Weekly reviews close the loop on what held, what slipped, and what needs to
            change next.
          </p>
        </div>
        <div className="hero-metric-grid">
          <article className="hero-metric-card">
            <span className="muted">Daily status</span>
            <strong>{state.checkIns.some((item) => item.kind === "daily" && isSameDay(item.createdAt, new Date())) ? "Done today" : "Open today"}</strong>
            <p>Keep today visible before it dissolves into memory theater.</p>
          </article>
          <article className="hero-metric-card">
            <span className="muted">Weekly status</span>
            <strong>{state.checkIns.some((item) => item.kind === "weekly" && isSameWeek(item.createdAt, new Date())) ? "Week reviewed" : "Week open"}</strong>
            <p>Weekly review should explain the week, not decorate it.</p>
          </article>
          <article className="hero-metric-card">
            <span className="muted">Protected storage</span>
            <strong>Agent-visible + saved</strong>
            <p>Reflection can inform domain progress, next actions, and future agent recommendations.</p>
          </article>
        </div>
      </section>

      <div className="reflection-stepper" role="tablist" aria-label="Reflection workflow steps">
        {stepLabels.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`choice-chip ${step === item.id ? "active" : ""}`}
            onClick={() => {
              if (item.id === "results" && !state.checkIns.length && !latestResult) {
                return;
              }
              setStep(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {step === "type" ? (
        <ReflectionPanel title="Step 1: Choose check-in type" eyebrow="Daily or weekly">
          <div className="reflection-mode-grid">
            {(["daily", "weekly"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`theme-card ${kind === option ? "active" : ""}`}
                onClick={() => {
                  setKind(option);
                  setStep("categories");
                }}
              >
                <strong>{option === "daily" ? "Daily check-in" : "Weekly review"}</strong>
                <p>
                  {option === "daily"
                    ? "Focus on what happened today, what slipped, and what needs protection tomorrow."
                    : "Focus on the full week, what improved, what blocked you, and what should change next week."}
                </p>
              </button>
            ))}
          </div>
        </ReflectionPanel>
      ) : null}

      {step === "categories" ? (
        <ReflectionPanel
          title="Step 2: Select categories"
          eyebrow={kind === "daily" ? "What matters today" : "What mattered this week"}
          aside={<span className="pill">{selectedCategories.length} selected</span>}
        >
          <div className="stack-list">
            <p className="muted">
              If you select multiple categories, each one gets its own focused section. Nothing is collapsed into one generic box.
            </p>
            <div className="quick-chip-grid">
              {reflectionCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`choice-chip ${selectedCategories.includes(category.id) ? "active" : ""}`}
                  onClick={() =>
                    setSelectedCategories((current) => {
                      const next = current.includes(category.id)
                        ? current.filter((item) => item !== category.id)
                        : [...current, category.id];
                      return next.length ? next : current;
                    })
                  }
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="controls">
              <button type="button" onClick={() => setStep("type")}>
                Back
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setActiveCategoryIndex(0);
                  setStep("questions");
                }}
              >
                Continue to questions
              </button>
            </div>
          </div>
        </ReflectionPanel>
      ) : null}

      {step === "questions" && activeCategory ? (
        <ReflectionPanel
          title={`Step 3: ${activeCategory.label}`}
          eyebrow={`${titleize(kind)} reflection`}
          aside={
            <span className="pill">
              {activeCategoryIndex + 1} / {selectedCategories.length}
            </span>
          }
        >
          <div className="workspace-grid workspace-grid-two">
            <div className="stack-list">
              <p className="muted">
                Answer one category at a time. This keeps reflection readable and prevents the page from turning into one long wall.
              </p>
              <div className="priority-grid">
                <MetricSlider label="Energy" value={energy} onChange={setEnergy} />
                <MetricSlider label="Adherence" value={adherence} onChange={setAdherence} />
                <MetricSlider label="Clarity" value={clarity} onChange={setClarity} />
              </div>
              <div className="stack-list">
                {questions.map((question) => (
                  <div key={question.key} className="field-group">
                    <label htmlFor={`${activeCategory.id}-${question.key}`}>{question.label}</label>
                    <textarea
                      id={`${activeCategory.id}-${question.key}`}
                      className="text-area"
                      rows={4}
                      placeholder={question.placeholder}
                      value={activeDraft.answers[question.key] || ""}
                      onChange={(event) =>
                        setReflectionDrafts((current) => ({
                          ...current,
                          [activeCategory.id]: {
                            ...(current[activeCategory.id] || buildEmptyReflectionDraft()),
                            answers: {
                              ...(current[activeCategory.id]?.answers || {}),
                              [question.key]: event.target.value
                            }
                          }
                        }))
                      }
                    />
                    <p className="field-note">If this does not apply to you, write NA.</p>
                  </div>
                ))}
                <div className="field-group">
                  <label htmlFor={`${activeCategory.id}-blocker`}>
                    {kind === "daily" ? "What got in the way today?" : "Main blocker in this area this week"}
                  </label>
                  <input
                    id={`${activeCategory.id}-blocker`}
                    className="text-input"
                    placeholder="Name the actual blocker, not a vague feeling."
                    value={activeDraft.blocker}
                    onChange={(event) =>
                      setReflectionDrafts((current) => ({
                        ...current,
                        [activeCategory.id]: {
                          ...(current[activeCategory.id] || buildEmptyReflectionDraft()),
                          blocker: event.target.value
                        }
                      }))
                    }
                  />
                  <p className="field-note">If this does not apply to you, write NA.</p>
                </div>
                <div className="field-group">
                  <label htmlFor={`${activeCategory.id}-rating`}>
                    {kind === "daily" ? "How well did you protect this today?" : "How well did you hold this area this week?"}
                  </label>
                  <select
                    id={`${activeCategory.id}-rating`}
                    className="select-input"
                    value={activeDraft.completionRating}
                    onChange={(event) =>
                      setReflectionDrafts((current) => ({
                        ...current,
                        [activeCategory.id]: {
                          ...(current[activeCategory.id] || buildEmptyReflectionDraft()),
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
              <div className="controls">
                <button
                  type="button"
                  onClick={() => {
                    if (activeCategoryIndex === 0) {
                      setStep("categories");
                      return;
                    }
                    setActiveCategoryIndex((current) => current - 1);
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    if (activeCategoryIndex === selectedCategories.length - 1) {
                      setStep("review");
                      return;
                    }
                    setActiveCategoryIndex((current) => current + 1);
                  }}
                >
                  {activeCategoryIndex === selectedCategories.length - 1 ? "Review answers" : "Next category"}
                </button>
              </div>
            </div>

            <article className="history-card reflection-side-rail">
              <strong>Selected categories</strong>
              <div className="stack-list">
                {selectedCategories.map((categoryId, index) => {
                  const category = getReflectionCategory(categoryId);
                  const draft = reflectionDrafts[categoryId] || buildEmptyReflectionDraft();
                  const answeredCount = Object.values(draft.answers).filter((value) => value.trim()).length;
                  return (
                    <button
                      key={categoryId}
                      type="button"
                      className={`milestone-row ${index === activeCategoryIndex ? "done" : ""}`}
                      onClick={() => setActiveCategoryIndex(index)}
                    >
                      <div>
                        <strong>{category?.label || categoryId}</strong>
                        <p className="muted">{answeredCount} prompts answered</p>
                      </div>
                      <span className="pill">{index + 1}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          </div>
        </ReflectionPanel>
      ) : null}

      {step === "review" ? (
        <ReflectionPanel title="Step 4: Review answers" eyebrow="Check what will be saved">
          <div className="stack-list">
            <div className="priority-grid">
              <MetricSlider label="Energy" value={energy} onChange={setEnergy} />
              <MetricSlider label="Adherence" value={adherence} onChange={setAdherence} />
              <MetricSlider label="Clarity" value={clarity} onChange={setClarity} />
            </div>
            <div className="history-stack">
              {reviewReflections.map((reflection) => {
                const category = getReflectionCategory(reflection.category);
                return (
                  <article key={reflection.category} className="history-card">
                    <div className="line-between">
                      <strong>{category?.label || reflection.category}</strong>
                      <span className="pill">{reflection.completionRating || "3"}/5</span>
                    </div>
                    <div className="stack-list">
                      {Object.entries(reflection.answers).map(([key, value]) =>
                        value?.trim() ? (
                          <div key={key}>
                            <span className="muted">{titleize(key)}</span>
                            <p>{value}</p>
                          </div>
                        ) : null
                      )}
                      {reflection.blocker?.trim() ? (
                        <div>
                          <span className="muted">Blocker</span>
                          <p>{reflection.blocker}</p>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="controls">
              <button type="button" onClick={() => setStep("questions")}>
                Back to questions
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  const createdAt = new Date().toISOString();
                  const summary = buildCheckInSummary(reviewReflections);
                  const entry: DemoCheckIn = {
                    id: `check-in-${Date.now()}`,
                    createdAt,
                    kind,
                    energy,
                    adherence,
                    clarity,
                    focus: selectedCategories
                      .map((categoryId) => getReflectionCategory(categoryId)?.label)
                      .filter(Boolean)
                      .join(", "),
                    focusAreas: selectedCategories
                      .map((categoryId) => getReflectionCategory(categoryId)?.label)
                      .filter(Boolean) as string[],
                    win: summary.completedActions[0] || "",
                    blocker: summary.blockers[0] || "",
                    note: summary.nextRecommendedActions[0] || "",
                    reflections: reviewReflections,
                    summary
                  };

                  const newUpdates = buildDomainUpdatesFromReflection(createdAt, reviewReflections);
                  const before = domainProgressSnapshot(state);
                  const nextState: DemoState = {
                    ...state,
                    checkIns: [entry, ...state.checkIns],
                    domainUpdates: newUpdates.concat(state.domainUpdates)
                  };
                  const after = domainProgressSnapshot(nextState);

                  const domainChanges = summary.impactedDomains.map((domain) => {
                    const reflection = reviewReflections.find(
                      (item) => getReflectionCategory(item.category)?.domain === domain
                    );
                    return {
                      domain,
                      before: before[domain] || 0,
                      after: after[domain] || 0,
                      note:
                        reflection?.answers.completed?.trim() ||
                        reflection?.answers.next?.trim() ||
                        "A new proof or review note was added."
                    };
                  });

                  onUpdate(nextState);
                  setLatestResult({
                    entryId: entry.id,
                    createdAt,
                    kind,
                    categories: selectedCategories,
                    summary,
                    domainChanges
                  });
                  setSelectedHistoryId(entry.id);
                  setResultsTab("summary");
                  setStep("results");
                  setReflectionDrafts(
                    selectedCategories.reduce(
                      (next, categoryId) => {
                        next[categoryId] = buildEmptyReflectionDraft();
                        return next;
                      },
                      {} as Record<string, ReflectionDraft>
                    )
                  );
                }}
              >
                Submit reflection
              </button>
            </div>
          </div>
        </ReflectionPanel>
      ) : null}

      {step === "results" ? (
        <div className="workspace-grid workspace-grid-two">
          <ReflectionPanel title="Step 5: Reflection results" eyebrow="Summary and history">
            <div className="quick-chip-grid">
              <button
                type="button"
                className={`choice-chip ${resultsTab === "summary" ? "active" : ""}`}
                onClick={() => setResultsTab("summary")}
              >
                Summary
              </button>
              <button
                type="button"
                className={`choice-chip ${resultsTab === "history" ? "active" : ""}`}
                onClick={() => setResultsTab("history")}
              >
                History
              </button>
            </div>

            {resultsTab === "summary" ? (
              latestResult ? (
                <div className="stack-list">
                  <div className="workspace-pills">
                    <span className="pill">{titleize(latestResult.kind)}</span>
                    <span className="pill">{formatDateTime(latestResult.createdAt)}</span>
                    {latestResult.categories.map((categoryId) => {
                      const category = getReflectionCategory(categoryId);
                      return category ? (
                        <span key={categoryId} className="pill">
                          {category.label}
                        </span>
                      ) : null;
                    })}
                  </div>

                  <article className="history-card">
                    <strong>Completed actions</strong>
                    <ul className="clean-list">
                      {latestResult.summary.completedActions.length ? (
                        latestResult.summary.completedActions.map((item, index) => (
                          <li key={stableListKey("reflection-results-completed", item, index)}>{item}</li>
                        ))
                      ) : (
                        <li>No completed actions were logged.</li>
                      )}
                    </ul>
                  </article>

                  <article className="history-card">
                    <strong>Skipped areas and blockers</strong>
                    <ul className="clean-list">
                      {[...latestResult.summary.skippedAreas, ...latestResult.summary.blockers].length ? (
                        [...latestResult.summary.skippedAreas, ...latestResult.summary.blockers].map((item, index) => (
                          <li key={stableListKey("reflection-results-skipped", item, index)}>{item}</li>
                        ))
                      ) : (
                        <li>No blockers were logged.</li>
                      )}
                    </ul>
                  </article>

                  <article className="history-card">
                    <strong>Recommended next actions</strong>
                    <ul className="clean-list">
                      {latestResult.summary.nextRecommendedActions.length ? (
                        latestResult.summary.nextRecommendedActions.map((item, index) => (
                          <li key={stableListKey("reflection-results-next", item, index)}>{item}</li>
                        ))
                      ) : (
                        <li>No next actions were generated.</li>
                      )}
                    </ul>
                  </article>

                  <article className="history-card">
                    <strong>Domain progress updates</strong>
                    <ul className="clean-list">
                      {latestResult.domainChanges.length ? (
                        latestResult.domainChanges.map((item) => (
                          <li key={item.domain}>
                            {titleize(item.domain)} moved from {percent(item.before)} to {percent(item.after)} because: {item.note}
                          </li>
                        ))
                      ) : (
                        <li>No domain progress changes were recorded.</li>
                      )}
                    </ul>
                  </article>
                </div>
              ) : (
                <p className="muted">Submit a reflection to generate a summary.</p>
              )
            ) : (
              <div className="reflection-history-layout">
                <div className="history-stack">
                  {state.checkIns.length ? (
                    state.checkIns.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`history-card reflection-history-button ${selectedHistoryId === item.id ? "active" : ""}`}
                        onClick={() => setSelectedHistoryId(item.id)}
                      >
                        <div className="line-between">
                          <strong>{checkInFocusLabel(item)}</strong>
                          <span className="pill">{titleize(item.kind || "weekly")}</span>
                        </div>
                        <p className="muted">{formatDate(item.createdAt)}</p>
                        <p className="muted">
                          Energy {item.energy}/5 • Adherence {item.adherence}/5 • Clarity {item.clarity}/5
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="muted">No reflections saved yet.</p>
                  )}
                </div>

                <article className="history-card">
                  {historyEntry ? (
                    <div className="stack-list">
                      <div className="line-between">
                        <strong>{checkInFocusLabel(historyEntry)}</strong>
                        <span className="pill">{formatDateTime(historyEntry.createdAt)}</span>
                      </div>
                      <p className="muted">{titleize(historyEntry.kind || "weekly")} reflection</p>
                      {historyEntry.summary?.completedActions?.length ? (
                        <div>
                          <strong>Completed</strong>
                          <ul className="clean-list">
                            {historyEntry.summary.completedActions.map((item, index) => (
                              <li key={stableListKey("reflection-history-completed", item, index)}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {historyEntry.summary?.blockers?.length ? (
                        <div>
                          <strong>Blockers</strong>
                          <ul className="clean-list">
                            {historyEntry.summary.blockers.map((item, index) => (
                              <li key={stableListKey("reflection-history-blockers", item, index)}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {historyEntry.summary?.nextRecommendedActions?.length ? (
                        <div>
                          <strong>Next actions</strong>
                          <ul className="clean-list">
                            {historyEntry.summary.nextRecommendedActions.map((item, index) => (
                              <li key={stableListKey("reflection-history-next", item, index)}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="muted">Choose a reflection from history to inspect it.</p>
                  )}
                </article>
              </div>
            )}

            <div className="controls">
              <button type="button" onClick={() => setStep("type")}>
                Start another reflection
              </button>
            </div>
          </ReflectionPanel>

          <ReflectionPanel title="Reflection archive" eyebrow="Running trends">
            <div className="priority-grid">
              <article className="mini-stat-card">
                <span className="muted">Average energy</span>
                <strong>{state.checkIns.length ? `${averages.energy.toFixed(1)}/5` : "n/a"}</strong>
                <p>How strong the period felt.</p>
              </article>
              <article className="mini-stat-card">
                <span className="muted">Average adherence</span>
                <strong>{state.checkIns.length ? `${averages.adherence.toFixed(1)}/5` : "n/a"}</strong>
                <p>How well execution matched intent.</p>
              </article>
              <article className="mini-stat-card">
                <span className="muted">Average clarity</span>
                <strong>{state.checkIns.length ? `${averages.clarity.toFixed(1)}/5` : "n/a"}</strong>
                <p>How usable the plan felt in practice.</p>
              </article>
            </div>
            <div className="stack-list">
              <p className="muted">
                Reflection is not isolated journaling. These entries feed domain progress, weekly proof, blockers, and future agent recommendations.
              </p>
              <div className="workspace-pills">
                {state.checkIns.slice(0, 6).map((item) => (
                  <span key={item.id} className="pill">
                    {titleize(item.kind || "weekly")} • {formatDate(item.createdAt)}
                  </span>
                ))}
              </div>
            </div>
          </ReflectionPanel>
        </div>
      ) : null}
    </div>
  );
}

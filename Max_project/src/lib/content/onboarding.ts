import type { Route } from "next";

export type OnboardingStepId =
  | "welcome"
  | "focus"
  | "baseline"
  | "habits"
  | "reality"
  | "constraints"
  | "review"
  | "processing"
  | "complete";

export type ChoiceOption = {
  value: string;
  label: string;
  description?: string;
};

export type FieldDefinition = {
  id: string;
  label: string;
  note?: string;
  placeholder?: string;
  type: "single-card" | "multi-card" | "single-chip" | "text" | "text-area" | "range" | "checkbox-list";
  required?: boolean;
  min?: number;
  minValue?: number;
  maxValue?: number;
  labels?: Record<number, string>;
  options?: ChoiceOption[];
};

export type StepDefinition = {
  id: Exclude<OnboardingStepId, "welcome" | "review" | "processing" | "complete">;
  index: number;
  title: string;
  kicker: string;
  description: string;
  nextHref: Route;
  prevHref: Route;
  fields: FieldDefinition[];
};

export const onboardingSteps: StepDefinition[] = [
  {
    id: "focus",
    index: 1,
    title: "Define what matters first",
    kicker: "Step 1 of 5",
    description:
      "Choose the domains, pacing, and tone. This tells the system what to optimize and how hard it is allowed to push.",
    nextHref: "/onboarding/baseline",
    prevHref: "/onboarding/welcome",
    fields: [
      {
        id: "focusDomains",
        label: "What should LifeMax OS prioritize first?",
        type: "multi-card",
        required: true,
        min: 2,
        note: "Pick at least two so the system has to make tradeoffs instead of writing a fantasy plan.",
        options: [
          { value: "career", label: "Career", description: "Role growth, leverage, positioning." },
          { value: "finance", label: "Money", description: "Cash flow, savings, pressure, stability." },
          { value: "health", label: "Health", description: "Energy, recovery, training, sleep." },
          { value: "looks", label: "Appearance", description: "Presentation, grooming, confidence." },
          { value: "routine", label: "Routine", description: "Execution quality and discipline." }
        ]
      },
      {
        id: "transformationMode",
        label: "What kind of help do you need?",
        type: "single-card",
        required: true,
        options: [
          { value: "reset", label: "Reset", description: "Reduce chaos and regain control." },
          { value: "climb", label: "Accelerate", description: "Push hard toward ambitious goals." },
          { value: "maintain", label: "Stabilize", description: "Protect gains and refine weak spots." }
        ]
      },
      {
        id: "timeHorizon",
        label: "What planning window should the system optimize for?",
        type: "single-chip",
        required: true,
        options: [
          { value: "30 days", label: "30 days" },
          { value: "90 days", label: "90 days" },
          { value: "180 days", label: "180 days" }
        ]
      },
      {
        id: "communicationStyle",
        label: "How should the system speak to you?",
        type: "single-chip",
        required: true,
        options: [
          { value: "direct", label: "Direct" },
          { value: "supportive", label: "Supportive" },
          { value: "analytical", label: "Analytical" }
        ]
      },
      {
        id: "supportIntensity",
        label: "How intense should the recommendations feel?",
        type: "single-chip",
        required: true,
        options: [
          { value: "steady", label: "Steady" },
          { value: "intensive", label: "Intensive" }
        ]
      },
      {
        id: "consentProfileData",
        label: "Consent",
        type: "checkbox-list",
        required: true,
        options: [
          {
            value: "consentProfileData",
            label: "I consent to LifeMax OS using my inputs to build a profile and plan."
          }
        ]
      }
    ]
  },
  {
    id: "baseline",
    index: 2,
    title: "Map your operating baseline",
    kicker: "Step 2 of 5",
    description:
      "This captures the practical conditions that shape what is realistic: role, schedule, time, money pressure, and current energy.",
    nextHref: "/onboarding/habits",
    prevHref: "/onboarding/focus",
    fields: [
      {
        id: "occupationCategory",
        label: "Current role context",
        type: "single-card",
        required: true,
        options: [
          { value: "Student", label: "Student", description: "Skill building and structure." },
          { value: "Early career", label: "Early career", description: "Clarity and leverage." },
          { value: "Operator", label: "Operator", description: "Execution-heavy workload." },
          { value: "Creative", label: "Creative", description: "Output and visibility." },
          { value: "Founder", label: "Founder", description: "High ambiguity and stress." },
          { value: "Manager", label: "Manager", description: "Leadership and systems." }
        ]
      },
      {
        id: "occupation",
        label: "Specific role",
        type: "text",
        required: true,
        placeholder: "Engineer, student, founder, analyst, designer..."
      },
      {
        id: "workSchedule",
        label: "Work pattern",
        type: "single-card",
        required: true,
        options: [
          { value: "Structured weekdays", label: "Structured weekdays", description: "Mostly predictable." },
          { value: "Shift-based", label: "Shift-based", description: "Rotating or late hours." },
          { value: "Variable / freelance", label: "Variable", description: "Self-directed and uneven." },
          { value: "Heavy overtime", label: "Heavy overtime", description: "High load, low slack." }
        ]
      },
      {
        id: "weeklyHoursAvailable",
        label: "Improvement time each week",
        type: "single-chip",
        required: true,
        options: [
          { value: "3-5 hours", label: "3-5" },
          { value: "6-10 hours", label: "6-10" },
          { value: "11-15 hours", label: "11-15" },
          { value: "15+ hours", label: "15+" }
        ]
      },
      {
        id: "weeklyScheduleReality",
        label: "What does a normal week actually look like?",
        type: "text-area",
        required: true,
        placeholder:
          "Example: Monday-Friday 9-6, 45 minute commute, mentally dead after dinner, Sunday is my only clean planning block."
      },
      {
        id: "financialStress",
        label: "Financial pressure",
        type: "single-chip",
        required: true,
        options: [
          { value: "Low", label: "Low" },
          { value: "Medium", label: "Medium" },
          { value: "High", label: "High" }
        ]
      },
      {
        id: "routineConsistency",
        label: "Current consistency",
        type: "range",
        required: true,
        minValue: 1,
        maxValue: 5,
        labels: {
          1: "chaotic",
          2: "uneven",
          3: "mixed",
          4: "solid",
          5: "locked in"
        }
      },
      {
        id: "energyBaseline",
        label: "Daily energy",
        type: "single-chip",
        required: true,
        options: [
          { value: "Low", label: "Low" },
          { value: "Medium", label: "Medium" },
          { value: "High", label: "High" }
        ]
      }
    ]
  },
  {
    id: "habits",
    index: 3,
    title: "Capture the physical baseline",
    kicker: "Step 3 of 5",
    description:
      "This step tells the system whether your body and environment can support ambition or whether recovery and defaults are the real bottleneck.",
    nextHref: "/onboarding/reality",
    prevHref: "/onboarding/baseline",
    fields: [
      {
        id: "sleepHours",
        label: "Typical sleep",
        type: "single-chip",
        required: true,
        options: [
          { value: "5.5", label: "<6h" },
          { value: "6.5", label: "6-7h" },
          { value: "7.5", label: "7-8h" },
          { value: "8.5", label: "8h+" }
        ]
      },
      {
        id: "dietQuality",
        label: "Food quality",
        type: "single-card",
        required: true,
        options: [
          { value: "Chaotic", label: "Chaotic", description: "Irregular meal timing, nutrients often inconsistent." },
          { value: "Mixed", label: "Mixed", description: "Some structure, but convenience still wins often." },
          { value: "Solid", label: "Solid", description: "Mostly intentional and repeatable." },
          { value: "Locked in", label: "Locked in", description: "Consistent and well-supported." }
        ]
      },
      {
        id: "eatingPattern",
        label: "How do you usually eat when life gets busy?",
        type: "single-card",
        required: true,
        options: [
          { value: "Mostly reactive", label: "Mostly reactive", description: "I eat whatever is easiest." },
          { value: "Skip then overeat", label: "Skip then overeat", description: "I miss meals then make up for it later." },
          { value: "Some structure", label: "Some structure", description: "A few defaults exist but they slip." },
          { value: "Planned and reliable", label: "Planned", description: "Meals are mostly decided in advance." }
        ]
      },
      {
        id: "trainingFrequency",
        label: "Training frequency",
        type: "single-chip",
        required: true,
        options: [
          { value: "0 sessions", label: "0" },
          { value: "1-2 sessions", label: "1-2" },
          { value: "3-4 sessions", label: "3-4" },
          { value: "5+ sessions", label: "5+" }
        ]
      },
      {
        id: "gymAccess",
        label: "Training environment",
        type: "single-card",
        required: true,
        options: [
          { value: "No gym access", label: "No gym", description: "Home or bodyweight only." },
          { value: "Basic gym access", label: "Basic gym", description: "Enough equipment for simple progression." },
          { value: "Full gym access", label: "Full gym", description: "Most training options are available." }
        ]
      },
      {
        id: "groomingHabits",
        label: "Presentation habits",
        type: "single-card",
        required: true,
        options: [
          { value: "Reactive", label: "Reactive", description: "Only when necessary." },
          { value: "Basic", label: "Basic", description: "Covered, not refined." },
          { value: "Consistent", label: "Consistent", description: "Stable baseline." },
          { value: "Intentional", label: "Intentional", description: "Deliberate and polished." }
        ]
      },
      {
        id: "build",
        label: "Build",
        type: "single-chip",
        required: true,
        options: [
          { value: "Lean", label: "Lean" },
          { value: "Average", label: "Average" },
          { value: "Athletic", label: "Athletic" },
          { value: "Bigger build", label: "Bigger" }
        ]
      },
      {
        id: "socialEnergy",
        label: "Social energy",
        type: "range",
        required: true,
        minValue: 1,
        maxValue: 5,
        labels: {
          1: "low",
          2: "calm",
          3: "balanced",
          4: "high",
          5: "charged"
        }
      },
      {
        id: "riskTolerance",
        label: "Risk tolerance",
        type: "range",
        required: true,
        minValue: 1,
        maxValue: 5,
        labels: {
          1: "low",
          2: "guarded",
          3: "balanced",
          4: "high",
          5: "aggressive"
        }
      }
    ]
  },
  {
    id: "reality",
    index: 4,
    title: "Expose the real friction",
    kicker: "Step 4 of 5",
    description:
      "This is where generic self-improvement breaks. The system needs to know how you actually avoid the hard thing and what pressure does to your behavior.",
    nextHref: "/onboarding/constraints",
    prevHref: "/onboarding/habits",
    fields: [
      {
        id: "nightlyPhoneHours",
        label: "How much time do you lose to your phone or scrolling on a typical night?",
        type: "single-chip",
        required: true,
        options: [
          { value: "0-1 hour", label: "0-1h" },
          { value: "1-2 hours", label: "1-2h" },
          { value: "3-4 hours", label: "3-4h" },
          { value: "5+ hours", label: "5h+" }
        ]
      },
      {
        id: "distractionSources",
        label: "What usually breaks your focus?",
        type: "multi-card",
        required: true,
        min: 1,
        options: [
          { value: "Phone / social media", label: "Phone", description: "Scrolling, messaging, endless checking." },
          { value: "YouTube / streaming", label: "Streaming", description: "Video rabbit holes kill the block." },
          { value: "Gaming", label: "Gaming", description: "Entertainment expands and eats the night." },
          { value: "Noise / chaotic environment", label: "Environment", description: "You do not control the room." },
          { value: "Fatigue", label: "Fatigue", description: "You are too tired to start cleanly." },
          { value: "Unclear next step", label: "Unclear next step", description: "You stall when the task feels fuzzy." },
          { value: "People interruptions", label: "Interruptions", description: "Other people break your flow." }
        ]
      },
      {
        id: "avoidancePatterns",
        label: "How do you usually avoid the hard thing?",
        type: "multi-card",
        required: true,
        min: 1,
        options: [
          { value: "I wait until I feel like it", label: "Wait for motivation", description: "You start late waiting for the perfect mood." },
          { value: "I do easy admin instead", label: "Busywork", description: "You substitute setup for real work." },
          { value: "I over-plan and under-execute", label: "Over-plan", description: "Planning becomes a hiding place." },
          { value: "I disappear after one bad day", label: "Quit after a slip", description: "One miss becomes a lost week." },
          { value: "I avoid feedback or visibility", label: "Avoid visibility", description: "You postpone anything judged by others." },
          { value: "I numb out with screens late", label: "Late-night escape", description: "Your day leaks out at night." }
        ]
      },
      {
        id: "stressResponse",
        label: "What happens when pressure rises?",
        type: "multi-card",
        required: true,
        min: 1,
        options: [
          { value: "Stay up too late and numb out with screens", label: "Lose the night", description: "Pressure turns into screen escape." },
          { value: "Skip meals or eat convenience food", label: "Food gets sloppy", description: "Nutrition collapses first." },
          { value: "Skip training and recovery", label: "Training disappears", description: "Exercise gets cut immediately." },
          { value: "Overspend for relief", label: "Spend for relief", description: "Money leaks to soften the week." },
          { value: "Isolate and stop replying", label: "Withdraw", description: "You go quiet and harder to help." },
          { value: "Become reactive and chaotic", label: "Go reactive", description: "The week becomes pure response mode." }
        ]
      },
      {
        id: "socialEnvironment",
        label: "What kind of environment are you operating inside?",
        type: "single-card",
        required: true,
        options: [
          { value: "Supportive", label: "Supportive", description: "People around you reinforce discipline." },
          { value: "Neutral but not strongly supportive", label: "Neutral", description: "No active help, no active sabotage." },
          { value: "Draining or tempting", label: "Draining", description: "People or context pull you off-plan." },
          { value: "Unstable", label: "Unstable", description: "The environment changes too much to trust default routines." }
        ]
      },
      {
        id: "selfNarrative",
        label: "What story do you keep telling yourself about why you are stuck?",
        type: "text-area",
        required: true,
        placeholder:
          "Example: I tell myself I just need more motivation, but the truth is I lose the night to my phone and start every day already behind."
      }
    ]
  },
  {
    id: "constraints",
    index: 5,
    title: "Set the pressure, stakes, and non-negotiables",
    kicker: "Step 5 of 5",
    description:
      "Now the system gets the stakes: why this matters now, where money leaks, and what type of control you actually need.",
    nextHref: "/onboarding/review",
    prevHref: "/onboarding/reality",
    fields: [
      {
        id: "careerGoal",
        label: "Career direction",
        type: "text",
        required: true,
        placeholder: "Example: land a better role in 90 days, recover credibility, rebuild portfolio momentum."
      },
      {
        id: "longTermDirection",
        label: "Long-term direction",
        type: "text",
        required: true,
        placeholder: "Example: more leverage, calmer finances, stronger body, cleaner reputation."
      },
      {
        id: "blockers",
        label: "Biggest blockers",
        type: "multi-card",
        required: true,
        min: 1,
        options: [
          { value: "Low energy", label: "Low energy", description: "Recovery and drive are weak." },
          { value: "Phone distraction", label: "Phone distraction", description: "Attention leaks constantly." },
          { value: "Money pressure", label: "Money pressure", description: "Financial stress narrows decisions." },
          { value: "Unclear goals", label: "Unclear goals", description: "Direction is fuzzy." },
          { value: "Inconsistent discipline", label: "Inconsistent discipline", description: "Momentum breaks too often." },
          { value: "Weak environment", label: "Weak environment", description: "Your setup fights you." }
        ]
      },
      {
        id: "moneyLeaks",
        label: "Where does money usually leak?",
        type: "multi-card",
        required: true,
        min: 1,
        options: [
          { value: "Food delivery / convenience spending", label: "Food delivery", description: "Convenience beats planning." },
          { value: "Subscriptions I barely use", label: "Subscriptions", description: "Charges drift in the background." },
          { value: "Impulse online purchases", label: "Impulse buys", description: "Mood spending adds up." },
          { value: "Transport / commuting sprawl", label: "Transport", description: "Travel costs stay unmanaged." },
          { value: "Nightlife / social spending", label: "Social spending", description: "Weekends erase discipline." },
          { value: "Debt interest / minimums", label: "Debt drag", description: "Past decisions tax the present." }
        ]
      },
      {
        id: "whyNow",
        label: "Why does this need to change now, not six months from now?",
        type: "text-area",
        required: true,
        placeholder: "Be blunt. What gets worse if you keep drifting exactly like this for another 90 days?"
      },
      {
        id: "financialSnapshot",
        label: "Money snapshot",
        note: "This is optional, but better data creates sharper money advice.",
        type: "text-area",
        placeholder: "Income, debt, savings, fixed bills, unstable expenses, or any financial reality that changes what is realistic."
      },
      {
        id: "currentTrackingTools",
        label: "What are you already using to track yourself, if anything?",
        type: "text",
        placeholder: "Calendar, Notes app, spreadsheet, MyFitnessPal, nothing, etc."
      },
      {
        id: "optionalNote",
        label: "Anything else the system should know before it sequences the first plan?",
        type: "text-area",
        placeholder: "Optional context."
      },
      {
        id: "systemFlags",
        label: "System behavior",
        type: "checkbox-list",
        options: [
          { value: "dataPersistence", label: "Save progress locally in this browser." },
          { value: "autonomousDecisions", label: "Allow stronger default routing and sequencing." }
        ]
      }
    ]
  }
];

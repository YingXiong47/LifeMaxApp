import { runWorkflow } from "../../agents/orchestrator/orchestratorAgent.js";
import { updatePlanProgress } from "../../agents/tracking/progressTrackerAgent.js";
import { loadState, saveState, resetState } from "../../core/utils/storage.js";
import { toPercent } from "../../core/utils/formatting.js";

const steps = [
  {
    id: "focus",
    kicker: "Step 1",
    title: "Goal signal",
    description: "Pick the domains and coaching posture you want the agents to optimize first.",
    fields: [
      {
        id: "focusDomains",
        label: "What should the system prioritize?",
        type: "multi-card",
        required: true,
        min: 2,
        note: "Choose at least two so the planner can balance tradeoffs.",
        options: [
          { value: "career", label: "Career", description: "Role growth, proof of work, leverage." },
          { value: "finance", label: "Money", description: "Cash flow, debt pressure, savings direction." },
          { value: "health", label: "Health", description: "Energy, sleep, training, recovery." },
          { value: "looks", label: "Looks", description: "Presentation, grooming, style consistency." },
          { value: "routine", label: "Routine", description: "Execution, discipline, planning rhythm." }
        ]
      },
      {
        id: "transformationMode",
        label: "What kind of change are you after?",
        type: "single-card",
        options: [
          { value: "reset", label: "Reset", description: "Get stable and stop bleeding energy." },
          { value: "climb", label: "Climb", description: "Push harder toward a bigger target." },
          { value: "maintain", label: "Maintain", description: "Protect gains and refine." }
        ]
      },
      {
        id: "timeHorizon",
        label: "What window should planning target?",
        type: "single-chip",
        options: [
          { value: "30 days", label: "30 days" },
          { value: "90 days", label: "90 days" },
          { value: "180 days", label: "180 days" }
        ]
      },
      {
        id: "communicationStyle",
        label: "How should the agents talk to you?",
        type: "single-chip",
        options: [
          { value: "direct", label: "Direct" },
          { value: "supportive", label: "Supportive" },
          { value: "analytical", label: "Analytical" }
        ]
      },
      {
        id: "supportIntensity",
        label: "How hard should the system push?",
        type: "single-chip",
        options: [
          { value: "steady", label: "Steady" },
          { value: "intensive", label: "Intensive" }
        ]
      },
      {
        id: "consentProfileData",
        label: "Consent and routing",
        type: "checkbox-list",
        options: [
          {
            value: "consentProfileData",
            label: "I consent to profile data being used for planning inside this browser session."
          }
        ]
      }
    ]
  },
  {
    id: "baseline",
    kicker: "Step 2",
    title: "Operating baseline",
    description: "Give the agents a practical baseline so they can stop guessing.",
    fields: [
      {
        id: "ageBracket",
        label: "Age bracket",
        type: "single-card",
        options: [
          { value: "18-24", label: "18-24", description: "Early build phase." },
          { value: "25-34", label: "25-34", description: "Prime acceleration phase." },
          { value: "35-44", label: "35-44", description: "Refine and compound." },
          { value: "45+", label: "45+", description: "Sustainable optimization." }
        ]
      },
      {
        id: "occupationCategory",
        label: "Current role context",
        type: "single-card",
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
        placeholder: "Product designer, sales rep, student, engineer...",
        note: "Keep it short."
      },
      {
        id: "workSchedule",
        label: "Work pattern",
        type: "single-card",
        options: [
          { value: "Structured weekdays", label: "Structured weekdays", description: "Mostly predictable." },
          { value: "Shift-based", label: "Shift-based", description: "Rotating or late hours." },
          { value: "Variable / freelance", label: "Variable / freelance", description: "Self-directed and uneven." },
          { value: "Heavy overtime", label: "Heavy overtime", description: "High load and low slack." }
        ]
      },
      {
        id: "weeklyHoursAvailable",
        label: "Hours available for improvement work each week",
        type: "single-chip",
        options: [
          { value: "3-5 hours", label: "3-5" },
          { value: "6-10 hours", label: "6-10" },
          { value: "11-15 hours", label: "11-15" },
          { value: "15+ hours", label: "15+" }
        ]
      },
      {
        id: "financialStress",
        label: "Financial pressure",
        type: "single-chip",
        options: [
          { value: "Low", label: "Low" },
          { value: "Medium", label: "Medium" },
          { value: "High", label: "High" }
        ]
      },
      {
        id: "routineConsistency",
        label: "How consistent are you right now?",
        type: "range",
        min: 1,
        max: 5,
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
        label: "Average daily energy",
        type: "single-chip",
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
    kicker: "Step 3",
    title: "Habits and presence",
    description: "This gives the profile-builder enough texture to stop treating you like a generic user.",
    fields: [
      {
        id: "sleepHours",
        label: "Typical sleep",
        type: "single-chip",
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
        options: [
          { value: "Chaotic", label: "Chaotic", description: "Mostly reactive." },
          { value: "Mixed", label: "Mixed", description: "Some good habits, lots of drift." },
          { value: "Solid", label: "Solid", description: "Usually supportive." },
          { value: "Locked in", label: "Locked in", description: "Consistent and intentional." }
        ]
      },
      {
        id: "trainingFrequency",
        label: "Training frequency",
        type: "single-chip",
        options: [
          { value: "0 sessions", label: "0" },
          { value: "1-2 sessions", label: "1-2" },
          { value: "3-4 sessions", label: "3-4" },
          { value: "5+ sessions", label: "5+" }
        ]
      },
      {
        id: "groomingHabits",
        label: "Presentation habits",
        type: "single-card",
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
        min: 1,
        max: 5,
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
        min: 1,
        max: 5,
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
    id: "constraints",
    kicker: "Step 4",
    title: "Constraints and ambition",
    description: "Now the planner can turn baseline plus ambition into an actual operating plan.",
    fields: [
      {
        id: "careerGoal",
        label: "Career direction",
        type: "single-card",
        options: [
          { value: "Need direction", label: "Need direction", description: "Clarify the next move first." },
          { value: "Promotion", label: "Promotion", description: "Win the next internal step." },
          { value: "New role", label: "New role", description: "Move somewhere stronger." },
          { value: "Higher income", label: "Higher income", description: "Push earning power now." },
          { value: "Build business", label: "Build business", description: "Create leverage outside the job." }
        ]
      },
      {
        id: "longTermDirection",
        label: "Long-term direction",
        type: "single-card",
        options: [
          { value: "Stability", label: "Stability", description: "Calmer and more reliable life systems." },
          { value: "Freedom", label: "Freedom", description: "More optionality and control." },
          { value: "Leadership", label: "Leadership", description: "Build authority and impact." },
          { value: "Wealth building", label: "Wealth building", description: "Compound financially." },
          { value: "Reinvention", label: "Reinvention", description: "Major shift in identity or direction." }
        ]
      },
      {
        id: "blockers",
        label: "Biggest blockers",
        type: "multi-card",
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
        id: "financialSnapshot",
        label: "Financial snapshot",
        type: "text-area",
        placeholder: "Short note: stable salary, debt pressure, low savings, irregular income...",
        note: "Optional, but it helps the finance agent stop speaking in abstractions."
      },
      {
        id: "optionalNote",
        label: "Anything else the agents should know?",
        type: "text-area",
        placeholder: "Optional note"
      },
      {
        id: "systemFlags",
        label: "System behavior",
        type: "checkbox-list",
        options: [
          { value: "dataPersistence", label: "Keep local progress history in this browser." },
          { value: "autonomousDecisions", label: "Allow proactive agent routing and stronger defaults." }
        ]
      }
    ]
  }
];

const form = document.getElementById("lifemax-form");
const stepperEl = document.getElementById("stepper");
const stepKickerEl = document.getElementById("step-kicker");
const stepTitleEl = document.getElementById("step-title");
const stepDescriptionEl = document.getElementById("step-description");
const progressBarEl = document.getElementById("progress-bar");
const wizardFieldsEl = document.getElementById("wizard-fields");
const prevStepBtn = document.getElementById("prev-step");
const nextStepBtn = document.getElementById("next-step");
const runBtn = document.getElementById("run-orchestrator");
const summaryEl = document.getElementById("package-summary");
const dashboardContentEl = document.getElementById("dashboard-content");
const milestonesEl = document.getElementById("milestones");
const iterationsEl = document.getElementById("iterations");
const logsEl = document.getElementById("logs");
const workflowStatusEl = document.getElementById("workflow-status");
const heroConfidenceEl = document.getElementById("hero-confidence");
const heroTasksEl = document.getElementById("hero-tasks");
const tabBarEl = document.getElementById("tab-bar");

const loadExampleBtn = document.getElementById("load-example");
const loadFounderBtn = document.getElementById("load-founder");
const loadResetBtn = document.getElementById("load-reset");
const resetStateBtn = document.getElementById("reset-state");
const downloadBtn = document.getElementById("download-package");
const rebuildPlanBtn = document.getElementById("rebuild-plan");
const reviewBtn = document.getElementById("generate-review");

let currentStep = 0;
let activeTab = "overview";
let answers = createDefaultAnswers();
let currentState = loadState() || createEmptyState();

function createEmptyState() {
  return {
    session: {
      userId: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    },
    history: [],
    latestRun: null,
    contactMessages: []
  };
}

function createDefaultAnswers() {
  return {
    focusDomains: ["career", "health"],
    transformationMode: "reset",
    timeHorizon: "90 days",
    communicationStyle: "direct",
    supportIntensity: "steady",
    consentProfileData: false,
    ageBracket: "25-34",
    occupationCategory: "Operator",
    occupation: "",
    workSchedule: "Structured weekdays",
    weeklyHoursAvailable: "6-10 hours",
    financialStress: "Medium",
    routineConsistency: 3,
    energyBaseline: "Medium",
    sleepHours: "6.5",
    dietQuality: "Mixed",
    trainingFrequency: "1-2 sessions",
    groomingHabits: "Basic",
    build: "Average",
    socialEnergy: 3,
    riskTolerance: 3,
    careerGoal: "New role",
    longTermDirection: "Freedom",
    blockers: ["Phone distraction"],
    financialSnapshot: "",
    optionalNote: "",
    dataPersistence: true,
    autonomousDecisions: false
  };
}

function samplePersona(type) {
  if (type === "founder") {
    return {
      focusDomains: ["career", "finance", "routine"],
      transformationMode: "climb",
      timeHorizon: "90 days",
      communicationStyle: "analytical",
      supportIntensity: "intensive",
      consentProfileData: true,
      ageBracket: "25-34",
      occupationCategory: "Founder",
      occupation: "Startup founder",
      workSchedule: "Variable / freelance",
      weeklyHoursAvailable: "11-15 hours",
      financialStress: "High",
      routineConsistency: 2,
      energyBaseline: "Medium",
      sleepHours: "5.5",
      dietQuality: "Mixed",
      trainingFrequency: "1-2 sessions",
      groomingHabits: "Basic",
      build: "Average",
      socialEnergy: 4,
      riskTolerance: 5,
      careerGoal: "Build business",
      longTermDirection: "Wealth building",
      blockers: ["Money pressure", "Unclear goals", "Inconsistent discipline"],
      financialSnapshot: "Irregular income, runway stress, some debt, low savings.",
      optionalNote: "Need stronger focus and less reactive decision-making.",
      dataPersistence: true,
      autonomousDecisions: true
    };
  }

  if (type === "reset") {
    return {
      focusDomains: ["health", "routine", "finance"],
      transformationMode: "reset",
      timeHorizon: "30 days",
      communicationStyle: "supportive",
      supportIntensity: "steady",
      consentProfileData: true,
      ageBracket: "25-34",
      occupationCategory: "Early career",
      occupation: "Customer success associate",
      workSchedule: "Heavy overtime",
      weeklyHoursAvailable: "3-5 hours",
      financialStress: "High",
      routineConsistency: 1,
      energyBaseline: "Low",
      sleepHours: "5.5",
      dietQuality: "Chaotic",
      trainingFrequency: "0 sessions",
      groomingHabits: "Reactive",
      build: "Average",
      socialEnergy: 2,
      riskTolerance: 2,
      careerGoal: "Need direction",
      longTermDirection: "Stability",
      blockers: ["Low energy", "Phone distraction", "Money pressure"],
      financialSnapshot: "Stable pay, no real savings, debt building.",
      optionalNote: "I need the plan to be simple enough that I actually do it.",
      dataPersistence: true,
      autonomousDecisions: false
    };
  }

  return {
    focusDomains: ["career", "health", "finance"],
    transformationMode: "climb",
    timeHorizon: "90 days",
    communicationStyle: "direct",
    supportIntensity: "steady",
    consentProfileData: true,
    ageBracket: "25-34",
    occupationCategory: "Creative",
    occupation: "Product designer",
    workSchedule: "Structured weekdays",
    weeklyHoursAvailable: "6-10 hours",
    financialStress: "Medium",
    routineConsistency: 3,
    energyBaseline: "Medium",
    sleepHours: "6.5",
    dietQuality: "Mixed",
    trainingFrequency: "1-2 sessions",
    groomingHabits: "Basic",
    build: "Average",
    socialEnergy: 3,
    riskTolerance: 4,
    careerGoal: "Higher income",
    longTermDirection: "Freedom",
    blockers: ["Phone distraction", "Unclear goals"],
    financialSnapshot: "Stable salary, some debt, small savings buffer.",
    optionalNote: "I want a system that pushes me without becoming impossible.",
    dataPersistence: true,
    autonomousDecisions: false
  };
}

function renderStepper() {
  stepperEl.innerHTML = "";
  steps.forEach((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `step-button ${index === currentStep ? "active" : ""}`;
    button.innerHTML = `<strong>${step.title}</strong><span>${step.kicker}</span>`;
    button.addEventListener("click", () => {
      currentStep = index;
      renderWizard();
    });
    stepperEl.appendChild(button);
  });
}

function renderWizard() {
  const step = steps[currentStep];
  renderStepper();
  stepKickerEl.textContent = step.kicker;
  stepTitleEl.textContent = step.title;
  stepDescriptionEl.textContent = step.description;
  progressBarEl.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
  wizardFieldsEl.innerHTML = "";

  step.fields.forEach((field) => {
    const group = document.createElement("div");
    group.className = "field-group";
    group.dataset.fieldId = field.id;
    const label = document.createElement("label");
    label.textContent = field.label;
    group.appendChild(label);

    if (field.note) {
      const note = document.createElement("div");
      note.className = "field-note";
      note.textContent = field.note;
      group.appendChild(note);
    }

    if (field.type === "single-card" || field.type === "multi-card") {
      const wrap = document.createElement("div");
      wrap.className = "choice-grid";
      field.options.forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-card";
        const isActive = field.type === "multi-card"
          ? (answers[field.id] || []).includes(option.value)
          : answers[field.id] === option.value;
        if (isActive) {
          button.classList.add("active");
        }
        button.innerHTML = `<strong>${option.label}</strong><small>${option.description || ""}</small>`;
        button.addEventListener("click", () => {
          if (field.type === "multi-card") {
            const next = new Set(answers[field.id] || []);
            if (next.has(option.value)) {
              next.delete(option.value);
            } else {
              next.add(option.value);
            }
            answers[field.id] = [...next];
          } else {
            answers[field.id] = option.value;
          }
          renderWizard();
        });
        wrap.appendChild(button);
      });
      group.appendChild(wrap);
    } else if (field.type === "single-chip") {
      const wrap = document.createElement("div");
      wrap.className = "quick-actions";
      field.options.forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `choice-chip ${answers[field.id] === option.value ? "active" : ""}`;
        button.textContent = option.label;
        button.addEventListener("click", () => {
          answers[field.id] = option.value;
          renderWizard();
        });
        wrap.appendChild(button);
      });
      group.appendChild(wrap);
    } else if (field.type === "text") {
      const input = document.createElement("input");
      input.className = "text-input";
      input.value = answers[field.id] || "";
      input.placeholder = field.placeholder || "";
      input.addEventListener("input", (event) => {
        answers[field.id] = event.target.value;
      });
      group.appendChild(input);
    } else if (field.type === "text-area") {
      const input = document.createElement("textarea");
      input.className = "text-area";
      input.rows = 3;
      input.value = answers[field.id] || "";
      input.placeholder = field.placeholder || "";
      input.addEventListener("input", (event) => {
        answers[field.id] = event.target.value;
      });
      group.appendChild(input);
    } else if (field.type === "range") {
      const row = document.createElement("div");
      row.className = "range-row";
      const input = document.createElement("input");
      input.type = "range";
      input.min = field.min;
      input.max = field.max;
      input.value = answers[field.id];
      input.addEventListener("input", (event) => {
        answers[field.id] = Number(event.target.value);
        renderWizard();
      });
      const readout = document.createElement("div");
      readout.className = "range-label";
      readout.textContent = field.labels?.[answers[field.id]] || answers[field.id];
      row.appendChild(input);
      row.appendChild(readout);
      group.appendChild(row);
    } else if (field.type === "checkbox-list") {
      const wrap = document.createElement("div");
      wrap.className = "checkbox-row";
      field.options.forEach((option) => {
        const pill = document.createElement("label");
        pill.className = "checkbox-pill";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = Boolean(answers[option.value]);
        input.addEventListener("change", (event) => {
          answers[option.value] = event.target.checked;
        });
        const text = document.createElement("span");
        text.textContent = option.label;
        pill.appendChild(input);
        pill.appendChild(text);
        wrap.appendChild(pill);
      });
      group.appendChild(wrap);
    }

    wizardFieldsEl.appendChild(group);
  });

  prevStepBtn.disabled = currentStep === 0;
  nextStepBtn.style.display = currentStep < steps.length - 1 ? "inline-flex" : "none";
  runBtn.style.display = currentStep === steps.length - 1 ? "inline-flex" : "none";
}

function stepHasMinimum(field) {
  if (field.type === "multi-card") {
    return (answers[field.id] || []).length >= (field.min || 1);
  }
  if (field.type === "text") {
    return Boolean((answers[field.id] || "").trim());
  }
  if (field.type === "checkbox-list") {
    return field.options.some((option) => Boolean(answers[option.value]));
  }
  return Boolean(answers[field.id]);
}

function validateCurrentStep() {
  const step = steps[currentStep];
  const invalid = step.fields.find((field) => field.required && !stepHasMinimum(field));
  return !invalid;
}

function ageBracketToAge(bracket) {
  return {
    "18-24": 22,
    "25-34": 29,
    "35-44": 39,
    "45+": 49
  }[bracket] || 29;
}

function derivePrimaryGoal() {
  const map = {
    reset: "Stabilize daily life and rebuild control across the highest-pressure domains",
    climb: "Create measurable upward momentum across the selected high-leverage domains",
    maintain: "Protect current gains and refine the weakest link"
  };
  return map[answers.transformationMode];
}

function buildObjective() {
  return `Improve life across ${answers.focusDomains.join(", ")} over ${answers.timeHorizon}.`;
}

function buildWorkflowInput() {
  const blockers = answers.blockers || [];
  return {
    objective: buildObjective(),
    primaryGoal: derivePrimaryGoal(),
    focusDomains: answers.focusDomains,
    transformationMode: answers.transformationMode,
    timeHorizon: answers.timeHorizon,
    age: String(ageBracketToAge(answers.ageBracket)),
    occupationCategory: answers.occupationCategory,
    occupation: answers.occupation || answers.occupationCategory,
    workSchedule: answers.workSchedule,
    weeklyHoursAvailable: answers.weeklyHoursAvailable,
    financialStress: answers.financialStress,
    financialSnapshot: answers.financialSnapshot,
    routineConsistency: String(answers.routineConsistency),
    energyBaseline: answers.energyBaseline,
    sleepHours: answers.sleepHours,
    dietQuality: answers.dietQuality,
    trainingFrequency: answers.trainingFrequency,
    groomingHabits: answers.groomingHabits,
    build: answers.build,
    socialEnergy: String(answers.socialEnergy),
    riskTolerance: String(answers.riskTolerance),
    careerGoal: answers.careerGoal,
    longTermDirection: answers.longTermDirection,
    blockers,
    constraintOne: blockers[0] || "",
    constraintTwo: blockers[1] || "",
    constraintThree: blockers[2] || "",
    procrastinationTrigger: blockers[0] || "unclear priorities",
    communicationStyle: answers.communicationStyle,
    supportIntensity: answers.supportIntensity,
    consentProfileData: Boolean(answers.consentProfileData),
    dataPersistence: Boolean(answers.dataPersistence),
    autonomousDecisions: Boolean(answers.autonomousDecisions),
    existingProgress: answers.optionalNote || "",
    knownPersonalityType: ""
  };
}

function renderMilestones(run) {
  milestonesEl.innerHTML = "";
  run.milestoneStatus.forEach((item) => {
    const node = document.createElement("div");
    node.className = "log-card";
    node.innerHTML = `
      <strong>${item.step}</strong>
      <span class="pill ${item.status === "complete" ? "good" : item.status === "attention" ? "warn" : ""}">${item.status}</span>
    `;
    milestonesEl.appendChild(node);
  });
}

function renderIterations(run) {
  iterationsEl.innerHTML = "";
  [...run.assumptions, ...run.iterationLog].forEach((line) => {
    const node = document.createElement("div");
    node.className = "log-card";
    node.textContent = line;
    iterationsEl.appendChild(node);
  });

  if (run.missingRequirements.length) {
    const missing = document.createElement("div");
    missing.className = "log-card";
    missing.innerHTML = `<strong>Missing requirements</strong><div class="warn">${run.missingRequirements.join(", ")}</div>`;
    iterationsEl.appendChild(missing);
  }
}

function renderLogs(run) {
  logsEl.innerHTML = "";
  run.logs.forEach((log) => {
    const node = document.createElement("div");
    node.className = "log-card";
    node.innerHTML = `
      <strong>${log.agentName}</strong>
      <div class="meta">${log.inputSummary}</div>
      <div class="${log.successFlag ? "good" : "warn"}">${log.outputSummary}</div>
      <div class="meta">${log.durationMs} ms</div>
    `;
    logsEl.appendChild(node);
  });
}

function renderSummaryCards(buildPackage) {
  summaryEl.innerHTML = "";
  const tracker = buildPackage?.tracker;
  const summary = buildPackage?.buildSummary;
  const cards = buildPackage
    ? [
        ["Final confidence", toPercent(summary.finalConfidenceScore)],
        ["Momentum score", toPercent(tracker.summary.momentumScore)],
        ["Completed tasks", String(tracker.summary.completedCount)],
        ["Focus domains", String(buildPackage.profile.goals.focusDomains.length)]
      ]
    : [
        ["Profile", "Waiting"],
        ["Roadmap", "Waiting"],
        ["Tracker", "Waiting"],
        ["Review", "Waiting"]
      ];

  cards.forEach(([label, value]) => {
    const node = document.createElement("div");
    node.className = "summary-card";
    node.innerHTML = `<strong>${label}</strong><div class="value">${value}</div>`;
    summaryEl.appendChild(node);
  });
}

function renderOverview(buildPackage) {
  const { profileIntel, strategyRoadmap, tracker, riskAssessment, testResultsSummary } = buildPackage;
  return `
    <div class="content-grid">
      <article class="data-card">
        <strong>Profile synthesis</strong>
        <p>${profileIntel.identityStatement}</p>
        <div class="tag-row">
          <span class="pill">${profileIntel.preferredCoachingMode}</span>
          <span class="pill">${toPercent(profileIntel.confidence)} confidence</span>
        </div>
        <ul>
          ${profileIntel.strengths.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </article>
      <article class="data-card">
        <strong>Weekly review</strong>
        <p>${tracker.weeklyReview.headline}</p>
        <p class="meta">${tracker.weeklyReview.focusForNextWeek}</p>
        <div class="progress-track"><span style="width:${Math.round(tracker.summary.adherenceScore * 100)}%"></span></div>
      </article>
      <article class="data-card">
        <strong>Strategy roadmap</strong>
        <p>${strategyRoadmap.executiveSummary}</p>
        <ul>
          ${strategyRoadmap.assumptions.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </article>
      <article class="data-card">
        <strong>Risk and validation</strong>
        <ul>
          ${riskAssessment.slice(0, 4).map((item) => `<li>${item}</li>`).join("")}
        </ul>
        <p class="meta">${testResultsSummary.failedTests.length ? "Some checks need follow-up." : "Core checks passed."}</p>
      </article>
    </div>
  `;
}

function renderProfile(buildPackage) {
  const { profile, profileIntel } = buildPackage;
  return `
    <div class="dashboard-columns">
      <article class="data-card">
        <strong>Who the agents think you are</strong>
        <p>${profileIntel.identityStatement}</p>
        <ul>
          ${profileIntel.bottlenecks.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </article>
      <article class="data-card">
        <strong>Baseline</strong>
        <div class="line-between"><span>Role</span><span class="meta">${profile.occupation}</span></div>
        <div class="line-between"><span>Schedule</span><span class="meta">${profile.schedule.workSchedule}</span></div>
        <div class="line-between"><span>Energy</span><span class="meta">${profile.habits.energyBaseline}</span></div>
        <div class="line-between"><span>Sleep</span><span class="meta">${profile.habits.sleepHours}h</span></div>
        <div class="line-between"><span>Financial stress</span><span class="meta">${profile.financialBaseline.stressLevel}</span></div>
        <div class="line-between"><span>Focus domains</span><span class="meta">${profile.goals.focusDomains.join(", ")}</span></div>
      </article>
    </div>
  `;
}

function renderRoadmap(buildPackage) {
  return `
    <div class="stack">
      ${buildPackage.strategyRoadmap.phases
        .map(
          (phase) => `
          <article class="timeline-card">
            <strong>${phase.name}</strong>
            <div class="meta">${phase.duration}</div>
            <ul>${phase.goals.map((goal) => `<li>${goal}</li>`).join("")}</ul>
          </article>
        `
        )
        .join("")}
      <article class="timeline-card">
        <strong>Priority stack</strong>
        <ul>
          ${buildPackage.strategyRoadmap.priorities
            .sort((a, b) => b.score - a.score)
            .map((priority) => `<li>${priority.domain}: ${priority.why} (${toPercent(priority.score)})</li>`)
            .join("")}
        </ul>
      </article>
    </div>
  `;
}

function renderTracker(buildPackage) {
  return `
    <div class="tracker-grid">
      <div class="stack">
        ${buildPackage.tracker.tasks
          .map(
            (task) => `
            <article class="task-row">
              <div class="task-head">
                <div>
                  <strong>${task.taskText}</strong>
                  <div class="meta">${task.planDomain} • ${task.metric} • ${task.deadline}</div>
                </div>
                <span class="pill ${task.status === "done" ? "good" : task.status === "in-progress" ? "warn" : ""}">${task.status}</span>
              </div>
              <div class="task-actions">
                <button type="button" data-action="start-task" data-task-id="${task.id}">Start</button>
                <button type="button" data-action="complete-task" data-task-id="${task.id}" class="primary">Done</button>
                <button type="button" data-action="reset-task" data-task-id="${task.id}">Reset</button>
              </div>
            </article>
          `
          )
          .join("")}
      </div>
      <div class="stack">
        <article class="data-card">
          <strong>Domain progress</strong>
          ${buildPackage.tracker.domainProgress
            .map(
              (item) => `
              <div class="stack">
                <div class="line-between"><span>${item.domain}</span><span class="meta">${item.completed}/${item.total}</span></div>
                <div class="progress-track"><span style="width:${Math.round(item.score * 100)}%"></span></div>
              </div>
            `
            )
            .join("")}
        </article>
        <article class="data-card">
          <strong>Review guidance</strong>
          <p>${buildPackage.tracker.weeklyReview.headline}</p>
          <p class="meta">${buildPackage.tracker.weeklyReview.focusForNextWeek}</p>
        </article>
      </div>
    </div>
  `;
}

function renderAgents(buildPackage) {
  return `
    <div class="stack">
      ${buildPackage.agentRoster
        .map(
          (agent) => `
          <article class="log-card">
            <strong>${agent.agentName}</strong>
            <div class="line-between">
              <span class="pill ${agent.status === "ready" ? "good" : "danger"}">${agent.status}</span>
              <span class="meta">${agent.confidence !== null ? toPercent(agent.confidence) : "n/a"}</span>
            </div>
          </article>
        `
        )
        .join("")}
    </div>
  `;
}

function renderDashboard(run) {
  if (!run?.buildPackage) {
    dashboardContentEl.innerHTML = `
      <article class="data-card">
        <strong>No active system yet</strong>
        <p class="meta">Complete the guided intake and build the first profile to unlock roadmap, tracker, and review panels.</p>
      </article>
    `;
    renderSummaryCards(null);
    return;
  }

  const buildPackage = run.buildPackage;
  renderSummaryCards(buildPackage);

  const tabs = {
    overview: renderOverview(buildPackage),
    profile: renderProfile(buildPackage),
    roadmap: renderRoadmap(buildPackage),
    tracker: renderTracker(buildPackage),
    agents: renderAgents(buildPackage)
  };

  dashboardContentEl.innerHTML = tabs[activeTab];
}

function syncHero(run) {
  if (!run?.buildPackage) {
    workflowStatusEl.textContent = run?.workflowStatus || "Ready for intake";
    heroConfidenceEl.textContent = "--";
    heroTasksEl.textContent = "0";
    return;
  }

  workflowStatusEl.textContent = run.workflowStatus;
  heroConfidenceEl.textContent = toPercent(run.buildPackage.buildSummary.finalConfidenceScore);
  heroTasksEl.textContent = String(run.buildPackage.tracker.summary.pendingCount);
}

function renderTabs() {
  [...tabBarEl.querySelectorAll(".tab-button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === activeTab);
  });
}

function renderAll() {
  renderTabs();
  syncHero(currentState.latestRun);
  renderDashboard(currentState.latestRun);

  if (!currentState.latestRun) {
    milestonesEl.innerHTML = "";
    iterationsEl.innerHTML = "";
    logsEl.innerHTML = "";
    return;
  }

  renderMilestones(currentState.latestRun);
  renderIterations(currentState.latestRun);
  renderLogs(currentState.latestRun);
}

function persist() {
  saveState(currentState);
}

function runSystemBuild() {
  const input = buildWorkflowInput();
  const result = runWorkflow(input, currentState);
  currentState.latestRun = result;
  currentState.history.unshift({
    createdAt: new Date().toISOString(),
    workflowStatus: result.workflowStatus,
    confidence: result.buildPackage?.buildSummary.finalConfidenceScore || 0
  });
  persist();
  renderAll();
}

function hydrateFromPersona(type) {
  answers = {
    ...createDefaultAnswers(),
    ...samplePersona(type)
  };
  renderWizard();
}

function handleTaskAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button || !currentState.latestRun?.buildPackage) {
    return;
  }
  const taskId = button.dataset.taskId;
  const action = button.dataset.action;
  const statusMap = {
    "start-task": "in-progress",
    "complete-task": "done",
    "reset-task": "pending"
  };
  currentState.latestRun.buildPackage = updatePlanProgress(
    currentState.latestRun.buildPackage,
    taskId,
    statusMap[action]
  );
  persist();
  renderAll();
}

prevStepBtn.addEventListener("click", () => {
  currentStep = Math.max(0, currentStep - 1);
  renderWizard();
});

nextStepBtn.addEventListener("click", () => {
  if (!validateCurrentStep()) {
    return;
  }
  currentStep = Math.min(steps.length - 1, currentStep + 1);
  renderWizard();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!answers.consentProfileData) {
    currentStep = 0;
    renderWizard();
    return;
  }
  runSystemBuild();
});

tabBarEl.addEventListener("click", (event) => {
  const button = event.target.closest(".tab-button");
  if (!button) {
    return;
  }
  activeTab = button.dataset.tab;
  renderAll();
});

dashboardContentEl.addEventListener("click", handleTaskAction);

loadExampleBtn.addEventListener("click", () => hydrateFromPersona("default"));
loadFounderBtn.addEventListener("click", () => hydrateFromPersona("founder"));
loadResetBtn.addEventListener("click", () => hydrateFromPersona("reset"));

rebuildPlanBtn.addEventListener("click", () => {
  if (!answers.consentProfileData) {
    currentStep = 0;
    renderWizard();
    return;
  }
  runSystemBuild();
});

reviewBtn.addEventListener("click", () => {
  activeTab = "tracker";
  renderAll();
});

resetStateBtn.addEventListener("click", () => {
  resetState();
  currentState = createEmptyState();
  answers = createDefaultAnswers();
  activeTab = "overview";
  currentStep = 0;
  renderWizard();
  renderAll();
});

downloadBtn.addEventListener("click", () => {
  if (!currentState.latestRun?.buildPackage) {
    return;
  }
  const blob = new Blob([JSON.stringify(currentState.latestRun.buildPackage, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lifemax-build-package.json";
  link.click();
  URL.revokeObjectURL(url);
});

renderWizard();
renderAll();

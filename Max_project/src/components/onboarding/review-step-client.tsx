"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppAuthSummary } from "@/components/providers/app-providers";
import { useWorkspaceState } from "@/components/providers/workspace-provider";
import { getDefaultDemoState, saveDemoState } from "@/lib/demo/storage";
import { getPlanningModeDetails, planningModeOptions } from "@/lib/planning-mode";
import { stableListKey } from "@/lib/ui/stable-list-key";
import { navigateWithFallback } from "@/lib/navigation";
import { loadResolvedOnboardingState } from "@/lib/onboarding/client-state";

export function ReviewStepClient() {
  const router = useRouter();
  const authSummary = useAppAuthSummary();
  const workspace = useWorkspaceState();
  const [state, setState] = useState(getDefaultDemoState);

  useEffect(() => {
    let cancelled = false;

    async function hydrateDraft() {
      const nextState = await loadResolvedOnboardingState({
        authMode: authSummary.mode,
        userId: authSummary.userId,
        workspaceAnswers: workspace.state.onboardingAnswers
      });

      if (!cancelled) {
        setState(nextState);
      }
    }

    void hydrateDraft();

    return () => {
      cancelled = true;
    };
  }, [authSummary.mode, authSummary.userId, workspace.state.onboardingAnswers]);

  const answers = state.onboardingAnswers || {};
  const selectedPlanningMode = state.preferences?.planningMode === "ai" ? "ai" : "stable";
  const selectedPlanningModeDetails = getPlanningModeDetails(selectedPlanningMode);

  const sections = [
    {
      title: "Focus",
      items: [
        `Domains: ${((answers.focusDomains as string[]) || []).join(", ")}`,
        `Mode: ${answers.transformationMode || "n/a"}`,
        `Window: ${answers.timeHorizon || "n/a"}`,
        `Tone: ${answers.communicationStyle || "n/a"}`
      ]
    },
    {
      title: "Baseline",
      items: [
        `Role: ${answers.occupation || "n/a"}`,
        `Schedule: ${answers.workSchedule || "n/a"}`,
        `Time available: ${answers.weeklyHoursAvailable || "n/a"}`,
        `Financial pressure: ${answers.financialStress || "n/a"}`,
        `Week reality: ${answers.weeklyScheduleReality || "n/a"}`
      ]
    },
    {
      title: "Habits",
      items: [
        `Sleep: ${answers.sleepHours || "n/a"}h`,
        `Food: ${answers.dietQuality || "n/a"}`,
        `Training: ${answers.trainingFrequency || "n/a"}`,
        `Eating pattern: ${answers.eatingPattern || "n/a"}`,
        `Routine consistency: ${answers.routineConsistency || "n/a"}`
      ]
    },
    {
      title: "Reality",
      items: [
        `Night phone time: ${answers.nightlyPhoneHours || "n/a"}`,
        `Distractions: ${((answers.distractionSources as string[]) || []).join(", ") || "n/a"}`,
        `Avoidance: ${((answers.avoidancePatterns as string[]) || []).join(", ") || "n/a"}`,
        `Pressure response: ${((answers.stressResponse as string[]) || []).join(", ") || "n/a"}`
      ]
    },
    {
      title: "Constraints",
      items: [
        `Career: ${answers.careerGoal || "n/a"}`,
        `Long-term: ${answers.longTermDirection || "n/a"}`,
        `Blockers: ${((answers.blockers as string[]) || []).join(", ") || "n/a"}`,
        `Why now: ${answers.whyNow || "n/a"}`
      ]
    }
  ];

  return (
    <section className="onboarding-shell">
      <aside className="onboarding-rail">
        <p className="eyebrow">Review</p>
        <h1>Make sure this feels true before the system builds your plan.</h1>
        <p className="lede">
          This review step is where a real product earns trust. It gives the user one clean chance to correct bad assumptions before the agents run.
        </p>
      </aside>

      <div className="step-card">
        <div className="stack">
          <article className="data-card">
            <strong>Choose how this first plan should run</strong>
            <p className="field-note">
              Stable mode is recommended for most users. AI mode is more dynamic but can be slower or less reliable.
            </p>
            <div className="choice-grid">
              {planningModeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`choice-card ${selectedPlanningMode === option.id ? "active" : ""}`}
                  onClick={() => {
                    const nextState = {
                      ...state,
                      preferences: {
                        ...state.preferences,
                        planningMode: option.id as "stable" | "ai"
                      }
                    };
                    setState(nextState);
                    saveDemoState(nextState);
                  }}
                >
                  <strong>
                    {option.title} <small>{option.eyebrow}</small>
                  </strong>
                  <small>{option.subtitle}</small>
                </button>
              ))}
            </div>
            <p className="field-note">
              Selected: <strong>{selectedPlanningModeDetails.title}</strong>. {selectedPlanningModeDetails.detail}
            </p>
          </article>

          {sections.map((section) => (
            <article key={section.title} className="data-card">
              <strong>{section.title}</strong>
              <ul>
                {section.items.map((item, index) => (
                  <li key={stableListKey(`review-${section.title}`, item, index)}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="wizard-nav">
          <Link className="button-link" href="/onboarding/constraints">
            Back
          </Link>
          <button
            type="button"
            className="button-link primary"
            onClick={() => {
              const nextState = {
                ...state,
                preferences: {
                  ...state.preferences,
                  planningMode: selectedPlanningMode
                }
              };
              setState(nextState);
              saveDemoState(nextState);
              navigateWithFallback(router, "/onboarding/processing");
            }}
          >
            Create my plan
          </button>
        </div>
      </div>
    </section>
  );
}

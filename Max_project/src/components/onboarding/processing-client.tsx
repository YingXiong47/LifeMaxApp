"use client";

import { useEffect, useRef, useState } from "react";
import { useAppAuthSummary } from "@/components/providers/app-providers";
import { useWorkspaceState } from "@/components/providers/workspace-provider";
import { Progress } from "@/components/ui/progress";
import { stableListKey } from "@/lib/ui/stable-list-key";
import { getOwnerKey, loadDemoState, saveDemoState } from "@/lib/demo/storage";
import { useGeneratePlan } from "@/hooks/use-onboarding";
import { navigateWithFallback } from "@/lib/navigation";
import { loadResolvedOnboardingState } from "@/lib/onboarding/client-state";
import { getPlanningModeDetails } from "@/lib/planning-mode";
import { onboardingAnswerSchema } from "@/lib/schemas/onboarding";

const pipeline = [
  "Validating intake and consent",
  "Synthesizing profile",
  "Running risk and quality gate",
  "Planning domain strategy",
  "Generating tasks and tracker",
  "Packaging the workspace"
];

async function loadWorkspaceRecoveryState() {
  const response = await fetch("/api/workspace", {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { state?: { latestRun?: { buildPackage?: unknown } | null } };
  return payload.state || null;
}

function readProcessingErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error.";

  if (
    message.includes("agent_runs_assessment_id_fkey") ||
    message.includes("violates foreign key constraint")
  ) {
    return "The plan finished, but protected workspace storage hit a linking error. Refresh once and the generated workspace should recover from the saved run.";
  }

  return message;
}

export function ProcessingClient() {
  const authSummary = useAppAuthSummary();
  const workspace = useWorkspaceState();
  const planningModeDetails = getPlanningModeDetails(
    workspace.state.preferences?.planningMode === "ai" ? "ai" : "stable"
  );
  const hasStartedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progressValue, setProgressValue] = useState(8);
  const [statusLabel, setStatusLabel] = useState("Starting workflow");
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: generatePlan } = useGeneratePlan();

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    if (authSummary.mode !== "demo" && workspace.status === "loading") {
      setStatusLabel("Loading saved onboarding state");
      setProgressValue(4);
      return;
    }

    hasStartedRef.current = true;

    let cancelled = false;
    let progressInterval: number | null = null;
    let finalTimeout: number | null = null;
    let slowRequestTimeout: number | null = null;

    async function run() {
      try {
        const state =
          authSummary.mode === "demo"
            ? loadDemoState()
            : await loadResolvedOnboardingState({
                authMode: authSummary.mode,
                userId: authSummary.userId,
                workspaceAnswers: workspace.state.onboardingAnswers
              });

        if (!state.onboardingAnswers || Object.keys(state.onboardingAnswers).length === 0) {
          if (authSummary.mode !== "demo" && workspace.state.latestRun?.buildPackage) {
            setStatusLabel("Recovered completed plan");
            setActiveIndex(pipeline.length - 1);
            setProgressValue(100);
            finalTimeout = window.setTimeout(() => {
              navigateWithFallback(
                {
                  push: (href) => window.location.assign(href),
                  replace: (href) => window.location.replace(href)
                },
                "/onboarding/complete",
                { replace: true, fallbackMs: 250 }
              );
            }, 320);
            return;
          }

          setError("Your onboarding answers have not loaded yet. Go back one step and try again.");
          return;
        }

        const parsed = onboardingAnswerSchema.parse(state.onboardingAnswers);
        setError(null);
        setStatusLabel(pipeline[0]);
        setActiveIndex(0);
        setProgressValue(8);

        progressInterval = window.setInterval(() => {
          setProgressValue((current) => {
            const nextValue = Math.min(current + 7, 92);
            const derivedIndex = Math.min(
              Math.floor((nextValue - 8) / 14),
              pipeline.length - 1
            );
            setActiveIndex(derivedIndex);
            setStatusLabel(pipeline[derivedIndex] || pipeline[0]);
            return nextValue;
          });
        }, 240);

        slowRequestTimeout = window.setTimeout(() => {
          setStatusLabel("Still packaging the workspace");
          setActiveIndex(pipeline.length - 1);
          setProgressValue((current) => Math.max(current, 94));
        }, 12_000);

        const payload = await generatePlan({
          ownerKey: authSummary.userId || getOwnerKey(state),
          authMode: authSummary.mode === "demo" ? "demo" : authSummary.mode,
          answers: parsed,
          planningMode: state.preferences?.planningMode === "ai" ? "ai" : "stable",
          previousState: state.latestRun
            ? {
                session: {
                  userId: state.session.user?.id || `demo-${Date.now()}`
                },
                latestRun: {
                  buildPackage: state.buildPackage
                }
              }
            : null
        });

        const nextState = {
          ...state,
          latestRun: payload.result,
          buildPackage: payload.result.buildPackage,
          history: [
            {
              id: payload.result.workflowMeta?.runId || `run-${Date.now()}`,
              createdAt: payload.result.workflowMeta?.generatedAt || new Date().toISOString(),
              workflowStatus: payload.result.workflowStatus,
              confidence: payload.result.buildPackage?.buildSummary?.finalConfidenceScore || 0,
              title: payload.result.buildPackage?.profile?.primaryGoal || "LifeMax OS plan"
            },
            ...state.history
          ]
        };

        saveDemoState(nextState);
        if (authSummary.mode !== "demo") {
          await workspace.saveState(nextState);
        }

        setActiveIndex(pipeline.length - 1);
        setStatusLabel("Finalizing workspace");
        setProgressValue(100);
        finalTimeout = window.setTimeout(() => {
          navigateWithFallback(
            {
              push: (href) => window.location.assign(href),
              replace: (href) => window.location.replace(href)
            },
            "/onboarding/complete",
            { replace: true, fallbackMs: 250 }
          );
        }, 420);
      } catch (caught) {
        if (!cancelled) {
          const latestState =
            authSummary.mode === "demo"
              ? loadDemoState()
              : await loadResolvedOnboardingState({
                  authMode: authSummary.mode,
                  userId: authSummary.userId,
                  workspaceAnswers: workspace.state.onboardingAnswers
                });
          const recoveredWorkspace =
            authSummary.mode === "demo" ? null : await loadWorkspaceRecoveryState();

          if (latestState.latestRun?.buildPackage || recoveredWorkspace?.latestRun?.buildPackage) {
            setStatusLabel("Recovered completed plan");
            setProgressValue(100);
            finalTimeout = window.setTimeout(() => {
              navigateWithFallback(
                {
                  push: (href) => window.location.assign(href),
                  replace: (href) => window.location.replace(href)
                },
                "/onboarding/complete",
                { replace: true, fallbackMs: 250 }
              );
            }, 320);
            return;
          }
          setError(readProcessingErrorMessage(caught));
        }
      } finally {
        if (progressInterval !== null) {
          window.clearInterval(progressInterval);
        }
        if (slowRequestTimeout !== null) {
          window.clearTimeout(slowRequestTimeout);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
      if (progressInterval !== null) {
        window.clearInterval(progressInterval);
      }
      if (finalTimeout !== null) {
        window.clearTimeout(finalTimeout);
      }
      if (slowRequestTimeout !== null) {
        window.clearTimeout(slowRequestTimeout);
      }
    };
  }, [
    authSummary.mode,
    authSummary.userId,
    generatePlan,
    workspace.state.latestRun,
    workspace.state.onboardingAnswers,
    workspace.status
  ]);

  return (
    <section className="onboarding-shell">
      <aside className="onboarding-rail">
        <p className="eyebrow">Processing</p>
        <h1>The system is building your first operating model.</h1>
        <p className="lede">
          This is where the product should feel convincingly agentic: visible stages, real outputs, and no fake black box.
        </p>
      </aside>

      <div className="step-card">
        <div className="stack">
          <article className="data-card">
            <strong>{planningModeDetails.title}</strong>
            <p className="field-note">{planningModeDetails.subtitle}</p>
          </article>
          <article className="data-card">
            <div className="line-between">
              <strong>{statusLabel}</strong>
              <span className="meta">{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} />
          </article>
          {pipeline.map((item, index) => (
            <article key={stableListKey("processing-pipeline", item, index)} className={`log-card ${index <= activeIndex ? "is-live" : ""}`}>
              <strong>{item}</strong>
              <div className="meta">{index < activeIndex ? "Complete" : index === activeIndex ? "Running" : "Queued"}</div>
            </article>
          ))}
        </div>
        {error ? <p className="warn">{error}</p> : null}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { onboardingSteps, StepDefinition } from "@/lib/content/onboarding";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAppAuthSummary } from "@/components/providers/app-providers";
import { useWorkspaceState } from "@/components/providers/workspace-provider";
import {
  defaultOnboardingAnswers,
  OnboardingDraft,
  onboardingStepSchemas
} from "@/lib/schemas/onboarding";
import { getOwnerKey, loadDemoState, saveDemoState } from "@/lib/demo/storage";
import { navigateWithFallback } from "@/lib/navigation";
import { useSaveOnboardingDraft } from "@/hooks/use-onboarding";
import { loadResolvedOnboardingState } from "@/lib/onboarding/client-state";

function readErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as { message?: unknown };
  return typeof candidate.message === "string" ? candidate.message : null;
}

const stepVisualCopy: Record<StepDefinition["id"], { caption: string; note: string }> = {
  focus: {
    caption: "Set the operating tone",
    note: "This first pass tells the system what to optimize and how hard to push."
  },
  baseline: {
    caption: "Map the real baseline",
    note: "Pressure, schedule, and energy determine what a credible plan can support."
  },
  habits: {
    caption: "Find the leverage points",
    note: "The body, food, and training baseline decide whether ambition is real or just talk."
  },
  reality: {
    caption: "Expose the avoidance loop",
    note: "This step identifies what actually breaks discipline so the plan can attack the cause instead of the symptom."
  },
  constraints: {
    caption: "Sequence around friction",
    note: "Blockers and long-term direction shape the first rollout and fallback paths."
  }
};

export function OnboardingStepClient({ stepId }: { stepId: StepDefinition["id"] }) {
  const router = useRouter();
  const authSummary = useAppAuthSummary();
  const workspace = useWorkspaceState();
  const step = useMemo(
    () => onboardingSteps.find((item) => item.id === stepId)!,
    [stepId]
  );
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const saveDraftMutation = useSaveOnboardingDraft();
  const form = useForm<Record<string, any>>({
    resolver: zodResolver(onboardingStepSchemas[stepId] as any),
    mode: "onChange",
    defaultValues: defaultOnboardingAnswers
  });

  useEffect(() => {
    let cancelled = false;

    async function hydrateDraft() {
      const state = await loadResolvedOnboardingState({
        authMode: authSummary.mode,
        userId: authSummary.userId,
        workspaceAnswers: workspace.state.onboardingAnswers
      });

      if (!cancelled) {
        form.reset({
          ...defaultOnboardingAnswers,
          ...(state.onboardingAnswers || {})
        });
      }
    }

    void hydrateDraft();

    return () => {
      cancelled = true;
    };
  }, [authSummary.mode, authSummary.userId, form, stepId, workspace.state.onboardingAnswers]);

  const values = form.watch();

  async function onSubmit(stepValues: Record<string, any>) {
    setSubmissionError(null);

    try {
      const state = loadDemoState();
      const mergedAnswers: OnboardingDraft = {
        ...defaultOnboardingAnswers,
        ...state.onboardingAnswers,
        ...stepValues
      };

      saveDemoState({
        ...state,
        onboardingAnswers: mergedAnswers
      });

      await saveDraftMutation.mutateAsync({
        ownerKey: authSummary.userId || getOwnerKey(state),
        authMode: authSummary.mode === "demo" ? "demo" : authSummary.mode,
        lastStep: step.id,
        answers: mergedAnswers
      });

      navigateWithFallback(router, step.nextHref);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Unable to save this step.");
    }
  }

  return (
    <section className="onboarding-shell">
      <aside className="onboarding-rail">
        <p className="eyebrow">Assessment</p>
        <h1>{step.title}</h1>
        <p className="lede">{step.description}</p>
        <div className="step-list">
          {onboardingSteps.map((item) => (
            <div key={item.id} className={`step-list-item ${item.id === step.id ? "active" : ""}`}>
              <span>{item.kicker}</span>
              <strong>{item.title}</strong>
            </div>
          ))}
        </div>
        <div className="step-scene-meta">
          <strong>{stepVisualCopy[step.id].caption}</strong>
          <p>{stepVisualCopy[step.id].note}</p>
        </div>
        <article className={`step-scene scene-${step.id}`} aria-hidden="true">
          <div className="step-scene-orbit" />
          <div className="step-scene-track" />
          <div className="step-scene-node lead" />
          <div className="step-scene-node mid" />
          <div className="step-scene-node tail" />
        </article>
      </aside>

      <div className="step-card">
        <div className="stack">
          <p className="eyebrow">{step.kicker}</p>
          <Progress value={(step.index / onboardingSteps.length) * 100} />
        </div>

        <form className="wizard-fields" onSubmit={form.handleSubmit(onSubmit)}>
          {step.fields.map((field) => (
            <div key={field.id} className="field-group">
              <Label>{field.label}</Label>
              {field.note ? <p className="field-note">{field.note}</p> : null}

              {(field.type === "single-card" || field.type === "multi-card") && (
                <div className="choice-grid">
                  {field.options?.map((option) => {
                    const selected =
                      field.type === "multi-card"
                        ? Array.isArray(values[field.id]) && (values[field.id] as string[]).includes(option.value)
                        : values[field.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`choice-card ${selected ? "active" : ""}`}
                        onClick={() => {
                          if (field.type === "multi-card") {
                            const current = new Set((form.getValues(field.id) as string[]) || []);
                            if (current.has(option.value)) {
                              current.delete(option.value);
                            } else {
                              current.add(option.value);
                            }
                            form.setValue(field.id, [...current], {
                              shouldDirty: true,
                              shouldValidate: true
                            });
                          } else {
                            form.setValue(field.id, option.value, {
                              shouldDirty: true,
                              shouldValidate: true
                            });
                          }
                        }}
                      >
                        <strong>{option.label}</strong>
                        {option.description ? <small>{option.description}</small> : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {field.type === "single-chip" && (
                <div className="quick-actions">
                  {field.options?.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`choice-chip ${values[field.id] === option.value ? "active" : ""}`}
                      onClick={() =>
                        form.setValue(field.id, option.value, {
                          shouldDirty: true,
                          shouldValidate: true
                        })
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {field.type === "text" && (
                <Input placeholder={field.placeholder} {...form.register(field.id)} />
              )}

              {field.type === "text-area" && (
                <Textarea rows={4} placeholder={field.placeholder} {...form.register(field.id)} />
              )}

              {field.type === "range" && (
                <Controller
                  control={form.control}
                  name={field.id}
                  render={({ field: controllerField }) => (
                    <div className="range-row">
                      <input
                        type="range"
                        min={field.minValue}
                        max={field.maxValue}
                        value={Number(controllerField.value || field.minValue || 1)}
                        onChange={(event) => controllerField.onChange(Number(event.target.value))}
                      />
                      <span className="range-label">
                        {field.labels?.[Number(controllerField.value || field.minValue || 1)]}
                      </span>
                    </div>
                  )}
                />
              )}

              {field.type === "checkbox-list" && (
                <div className="checkbox-row">
                  {field.options?.map((option) => (
                    <label
                      key={option.value}
                      className={`checkbox-pill ${Boolean(values[option.value]) ? "active" : ""}`}
                    >
                      <Controller
                        control={form.control}
                        name={option.value}
                        render={({ field: controllerField }) => (
                          <Checkbox
                            checked={Boolean(controllerField.value)}
                            onCheckedChange={(checked) => controllerField.onChange(checked === true)}
                          />
                        )}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {(() => {
                const directMessage = readErrorMessage(form.formState.errors[field.id]);
                const optionMessage = field.options
                  ?.map((option) => readErrorMessage(form.formState.errors[option.value]))
                  .find(Boolean);

                if (!directMessage && !optionMessage) {
                  return null;
                }

                return <p className="warn">{directMessage || optionMessage}</p>;
              })()}
            </div>
          ))}
          {submissionError ? <p className="warn">{submissionError}</p> : null}
        </form>

        <div className="wizard-nav">
          <Link className="button-link" href={step.prevHref}>
            Back
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={!form.formState.isValid || saveDraftMutation.isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {saveDraftMutation.isPending ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </section>
  );
}

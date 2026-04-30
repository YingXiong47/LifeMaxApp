"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppAuthSummary } from "@/components/providers/app-providers";
import { useWorkspaceState } from "@/components/providers/workspace-provider";

export function StartAssessmentActions() {
  const router = useRouter();
  const authSummary = useAppAuthSummary();
  const { state } = useWorkspaceState();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const shouldConfirmOverwrite =
    Boolean(authSummary.userId) && (Boolean(state.buildPackage) || state.history.length > 0);

  function handleBegin() {
    if (shouldConfirmOverwrite) {
      setConfirmOpen(true);
      return;
    }

    router.push("/onboarding/focus?fresh=1");
  }

  function continueToAssessment() {
    setConfirmOpen(false);
    router.push("/onboarding/focus?fresh=1");
  }

  return (
    <div className="stack-list">
      <div className="wizard-nav">
        <Link className="button-link" href="/">
          Back home
        </Link>
        <button type="button" className="button-link primary" onClick={handleBegin}>
          {shouldConfirmOverwrite ? "Start new assessment" : "Begin assessment"}
        </button>
      </div>

      {confirmOpen ? (
        <article className="history-card assessment-warning-card" role="alertdialog" aria-modal="true">
          <strong>Replace current plan?</strong>
          <p>
            Starting a new assessment will replace your current assessment-based plan. Future recommendations, domain
            progress, and agent outputs will be based on the new assessment.
          </p>
          <div className="controls">
            <button type="button" onClick={() => setConfirmOpen(false)}>
              Cancel
            </button>
            <button type="button" className="primary" onClick={continueToAssessment}>
              Continue and overwrite
            </button>
          </div>
        </article>
      ) : null}
    </div>
  );
}

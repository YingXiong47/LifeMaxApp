"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppAuthSummary } from "@/components/providers/app-providers";
import { useWorkspaceState } from "@/components/providers/workspace-provider";
import { syncSupabaseSession } from "@/lib/auth/client-session";
import { clearWorkspaceFallbackState, resetDemoState } from "@/lib/demo/storage";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type DeleteTarget = "profile" | "account";

const targetCopy: Record<
  DeleteTarget,
  {
    eyebrow: string;
    title: string;
    description: string;
    confirmLabel: string;
    buttonLabel: string;
    successNotice: string;
  }
> = {
  profile: {
    eyebrow: "Delete profile data",
    title: "Delete the saved workspace but keep this login.",
    description:
      "This removes the assessment, plans, progress history, reflections, agent runs, onboarding draft, and protected workspace records. Your email/password account stays active.",
    confirmLabel: "Delete profile data",
    buttonLabel: "Delete profile data",
    successNotice: "Profile data deleted. Your account is still active, but the workspace has been reset."
  },
  account: {
    eyebrow: "Delete account",
    title: "Delete the account and all protected workspace data.",
    description:
      "This permanently removes the login itself and all saved workspace records tied to it. This cannot be undone.",
    confirmLabel: "Delete account",
    buttonLabel: "Delete account",
    successNotice: "Account deleted."
  }
};

export function SettingsDangerZone() {
  const router = useRouter();
  const authSummary = useAppAuthSummary();
  const workspace = useWorkspaceState();
  const [activeTarget, setActiveTarget] = useState<DeleteTarget | null>(null);
  const [pendingTarget, setPendingTarget] = useState<DeleteTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function runDelete(target: DeleteTarget) {
    setPendingTarget(target);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ target })
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to complete the account action.");
      }

      resetDemoState();
      clearWorkspaceFallbackState();

      if (target === "profile") {
        setNotice(targetCopy.profile.successNotice);
        setActiveTarget(null);
        await workspace.refresh();
        router.refresh();
        return;
      }

      try {
        const supabase = getBrowserSupabaseClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch {
        // Ignore local sign-out failures after the account is already deleted.
      }

      await syncSupabaseSession(null);
      setActiveTarget(null);
      router.push("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to complete the account action.");
    } finally {
      setPendingTarget(null);
    }
  }

  if (authSummary.mode !== "supabase") {
    return (
      <div className="stack-list danger-zone">
        <p className="muted">
          Protected profile deletion and full account deletion are only available for Supabase-authenticated accounts.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="stack-list danger-zone">
        <p className="muted">
          These actions affect protected workspace data. Deleting profile data keeps the login. Deleting the account
          removes the login and the saved workspace permanently.
        </p>
        <div className="controls">
          <button type="button" className="button-link danger" onClick={() => setActiveTarget("profile")}>
            Delete profile data
          </button>
          <button type="button" className="button-link danger" onClick={() => setActiveTarget("account")}>
            Delete account
          </button>
        </div>
        {notice ? <p className="field-note">{notice}</p> : null}
        {error ? <p className="warn">{error}</p> : null}
      </div>

      {activeTarget ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setActiveTarget(null)}>
          <article
            className="workspace-panel example-run-modal danger-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`danger-zone-${activeTarget}-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-head">
              <div>
                <p className="eyebrow">{targetCopy[activeTarget].eyebrow}</p>
                <h2 id={`danger-zone-${activeTarget}-title`}>{targetCopy[activeTarget].title}</h2>
              </div>
            </div>
            <p>{targetCopy[activeTarget].description}</p>
            <p className="field-note">This action affects protected workspace storage immediately.</p>
            <div className="controls">
              <button type="button" className="button-link" onClick={() => setActiveTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="button-link danger"
                disabled={pendingTarget === activeTarget}
                onClick={() => runDelete(activeTarget)}
              >
                {pendingTarget === activeTarget ? "Working..." : targetCopy[activeTarget].confirmLabel}
              </button>
            </div>
            {error ? <p className="warn">{error}</p> : null}
          </article>
        </div>
      ) : null}
    </>
  );
}

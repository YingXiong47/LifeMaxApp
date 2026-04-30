"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { syncSupabaseSession } from "@/lib/auth/client-session";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type ResetStatus = "verifying" | "ready" | "invalid" | "complete";

export function SupabaseResetPasswordCard() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<ResetStatus>("verifying");
  const [submitting, setSubmitting] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);

  useEffect(() => {
    const client = getBrowserSupabaseClient();

    if (!client) {
      setStatus("invalid");
      setError("Supabase auth is not configured yet.");
      return;
    }

    const supabase = client;
    let cancelled = false;

    async function resolveRecoverySession() {
      setError(null);
      setNotice("Verifying your recovery link...");

      const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const code = search?.get("code");
      const recoveryInHash =
        typeof window !== "undefined" &&
        (window.location.hash.includes("access_token") || window.location.hash.includes("type=recovery"));
      setHasRecoveryToken(Boolean(code) || recoveryInHash);

      try {
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw new Error(exchangeError.message);
          }

          if (data.session) {
            await syncSupabaseSession(data.session);
            if (!cancelled) {
              setStatus("ready");
              setNotice("Link verified. Choose a new password.");
            }
            return;
          }
        }

        const { data } = await supabase.auth.getSession();

        if (data.session) {
          await syncSupabaseSession(data.session);
          if (!cancelled) {
            setStatus("ready");
            setNotice("Link verified. Choose a new password.");
          }
          return;
        }

        if (!cancelled) {
          setStatus("invalid");
          setNotice(null);
          setError("This reset link is missing, expired, or already used. Request a new one.");
        }
      } catch (caught) {
        if (!cancelled) {
          setStatus("invalid");
          setNotice(null);
          setError(caught instanceof Error ? caught.message : "Unable to verify the reset link.");
        }
      }
    }

    void resolveRecoverySession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        void syncSupabaseSession(session);

        if (!cancelled) {
          setStatus("ready");
          setError(null);
          setNotice("Link verified. Choose a new password.");
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    const supabase = getBrowserSupabaseClient();

    if (!supabase) {
      setError("Supabase auth is not configured yet.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      const { data } = await supabase.auth.getSession();
      await syncSupabaseSession(data.session ?? null);
      setStatus("complete");
      setNotice("Password updated. You can continue back into your workspace now.");
      router.push("/app/settings");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update the password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <p className="eyebrow">Password reset</p>
      <h1>{status === "complete" ? "Password updated" : "Choose a new password"}</h1>
      <p className="lede">
        {status === "complete"
          ? "Your password has been changed. This page stays separate from sign-in so users can complete recovery cleanly after email verification."
          : "This page is only for verified password recovery. Open it from the reset email, then set a new password here."}
      </p>
      <div className="wizard-fields">
        {status === "ready" || status === "complete" ? (
          <>
            <div className="field-group">
              <label htmlFor="reset-password">New password</label>
              <input
                id="reset-password"
                className="text-input"
                type="password"
                autoComplete="new-password"
                value={password}
                placeholder="Create a new password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="field-group">
              <label htmlFor="reset-confirm-password">Confirm new password</label>
              <input
                id="reset-confirm-password"
                className="text-input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                placeholder="Re-enter the new password"
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="field-group">
            <label>Recovery link status</label>
            <p className="field-note">
              {hasRecoveryToken ? "Checking the recovery link now..." : "Open this page from the password reset email to continue."}
            </p>
          </div>
        )}
        {error ? <p className="warn">{error}</p> : null}
        {notice ? <p className="field-note">{notice}</p> : null}
        <div className="controls">
          {status === "ready" ? (
            <button type="submit" className="button-link primary" disabled={submitting}>
              {submitting ? "Updating..." : "Update password"}
            </button>
          ) : status === "complete" ? (
            <Link className="button-link primary" href="/app/settings">
              Return to workspace
            </Link>
          ) : (
            <Link className="button-link primary" href="/forgot-password">
              Request a new reset link
            </Link>
          )}
          <Link className="button-link" href="/sign-in">
            Back to sign in
          </Link>
        </div>
      </div>
    </form>
  );
}

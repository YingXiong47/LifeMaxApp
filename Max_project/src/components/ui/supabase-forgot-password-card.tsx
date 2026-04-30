"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export function SupabaseForgotPasswordCard() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const supabase = getBrowserSupabaseClient();

    if (!supabase) {
      setError("Supabase auth is not configured yet.");
      return;
    }

    setSubmitting(true);

    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setNotice("Check your email for the secure password reset link. Open that link to choose a new password.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <p className="eyebrow">Password help</p>
      <h1>Send a password reset link</h1>
      <p className="lede">
        Enter the email tied to your account. We will send a secure link so you can verify the request and set a new password on a separate page.
      </p>
      <div className="wizard-fields">
        <div className="field-group">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            className="text-input"
            type="email"
            autoComplete="email"
            value={email}
            placeholder="you@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {error ? <p className="warn">{error}</p> : null}
        {notice ? <p className="field-note">{notice}</p> : null}
        <div className="controls">
          <button type="submit" className="button-link primary" disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
          </button>
          <Link className="button-link" href="/sign-in">
            Back to sign in
          </Link>
        </div>
      </div>
    </form>
  );
}

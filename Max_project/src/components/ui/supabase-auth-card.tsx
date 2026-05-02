"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { syncSupabaseSession } from "@/lib/auth/client-session";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export function SupabaseAuthCard({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (mode === "sign-up" && password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "sign-in") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError || !data.session) {
          throw new Error(signInError?.message || "Unable to sign in.");
        }

        await syncSupabaseSession(data.session);
        router.push("/app");
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.session) {
        await syncSupabaseSession(data.session);
        router.push("/app");
        router.refresh();
        return;
      }

      setNotice("Account created. If email confirmation is enabled in Supabase, confirm your email before signing in.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <p className="eyebrow">{mode === "sign-in" ? "Sign in" : "Create account"}</p>
      <h1>{mode === "sign-in" ? "Return to your workspace" : "Create your LifeMax OS account"}</h1>
      <p className="lede">
        Secure email and password auth is powered by Supabase. Your workspace, runs, and onboarding state stay tied to
        your account instead of a local demo profile.
      </p>
      <div className="wizard-fields">
        {mode === "sign-up" ? (
          <div className="field-group">
            <label htmlFor="full-name">Name</label>
            <input
              id="full-name"
              className="text-input"
              value={name}
              placeholder="Example: John Apple"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        ) : null}
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="text-input"
            type="email"
            autoComplete="email"
            value={email}
            placeholder="you@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="text-input"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            value={password}
            placeholder={mode === "sign-in" ? "Enter your password" : "Create a password"}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {mode === "sign-up" ? (
          <div className="field-group">
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              className="text-input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              placeholder="Re-enter your password"
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        ) : null}
        {error ? <p className="warn">{error}</p> : null}
        {notice ? <p className="field-note">{notice}</p> : null}
        <div className="controls">
          <button type="submit" className="button-link primary" disabled={submitting}>
            {submitting ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
          {mode === "sign-in" ? (
            <Link className="button-link" href="/forgot-password">
              Forgot password?
            </Link>
          ) : null}
          <Link className="button-link" href={mode === "sign-in" ? "/sign-up" : "/sign-in"}>
            {mode === "sign-in" ? "Create account" : "Already have an account?"}
          </Link>
          <Link className="button-link" href="/example-run">
            Example run
          </Link>
        </div>
      </div>
    </form>
  );
}

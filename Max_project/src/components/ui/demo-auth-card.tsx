"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createDemoSession, loadDemoState, saveDemoState } from "@/lib/demo/storage";

export function DemoAuthCard({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const deployedWithoutAuth = process.env.NODE_ENV === "production";
  const heading = deployedWithoutAuth
    ? mode === "sign-in"
      ? "Authentication is not configured on this deployment"
      : "Account creation is not configured on this deployment"
    : mode === "sign-in"
      ? "Return to your workspace"
      : "Create your LifeMax OS account";
  const description = deployedWithoutAuth
    ? "This deployment fell back to demo mode because Supabase email/password auth is not configured. Add the Supabase project URL and anon key in the deployment environment variables to restore the real sign-in form with password fields."
    : "This scaffold runs in demo auth mode locally. In production, connect Clerk or Supabase Auth and replace this with a real protected session flow.";
  const primaryLabel = mode === "sign-in" ? "Enter demo workspace" : "Create demo workspace";

  return (
    <div className="auth-card">
      <p className="eyebrow">{deployedWithoutAuth ? "Demo fallback" : mode === "sign-in" ? "Sign in" : "Create account"}</p>
      <h1>{heading}</h1>
      <p className="lede">{description}</p>
      <div className="wizard-fields">
        {mode === "sign-up" ? (
          <div className="field-group">
            <label>Name</label>
            <input
              className="text-input"
              value={name}
              placeholder="Example: LifeMax User"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        ) : null}
        <div className="field-group">
          <label>Email</label>
          <input
            className="text-input"
            value={email}
            placeholder="you@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {deployedWithoutAuth ? (
          <p className="warn">
            Password sign-in is unavailable here because this deployment is missing Supabase auth configuration.
          </p>
        ) : null}
        <div className="controls">
          <button
            type="button"
            className="button-link primary"
            onClick={() => {
              const state = loadDemoState();
              saveDemoState({
                ...state,
                session: createDemoSession(name, email)
              });
              router.push("/app");
            }}
          >
            {primaryLabel}
          </button>
          <Link className="button-link" href={mode === "sign-in" ? "/sign-up" : "/sign-in"}>
            {mode === "sign-in" ? "Create account" : "Already have an account?"}
          </Link>
          <Link className="button-link" href="/example-run">
            Example run
          </Link>
        </div>
      </div>
    </div>
  );
}

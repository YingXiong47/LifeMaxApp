"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createDemoSession, loadDemoState, saveDemoState } from "@/lib/demo/storage";

export function DemoAuthCard({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="auth-card">
      <p className="eyebrow">{mode === "sign-in" ? "Sign in" : "Create account"}</p>
      <h1>{mode === "sign-in" ? "Return to your workspace" : "Create your LifeMax OS account"}</h1>
      <p className="lede">
        This scaffold runs in demo auth mode locally. In production, connect Clerk or Supabase Auth and replace this with a real protected session flow.
      </p>
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
            Continue in demo mode
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

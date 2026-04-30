"use client";

import Link from "next/link";
import { useState } from "react";

export function ExampleRunCta() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="hero-actions">
        <button type="button" className="button-link primary" onClick={() => setIsOpen(true)}>
          Create account to personalize
        </button>
      </div>

      {isOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsOpen(false)}>
          <article
            className="workspace-panel example-run-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="example-run-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-head">
              <div>
                <p className="eyebrow">Continue from the example</p>
                <h2 id="example-run-modal-title">Turn this walkthrough into your own workspace.</h2>
              </div>
            </div>
            <p>
              The example run stays temporary. Create an account to build your own assessment-based workspace, or sign
              in if you already have one.
            </p>
            <div className="controls">
              <Link className="button-link primary" href="/sign-up" onClick={() => setIsOpen(false)}>
                Sign up
              </Link>
              <Link className="button-link" href="/sign-in" onClick={() => setIsOpen(false)}>
                Sign in
              </Link>
              <button type="button" className="button-link" onClick={() => setIsOpen(false)}>
                Keep exploring the example
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}

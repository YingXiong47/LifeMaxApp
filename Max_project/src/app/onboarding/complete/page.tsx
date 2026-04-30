import Link from "next/link";

export default function CompletePage() {
  return (
    <section className="onboarding-shell">
      <aside className="onboarding-rail">
        <div className="completion-topbar">
          <Link className="button-link" href="/app/settings">
            Settings
          </Link>
          <Link className="button-link" href="/">
            Back to Home
          </Link>
        </div>
        <p className="eyebrow">Complete</p>
        <h1>Your first workspace is ready.</h1>
        <p className="lede">
          In a production build this is where the user would land after a persisted server-side run, not just a local demo build.
        </p>
      </aside>
      <div className="step-card">
        <div className="stack">
          <article className="data-card">
            <strong>What’s next</strong>
            <p>Open the dashboard, review the plan, and start your first check-in cycle.</p>
          </article>
        </div>
        <div className="wizard-nav">
          <Link className="button-link" href="/">
            Exit assessment
          </Link>
          <Link className="button-link" href="/app">
            Open dashboard
          </Link>
          <Link className="button-link primary" href="/app/plan">
            View plan
          </Link>
        </div>
      </div>
    </section>
  );
}

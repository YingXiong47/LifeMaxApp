import { MarketingHeader } from "@/components/layout/marketing-header";
import { ExampleRunCta } from "@/components/marketing/example-run-cta";
import { ExampleWorkspace } from "@/components/marketing/example-workspace";

export default function ExampleRunPage() {
  return (
    <>
      <MarketingHeader />
      <main className="marketing-main example-workspace-shell">
        <section className="workspace-hero workspace-hero-soft">
          <div className="hero-copy-block">
            <p className="eyebrow">Example run</p>
            <h1>Walk through a full LifeMax workspace before you create an account.</h1>
            <p>
              This is a read-only example of the actual product surfaces: overview, plan, progress, reflection, and
              agent workspace. It does not require sign-in and does not write protected workspace data.
            </p>
            <p className="field-note">
              After you explore the example, create an account only if you want your own assessment, plan, reflections,
              and agent runs saved to a protected workspace.
            </p>
          </div>
          <div className="hero-metric-grid">
            <article className="hero-metric-card">
              <span className="muted">Mode</span>
              <strong>Read-only walkthrough</strong>
              <p>Explore the full product shape without committing personal data.</p>
            </article>
            <article className="hero-metric-card">
              <span className="muted">Storage</span>
              <strong>No protected save</strong>
              <p>The example stays temporary until you choose to create or sign into an account.</p>
            </article>
            <article className="hero-metric-card">
              <span className="muted">Goal</span>
              <strong>Show the real product flow</strong>
              <p>Overview, plan, progress, reflection, and agent logic all appear in one guided example.</p>
            </article>
          </div>
        </section>

        <ExampleWorkspace />

        <section className="workspace-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Continue from the example</p>
              <h2>Make this your own when you are ready.</h2>
            </div>
          </div>
          <p>
            The example is intentionally temporary. Create an account only when you want your own assessment to shape
            the plan, tracker, reflections, and agent recommendations.
          </p>
          <ExampleRunCta />
        </section>
      </main>
    </>
  );
}

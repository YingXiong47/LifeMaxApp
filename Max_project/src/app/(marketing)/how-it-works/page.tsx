import { MarketingHeader } from "@/components/layout/marketing-header";
import { orchestrationPhases } from "@/lib/orchestration/architecture";

export default function HowItWorksPage() {
  return (
    <>
      <MarketingHeader />
      <main className="page-shell">
        <section className="panel">
          <p className="eyebrow">How it works</p>
          <h1>From guided intake to tracked execution.</h1>
          <p className="lede">
            The core design principle is simple: understand the user properly, plan in the right sequence, and keep the plan alive after generation.
          </p>
        </section>
        <section className="stack">
          {orchestrationPhases.map((phase, index) => (
            <article key={phase.name} className="panel">
              <p className="eyebrow">Phase {index + 1}</p>
              <h2>{phase.name}</h2>
              <p>{phase.purpose}</p>
              <p className="muted">Owner: {phase.owner}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

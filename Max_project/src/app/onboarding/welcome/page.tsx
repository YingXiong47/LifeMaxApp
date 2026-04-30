import Image from "next/image";
import { StartAssessmentActions } from "@/components/onboarding/start-assessment-actions";

export default function OnboardingWelcomePage() {
  return (
    <section className="onboarding-shell">
      <aside className="onboarding-rail">
        <p className="eyebrow">Welcome</p>
        <h1>A calmer, more serious onboarding flow.</h1>
        <p className="lede">
          Each step now has its own screen so the experience feels focused, premium, and psychologically clean instead of being crammed into one awkward page.
        </p>
        <div
          className="panel"
          style={{
            position: "relative",
            minHeight: 320,
            overflow: "hidden",
            padding: 0,
            borderRadius: 18
          }}
        >
          <Image
            alt="Illustrated path showing progress across the onboarding journey"
            fill
            priority
            src="/illustrations/onboarding-path.svg"
            style={{ objectFit: "cover" }}
          />
        </div>
      </aside>
      <div className="step-card">
        <div className="stack">
          <article className="data-card">
            <strong>What you’ll do</strong>
            <p>Answer four focused steps, review the profile summary, and generate your first plan.</p>
          </article>
          <article className="data-card">
            <strong>What the system will do</strong>
            <p>Validate your inputs, synthesize a profile, run an evaluation gate, sequence the work, and initialize a tracker.</p>
          </article>
        </div>
        <StartAssessmentActions />
      </div>
    </section>
  );
}

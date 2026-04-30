import Image from "next/image";
import Link from "next/link";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { trustPillars } from "@/lib/content/site";

export default function HomePage() {
  return (
    <>
      <MarketingHeader />
      <main className="marketing-main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Personal operating system</p>
            <h1>Build a serious plan for your life, then keep it alive.</h1>
            <p className="lede">
              LifeMax OS is a human-centered planning platform that uses agent workflows to turn your baseline, constraints, and goals into a structured system you can actually follow.
            </p>
            <div className="hero-actions">
              <Link className="button-link primary" href="/sign-up">
                Sign up
              </Link>
              <Link className="button-link" href="/sign-in">
                Sign in
              </Link>
              <Link className="button-link" href="/example-run">
                Example run
              </Link>
            </div>
            <p className="field-note">Example run stays outside your account and does not save to protected workspace storage.</p>
            <div className="hero-strip" aria-label="LifeMax outcomes">
              <article className="hero-strip-card">
                <span className="hero-kicker">Sharper direction</span>
                <strong>One serious system instead of scattered goals.</strong>
              </article>
              <article className="hero-strip-card">
                <span className="hero-kicker">Visible momentum</span>
                <strong>Weekly follow-through with real structure and review.</strong>
              </article>
            </div>
          </div>

          <div className="hero-visuals" aria-label="Motivational self-improvement visuals">
            <article className="vision-card focus">
              <Image
                alt="Illustrated figure striding toward progress"
                className="vision-image"
                fill
                priority
                src="/illustrations/hero-stride.svg"
              />
              <div className="vision-card-copy">
                <p className="eyebrow">What users actually need</p>
                <h2>Direction, pressure, and follow-through in the same system.</h2>
              </div>
            </article>
            <div className="vision-grid">
              <article className="vision-tile dawn">
                <span className="hero-kicker">1. Understand the baseline</span>
                <strong>Structured intake</strong>
              </article>
              <article className="vision-tile ascent">
                <span className="hero-kicker">2. Build a credible plan</span>
                <strong>Agent-guided sequencing</strong>
              </article>
              <article className="vision-tile discipline">
                <span className="hero-kicker">3. Stay with the work</span>
                <strong>Progress tracking</strong>
              </article>
            </div>
          </div>
        </section>
        <section className="panel-grid-two">
          {trustPillars.map((pillar) => (
            <article key={pillar.title} className="panel">
              <p className="eyebrow">{pillar.title}</p>
              <p>{pillar.description}</p>
            </article>
          ))}
          <article className="panel">
            <p className="eyebrow">Entry points</p>
            <p>
              Sign up creates a protected workspace, sign in returns to an existing one, and the example run shows the product without storing a permanent profile.
            </p>
          </article>
        </section>
      </main>
    </>
  );
}

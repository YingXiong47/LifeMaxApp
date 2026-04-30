import { MarketingHeader } from "@/components/layout/marketing-header";
import { stableListKey } from "@/lib/ui/stable-list-key";

const beliefs = [
  "Most people do not need more hype. They need clearer diagnosis, better structure, and honest follow-through.",
  "A good plan should reduce confusion, not create more of it.",
  "Progress should be reviewable over time instead of disappearing after one good week.",
  "Personal growth tools should feel supportive, direct, and useful in real life."
];

const commitments = [
  {
    title: "Clarity over motivational fluff",
    description:
      "LifeMax OS is built to turn vague goals into concrete next steps, not recycled self-help language."
  },
  {
    title: "Structure that survives real life",
    description:
      "The product is designed around routines, bottlenecks, friction, and review loops, because that is where plans usually break."
  },
  {
    title: "Progress you can actually inspect",
    description:
      "Instead of a one-time output, the goal is a workspace that helps people see what changed, what slipped, and what to do next."
  }
];

const missionPoints = [
  "Help people understand why they are stuck, not just what they should do.",
  "Turn ambition into a weekly operating system that feels practical and sustainable.",
  "Give users a planning tool that behaves more like a serious coach and less like a generic generator."
];

export default function AboutPage() {
  return (
    <>
      <MarketingHeader />
      <main className="page-shell">
        <section className="panel">
          <p className="eyebrow">About LifeMax OS</p>
          <h1>Built to help people turn intention into follow-through.</h1>
          <p className="lede">
            LifeMax OS started from a simple frustration: too many self-improvement tools sound smart at first, then
            leave people with generic advice, vague encouragement, and no real system to run their week. This project
            was started to build something more useful. The goal is to help people understand their real bottlenecks,
            create a plan that fits their life, and keep that plan alive with reflection, progress review, and direct
            accountability.
          </p>
        </section>

        <section className="panel-grid-two">
          <article className="panel">
            <p className="eyebrow">Why I started this</p>
            <h2>Because people do not fail only from lack of ambition.</h2>
            <p>
              A lot of people already know they want better health, more discipline, stronger finances, better work,
              or more confidence. The harder problem is that they often do not have a clear diagnosis of what is
              actually holding them back. Sometimes it is attention. Sometimes it is sleep. Sometimes it is poor
              structure, emotional avoidance, or trying to improve five life areas at once with no sequence.
            </p>
            <p>
              LifeMax OS was started to close that gap. The idea was to build a product that does more than generate a
              burst of advice. It should help people make sense of their baseline, create a workable system, and
              revisit that system as life changes.
            </p>
          </article>

          <article className="panel">
            <p className="eyebrow">Our mission</p>
            <h2>Build a personal planning platform that actually helps people move.</h2>
            <ul>
              {missionPoints.map((item, index) => (
                <li key={stableListKey("about-mission", item, index)}>{item}</li>
              ))}
            </ul>
            <p className="muted">
              The long-term motivation behind LifeMax OS is to give people a system that feels serious, human, and
              useful when real life gets messy.
            </p>
          </article>
        </section>

        <section className="panel">
          <p className="eyebrow">What we believe</p>
          <h2>People deserve more than one-shot inspiration.</h2>
          <div className="stack">
            {beliefs.map((item, index) => (
              <p key={stableListKey("about-belief", item, index)}>{item}</p>
            ))}
          </div>
        </section>

        <section className="panel-grid-two">
          {commitments.map((item) => (
            <article key={item.title} className="panel">
              <p className="eyebrow">What this means in practice</p>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          ))}
        </section>

        <section className="panel">
          <p className="eyebrow">What LifeMax OS is trying to become</p>
          <h2>A product that helps people think clearly, plan honestly, and review progress over time.</h2>
          <p>
            The vision is not to replace judgment or pretend software can fix someone&apos;s life in one sitting. The
            vision is to create a serious platform that helps users slow down, understand their constraints, choose the
            right priorities, and keep a better system running week after week.
          </p>
          <p>
            If LifeMax OS does its job well, users should leave with more clarity, better structure, and a stronger
            sense of what actually deserves their effort right now.
          </p>
        </section>
      </main>
    </>
  );
}

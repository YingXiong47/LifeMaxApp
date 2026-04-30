"use client";

import { ReactNode, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { stableListKey } from "@/lib/ui/stable-list-key";

type ExampleTab = "overview" | "plan" | "progress" | "reflection" | "agents";

type ExamplePanelProps = {
  title: string;
  eyebrow?: string;
  aside?: ReactNode;
  children: ReactNode;
};

const exampleRun = {
  diagnosis:
    "You say you want career momentum, better health, and less financial stress, but your real bottleneck is that the night collapses into scrolling and the next day starts from recovery debt.",
  bottleneck: "Uncontrolled attention after 9:30 PM is stealing the time and recovery you think you do not have.",
  falseAssumption:
    "You may think you need more motivation. The real problem is weak evening control, no fixed recovery standard, and work that only happens in leftover energy.",
  leverage: "Protect a 90-minute work block before entertainment and move the phone out of the room before bed.",
  thisWeek:
    "Launch week: close one ugly but real proof-of-work win before asking the system for confidence.",
  reliability: 0.78,
  momentum: 0.64,
  horizon: "90 days",
  operatingSystem: "Career-first week",
  actions: [
    {
      id: "career-proof",
      title: "Ship one visible proof-of-work artifact tied to your next role target.",
      domain: "Career",
      metric: "1 artifact published or sent",
      status: "in-progress"
    },
    {
      id: "sleep-boundary",
      title: "Move the phone out of the room before bed for the next 5 nights.",
      domain: "Health",
      metric: "5 phone-free nights",
      status: "ready"
    },
    {
      id: "money-snapshot",
      title: "Separate fixed costs, variable costs, debt, and savings in one weekly tracker.",
      domain: "Finance",
      metric: "1 complete money snapshot",
      status: "ready"
    },
    {
      id: "wardrobe-reset",
      title: "Remove one weak-link outfit item and lock three reliable workday combinations.",
      domain: "Looks",
      metric: "3 combinations documented",
      status: "queued"
    }
  ],
  priorities: [
    {
      domain: "career",
      score: 0.92,
      why: "Career work is the highest-pressure domain, but it currently gets the worst energy."
    },
    {
      domain: "health",
      score: 0.84,
      why: "Recovery is underbuilt, which means everything else keeps depending on willpower."
    },
    {
      domain: "finance",
      score: 0.72,
      why: "Money stress stays vague until one tracker exists and silent leaks are visible."
    }
  ],
  domains: [
    { domain: "looks", completed: 2, total: 5, score: 0.4, summary: "Standards exist, but mornings still start rushed." },
    { domain: "health", completed: 3, total: 5, score: 0.6, summary: "Sleep and food structure are fragile, but recoverable." },
    { domain: "career", completed: 3, total: 5, score: 0.6, summary: "Useful intent exists, but output needs a named weekly lane." },
    { domain: "finance", completed: 2, total: 5, score: 0.4, summary: "Spending is partially visible, but the full picture is missing." },
    { domain: "routine", completed: 3, total: 5, score: 0.6, summary: "The week has enough structure to work if nights stop collapsing." }
  ],
  weeklyPlan: [
    {
      day: "Day 1",
      title: "Define the next career checkpoint and the three capabilities it requires.",
      detail: "This removes vague ambition and turns the week into a visible target instead of abstract self-improvement.",
      metric: "1 checkpoint named with 3 supporting capabilities"
    },
    {
      day: "Day 2",
      title: "Ship one ugly but real proof-of-work artifact tied directly to that checkpoint.",
      detail: "Perfection is not the goal. Proof is the goal. A rough shipped artifact beats another week of planning.",
      metric: "1 artifact published or sent"
    },
    {
      day: "Day 3",
      title: "Build the first honest money snapshot: fixed costs, variable costs, debt, and savings.",
      detail: "The point is visibility, not sophistication. You do not optimize numbers you refuse to look at.",
      metric: "1 complete money snapshot"
    },
    {
      day: "Day 4",
      title: "Protect one protein-forward lunch and one hydration check before noon.",
      detail: "This is a recovery-support move, not a diet fantasy. Reduce friction before chasing bigger health changes.",
      metric: "1 lunch + 1 hydration check completed"
    },
    {
      day: "Day 5",
      title: "Reset the workday appearance standard so mornings stop wasting decisions.",
      detail: "Pick three reliable combinations, remove one weak-link item, and cut the 'I’ll figure it out later' drain.",
      metric: "3 outfits locked and 1 weak item removed"
    }
  ],
  phases: [
    {
      title: "Week 1: Stabilize the floor",
      timeline: "Days 1-7",
      summary: "Stop the night from destroying the next day, make career output visible, and create money visibility.",
      watchout: "If the plan tries to change sleep, body composition, grooming, and career all at once, it will collapse by Thursday."
    },
    {
      title: "Weeks 2-4: Build repeatability",
      timeline: "Weeks 2-4",
      summary: "Repeat the deep work block, keep the phone boundary, and treat proof plus review as the weekly operating rhythm.",
      watchout: "Do not mistake one good week for a stable identity. Repeatable weeks matter more than one emotional burst."
    },
    {
      title: "Month 2 onward: Raise standards carefully",
      timeline: "Month 2+",
      summary: "Only raise intensity after the first system can survive stress, workdays, and low-motivation evenings.",
      watchout: "If recovery falls again, intensity must shrink before new goals are added."
    }
  ],
  playbooks: [
    {
      domain: "Career",
      target: "Make future-building work happen before the day gets hijacked by lower-value tasks.",
      risk: "Career work currently dies when it is saved for leftover energy.",
      nextMove: "Protect one 90-minute work block and define exactly what must ship in it."
    },
    {
      domain: "Health",
      target: "Rebuild usable energy by fixing sleep timing and meal chaos before adding more ambition.",
      risk: "Sleep debt will quietly sabotage training, mood, and attention if treated like a side issue.",
      nextMove: "Hold one wake time within 30 minutes for the next 5 days and remove the phone from bed."
    },
    {
      domain: "Finance",
      target: "Create enough visibility that spending stops feeling mysterious.",
      risk: "Financial stress becomes permanent when spending is emotional but never audited.",
      nextMove: "Build one tracker and run one subscription audit before trying more advanced budgeting."
    }
  ],
  reflection: {
    today: "Open",
    week: "Open",
    lastCompleted: "April 27, 2026",
    categories: ["Repair sleep", "Execute career work", "Protect health"],
    completed: "Moved the phone out of bed twice, shipped one application, and hit two protein-forward lunches.",
    next: "Keep the phone out of the room, name tomorrow’s career block tonight, and stop pretending late-night scrolling is harmless.",
    history: [
      {
        type: "Daily check-in",
        date: "April 27, 2026",
        summary: "Protected the first work block but lost the night to scrolling.",
        categories: ["Protect attention", "Execute career work"]
      },
      {
        type: "Weekly review",
        date: "April 25, 2026",
        summary: "Career progress improved, but sleep debt kept bleeding into the next morning.",
        categories: ["Repair sleep", "Execute career work", "Protect health"]
      }
    ]
  },
  progress: {
    adherence: 0.71,
    proofCount: 6,
    standardsHeld: 4,
    blockers: [
      "Phone stays in bed when the day feels emotionally heavy.",
      "Career work gets postponed when the task is vague or perfectionist.",
      "Money review disappears when the week feels financially embarrassing."
    ],
    nextAdjustments: [
      "Name tomorrow’s career block before dinner, not in the morning.",
      "Charge the phone outside the bedroom for the next 5 nights.",
      "Use one ugly spreadsheet before looking for a perfect budgeting app."
    ],
    updates: [
      { date: "April 28", domain: "career", note: "Proof-of-work draft shipped to one mentor for feedback.", kind: "proof" },
      { date: "April 28", domain: "health", note: "Wake time held within 30 minutes for three consecutive days.", kind: "standard" },
      { date: "April 27", domain: "finance", note: "Monthly subscriptions reviewed and one recurring leak flagged.", kind: "review" }
    ]
  },
  agents: {
    summary:
      "The agents agree that the user's problem is not lack of goals. It is a weak weekly operating system that lets nights, attention, and vague work destroy the next day.",
    roster: [
      { name: "Diagnostic Agent", status: "complete", confidence: 0.88, output: "Identified the real bottleneck behind the stated goals." },
      { name: "Strategy Agent", status: "complete", confidence: 0.82, output: "Sequenced the domains and narrowed the focus for this phase." },
      { name: "Execution Agent", status: "complete", confidence: 0.84, output: "Converted the plan into a seven-day system with specific actions." },
      { name: "Accountability Agent", status: "complete", confidence: 0.76, output: "Defined failure triggers, proof, and adjustment rules." },
      { name: "Reality Check Agent", status: "complete", confidence: 0.8, output: "Challenged the user's vague assumptions and unrealistic pacing." }
    ],
    response: {
      title: "Recommendation Compiler response",
      keyIssue: "The user loses control at night, then expects the next morning to compensate for it.",
      constraints: [
        "Sleep is unstable.",
        "Career work is vague when it needs to ship.",
        "Money visibility is weak."
      ],
      plan:
        "Protect one non-negotiable work block before entertainment, create one money snapshot, and fix the bedtime environment before chasing more intensity.",
      actionSteps: [
        "Define tomorrow's career output tonight.",
        "Move the phone out of the room before bed.",
        "Review one money tracker before the week ends."
      ],
      risks: [
        "The user may confuse motivation with structure.",
        "Too many simultaneous upgrades will collapse the system."
      ],
      nextMove: "Ship one visible win this week, then review what actually held."
    }
  }
};

function ExamplePanel({ title, eyebrow, aside, children }: ExamplePanelProps) {
  return (
    <article className="workspace-panel">
      <div className="panel-head">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
      {children}
    </article>
  );
}

export function ExampleWorkspace() {
  const [activeTab, setActiveTab] = useState<ExampleTab>("overview");

  return (
    <div className="workspace-stack">
      <section className="workspace-hero workspace-hero-accent">
        <div className="hero-copy-block">
          <p className="eyebrow">Read-only example workspace</p>
          <h2>{exampleRun.bottleneck}</h2>
          <p>{exampleRun.diagnosis}</p>
          <p className="field-note">
            This example mirrors the real product flow. Browse the tabs below to inspect the overview, plan, progress,
            reflection loop, and agent workspace without signing in.
          </p>
          <div className="workspace-pills">
            <span className="pill">Temporary example</span>
            <span className="pill">No protected data saved</span>
            <span className="pill">Based on a realistic sample user</span>
          </div>
        </div>
        <div className="hero-metric-grid">
          <article className="hero-metric-card">
            <span className="muted">Highest leverage change</span>
            <strong>{exampleRun.leverage}</strong>
          </article>
          <article className="hero-metric-card">
            <span className="muted">False assumption</span>
            <strong>{exampleRun.falseAssumption}</strong>
          </article>
          <article className="hero-metric-card">
            <span className="muted">This week</span>
            <strong>{exampleRun.thisWeek}</strong>
          </article>
        </div>
      </section>

      <div className="quick-chip-grid workspace-subnav" role="tablist" aria-label="Example workspace tabs">
        {[
          ["overview", "Overview"],
          ["plan", "Plan"],
          ["progress", "Progress"],
          ["reflection", "Reflection"],
          ["agents", "Agent workspace"]
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`choice-chip ${activeTab === value ? "active" : ""}`}
            onClick={() => setActiveTab(value as ExampleTab)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="workspace-columns">
          <div className="workspace-main-column">
            <ExamplePanel title="Next best actions" eyebrow="Action lane">
              <div className="action-list">
                {exampleRun.actions.map((action) => (
                  <div key={action.id} className="action-row">
                    <div>
                      <strong>{action.title}</strong>
                      <p className="muted">
                        {action.domain} • {action.metric}
                      </p>
                    </div>
                    <span className={`pill ${action.status === "complete" ? "good" : action.status === "in-progress" ? "warn" : ""}`}>
                      {action.status}
                    </span>
                  </div>
                ))}
              </div>
            </ExamplePanel>

            <ExamplePanel
              title="Priority stack"
              eyebrow="Strategy"
              aside={<span className="pill good">{exampleRun.operatingSystem}</span>}
            >
              <div className="priority-grid">
                {exampleRun.priorities.map((item) => (
                  <article key={item.domain} className="mini-stat-card">
                    <span className="muted">{item.domain}</span>
                    <strong>{Math.round(item.score * 100)}%</strong>
                    <p>{item.why}</p>
                  </article>
                ))}
              </div>
            </ExamplePanel>

            <ExamplePanel title="Domain momentum" eyebrow="Tracker">
              <div className="stack-list">
                {exampleRun.domains.map((domain) => (
                  <div key={domain.domain} className="progress-row">
                    <div className="line-between">
                      <div>
                        <strong>{domain.domain}</strong>
                        <p className="muted">{domain.summary}</p>
                      </div>
                      <span className="muted">
                        {domain.completed}/{domain.total}
                      </span>
                    </div>
                    <Progress value={domain.score * 100} />
                  </div>
                ))}
              </div>
            </ExamplePanel>
          </div>

          <div className="workspace-side-column">
            <ExamplePanel title="Reflection snapshot" eyebrow="Check-in control" aside={<span className="pill">Needs review</span>}>
              <div className="reflection-status-grid">
                <article className="mini-stat-card">
                  <span className="muted">Today</span>
                  <strong>Daily check-in {exampleRun.reflection.today}</strong>
                  <p>Capture what held, what slipped, and what needs attention tomorrow.</p>
                </article>
                <article className="mini-stat-card">
                  <span className="muted">This week</span>
                  <strong>Weekly review {exampleRun.reflection.week}</strong>
                  <p>Close the week with blockers, proof, and next actions.</p>
                </article>
                <article className="mini-stat-card">
                  <span className="muted">Last completed</span>
                  <strong>{exampleRun.reflection.lastCompleted}</strong>
                  <p>{exampleRun.reflection.categories.join(", ")}</p>
                </article>
              </div>
              <div>
                <strong>Last reflection summary</strong>
                <p className="muted">Completed: {exampleRun.reflection.completed}</p>
                <p className="muted">Next: {exampleRun.reflection.next}</p>
              </div>
            </ExamplePanel>

            <ExamplePanel title="Agent orchestration" eyebrow="Live run">
              <div className="stack-list">
                {exampleRun.agents.roster.map((agent) => (
                  <div key={agent.name} className="line-between">
                    <div>
                      <strong>{agent.name}</strong>
                      <p className="muted">{agent.output}</p>
                    </div>
                    <span className="pill good">{agent.status}</span>
                  </div>
                ))}
              </div>
            </ExamplePanel>
          </div>
        </div>
      ) : null}

      {activeTab === "plan" ? (
        <div className="workspace-columns">
          <div className="workspace-main-column">
            <ExamplePanel title="Seven-day execution" eyebrow="This week">
              <div className="plan-day-grid">
                {exampleRun.weeklyPlan.map((item, index) => (
                  <article key={stableListKey("example-week", item.title, index)} className="history-card">
                    <div className="line-between">
                      <strong>{item.day}</strong>
                      <span className="pill">Execution</span>
                    </div>
                    <p>{item.title}</p>
                    <p className="muted">{item.detail}</p>
                    <p className="muted">{item.metric}</p>
                  </article>
                ))}
              </div>
            </ExamplePanel>

            <ExamplePanel title="Domain playbooks" eyebrow="Why the plan changes by domain">
              <div className="history-stack">
                {exampleRun.playbooks.map((playbook, index) => (
                  <article key={stableListKey("example-playbook", playbook.domain, index)} className="history-card">
                    <div className="line-between">
                      <strong>{playbook.domain}</strong>
                      <span className="pill">Focused now</span>
                    </div>
                    <p>{playbook.target}</p>
                    <p className="muted">Risk: {playbook.risk}</p>
                    <p className="muted">Next move: {playbook.nextMove}</p>
                  </article>
                ))}
              </div>
            </ExamplePanel>
          </div>

          <div className="workspace-side-column">
            <ExamplePanel title="Roadmap phases" eyebrow="Timeline">
              <div className="history-stack">
                {exampleRun.phases.map((phase, index) => (
                  <details key={stableListKey("example-phase", phase.title, index)} className="history-card roadmap-phase-card compact-plan">
                    <summary>
                      <div>
                        <span className="muted">{phase.timeline}</span>
                        <strong>{phase.title}</strong>
                      </div>
                      <span className="pill">View details</span>
                    </summary>
                    <div className="compact-plan-body stack-list">
                      <p>{phase.summary}</p>
                      <p className="muted">Watchout: {phase.watchout}</p>
                    </div>
                  </details>
                ))}
              </div>
            </ExamplePanel>

            <ExamplePanel title="Plan logic" eyebrow="What this example is showing">
              <div className="stack-list">
                <p>
                  This sample plan does not try to “fix everything.” It narrows the first week to the smallest moves
                  that actually stabilize career output, sleep, and money visibility.
                </p>
                <p className="muted">
                  That is what the full assessment is meant to do with your real data: find the actual bottleneck and
                  sequence the week around it.
                </p>
              </div>
            </ExamplePanel>
          </div>
        </div>
      ) : null}

      {activeTab === "progress" ? (
        <div className="workspace-columns">
          <div className="workspace-main-column">
            <ExamplePanel title="Weekly proof log" eyebrow="What changed">
              <div className="history-stack">
                {exampleRun.progress.updates.map((item, index) => (
                  <article key={stableListKey("example-update", `${item.date}-${item.domain}`, index)} className="history-card">
                    <div className="line-between">
                      <strong>{item.date}</strong>
                      <span className="pill">{item.domain}</span>
                    </div>
                    <p>{item.note}</p>
                    <p className="muted">Logged as {item.kind}</p>
                  </article>
                ))}
              </div>
            </ExamplePanel>

            <ExamplePanel title="Domain momentum board" eyebrow="How progress is scored">
              <div className="stack-list">
                {exampleRun.domains.map((domain) => (
                  <article key={domain.domain} className="domain-progress-card">
                    <div className="line-between">
                      <strong>{domain.domain}</strong>
                      <span className="pill">
                        {domain.completed}/{domain.total}
                      </span>
                    </div>
                    <Progress value={domain.score * 100} />
                    <p className="muted">{domain.summary}</p>
                  </article>
                ))}
              </div>
            </ExamplePanel>
          </div>

          <div className="workspace-side-column">
            <ExamplePanel title="Tracker health" eyebrow="Signals">
              <div className="stack-list">
                <article className="mini-stat-card">
                  <span className="muted">Adherence</span>
                  <strong>{Math.round(exampleRun.progress.adherence * 100)}%</strong>
                  <p>The system is partly holding, but the night boundary is still unstable.</p>
                </article>
                <article className="mini-stat-card">
                  <span className="muted">Proof captured</span>
                  <strong>{exampleRun.progress.proofCount}</strong>
                  <p>Visible evidence matters more than good intentions.</p>
                </article>
                <article className="mini-stat-card">
                  <span className="muted">Standards held</span>
                  <strong>{exampleRun.progress.standardsHeld}</strong>
                  <p>Standards are where the week either becomes real or stays theoretical.</p>
                </article>
              </div>
            </ExamplePanel>

            <ExamplePanel title="Adjustment rules" eyebrow="What changes next">
              <div className="stack-list">
                <div>
                  <strong>Blockers</strong>
                  <ul className="clean-list">
                    {exampleRun.progress.blockers.map((item, index) => (
                      <li key={stableListKey("example-blocker", item, index)}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Next adjustments</strong>
                  <ul className="clean-list">
                    {exampleRun.progress.nextAdjustments.map((item, index) => (
                      <li key={stableListKey("example-adjustment", item, index)}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </ExamplePanel>
          </div>
        </div>
      ) : null}

      {activeTab === "reflection" ? (
        <div className="workspace-columns">
          <div className="workspace-main-column">
            <ExamplePanel title="Reflection loop" eyebrow="Daily and weekly">
              <div className="reflection-status-grid">
                <article className="mini-stat-card">
                  <span className="muted">Daily check-in</span>
                  <strong>Today is still open</strong>
                  <p>Answer what you completed, what slipped, and what needs attention tomorrow.</p>
                </article>
                <article className="mini-stat-card">
                  <span className="muted">Weekly review</span>
                  <strong>The week still needs closure</strong>
                  <p>Summarize what improved, what blocked you, and what needs to change next week.</p>
                </article>
              </div>
              <div className="history-stack">
                {exampleRun.reflection.history.map((entry, index) => (
                  <article key={stableListKey("example-reflection-history", `${entry.type}-${entry.date}`, index)} className="history-card">
                    <div className="line-between">
                      <strong>{entry.type}</strong>
                      <span className="pill">{entry.date}</span>
                    </div>
                    <p>{entry.summary}</p>
                    <div className="workspace-pills">
                      {entry.categories.map((category, itemIndex) => (
                        <span key={stableListKey("example-reflection-category", category, itemIndex)} className="pill">
                          {category}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </ExamplePanel>
          </div>

          <div className="workspace-side-column">
            <ExamplePanel title="What reflection changes" eyebrow="Why it matters">
              <div className="stack-list">
                <p>
                  In the real workspace, reflection is not a journal box. It updates domain progress, surfaces
                  blockers, and changes what the agents recommend next.
                </p>
                <p className="muted">
                  If a prompt does not apply, the real form lets the user write NA rather than forcing a fake answer.
                </p>
                <div>
                  <strong>Example next actions generated from reflection</strong>
                  <ul className="clean-list">
                    <li>Move the phone out of the room tonight.</li>
                    <li>Name tomorrow&apos;s career block before dinner.</li>
                    <li>Audit one recurring expense before the week ends.</li>
                  </ul>
                </div>
              </div>
            </ExamplePanel>
          </div>
        </div>
      ) : null}

      {activeTab === "agents" ? (
        <div className="workspace-columns">
          <div className="workspace-main-column">
            <ExamplePanel title="Agent roster" eyebrow="Who does what">
              <div className="agent-grid">
                {exampleRun.agents.roster.map((agent, index) => (
                  <article key={stableListKey("example-agent", agent.name, index)} className="agent-card">
                    <div className="line-between">
                      <strong>{agent.name}</strong>
                      <span className="pill good">{agent.status}</span>
                    </div>
                    <p>{agent.output}</p>
                    <p className="muted">Reliability score {Math.round(agent.confidence * 100)}%</p>
                  </article>
                ))}
              </div>
            </ExamplePanel>

            <ExamplePanel title="Structured agent output" eyebrow="Recommendation Compiler">
              <div className="agent-chat-thread">
                <article className="agent-chat-bubble user">
                  <strong>User question</strong>
                  <p>I keep saying I want momentum, but nothing sticks. What should I actually do first?</p>
                </article>
                <article className="agent-chat-bubble">
                  <strong>{exampleRun.agents.response.title}</strong>
                  <p>
                    <strong>Key issue:</strong> {exampleRun.agents.response.keyIssue}
                  </p>
                  <p>
                    <strong>Constraints:</strong> {exampleRun.agents.response.constraints.join(" ")}
                  </p>
                  <p>
                    <strong>Plan:</strong> {exampleRun.agents.response.plan}
                  </p>
                  <div>
                    <strong>Action steps</strong>
                    <ul className="clean-list">
                      {exampleRun.agents.response.actionSteps.map((item, index) => (
                        <li key={stableListKey("example-agent-step", item, index)}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <p>
                    <strong>Risks:</strong> {exampleRun.agents.response.risks.join(" ")}
                  </p>
                  <p>
                    <strong>Next move:</strong> {exampleRun.agents.response.nextMove}
                  </p>
                </article>
              </div>
            </ExamplePanel>
          </div>

          <div className="workspace-side-column">
            <ExamplePanel title="Pipeline snapshot" eyebrow="How the run moves">
              <div className="pipeline-list compact-pipeline-list">
                {exampleRun.agents.roster.map((agent, index) => (
                  <div key={stableListKey("example-pipeline", agent.name, index)} className="pipeline-item">
                    <div>
                      <strong>{agent.name}</strong>
                      <p className="muted">{agent.output}</p>
                    </div>
                    <span className="pill good">{agent.status}</span>
                  </div>
                ))}
              </div>
              <div className="history-card">
                <strong>Last run summary</strong>
                <p>{exampleRun.agents.summary}</p>
                <p className="muted">This is what the real protected workspace stores after a signed-in run.</p>
              </div>
            </ExamplePanel>
          </div>
        </div>
      ) : null}
    </div>
  );
}

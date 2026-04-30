export const orchestrationPhases = [
  {
    name: "Intake validation",
    owner: "intake-agent",
    purpose: "Verify consent, completeness, and baseline sufficiency"
  },
  {
    name: "Profile synthesis",
    owner: "profile-agent",
    purpose: "Build structured profile and user intelligence"
  },
  {
    name: "Risk and evaluation gate",
    owner: "evaluation-agent",
    purpose: "Downgrade unsafe or low-confidence planning before deeper agents run"
  },
  {
    name: "Strategy planning",
    owner: "strategy-agent",
    purpose: "Sequence domains and choose the correct intensity"
  },
  {
    name: "Domain planning",
    owner: "domain-agents",
    purpose: "Generate measurable actions by domain"
  },
  {
    name: "Compilation and tracking",
    owner: "compiler + tracker",
    purpose: "Package outputs, initialize tasks, and expose review loops"
  }
];

export const requiredTooling = [
  "Next.js App Router",
  "Clerk or Supabase Auth",
  "Supabase Postgres",
  "OpenAI Agents SDK",
  "Inngest or Temporal",
  "Structured logging + analytics",
  "Object storage for uploads",
  "Vector retrieval for non-canonical memory"
];

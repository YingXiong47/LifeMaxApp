import type { Route } from "next";

export const primaryNavigation = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
] satisfies ReadonlyArray<{ href: Route; label: string }>;

export const appNavigation = [
  { href: "/app", label: "Overview" },
  { href: "/app/profile", label: "Profile" },
  { href: "/app/plan", label: "Plan" },
  { href: "/app/reflection", label: "Reflection" },
  { href: "/app/progress", label: "Progress" },
  { href: "/app/agent-runs", label: "Agent runs" },
  { href: "/app/history", label: "History" },
  { href: "/app/settings", label: "Settings" }
] satisfies ReadonlyArray<{ href: Route; label: string }>;

export const trustPillars = [
  {
    title: "Structured by design",
    description: "The system turns vague goals into explicit plans, not inspirational blur."
  },
  {
    title: "Private by default",
    description: "Authenticated workspaces can stay tied to secure server-side accounts and persisted plans."
  },
  {
    title: "Agent-visible",
    description: "You can see what each agent did, why it ran, and what changed downstream."
  }
];

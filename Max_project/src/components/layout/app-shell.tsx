"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren } from "react";
import { UserButton } from "@clerk/nextjs";
import { useWorkspaceState } from "@/components/providers/workspace-provider";
import { appNavigation } from "@/lib/content/site";
import { SupabaseAccountControls } from "@/components/ui/supabase-account-controls";
import { resetDemoState } from "@/lib/demo/storage";
import { getPlanningModeDetails, planningModePill } from "@/lib/planning-mode";
import type { AuthSummary } from "@/lib/auth/session";

type WorkspaceAction = {
  href: string;
  label: string;
  prominent?: boolean;
};

const pageDescriptions: Record<string, string> = {
  "/app": "Run the week from one control room with clear priorities and visible momentum.",
  "/app/profile": "Review the synthesized profile, friction points, and coaching preferences.",
  "/app/plan": "See the roadmap, domain plans, and measurable next actions in one place.",
  "/app/reflection": "Run daily check-ins and weekly reviews as a focused workflow instead of a dashboard blob.",
  "/app/progress": "Log weekly proof, hold standards, and keep each domain honest.",
  "/app/agent-runs": "Inspect orchestration, ask agents direct questions, and understand run reliability.",
  "/app/history": "Review previous runs and compare reliability over time.",
  "/app/settings": "Tune appearance, demo behavior, and production-readiness settings."
};

const appearanceLabels: Record<"sunrise" | "ember" | "midnight", string> = {
  sunrise: "Light mode",
  ember: "Warm mode",
  midnight: "Default blue theme"
};

function buildWorkspaceActions(pathname: string, hasPlan: boolean): WorkspaceAction[] {
  if (!hasPlan) {
    return [{ href: "/onboarding/welcome", label: "Start assessment", prominent: true }];
  }

  if (pathname === "/app" || pathname === "/app/plan") {
    return [
      { href: "/app/reflection?mode=weekly", label: "Log weekly progress", prominent: true },
      { href: "/app/agent-runs", label: "Review agent feedback" }
    ];
  }

  if (pathname === "/app/reflection") {
    return [
      { href: "/app/plan", label: "Review current plan" },
      { href: "/app/progress", label: "Open progress board", prominent: true }
    ];
  }

  if (pathname === "/app/progress") {
    return [
      { href: "/app/reflection?mode=weekly", label: "Log weekly progress", prominent: true },
      { href: "/app/plan", label: "Review current plan" }
    ];
  }

  if (pathname === "/app/agent-runs") {
    return [
      { href: "/app/plan", label: "Review current plan" },
      { href: "/app/progress", label: "Check progress board", prominent: true }
    ];
  }

  if (pathname === "/app/history") {
    return [
      { href: "/app/plan", label: "Review current plan" },
      { href: "/app/reflection?tab=history", label: "Open reflection history", prominent: true }
    ];
  }

  if (pathname === "/app/settings") {
    return [
      { href: "/app", label: "Return to overview", prominent: true },
      { href: "/app/reflection?mode=weekly", label: "Log weekly progress" }
    ];
  }

  if (pathname === "/app/profile") {
    return [
      { href: "/app/plan", label: "Review current plan", prominent: true },
      { href: "/app/progress", label: "Open progress board" }
    ];
  }

  return [
    { href: "/app/plan", label: "Review current plan", prominent: true },
    { href: "/app/reflection?mode=weekly", label: "Log weekly progress" }
  ];
}

function getStorageLabel(connectionStatus: string) {
  if (connectionStatus === "loading") {
    return "Saving workspace";
  }

  if (connectionStatus === "connected") {
    return "Workspace saved";
  }

  if (connectionStatus === "demo") {
    return "Saved locally";
  }

  if (connectionStatus === "degraded") {
    return "Recovery copy active";
  }

  return "Save issue";
}

function getStorageTone(connectionStatus: string) {
  return connectionStatus === "connected"
    ? "good"
    : connectionStatus === "degraded"
      ? "warn"
      : connectionStatus === "error"
        ? "warn"
        : "";
}

export function AppShell({
  children,
  authSummary
}: PropsWithChildren<{ authSummary: AuthSummary }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { state: workspaceState, status, error, diagnostics, clearError } = useWorkspaceState();
  const session = workspaceState.session;

  const appearance = workspaceState.preferences?.appearance || "midnight";
  const runCount = workspaceState.history.length;
  const checkInCount = workspaceState.checkIns.length;
  const hasPlan = Boolean(workspaceState.buildPackage);
  const workspaceActions = buildWorkspaceActions(pathname, hasPlan);
  const sidebarAction = hasPlan
    ? pathname === "/app"
      ? { href: "/app/reflection?mode=weekly", label: "Log weekly progress", prominent: true }
      : { href: "/app", label: "Return to overview" }
    : { href: "/onboarding/welcome", label: "Start assessment", prominent: true };
  const showSettingsAction = pathname !== "/app/settings";
  const storageLabel = getStorageLabel(diagnostics.connectionStatus);
  const storageTone = getStorageTone(diagnostics.connectionStatus);
  const planningMode = workspaceState.preferences?.planningMode === "ai" ? "ai" : "stable";
  const planningModeDetails = getPlanningModeDetails(planningMode);

  const signedInLabel = authSummary.user ? `${authSummary.user.name} • ${authSummary.user.email}` : null;
  const accountLabel =
    signedInLabel ||
    (session?.authenticated && session.user
        ? `${session.user.name} • ${session.user.email}`
        : authSummary.mode === "supabase"
          ? "Email/password auth is configured, but no active session is attached to this workspace."
          : "No production auth configured yet. Continue in demo mode or connect Supabase or Clerk.");

  return (
    <div className="app-frame" data-appearance={appearance}>
      <aside className="app-sidebar">
        <div className="sidebar-card brand-panel">
          <Link className="brand" href="/">
            <span className="brand-mark">LM</span>
            <span>
              <strong>LifeMax OS</strong>
              <small>
                {authSummary.mode === "clerk"
                  ? authSummary.user
                    ? "Protected workspace"
                    : "Authentication required"
                  : authSummary.mode === "supabase"
                    ? authSummary.user
                      ? "Secure workspace"
                      : "Sign in required"
                  : session?.authenticated
                    ? "Signed in"
                    : "Demo mode"}
              </small>
            </span>
          </Link>
          <p className="muted">
            A warmer, sharper workspace for planning, check-ins, progress, and agent review.
          </p>
          <div className="workspace-pills">
            <span className="pill">{appearanceLabels[appearance]} theme</span>
            <span className={`pill ${planningMode === "ai" ? "warn" : "good"}`}>{planningModePill(planningMode)}</span>
            <span className="pill">{status === "loading" ? "Loading runs" : `${runCount} runs`}</span>
            <span className="pill">{status === "loading" ? "Loading check-ins" : `${checkInCount} check-ins`}</span>
          </div>
        </div>

        <nav className="app-nav" aria-label="Application">
          {appNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`app-nav-link ${pathname === item.href ? "active" : ""}`}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-card">
          <div className="line-between">
            <strong>Workspace pulse</strong>
            <span className="pill good">{workspaceState.buildPackage ? "Live plan" : "Needs assessment"}</span>
          </div>
          <p className="muted">
            {workspaceState.buildPackage
              ? workspaceState.buildPackage.tracker.weeklyReview.headline
              : "Complete the assessment to initialize your first operating system."}
          </p>
          <div className="controls">
            <Link
              className={`button-link ${sidebarAction.prominent ? "primary" : ""}`}
              href={sidebarAction.href}
            >
              {sidebarAction.label}
            </Link>
          </div>
          <p className="field-note">
            {planningModeDetails.title}: {planningModeDetails.subtitle}
          </p>
        </div>

        <div className="sidebar-card">
          <strong>Account</strong>
          <p className="muted">{accountLabel}</p>
          <div className="controls">
            {authSummary.mode === "clerk" ? (
              <div className="inline-flex items-center gap-3">
                <Link className="button-link" href="/sign-in">
                  Manage access
                </Link>
                <UserButton />
              </div>
            ) : authSummary.mode === "supabase" ? (
              <div className="inline-flex items-center gap-3">
                <Link className="button-link" href="/app/settings">
                  Manage access
                </Link>
                <SupabaseAccountControls />
              </div>
            ) : (
              <>
                <Link className="button-link" href="/sign-in">
                  {session?.authenticated ? "Switch account" : "Sign in"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    resetDemoState();
                    router.push("/");
                  }}
                >
                  Reset demo
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-copy">
            <p className="eyebrow">Application workspace</p>
            <h1>{appNavigation.find((item) => item.href === pathname)?.label || "Dashboard"}</h1>
            <p className="muted">{pageDescriptions[pathname] || pageDescriptions["/app"]}</p>
            <div className="topbar-meta">
              <span className={`workspace-sync-status ${planningMode === "ai" ? "warn" : "good"}`}>
                {planningModePill(planningMode)}
              </span>
              <span className={`workspace-sync-status ${storageTone}`}>{storageLabel}</span>
            </div>
          </div>
          <div className="topbar-actions">
            {workspaceActions.map((action) => (
              <Link
                key={action.href}
                className={`button-link ${action.prominent ? "primary" : ""}`}
                href={action.href}
              >
                {action.label}
              </Link>
            ))}
            {showSettingsAction ? (
              <Link className="button-link" href="/app/settings">
                Settings
              </Link>
            ) : null}
          </div>
        </header>
        {error ? (
          <div className="workspace-status-banner" role="status">
            <div>
              <strong>Storage warning</strong>
              <p>{error}</p>
            </div>
            <button type="button" onClick={clearError}>
              Dismiss
            </button>
          </div>
        ) : null}
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

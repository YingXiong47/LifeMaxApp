"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type { AuthSummary } from "@/lib/auth/session";
import {
  clearWorkspaceFallbackState,
  loadDemoState,
  loadWorkspaceFallbackState,
  saveDemoState,
  saveWorkspaceFallbackState
} from "@/lib/demo/storage";
import {
  createDefaultWorkspaceDiagnostics,
  createDefaultWorkspaceState,
  type WorkspaceDiagnostics,
  type WorkspaceState
} from "@/lib/workspace/state";

type WorkspaceStatus = "loading" | "ready" | "error";

type WorkspaceContextValue = {
  state: WorkspaceState;
  status: WorkspaceStatus;
  diagnostics: WorkspaceDiagnostics;
  error: string | null;
  saveState: (nextState: WorkspaceState) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  state: createDefaultWorkspaceState(),
  status: "loading",
  diagnostics: createDefaultWorkspaceDiagnostics(null),
  error: null,
  saveState: async () => {},
  refresh: async () => {},
  clearError: () => {}
});

function isDev() {
  return process.env.NODE_ENV !== "production";
}

function clientLog(event: string, payload: Record<string, unknown>) {
  if (!isDev()) {
    return;
  }

  console.info(`[workspace-client] ${event}`, payload);
}

async function parseWorkspaceResponse(response: Response) {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Workspace request failed.");
  }

  return payload as { state: WorkspaceState; diagnostics: WorkspaceDiagnostics };
}

export function useWorkspaceState() {
  return useContext(WorkspaceContext);
}

export function WorkspaceProvider({
  children,
  authSummary
}: PropsWithChildren<{ authSummary: AuthSummary }>) {
  const [state, setState] = useState(createDefaultWorkspaceState);
  const [status, setStatus] = useState<WorkspaceStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<WorkspaceDiagnostics>(() =>
    createDefaultWorkspaceDiagnostics(authSummary.userId)
  );

  const applyDiagnostics = useCallback(
    (next: Partial<WorkspaceDiagnostics>) => {
      setDiagnostics((current) => ({
        ...current,
        userId: authSummary.userId,
        ...next
      }));
    },
    [authSummary.userId]
  );

  const loadWorkspace = useCallback(async () => {
    if (authSummary.mode === "demo") {
      const nextState = loadDemoState();
      setState(nextState);
      setStatus("ready");
      setError(null);
      applyDiagnostics({
        mode: "demo-local",
        connectionStatus: "demo",
        tablesUsed: [],
        lastSuccessfulRead: new Date().toISOString(),
        lastReadSource: "localStorage",
        fallbackLocalStorage: true
      });
      clientLog("read:demo-local", { userId: authSummary.userId });
      return;
    }

    setStatus("loading");

    try {
      clientLog("read:start", { userId: authSummary.userId, source: "supabase" });
      const response = await fetch("/api/workspace", {
        method: "GET",
        cache: "no-store"
      });
      const payload = await parseWorkspaceResponse(response);
      setState(payload.state);
      setStatus("ready");
      setError(null);
      clearWorkspaceFallbackState();
      setDiagnostics(payload.diagnostics);
      clientLog("read:success", { userId: authSummary.userId, diagnostics: payload.diagnostics });
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Unable to load workspace.";
      const fallbackState = loadWorkspaceFallbackState();

      if (fallbackState) {
        setState(fallbackState);
        setStatus("ready");
        setError(
          `${message} Showing the local recovery copy until protected storage becomes available again.`
        );
        applyDiagnostics({
          mode: "local-fallback",
          connectionStatus: "degraded",
          tablesUsed: [
            "profiles",
            "assessments",
            "domains",
            "domain_progress_logs",
            "weekly_plans",
            "agent_runs",
            "reflections",
            "user_settings"
          ],
          lastSuccessfulRead: new Date().toISOString(),
          lastReadSource: "local recovery cache",
          fallbackLocalStorage: true,
          recentSaveErrors: [message]
        });
        clientLog("read:fallback", { userId: authSummary.userId, error: message });
        return;
      }

      setState(createDefaultWorkspaceState());
      setStatus("error");
      setError(message);
      applyDiagnostics({
        mode: "supabase",
        connectionStatus: "error",
        tablesUsed: [
          "profiles",
          "assessments",
          "domains",
          "domain_progress_logs",
          "weekly_plans",
          "agent_runs",
          "reflections",
          "user_settings"
        ],
        fallbackLocalStorage: false,
        recentSaveErrors: [message]
      });
      clientLog("read:error", { userId: authSummary.userId, error: message });
    }
  }, [applyDiagnostics, authSummary.mode, authSummary.userId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (authSummary.mode !== "demo") {
      return;
    }

    const syncDemoState = () => {
      setState(loadDemoState());
      applyDiagnostics({
        mode: "demo-local",
        connectionStatus: "demo",
        lastSuccessfulRead: new Date().toISOString(),
        lastReadSource: "localStorage",
        fallbackLocalStorage: true
      });
    };

    window.addEventListener("lifemax-demo-state", syncDemoState);
    return () => window.removeEventListener("lifemax-demo-state", syncDemoState);
  }, [applyDiagnostics, authSummary.mode]);

  const saveState = useCallback(
    async (nextState: WorkspaceState) => {
      setState(nextState);

      if (authSummary.mode === "demo") {
        saveDemoState(nextState);
        applyDiagnostics({
          mode: "demo-local",
          connectionStatus: "demo",
          lastSuccessfulWrite: new Date().toISOString(),
          lastWriteSource: "localStorage",
          fallbackLocalStorage: true
        });
        clientLog("write:demo-local", { userId: authSummary.userId });
        return;
      }

      try {
        clientLog("write:start", { userId: authSummary.userId, source: "supabase" });
        const response = await fetch("/api/workspace", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ state: nextState })
        });
        const payload = await parseWorkspaceResponse(response);
        setState(payload.state);
        setStatus("ready");
        setError(null);
        clearWorkspaceFallbackState();
        applyDiagnostics({
          ...payload.diagnostics,
          lastSuccessfulRead: diagnostics.lastSuccessfulRead,
          lastReadSource: diagnostics.lastReadSource
        });
        clientLog("write:success", { userId: authSummary.userId, diagnostics: payload.diagnostics });
      } catch (nextError) {
        const message = nextError instanceof Error ? nextError.message : "Unable to save workspace.";
        saveWorkspaceFallbackState(nextState);
        setStatus("ready");
        setError(
          `${message} Changes are cached locally for recovery, but protected Supabase storage did not confirm this save.`
        );
        applyDiagnostics({
          mode: "local-fallback",
          connectionStatus: "degraded",
          lastSuccessfulWrite: diagnostics.lastSuccessfulWrite,
          lastWriteSource: "local recovery cache",
          fallbackLocalStorage: true,
          recentSaveErrors: [...diagnostics.recentSaveErrors.slice(-4), message]
        });
        clientLog("write:fallback", { userId: authSummary.userId, error: message });
      }
    },
    [applyDiagnostics, authSummary.mode, authSummary.userId, diagnostics.lastSuccessfulWrite, diagnostics.recentSaveErrors]
  );

  const value = useMemo(
    () => ({
      state,
      status,
      diagnostics,
      error,
      saveState,
      refresh: loadWorkspace,
      clearError: () => setError(null)
    }),
    [diagnostics, error, loadWorkspace, saveState, state, status]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

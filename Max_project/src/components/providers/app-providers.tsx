"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, PropsWithChildren, useContext, useState } from "react";
import { SupabaseSessionBridge } from "@/components/providers/supabase-session-bridge";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import type { AuthSummary } from "@/lib/auth/session";

const AuthSummaryContext = createContext<AuthSummary>({
  mode: "demo",
  userId: null,
  user: null
});

export function useAppAuthSummary() {
  return useContext(AuthSummaryContext);
}

function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false
          },
          mutations: {
            retry: 1
          }
        }
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function AppProviders({
  children,
  clerkPublishableKey,
  authSummary
}: PropsWithChildren<{ clerkPublishableKey?: string; authSummary: AuthSummary }>) {
  const content = (
    <AuthSummaryContext.Provider value={authSummary}>
      <QueryProvider>
        <SupabaseSessionBridge />
        <WorkspaceProvider authSummary={authSummary}>{children}</WorkspaceProvider>
      </QueryProvider>
    </AuthSummaryContext.Provider>
  );

  if (!clerkPublishableKey) {
    return content;
  }

  return <ClerkProvider publishableKey={clerkPublishableKey}>{content}</ClerkProvider>;
}

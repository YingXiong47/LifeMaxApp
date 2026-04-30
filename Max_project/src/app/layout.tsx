import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { getAuthMode } from "@/lib/auth/config";
import { clientEnv } from "@/lib/env";
import { getAuthSummary } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "LifeMax OS",
  description: "A personal operating system for structured goals, planning, and progress."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authSummary = await getAuthSummary();
  const authMode = getAuthMode();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AppProviders
          clerkPublishableKey={authMode === "clerk" ? clientEnv.clerkPublishableKey : undefined}
          authSummary={authSummary}
        >
          {children}
        </AppProviders>
      </body>
    </html>
  );
}

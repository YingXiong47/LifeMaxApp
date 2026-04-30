import { AppShell } from "@/components/layout/app-shell";
import { getAuthSummary } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const authSummary = await getAuthSummary();

  if ((authSummary.mode === "clerk" || authSummary.mode === "supabase") && !authSummary.userId) {
    redirect("/sign-in");
  }

  return <AppShell authSummary={authSummary}>{children}</AppShell>;
}

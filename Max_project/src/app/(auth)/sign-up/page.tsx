import { MarketingHeader } from "@/components/layout/marketing-header";
import { DemoAuthCard } from "@/components/ui/demo-auth-card";
import { SupabaseAuthCard } from "@/components/ui/supabase-auth-card";
import { SignUp } from "@clerk/nextjs";
import { getAuthMode } from "@/lib/auth/config";
import { getAuthSummary } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const authSummary = await getAuthSummary();

  if (authSummary.userId) {
    redirect("/app");
  }

  const authMode = getAuthMode();

  return (
    <>
      <MarketingHeader />
      <main className="page-shell">
        {authMode === "clerk" ? (
          <SignUp />
        ) : authMode === "supabase" ? (
          <SupabaseAuthCard mode="sign-up" />
        ) : (
          <DemoAuthCard mode="sign-up" />
        )}
      </main>
    </>
  );
}

import { MarketingHeader } from "@/components/layout/marketing-header";
import { DemoAuthCard } from "@/components/ui/demo-auth-card";
import { SupabaseAuthCard } from "@/components/ui/supabase-auth-card";
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
        {authMode === "supabase" ? (
          <SupabaseAuthCard mode="sign-up" />
        ) : authMode === "clerk" ? (
          await (async () => {
            const { SignUp } = await import("@clerk/nextjs");
            return <SignUp />;
          })()
        ) : (
          <DemoAuthCard mode="sign-up" />
        )}
      </main>
    </>
  );
}

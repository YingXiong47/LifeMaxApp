import { MarketingHeader } from "@/components/layout/marketing-header";
import { SupabaseResetPasswordCard } from "@/components/ui/supabase-reset-password-card";
import { getAuthMode } from "@/lib/auth/config";

function ResetPasswordUnavailable() {
  return (
    <div className="auth-card">
      <p className="eyebrow">Password reset</p>
      <h1>Password reset is unavailable here</h1>
      <p className="lede">
        This route expects Supabase email/password auth. Configure Supabase on the deployment and open the page from a verified reset email.
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const authMode = getAuthMode();

  return (
    <>
      <MarketingHeader />
      <main className="page-shell">
        {authMode === "supabase" ? <SupabaseResetPasswordCard /> : <ResetPasswordUnavailable />}
      </main>
    </>
  );
}

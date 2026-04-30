import { MarketingHeader } from "@/components/layout/marketing-header";
import { SupabaseForgotPasswordCard } from "@/components/ui/supabase-forgot-password-card";
import { getAuthMode } from "@/lib/auth/config";

function PasswordSupportUnavailable() {
  return (
    <div className="auth-card">
      <p className="eyebrow">Password help</p>
      <h1>Password reset is unavailable here</h1>
      <p className="lede">
        This route expects Supabase email/password auth. Configure the Supabase runtime variables on the deployment before using password recovery.
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const authMode = getAuthMode();

  return (
    <>
      <MarketingHeader />
      <main className="page-shell">
        {authMode === "supabase" ? <SupabaseForgotPasswordCard /> : <PasswordSupportUnavailable />}
      </main>
    </>
  );
}

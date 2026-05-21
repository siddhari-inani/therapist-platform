"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/contexts/demo-context";
import { Card, CardContent } from "@/components/ui/card";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const { isDemo } = useDemoMode();

  useEffect(() => {
    let mounted = true;
    setChecking(true);

    async function verifyAccess() {
      if (isDemo) {
        if (mounted) setChecking(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, license_number, onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      // Therapists must finish the onboarding wizard before they can use the
      // dashboard. We treat the user as onboarded when either:
      //   * onboarding_completed_at is set (preferred, set by the wizard), OR
      //   * full_name + license_number are both filled (legacy invite-flow
      //     accounts that predate onboarding_completed_at).
      const isTherapist = profile?.role === "therapist";
      const hasRequiredFields = Boolean(profile?.full_name && profile?.license_number);
      const needsOnboarding =
        isTherapist && !profile?.onboarding_completed_at && !hasRequiredFields;

      if (needsOnboarding) {
        router.replace("/onboarding");
        return;
      }

      if (mounted) setChecking(false);
    }

    verifyAccess();
    return () => {
      mounted = false;
    };
  }, [isDemo, router, supabase]);

  if (checking) {
    return (
      <div className="p-6 md:p-8">
        <Card className="border-slate-200/80 dark:border-slate-800/80">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Checking access...
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

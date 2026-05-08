"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/contexts/demo-context";
import { Card, CardContent } from "@/components/ui/card";

const ONBOARDING_ALLOWED_ROUTES = new Set([
  "/dashboard/profile",
  "/dashboard/settings",
  "/dashboard/preferences",
]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
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
        .select("role, full_name, license_number")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      const needsOnboarding =
        profile?.role === "therapist" &&
        (!profile.full_name || !profile.license_number);

      if (
        needsOnboarding &&
        pathname !== "/dashboard/profile" &&
        !ONBOARDING_ALLOWED_ROUTES.has(pathname)
      ) {
        router.replace("/dashboard/profile");
        return;
      }

      if (mounted) setChecking(false);
    }

    verifyAccess();
    return () => {
      mounted = false;
    };
  }, [isDemo, pathname, router, supabase]);

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

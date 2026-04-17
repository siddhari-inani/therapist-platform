"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  Settings,
  Users,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  User,
  Trophy,
  FlaskConical,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { XpBar } from "@/components/gamification/xp-bar";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/contexts/demo-context";
import { DEMO_THERAPIST } from "@/lib/demo-data";
import type { Profile } from "@/types/database.types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/patients", label: "Patients", icon: Users },
  { href: "/dashboard/charting", label: "Charting", icon: FileText },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/progress", label: "Progress", icon: Trophy },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();
  const { isDemo, setDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemo) {
      setProfile(DEMO_THERAPIST as Profile);
      return;
    }
    async function fetchProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (data) {
            setProfile(data as Profile);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }

    fetchProfile();
  }, [supabase, isDemo]);

  const handleLogout = async () => {
    if (isDemo) {
      setDemoMode(false);
      window.location.href = "/login";
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const displayProfile = isDemo ? (DEMO_THERAPIST as Profile) : profile;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-950/80 backdrop-blur-xl shadow-xl shadow-slate-200/30 dark:shadow-black/20">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/40 dark:border-white/10">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Stethoscope className="h-4 w-4" aria-hidden />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate">
          Revora Health
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-10 px-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:bg-primary/15 dark:hover:bg-primary/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
              >
                <Icon
                  className={cn("mr-3 h-4 w-4 shrink-0", isActive ? "text-primary" : "text-slate-500 dark:text-slate-400")}
                  aria-hidden
                />
                <span className="truncate">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Demo mode toggle */}
      <div className="border-t border-white/40 dark:border-white/10 px-3 py-2">
        <button
          type="button"
          onClick={() => setDemoMode(!isDemo)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isDemo
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
          aria-pressed={isDemo}
        >
          <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{isDemo ? "Demo mode ON" : "Try demo"}</span>
        </button>
      </div>

      {/* XP progress */}
      <div className="border-t border-white/40 dark:border-white/10 px-3 py-2">
        <XpBar compact className="px-1" />
      </div>

      {/* User & actions */}
      <div className="border-t border-white/40 dark:border-white/10 p-3 space-y-2">
        <div className="flex items-center gap-3 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/60 dark:border-white/5 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-sm">
            {displayProfile?.avatar_url ? (
              <img
                src={displayProfile.avatar_url}
                alt={displayProfile?.full_name || "User avatar"}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              (displayProfile?.full_name || displayProfile?.email || "U")[0].toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {displayProfile?.full_name || displayProfile?.email || "User"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {isDemo ? "Demo" : displayProfile?.role === "therapist" ? "Therapist" : displayProfile?.role || "User"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start h-9 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-sm"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4 shrink-0" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}

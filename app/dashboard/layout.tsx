import { Sidebar } from "@/components/dashboard/sidebar";
import { AIAssistant } from "@/components/dashboard/ai-assistant";
import { ErrorBoundary } from "@/components/error-boundary";
import { GamificationWrapper } from "@/components/dashboard/gamification-wrapper";
import { DemoProvider } from "@/contexts/demo-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DemoProvider>
      <GamificationWrapper>
      <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-slate-100 via-lime-50/20 to-emerald-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative min-w-0 pb-[env(safe-area-inset-bottom)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-lime-100/15 dark:from-white/5 dark:via-transparent dark:to-lime-900/10 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(133,153,68,0.12)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(133,153,68,0.05)_0%,transparent_50%)] pointer-events-none" />
          <div className="relative z-10 dashboard-content">
            {children}
          </div>
        </main>
        <AIAssistant />
      </div>
      </GamificationWrapper>
      </DemoProvider>
    </ErrorBoundary>
  );
}

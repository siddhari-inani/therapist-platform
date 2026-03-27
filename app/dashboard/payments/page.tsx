"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Building2,
  Check,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/contexts/demo-context";
import { DEMO_PAYMENTS, getDemoPaymentsThisMonth } from "@/lib/demo-data";
import type { PaymentStatus } from "@/types/database.types";

type PaymentPlatformId = "stripe" | "square" | null;

const PAYMENT_PLATFORMS = [
  {
    id: "stripe" as const,
    name: "Stripe",
    description: "Accept cards, ACH, and more. Global payouts and invoicing.",
    icon: CreditCard,
    href: "https://stripe.com",
    connectLabel: "Connect with Stripe",
  },
  {
    id: "square" as const,
    name: "Square",
    description: "In-person and online payments, appointments, and payroll.",
    icon: Building2,
    href: "https://squareup.com",
    connectLabel: "Connect with Square",
  },
];

type PaymentRow = {
  id: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  created_at: string;
  appointment_id: string | null;
};

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [receivedThisMonth, setReceivedThisMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDemo } = useDemoMode();

  const supabase = createClient();

  const fetchConnectStatus = useCallback(async () => {
    const statusRes = await fetch("/api/stripe/connect-status");
    const status = await statusRes.json();
    return Boolean(status.connected);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (isDemo) {
          if (mounted) {
            setStripeConnected(false);
            setPayments(DEMO_PAYMENTS as PaymentRow[]);
            setReceivedThisMonth(getDemoPaymentsThisMonth());
          }
          setLoading(false);
          return;
        }

        const [connected, { data: { user } }] = await Promise.all([
          fetchConnectStatus(),
          supabase.auth.getUser(),
        ]);
        if (!mounted) return;

        setStripeConnected(connected);

        if (!user) {
          setLoading(false);
          return;
        }

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: paymentsData } = await supabase
          .from("payments")
          .select("id, amount_cents, currency, status, description, created_at, appointment_id")
          .eq("therapist_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (mounted) setPayments((paymentsData as PaymentRow[]) ?? []);

        const { data: monthData } = await supabase
          .from("payments")
          .select("amount_cents")
          .eq("therapist_id", user.id)
          .eq("status", "succeeded")
          .gte("created_at", startOfMonth.toISOString());

        if (mounted) {
          const total = (monthData ?? []).reduce((sum, p) => sum + p.amount_cents, 0);
          setReceivedThisMonth(total);
        }
      } catch (e) {
        if (mounted) setStripeConnected(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [fetchConnectStatus, isDemo]);

  // After returning from Stripe Connect onboarding, refetch status and clear URL params
  useEffect(() => {
    const returnParam = searchParams.get("stripe_connect");
    if (returnParam !== "return" && returnParam !== "refresh") return;

    fetchConnectStatus().then((connected) => {
      setStripeConnected(connected);
      // Clear query params so the message doesn't reappear on refresh
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/dashboard/payments");
      }
    });
  }, [searchParams, fetchConnectStatus]);

  const handleConnectStripe = async () => {
    setConnectError(null);
    setConnectingStripe(true);
    try {
      const res = await fetch("/api/stripe/connect-onboard", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to start Stripe connection."
        );
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No redirect URL received from server.");
    } catch (err) {
      console.error(err);
      setConnectError(err instanceof Error ? err.message : "Connection failed. Try again.");
      setConnectingStripe(false);
    }
  };

  const connectedPlatform: PaymentPlatformId = stripeConnected ? "stripe" : null;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <header className="space-y-1">
        <Breadcrumb items={[{ label: "Payments" }]} />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Payments
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-base max-w-2xl">
          Connect a payment platform to accept payments from patients and manage payouts.
        </p>
      </header>

      {/* Connected status */}
      <section aria-labelledby="status-heading">
        <h2 id="status-heading" className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
          Payment platform
        </h2>
        <Card className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span className="text-sm">Loading…</span>
              </div>
            ) : connectedPlatform ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Connected to {PAYMENT_PLATFORMS.find((p) => p.id === connectedPlatform)?.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your account is linked. You can accept payments and view payouts in Stripe.
                  </p>
                </div>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600">
                    Open Stripe Dashboard
                  </Button>
                </a>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm py-2">
                No payment platform connected. Choose an option below to connect.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Platform options */}
      <section aria-labelledby="platforms-heading">
        <h2 id="platforms-heading" className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
          Connect a platform
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {PAYMENT_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isConnected = connectedPlatform === platform.id;
            const isStripe = platform.id === "stripe";
            return (
              <Card
                key={platform.id}
                className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                        <Icon className="h-6 w-6 text-slate-600 dark:text-slate-400" aria-hidden />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {platform.name}
                        </CardTitle>
                        <CardDescription className="mt-0.5 text-slate-500 dark:text-slate-400 text-sm">
                          {platform.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {connectError && isStripe && (
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                      <span>{connectError}</span>
                    </div>
                  )}
                  {isStripe ? (
                    <Button
                      onClick={handleConnectStripe}
                      disabled={isConnected || connectingStripe}
                      className="w-full"
                    >
                      {connectingStripe ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          Redirecting…
                        </>
                      ) : isConnected ? (
                        <>
                          <Check className="mr-2 h-4 w-4" aria-hidden />
                          Connected
                        </>
                      ) : (
                        platform.connectLabel
                      )}
                    </Button>
                  ) : (
                    <Button disabled className="w-full" variant="secondary">
                      Coming soon
                    </Button>
                  )}
                  <a
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Learn more
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Overview */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
          Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden />
                Received (this month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {receivedThisMonth !== null ? formatAmount(receivedThisMonth, "usd") : "—"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Successful payments from patients this month.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden />
                Payouts (this month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                —
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                View payouts and bank transfers in your Stripe Dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent payments */}
      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
          Recent payments
        </h2>
        <Card className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
          <CardContent className="pt-6">
            {payments.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm py-4">
                No payments yet. Payments will appear here after patients pay for sessions.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-400" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {p.description || "Session payment"}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(p.created_at)} · {p.status}
                        </p>
                      </div>
                    </div>
                    <p className="text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100 shrink-0">
                      {formatAmount(p.amount_cents, p.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InviteAcceptPage() {
  const params = useParams();
  const token = params.token as string;
  const [formData, setFormData] = useState({
    full_name: "",
    license_number: "",
    specialties: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const acceptInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/therapist-invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...formData }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to accept invite");
        return;
      }
      setComplete(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-lime-50/40 to-white p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center">
        <Card className="w-full border-white/50 bg-white/80 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle>Join Revora Health</CardTitle>
            <CardDescription>
              Complete your therapist profile to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {complete ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Your account is ready. Sign in with the password you just created.
                </div>
                <Link href="/login">
                  <Button className="w-full">Go to login</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={acceptInvite} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(event) => setFormData({ ...formData, full_name: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_number">License number</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(event) => setFormData({ ...formData, license_number: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialties">Specialties</Label>
                  <Input
                    id="specialties"
                    value={formData.specialties}
                    onChange={(event) => setFormData({ ...formData, specialties: event.target.value })}
                    placeholder="Orthopedics, sports rehab, post-op"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={(event) => setFormData({ ...formData, timezone: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    minLength={8}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Accept invite"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

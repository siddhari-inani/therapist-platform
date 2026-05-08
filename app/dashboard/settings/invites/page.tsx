"use client";

import { useEffect, useState } from "react";
import { Copy, Send, UserPlus } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type TherapistInvite = {
  id: string;
  email: string;
  role: "therapist" | "admin";
  status: "pending" | "accepted" | "expired" | "revoked";
  token: string;
  expires_at: string;
  created_at: string;
};

export default function TherapistInvitesPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<TherapistInvite[]>([]);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    const response = await fetch("/api/therapist-invites");
    if (!response.ok) return;
    const data = await response.json();
    setInvites(data.invites ?? []);
  };

  const createInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/therapist-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "therapist" }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error("Invite not created", { description: data.error ?? "Check permissions and try again." });
        return;
      }
      setEmail("");
      setInvites((prev) => [data.invite, ...prev]);
      toast.success("Invite created", { description: "Share the invite link with the therapist." });
    } finally {
      setLoading(false);
    }
  };

  const inviteUrl = (token: string) =>
    typeof window === "undefined" ? `/invite/${token}` : `${window.location.origin}/invite/${token}`;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Settings", href: "/dashboard/settings" }, { label: "Therapist Invites" }]} />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Therapist Invites
        </h1>
        <p className="text-muted-foreground">
          Invite PTs into the platform and give them a guided profile setup before they access patient workflows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-primary" aria-hidden />
            Invite a therapist
          </CardTitle>
          <CardDescription>Invites expire after 7 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Therapist email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="pt@example.com"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              <Send className="h-4 w-4" aria-hidden />
              {loading ? "Creating..." : "Create invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent invites</CardTitle>
          <CardDescription>Copy the invite link after creating it.</CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No therapist invites yet.
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {invite.status} · expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={async () => {
                      await navigator.clipboard.writeText(inviteUrl(invite.token));
                      toast.success("Invite link copied");
                    }}
                    disabled={invite.status !== "pending"}
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                    Copy link
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

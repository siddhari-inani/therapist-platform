"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ConversationList,
  type Conversation,
} from "@/components/messages/conversation-list";
import { MessageCompose } from "@/components/messages/message-compose";
import { MessageThread } from "@/components/messages/message-thread";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/contexts/demo-context";
import { getDemoConversations, DEMO_THERAPIST_ID, DEMO_MESSAGES } from "@/lib/demo-data";
import type { Message, Profile } from "@/types/database.types";
import { MessageSquare, Pencil } from "lucide-react";

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const patientIdFromUrl = searchParams.get("patient");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);
  const supabase = createClient();
  const { isDemo } = useDemoMode();

  const loadConversations = useCallback(async () => {
    if (isDemo) {
      setUserId(DEMO_THERAPIST_ID);
      const list = getDemoConversations();
      setConversations(list);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const { data: sent } = await supabase
      .from("messages")
      .select("*")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false });

    const all = (sent ?? []) as Message[];

    const byPatient = new Map<string, Message>();
    for (const m of all) {
      const pid = m.recipient_id;
      const existing = byPatient.get(pid);
      if (!existing || new Date(m.created_at) > new Date(existing.created_at)) {
        byPatient.set(pid, m);
      }
    }

    const ids = Array.from(byPatient.keys());
    if (ids.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);

    const profileMap = new Map<string, Profile>();
    for (const p of profiles ?? []) {
      profileMap.set((p as Profile).id, p as Profile);
    }

    const list: Conversation[] = [];
    for (const [patientId, last] of Array.from(byPatient.entries())) {
      const patient = profileMap.get(patientId);
      if (patient) {
        list.push({ other: patient, lastMessage: last, unread: false });
      }
    }
    list.sort(
      (a, b) =>
        new Date(b.lastMessage.created_at).getTime() -
        new Date(a.lastMessage.created_at).getTime()
    );
    setConversations(list);
    setLoading(false);
  }, [supabase, isDemo]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!patientIdFromUrl) return;
    if (loading) return;
    const profile = conversations.find((c) => c.other.id === patientIdFromUrl)?.other;
    if (profile) {
      setSelected(profile);
      setComposeOpen(false);
    } else {
      setComposeOpen(true);
    }
  }, [patientIdFromUrl, conversations, loading]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumb items={[{ label: "Messages" }]} />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="text-muted-foreground text-lg">
            Secure messaging with your patients
          </p>
        </div>
        <Button onClick={() => setComposeOpen(true)} className="shrink-0">
          <Pencil className="h-4 w-4 mr-2" />
          New message
        </Button>
      </div>

      <Card className="shadow-lg border-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[500px]">
            <div
              className={`border-b md:border-b-0 md:border-r flex flex-col ${
                selected && userId ? "hidden md:flex" : ""
              }`}
            >
              <div className="p-3 border-b flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Inbox</span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[60vh] md:max-h-none">
                <ConversationList
                  conversations={conversations}
                  currentUserId={userId ?? ""}
                  selectedId={selected?.id ?? null}
                  onSelect={setSelected}
                  loading={loading}
                />
              </div>
            </div>
            <div className="flex flex-col min-h-[400px]">
              {selected && userId ? (
                <MessageThread
                  otherProfile={selected}
                  currentUserId={userId}
                  onBack={() => setSelected(null)}
                  onMessageSent={loadConversations}
                  initialMessages={isDemo ? DEMO_MESSAGES.filter((m) => (m.sender_id === selected.id || m.recipient_id === selected.id)).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : undefined}
                  isDemo={isDemo}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Select a conversation</p>
                    <p className="text-sm mt-1">
                      Or start a new message to a patient.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <MessageCompose
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onSuccess={loadConversations}
        defaultRecipientId={patientIdFromUrl ?? undefined}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 md:p-8">
          <div className="text-sm text-muted-foreground">Loading messages...</div>
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}

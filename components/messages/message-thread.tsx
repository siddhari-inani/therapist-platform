"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Message, Profile } from "@/types/database.types";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageThreadProps {
  otherProfile: Profile;
  currentUserId: string;
  onBack?: () => void;
  onMessageSent?: () => void;
  /** When in demo mode, use these messages instead of fetching */
  initialMessages?: Message[];
  isDemo?: boolean;
}

export function MessageThread({
  otherProfile,
  currentUserId,
  onBack,
  onMessageSent,
  initialMessages,
  isDemo,
}: MessageThreadProps) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages ?? []);
  const [loading, setLoading] = React.useState(!initialMessages);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadMessages = React.useCallback(async () => {
    if (initialMessages !== undefined) {
      setMessages(initialMessages);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", currentUserId)
        .eq("recipient_id", otherProfile.id)
        .order("created_at", { ascending: true });

      setMessages((data ?? []) as Message[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, otherProfile.id, initialMessages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (initialMessages !== undefined) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!reply.trim() || sending) return;
    if (isDemo) {
      setReply("");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        recipient_id: otherProfile.id,
        body: reply.trim(),
        subject: null,
      });
      if (error) throw error;
      setReply("");
      await loadMessages();
      onMessageSent?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 border-b p-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
        )}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">To</p>
          <p className="font-semibold">{otherProfile.full_name || otherProfile.email}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    isMe
                      ? "bg-primary text-white"
                      : "bg-muted"
                  )}
                >
                  {m.subject && (
                    <p className="text-xs font-medium opacity-80 mb-1">{m.subject}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      isMe ? "text-blue-100" : "text-muted-foreground"
                    )}
                  >
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4 flex gap-2">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type a message to patient..."
          rows={2}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!reply.trim() || sending}
          className="shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

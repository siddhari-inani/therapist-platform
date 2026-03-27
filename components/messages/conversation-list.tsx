"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Message, Profile } from "@/types/database.types";

export type Conversation = {
  other: Profile;
  lastMessage: Message;
  unread: boolean;
};

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  selectedId: string | null;
  onSelect: (other: Profile) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  currentUserId,
  selectedId,
  onSelect,
  loading,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        No messages yet. Send a message to a patient to get started.
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((c) => {
        const isSelected = selectedId === c.other.id;
        const preview = `You: ${c.lastMessage.body.slice(0, 45)}${c.lastMessage.body.length > 45 ? "…" : ""}`;

        return (
          <button
            key={c.other.id}
            type="button"
            onClick={() => onSelect(c.other)}
            className={cn(
              "relative w-full text-left p-4 hover:bg-muted/50 transition-colors",
              isSelected && "bg-muted"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {c.other.full_name || c.other.email}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {preview}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {c.unread && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(c.lastMessage.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

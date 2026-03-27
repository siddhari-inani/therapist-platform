"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Profile, MessageInsert } from "@/types/database.types";
import { Loader2 } from "lucide-react";

interface MessageComposeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultRecipientId?: string;
  defaultSubject?: string;
  patientId?: string | null;
}

export function MessageCompose({
  open,
  onOpenChange,
  onSuccess,
  defaultRecipientId,
  defaultSubject,
  patientId,
}: MessageComposeProps) {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState(defaultRecipientId ?? "");
  const [subject, setSubject] = useState(defaultSubject ?? "");
  const [body, setBody] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      setRecipientId(defaultRecipientId ?? "");
      setSubject(defaultSubject ?? "");
      setBody("");
      setError(null);
      loadPatients();
    }
  }, [open, defaultRecipientId, defaultSubject]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: e } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "patient")
        .order("full_name");

      if (e) {
        setError("Could not load patients.");
        return;
      }
      setPatients((data as Profile[]) ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in.");
        setSending(false);
        return;
      }
      if (!recipientId || !body.trim()) {
        setError("Recipient and message are required.");
        setSending(false);
        return;
      }

      const insert: MessageInsert = {
        sender_id: user.id,
        recipient_id: recipientId,
        body: body.trim(),
        subject: subject.trim() || null,
        patient_id: patientId || recipientId,
      };

      const { error: err } = await supabase.from("messages").insert(insert);

      if (err) {
        setError(err.message ?? "Failed to send message.");
        setSending(false);
        return;
      }

      onOpenChange(false);
      onSuccess?.();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Send a secure message to a patient
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-2 block">To</label>
            {loading ? (
              <div className="h-10 rounded-md border bg-muted animate-pulse" />
            ) : patients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No patients found. Add patients first from the Patients page.
              </p>
            ) : (
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your message..."
              rows={5}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending || loading || patients.length === 0}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

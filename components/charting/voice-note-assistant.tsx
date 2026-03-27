"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Sparkles, FileUp, Loader2, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type SOAPStructured = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

export type ApplySoapResult = "applied" | "skipped_finalized" | "skipped_read_only" | "unavailable";

interface VoiceNoteAssistantProps {
  /** Call with structured SOAP; returns result so we can show the right message. */
  onApplySoap: (soap: SOAPStructured) => ApplySoapResult;
  /** When true, only the "Apply to note" button is disabled (e.g. note is finalized). Dictation and Structure as SOAP stay enabled. */
  applyDisabled?: boolean;
  /** When true, the entire assistant is disabled (legacy / optional). */
  disabled?: boolean;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function VoiceNoteAssistant({ onApplySoap, applyDisabled = false, disabled = false }: VoiceNoteAssistantProps) {
  const panelDisabled = disabled;
  const onlyApplyDisabled = applyDisabled && !panelDisabled;
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [structuredSoap, setStructuredSoap] = useState<SOAPStructured | null>(null);
  const [isStructuring, setIsStructuring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SpeechRecognitionClass = getSpeechRecognition();
  const supportsVoice = !!SpeechRecognitionClass;

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const startListening = () => {
    setError(null);
    if (!SpeechRecognitionClass) {
      setError("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    const rec = new SpeechRecognitionClass();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const results = e.results;
      let text = "";
      for (let i = 0; i < results.length; i++) {
        text += results.item(i).item(0).transcript;
      }
      setTranscript(text);
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== "aborted") {
        setError(e.message ?? e.error ?? "Speech recognition error");
      }
      setIsListening(false);
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  const handleStructureAsSoap = async () => {
    const text = transcript.trim();
    if (!text) {
      setError("Add some voice notes or transcript first.");
      return;
    }
    setError(null);
    setIsStructuring(true);
    try {
      const res = await fetch("/api/voice/soap-from-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      let data: { error?: string; subjective?: string; objective?: string; assessment?: string; plan?: string };
      try {
        data = await res.json();
      } catch {
        setError(res.status === 503 ? "Gemini API key is not set. Add GEMINI_API_KEY to .env.local." : "Server returned an invalid response.");
        return;
      }
      if (!res.ok) {
        const msg = data.error ?? (res.status === 503 ? "Gemini API key is not set. Add GEMINI_API_KEY to .env.local." : "Failed to structure note");
        setError(msg);
        return;
      }
      const soap: SOAPStructured = {
        subjective: data.subjective ?? "",
        objective: data.objective ?? "",
        assessment: data.assessment ?? "",
        plan: data.plan ?? "",
      };
      setStructuredSoap(soap);
      // Apply directly to the note so user doesn't have to click "Apply to note"
      const result = onApplySoap(soap);
      switch (result) {
        case "applied":
          setError(null);
          // Keep the generated SOAP preview visible
          return;
        case "unavailable":
          setError("Note editor is not ready. Scroll to the SOAP note above, then click \"Apply to note\".");
          return;
        case "skipped_finalized":
          setError("This note is finalized. Click \"Edit / Amend\" on the SOAP note above, then \"Apply to note\".");
          return;
        case "skipped_read_only":
          setError("The note is read-only. Apply is not available.");
          return;
        default:
          setError("Could not apply to note. You can click \"Apply to note\" to try again.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed. Check your connection.");
    } finally {
      setIsStructuring(false);
    }
  };

  const handleApplyToNote = () => {
    if (!structuredSoap) return;
    const result = onApplySoap(structuredSoap);
    switch (result) {
      case "applied":
        setStructuredSoap(null);
        setTranscript("");
        setError(null);
        return;
      case "unavailable":
        setError("Note editor is not ready. Scroll to the SOAP note above and try again.");
        return;
      case "skipped_finalized":
        setError("This note is finalized. Click \"Edit / Amend\" on the SOAP note above, then apply again.");
        return;
      case "skipped_read_only":
        setError("The note is read-only. Apply is not available.");
        return;
      default:
        setError("Could not apply to note. Try again.");
    }
  };

  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setIsTranscribing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: form,
      });
      let data: { error?: string; transcript?: string };
      try {
        data = await res.json();
      } catch {
        setError(res.status === 503 ? "Gemini API key is not set. Add GEMINI_API_KEY to .env.local." : "Transcription failed.");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? (res.status === 503 ? "Gemini API key is not set." : "Transcription failed"));
        return;
      }
      const text = typeof data.transcript === "string" ? data.transcript : "";
      setTranscript((prev) => (prev ? `${prev}\n${text}` : text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Check your connection.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClear = () => {
    setTranscript("");
    setStructuredSoap(null);
    setError(null);
    stopListening();
  };

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          Clara
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Voice input */}
        <div className="flex flex-wrap items-center gap-2">
          {supportsVoice && (
            <Button
              type="button"
              variant={isListening ? "destructive" : "default"}
              size="sm"
              onClick={isListening ? stopListening : startListening}
              disabled={panelDisabled}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" aria-hidden />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" aria-hidden />
                  Start dictation
                </>
              )}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
            className="hidden"
            onChange={handleUploadAudio}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={panelDisabled || isTranscribing}
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
            ) : (
              <FileUp className="h-4 w-4 mr-2" aria-hidden />
            )}
            {isTranscribing ? "Transcribing…" : "Upload audio"}
          </Button>
        </div>

        {/* Transcript */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
            Transcript
          </label>
          <textarea
            className="w-full min-h-[100px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
            placeholder="Speak or upload audio. Transcript will appear here."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={panelDisabled}
          />
        </div>

        {/* Structure as SOAP + Apply */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleStructureAsSoap}
            disabled={panelDisabled || !transcript.trim() || isStructuring}
          >
            {isStructuring ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" aria-hidden />
            )}
            {isStructuring ? "Structuring…" : "Structure as SOAP"}
          </Button>
          {structuredSoap && (
            <Button
              type="button"
              size="sm"
              onClick={handleApplyToNote}
              disabled={panelDisabled || onlyApplyDisabled}
            >
              <Check className="h-4 w-4 mr-2" aria-hidden />
              Apply to note
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={panelDisabled}
          >
            <Trash2 className="h-4 w-4 mr-2" aria-hidden />
            Clear
          </Button>
        </div>

        {structuredSoap && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 text-sm space-y-2">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              Structured SOAP (preview)
            </p>
            {structuredSoap.subjective && (
              <p>
                <span className="font-medium">S:</span>{" "}
                {structuredSoap.subjective.slice(0, 120)}
                {structuredSoap.subjective.length > 120 ? "…" : ""}
              </p>
            )}
            {structuredSoap.objective && (
              <p>
                <span className="font-medium">O:</span>{" "}
                {structuredSoap.objective.slice(0, 120)}
                {structuredSoap.objective.length > 120 ? "…" : ""}
              </p>
            )}
            {structuredSoap.assessment && (
              <p>
                <span className="font-medium">A:</span>{" "}
                {structuredSoap.assessment.slice(0, 120)}
                {structuredSoap.assessment.length > 120 ? "…" : ""}
              </p>
            )}
            {structuredSoap.plan && (
              <p>
                <span className="font-medium">P:</span>{" "}
                {structuredSoap.plan.slice(0, 120)}
                {structuredSoap.plan.length > 120 ? "…" : ""}
              </p>
            )}
          </div>
        )}

        {!supportsVoice && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Live dictation is not supported in this browser. Use &quot;Upload audio&quot; (Chrome,
            Edge, or Safari) or try another browser.
          </p>
        )}
        {onlyApplyDisabled && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This note is finalized. Use &quot;Edit / Amend&quot; in the SOAP note above to apply
            voice content to the note.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

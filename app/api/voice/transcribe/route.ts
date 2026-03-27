import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

/**
 * Transcribe audio using Google Gemini (multimodal: audio + text prompt).
 * Accepts multipart form with "file" (audio: mp3, mp4, mpeg, mpga, m4a, wav, webm)
 * or JSON body with "audioBase64" and optional "mimeType".
 */
const TRANSCRIBE_PROMPT =
  "Transcribe the following audio to text. Return only the raw transcript, no other commentary or formatting.";

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    mp4: "audio/mp4",
    mpeg: "audio/mpeg",
    mpga: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    webm: "audio/webm",
  };
  return map[ext ?? ""] ?? "audio/webm";
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set. Add it to enable audio transcription." },
        { status: 503 }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    let audioBase64: string;
    let mimeType = "audio/webm";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const uploaded = formData.get("file");
      if (!uploaded || !(uploaded instanceof File)) {
        return NextResponse.json(
          { error: "Form field 'file' with an audio file is required" },
          { status: 400 }
        );
      }
      const buffer = await uploaded.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      audioBase64 = Buffer.from(bytes).toString("base64");
      mimeType = getMimeType(uploaded.name);
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      const { audioBase64: base64, mimeType: mt } = body as { audioBase64?: string; mimeType?: string };
      if (!base64 || typeof base64 !== "string") {
        return NextResponse.json(
          { error: "JSON body must include audioBase64 (base64-encoded audio)" },
          { status: 400 }
        );
      }
      audioBase64 = base64;
      if (mt) mimeType = mt;
    } else {
      return NextResponse.json(
        { error: "Send multipart/form-data with 'file' or application/json with audioBase64" },
        { status: 400 }
      );
    }

    const result = await generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: audioBase64 } },
            { text: TRANSCRIBE_PROMPT },
          ],
        },
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    });

    if (!result.ok) {
      const message = result.error ?? "";
      const isQuotaOrBilling =
        result.status === 429 ||
        result.status === 503 ||
        /quota|billing|insufficient|limit exceeded|api key/i.test(message);
      const friendlyError = isQuotaOrBilling
        ? "Gemini quota exceeded or API key issue. Check your key at https://aistudio.google.com/apikey"
        : message || "Transcription failed";
      return NextResponse.json(
        { error: friendlyError },
        { status: result.status === 429 ? 429 : result.status ?? 500 }
      );
    }

    const text = result.text.trim();
    return NextResponse.json({ transcript: text });
  } catch (err) {
    console.error("transcribe error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

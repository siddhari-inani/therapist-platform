import { NextRequest, NextResponse } from "next/server";
import {
  classifyGeminiError,
  generateContent,
  getGeminiApiKeySource,
  isGeminiConfigured,
} from "@/lib/gemini";

const SOAP_STRUCTURE_SYSTEM = `You are a clinical documentation assistant for physical therapy. Your task is to take a raw transcript of a therapist's voice notes or session summary and structure it into a SOAP note format.

SOAP format:
- **Subjective (S):** What the patient reports – symptoms, pain level, concerns, history, functional limitations. Use direct or summarized patient quotes where appropriate.
- **Objective (O):** Observable findings – range of motion, strength, posture, gait, special tests, measurements, clinical observations.
- **Assessment (A):** Clinical interpretation – diagnosis/impression, progress toward goals, response to treatment, clinical reasoning.
- **Plan (P):** Next steps – treatment plan, exercises, frequency, follow-up, patient education, referrals.

Rules:
- Output valid JSON only, with keys: subjective, objective, assessment, plan.
- Each value must be a string. Use empty string "" for a section if the transcript does not contain relevant information.
- Preserve clinical terminology and specifics from the transcript. Do not invent information.
- Keep each section concise but complete. Use bullet points or short paragraphs as appropriate.
- If the transcript is mostly one category (e.g. only subjective), put that content in the right section and leave others as "" or a brief placeholder like "To be documented."
- Do not include markdown or extra formatting inside the strings – plain text only.`;

export async function POST(request: NextRequest) {
  try {
    if (!isGeminiConfigured()) {
      const source = getGeminiApiKeySource();
      console.error("soap-from-transcript: Gemini key not configured", { source });
      return NextResponse.json(
        {
          error:
            "Gemini API key is not set for the server runtime. Add GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY) and restart the dev server.",
          configSource: source,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { transcript } = body as { transcript?: string };

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    const result = await generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Structure the following transcript into a SOAP note. Reply with only a single JSON object with keys subjective, objective, assessment, plan and string values.\n\nTranscript:\n${transcript.trim()}`,
            },
          ],
        },
      ],
      systemInstruction: { parts: [{ text: SOAP_STRUCTURE_SYSTEM }] },
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
    });

    if (!result.ok) {
      const message = result.error ?? "";
      const category = classifyGeminiError(result.status, message);
      const friendlyError =
        category === "quota_or_billing"
          ? "Gemini quota exceeded. Check quotas at https://aistudio.google.com/apikey"
          : category === "api_key_or_auth" || category === "misconfigured"
            ? "Gemini API key issue. Check your key at https://aistudio.google.com/apikey"
            : category === "temporary_unavailable"
              ? "Gemini is temporarily unavailable. Please try again in a minute."
              : message || "AI structuring failed";
      return NextResponse.json(
        {
          error: friendlyError,
          category,
          status: result.status ?? 500,
          ...(process.env.NODE_ENV === "development" ? { rawError: message } : {}),
        },
        { status: result.status === 429 ? 429 : result.status ?? 500 }
      );
    }

    const content = result.text.trim();
    if (!content) {
      return NextResponse.json(
        { error: "No structured response from AI" },
        { status: 500 }
      );
    }

    let parsed: { subjective?: string; objective?: string; assessment?: string; plan?: string };
    const stripped = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    const toParse = jsonMatch ? jsonMatch[0] : stripped;
    try {
      parsed = JSON.parse(toParse) as typeof parsed;
    } catch (parseErr) {
      console.error("soap-from-transcript parse error:", parseErr, "content:", content.slice(0, 200));
      return NextResponse.json(
        { error: "AI returned invalid JSON. Try again or edit the transcript." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subjective: typeof parsed.subjective === "string" ? parsed.subjective : "",
      objective: typeof parsed.objective === "string" ? parsed.objective : "",
      assessment: typeof parsed.assessment === "string" ? parsed.assessment : "",
      plan: typeof parsed.plan === "string" ? parsed.plan : "",
    });
  } catch (err) {
    console.error("soap-from-transcript error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

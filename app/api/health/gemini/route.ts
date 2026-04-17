import { NextResponse } from "next/server";
import { getGeminiApiKeySource, isGeminiConfigured } from "@/lib/gemini";

export async function GET() {
  const configured = isGeminiConfigured();
  const source = getGeminiApiKeySource();

  return NextResponse.json(
    {
      ok: true,
      service: "gemini",
      configured,
      source,
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      environment: process.env.VERCEL_ENV ?? "local",
      // Intentionally only reports key source; never include key value.
      checkedAt: new Date().toISOString(),
    },
    { status: configured ? 200 : 503 }
  );
}

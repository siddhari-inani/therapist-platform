/**
 * Google Gemini API helpers (REST).
 * Uses GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY) from env.
 * Get a key at https://aistudio.google.com/apikey
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash";

function getApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
}

type GeminiApiKeySource =
  | "GEMINI_API_KEY"
  | "GOOGLE_API_KEY"
  | "GOOGLE_GENERATIVE_AI_API_KEY"
  | "missing";

export function getGeminiApiKeySource(): GeminiApiKeySource {
  if (process.env.GEMINI_API_KEY) return "GEMINI_API_KEY";
  if (process.env.GOOGLE_API_KEY) return "GOOGLE_API_KEY";
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "GOOGLE_GENERATIVE_AI_API_KEY";
  return "missing";
}

function getModel(): string {
  return process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
}

export type GeminiContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export type GeminiGenerateContentParams = {
  contents: { role?: "user" | "model"; parts: GeminiContentPart[] }[];
  systemInstruction?: { parts: [{ text: string }] };
  generationConfig?: { temperature?: number; maxOutputTokens?: number };
};

export type GeminiGenerateContentResult =
  | { ok: true; text: string }
  | { ok: false; error: string; status?: number };

export type GeminiErrorCategory =
  | "quota_or_billing"
  | "api_key_or_auth"
  | "temporary_unavailable"
  | "misconfigured"
  | "other";

/**
 * Categorize Gemini failures so route handlers can return accurate user-facing errors.
 */
export function classifyGeminiError(status?: number, error?: string): GeminiErrorCategory {
  const message = error ?? "";

  if (status === 429 || /quota|billing|insufficient|limit exceeded|resource_exhausted/i.test(message)) {
    return "quota_or_billing";
  }

  if (
    status === 401 ||
    status === 403 ||
    /api key|invalid key|permission|unauthorized|forbidden/i.test(message)
  ) {
    return "api_key_or_auth";
  }

  if (
    /api key is missing|set gemini_api_key|google_api_key|google_generative_ai_api_key|key is not set/i.test(
      message
    )
  ) {
    return "misconfigured";
  }

  if (status === 503 && /service unavailable|overloaded|try again|temporar/i.test(message)) {
    return "temporary_unavailable";
  }

  return "other";
}

/**
 * Call Gemini generateContent. Returns extracted text or error.
 */
export async function generateContent(
  params: GeminiGenerateContentParams,
  model?: string
): Promise<GeminiGenerateContentResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "Gemini API key is missing. Set GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY.",
      status: 503,
    };
  }

  const modelId = model ?? getModel();
  const body: Record<string, unknown> = {
    contents: params.contents.map((c) => ({
      role: c.role ?? "user",
      parts: c.parts,
    })),
    generationConfig: {
      temperature: params.generationConfig?.temperature ?? 0.7,
      maxOutputTokens: params.generationConfig?.maxOutputTokens ?? 2000,
    },
  };
  if (params.systemInstruction) {
    body.systemInstruction = params.systemInstruction;
  }

  const callGemini = async (targetModel: string): Promise<GeminiGenerateContentResult> => {
    const url = `${GEMINI_BASE}/${targetModel}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.error?.message ?? data?.error?.status ?? "Gemini API error";
      return {
        ok: false,
        error: String(message),
        status: response.status,
      };
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    if (!text) {
      return {
        ok: false,
        error: "No text in Gemini response.",
        status: 500,
      };
    }

    return { ok: true, text };
  };

  const firstAttempt = await callGemini(modelId);
  if (firstAttempt.ok) {
    return firstAttempt;
  }

  const shouldTryFallbackModel =
    !model &&
    modelId !== FALLBACK_MODEL &&
    (firstAttempt.status === 503 ||
      firstAttempt.status === 404 ||
      /model|not found|unsupported|unavailable|overloaded|try again/i.test(firstAttempt.error));

  if (shouldTryFallbackModel) {
    const fallbackAttempt = await callGemini(FALLBACK_MODEL);
    if (fallbackAttempt.ok) {
      return fallbackAttempt;
    }

    return {
      ok: false,
      error: `Gemini failed on models ${modelId} and ${FALLBACK_MODEL}: ${fallbackAttempt.error}`,
      status: fallbackAttempt.status ?? firstAttempt.status,
    };
  }

  return firstAttempt;
}

/** Check if Gemini is configured (key set). */
export function isGeminiConfigured(): boolean {
  return Boolean(getApiKey());
}

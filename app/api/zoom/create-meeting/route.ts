import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      "Missing Zoom credentials. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET."
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(ZOOM_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "account_credentials",
      account_id: accountId,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom token failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function getZoomUserId(accessToken: string): Promise<string> {
  const userId = process.env.ZOOM_USER_ID;
  if (userId) return userId;

  const res = await fetch(`${ZOOM_API_BASE}/users?status=active&page_size=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error("Zoom: could not list users. Set ZOOM_USER_ID to your Zoom user ID (e.g. email).");
  }
  const data = (await res.json()) as { users?: { id: string }[] };
  const first = data.users?.[0]?.id;
  if (!first) throw new Error("Zoom: no users found. Set ZOOM_USER_ID to your Zoom user ID.");
  return first;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      start_time,
      duration_minutes,
      topic,
    } = body as {
      start_time: string;
      duration_minutes: number;
      topic?: string;
    };

    if (!start_time || typeof duration_minutes !== "number" || duration_minutes < 5) {
      return NextResponse.json(
        { error: "Invalid request: start_time and duration_minutes (min 5) required" },
        { status: 400 }
      );
    }

    const accessToken = await getZoomAccessToken();
    const zoomUserId = await getZoomUserId(accessToken);

    const startDate = new Date(start_time);
    const zoomStartTime = startDate.toISOString().replace(/\.\d{3}Z$/, "Z");
    const duration = Math.min(Math.max(Math.round(duration_minutes), 5), 480);

    const meetingPayload = {
      topic: topic || "Therapy session",
      type: 2,
      start_time: zoomStartTime,
      duration,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      settings: {
        join_before_host: true,
        waiting_room: false,
        approval_type: 2,
      },
    };

    const createRes = await fetch(`${ZOOM_API_BASE}/users/${encodeURIComponent(zoomUserId)}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(meetingPayload),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("Zoom create meeting error:", createRes.status, errText);
      return NextResponse.json(
        { error: "Failed to create Zoom meeting", details: errText },
        { status: 502 }
      );
    }

    const meeting = (await createRes.json()) as {
      id: number;
      join_url: string;
      start_url?: string;
    };

    return NextResponse.json({
      meeting_id: String(meeting.id),
      join_url: meeting.join_url,
      start_url: meeting.start_url || meeting.join_url,
    });
  } catch (err) {
    console.error("Zoom create-meeting error:", err);
    const message = err instanceof Error ? err.message : "Failed to create Zoom meeting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

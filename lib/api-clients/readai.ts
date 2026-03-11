import axios from "axios";
import { sql } from "@vercel/postgres";
import { ReadAiMeeting, TranscriptLine, MeetingDetail } from "@/types/readai";

const BASE_URL = "https://api.read.ai/v1";

// In-memory token cache
let tokenCache: {
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
} | null = null;

async function getStoredRefreshToken(): Promise<string | null> {
  try {
    const result = await sql`SELECT value FROM settings WHERE key = 'read_ai_refresh_token'`;
    return result.rows[0]?.value || null;
  } catch {
    return null;
  }
}

async function saveRefreshToken(token: string): Promise<void> {
  try {
    await sql`
      INSERT INTO settings (key, value) VALUES ('read_ai_refresh_token', ${token})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  } catch {
    // Non-fatal — continue even if DB write fails
  }
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 30s buffer)
  if (tokenCache && tokenCache.expiresAt > now + 30000) {
    return tokenCache.accessToken;
  }

  // Try DB first, then env fallback
  const storedToken = await getStoredRefreshToken();
  const refreshToken = tokenCache?.refreshToken || storedToken || process.env.READ_AI_REFRESH_TOKEN;
  const clientId = process.env.READ_AI_CLIENT_ID;
  const clientSecret = process.env.READ_AI_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Read.ai OAuth credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://authn.read.ai/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to refresh Read.ai token: ${response.status} ${text}`);
  }

  const data = await response.json();

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
    refreshToken: data.refresh_token,
  };

  // Persist the new refresh token so it survives server restarts
  await saveRefreshToken(data.refresh_token);

  return tokenCache.accessToken;
}

async function getClient() {
  const token = await getAccessToken();
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
}

export interface MeetingsResponse {
  meetings: ReadAiMeeting[];
  nextCursor: string | null;
}

export async function listMeetings(cursor?: string): Promise<MeetingsResponse> {
  const client = await getClient();
  const params: Record<string, string> = {};
  if (cursor) params.cursor = cursor;

  const { data } = await client.get("/meetings", { params });

  const rawMeetings = data.data || data.meetings || data.results || [];

  const meetings: ReadAiMeeting[] = rawMeetings.map((m: Record<string, unknown>) => {
    const startMs = (m.start_time_ms as number) || 0;
    const endMs = (m.end_time_ms as number) || 0;
    const durationSeconds = startMs && endMs ? Math.round((endMs - startMs) / 1000) : 0;
    const participants = (m.participants as unknown[]) || [];

    return {
      id: m.id as string,
      title: (m.title as string) || (m.name as string) || "Untitled Meeting",
      date: startMs ? new Date(startMs).toISOString() : ((m.created_at as string) || new Date().toISOString()),
      duration: durationSeconds,
      participantCount: participants.length,
      status: (m.status as string) || "completed",
    };
  });

  return {
    meetings,
    nextCursor: data.next_cursor || data.cursor || null,
  };
}

export interface MeetingWithTranscript {
  meeting: MeetingDetail;
  transcript: TranscriptLine[];
}

export async function getMeetingWithTranscript(
  id: string
): Promise<MeetingWithTranscript> {
  const client = await getClient();
  const { data } = await client.get(`/meetings/${id}`, {
    params: { "expand[]": "transcript" },
  });

  const raw = data.meeting || data;

  const startMs = (raw.start_time_ms as number) || 0;
  const endMs = (raw.end_time_ms as number) || 0;

  const meeting: MeetingDetail = {
    id: raw.id,
    title: raw.title || raw.name || "Untitled Meeting",
    date: startMs ? new Date(startMs).toISOString() : (raw.created_at || new Date().toISOString()),
    duration: startMs && endMs ? Math.round((endMs - startMs) / 1000) : (raw.duration_seconds || 0),
    participants: (raw.participants || []).map((p: Record<string, unknown>) => ({
      name: (p.name as string) || (p.display_name as string) || "Unknown",
      email: p.email as string | undefined,
    })),
  };

  // API returns transcript.turns[], each with speaker.name and text
  const turns = raw.transcript?.turns || raw.transcript?.transcript || raw.transcript || [];
  const rawTranscript = Array.isArray(turns) ? turns : [];

  const transcript: TranscriptLine[] = rawTranscript.map(
    (line: Record<string, unknown>) => {
      const speaker = line.speaker as Record<string, unknown> | string | undefined;
      const speakerName = typeof speaker === "object" && speaker !== null
        ? (speaker.name as string) || "Unknown"
        : (speaker as string) || (line.speaker_name as string) || "Unknown";
      return {
        speaker: speakerName,
        text: (line.text as string) || (line.content as string) || "",
        startTime: (line.start_time_ms as number) || (line.start_time as number) || 0,
      };
    }
  );

  return { meeting, transcript };
}

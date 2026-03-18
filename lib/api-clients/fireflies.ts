import { FirefliesMeeting, TranscriptLine, MeetingDetail } from "@/types/fireflies";

const GRAPHQL_URL = "https://api.fireflies.ai/graphql";

async function query(gql: string, variables?: Record<string, unknown>) {
  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) {
    throw new Error("FIREFLIES_API_KEY is not configured");
  }

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query: gql, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = Object.assign(new Error(`Fireflies API error: ${response.status} ${text}`), {
      response: { status: response.status },
    });
    throw err;
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`Fireflies GraphQL error: ${json.errors[0].message}`);
  }

  return json.data;
}

export interface MeetingsResponse {
  meetings: FirefliesMeeting[];
  nextCursor: string | null;
}

export async function listMeetings(cursor?: string): Promise<MeetingsResponse> {
  const skip = cursor ? parseInt(cursor, 10) : 0;
  const limit = 20;

  const data = await query(
    `query GetTranscripts($limit: Int, $skip: Int) {
      transcripts(limit: $limit, skip: $skip) {
        id
        title
        date
        duration
        participants
      }
    }`,
    { limit, skip }
  );

  const raw: Array<Record<string, unknown>> = data.transcripts || [];

  const meetings: FirefliesMeeting[] = raw.map((m) => ({
    id: m.id as string,
    title: (m.title as string) || "Untitled Meeting",
    date: m.date ? new Date(m.date as number).toISOString() : new Date().toISOString(),
    duration: ((m.duration as number) || 0) * 60, // minutes → seconds
    participantCount: ((m.participants as string[]) || []).length,
    status: "completed",
  }));

  const nextCursor = raw.length === limit ? String(skip + limit) : null;

  return { meetings, nextCursor };
}

export interface MeetingWithTranscript {
  meeting: MeetingDetail;
  transcript: TranscriptLine[];
}

export async function getMeetingWithTranscript(id: string): Promise<MeetingWithTranscript> {
  const data = await query(
    `query GetTranscript($id: String!) {
      transcript(id: $id) {
        id
        title
        date
        duration
        participants
        sentences {
          speaker_name
          text
          start_time
        }
      }
    }`,
    { id }
  );

  const raw = data.transcript;
  if (!raw) {
    const err = Object.assign(new Error("Meeting not found"), {
      response: { status: 404 },
    });
    throw err;
  }

  const meeting: MeetingDetail = {
    id: raw.id,
    title: raw.title || "Untitled Meeting",
    date: raw.date ? new Date(raw.date as number).toISOString() : new Date().toISOString(),
    duration: ((raw.duration as number) || 0) * 60, // minutes → seconds
    participants: ((raw.participants as string[]) || []).map((name: string) => ({ name })),
  };

  const transcript: TranscriptLine[] = ((raw.sentences as Array<Record<string, unknown>>) || []).map(
    (s) => ({
      speaker: (s.speaker_name as string) || "Unknown",
      text: (s.text as string) || "",
      startTime: ((s.start_time as number) || 0) * 1000, // seconds → ms
    })
  );

  return { meeting, transcript };
}

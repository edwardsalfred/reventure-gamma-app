import Link from "next/link";
import { getMeetingWithTranscript } from "@/lib/api-clients/readai";
import { TranscriptViewer } from "@/components/meetings/TranscriptViewer";
import { GenerateButton } from "@/components/generate/GenerateButton";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

interface Props {
  params: { meetingId: string };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
}

export default async function MeetingDetailPage({ params }: Props) {
  let meetingData;
  let errorMessage: string | null = null;
  try {
    meetingData = await getMeetingWithTranscript(params.meetingId);
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  if (errorMessage || !meetingData) {
    return (
      <div className="max-w-4xl">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
          ← Back to meetings
        </Link>
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
          Failed to load meeting: {errorMessage || "Unknown error"}
        </div>
      </div>
    );
  }

  const { meeting, transcript } = meetingData;

  return (
    <div className="max-w-4xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to meetings
      </Link>

      <div className="space-y-6">
        {/* Meeting header */}
        <Card>
          <CardHeader>
            <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Date</dt>
                <dd className="font-medium text-gray-900 mt-0.5">
                  {formatDate(meeting.date)}
                </dd>
              </div>
              {meeting.duration > 0 && (
                <div>
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">
                    {formatDuration(meeting.duration)}
                  </dd>
                </div>
              )}
              {meeting.participants.length > 0 && (
                <div>
                  <dt className="text-gray-500">Participants</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">
                    {meeting.participants.map((p) => p.name).join(", ")}
                  </dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>

        {/* Generate proposal */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Generate Proposal</h2>
            <p className="text-sm text-gray-500 mt-1">
              AI will analyze the transcript and create a professional business proposal,
              then generate a Gamma presentation for you to share with the client.
            </p>
          </CardHeader>
          <CardBody>
            <GenerateButton
              meetingId={meeting.id}
              meetingTitle={meeting.title}
              transcript={transcript}
            />
          </CardBody>
        </Card>

        {/* Transcript */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Transcript</h2>
              <span className="text-xs text-gray-400">
                {transcript.length} lines
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <TranscriptViewer transcript={transcript} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

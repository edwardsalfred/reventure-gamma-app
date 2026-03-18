"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { FirefliesMeeting } from "@/types/fireflies";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MeetingsList() {
  const [meetings, setMeetings] = useState<FirefliesMeeting[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  async function fetchMeetings(cursor?: string) {
    const url = cursor ? `/api/meetings?cursor=${cursor}` : "/api/meetings";
    const res = await fetch(url);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to load meetings");
    }
    return res.json();
  }

  useEffect(() => {
    fetchMeetings()
      .then((data) => {
        setMeetings(data.meetings);
        setNextCursor(data.nextCursor);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  async function loadMore() {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchMeetings(nextCursor);
      setMeetings((prev) => [...prev, ...data.meetings]);
      setNextCursor(data.nextCursor);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} className="mt-4" />;
  }

  if (meetings.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium mb-1">No meetings found</p>
        <p className="text-sm">Your Fireflies recordings will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <Link
          key={meeting.id}
          href={`/dashboard/${meeting.id}`}
          className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                {meeting.title}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                <span>{formatDate(meeting.date)}</span>
                {meeting.duration > 0 && (
                  <>
                    <span>·</span>
                    <span>{formatDuration(meeting.duration)}</span>
                  </>
                )}
                {meeting.participantCount > 0 && (
                  <>
                    <span>·</span>
                    <span>{meeting.participantCount} participants</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={meeting.status === "completed" ? "green" : "yellow"}>
                {meeting.status}
              </Badge>
              <svg
                className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
      {nextCursor && (
        <div className="text-center pt-4">
          <Button
            variant="secondary"
            onClick={loadMore}
            isLoading={isLoadingMore}
          >
            Load more meetings
          </Button>
        </div>
      )}
    </div>
  );
}

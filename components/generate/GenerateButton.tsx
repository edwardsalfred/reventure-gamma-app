"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { GenerationProgress } from "./GenerationProgress";
import { TranscriptLine } from "@/types/fireflies";

type GenerationState = "idle" | "generating" | "polling" | "done" | "error" | "timeout";

const MAX_POLL_ATTEMPTS = 60; // 5 minutes
const POLL_INTERVAL_MS = 5000;

interface GenerateButtonProps {
  meetingId: string;
  meetingTitle: string;
  transcript: TranscriptLine[];
}

export function GenerateButton({
  meetingId,
  meetingTitle,
  transcript,
}: GenerateButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<GenerationState>("idle");
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (transcript.length === 0) {
      setError("This meeting has no transcript. Cannot generate a proposal.");
      return;
    }

    setError("");
    setState("generating");

    let presentationId: number;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, meetingTitle, transcript }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start generation.");
        setState("error");
        return;
      }

      presentationId = data.presentationId;
    } catch {
      setError("Network error. Please check your connection.");
      setState("error");
      return;
    }

    // Start polling
    setState("polling");
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;

      if (attempts > MAX_POLL_ATTEMPTS) {
        clearInterval(poll);
        setState("timeout");
        setError("Generation timed out. Please check your presentations later.");
        return;
      }

      try {
        const res = await fetch(`/api/presentations/${presentationId}`);
        const data = await res.json();

        if (data.status === "completed") {
          clearInterval(poll);
          setState("done");
          setTimeout(() => {
            router.push(`/presentation/${presentationId}`);
          }, 500);
        } else if (data.status === "failed") {
          clearInterval(poll);
          setState("error");
          setError(data.error_message || "Presentation generation failed.");
        }
      } catch {
        // Swallow polling errors — will retry
      }
    }, POLL_INTERVAL_MS);
  }

  const isActive = state === "generating" || state === "polling";

  return (
    <div className="space-y-4">
      <Button
        size="lg"
        onClick={handleGenerate}
        disabled={isActive || state === "done"}
        isLoading={isActive}
        className="w-full sm:w-auto"
      >
        {state === "done"
          ? "Redirecting to presentation..."
          : isActive
          ? "Generating..."
          : "Generate Proposal"}
      </Button>

      {isActive || state === "done" ? (
        <GenerationProgress state={state} />
      ) : null}

      {(state === "error" || state === "timeout") && error && (
        <ErrorMessage message={error} />
      )}
    </div>
  );
}

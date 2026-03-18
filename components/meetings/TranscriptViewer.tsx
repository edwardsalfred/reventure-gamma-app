"use client";

import { useState } from "react";
import { TranscriptLine } from "@/types/fireflies";
import { Button } from "@/components/ui/Button";

interface TranscriptViewerProps {
  transcript: TranscriptLine[];
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  const displayLines = isExpanded ? transcript : transcript.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {displayLines.map((line, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="text-gray-400 font-mono shrink-0 mt-0.5 text-xs">
              {formatTime(line.startTime)}
            </span>
            <div>
              <span className="font-medium text-gray-700">{line.speaker}: </span>
              <span className="text-gray-600">{line.text}</span>
            </div>
          </div>
        ))}
      </div>
      {transcript.length > 8 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-brand-600"
        >
          {isExpanded
            ? "Show less"
            : `Show all ${transcript.length} lines`}
        </Button>
      )}
      {transcript.length === 0 && (
        <p className="text-sm text-gray-500 italic">No transcript available for this meeting.</p>
      )}
    </div>
  );
}

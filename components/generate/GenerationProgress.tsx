import React from "react";
import { Spinner } from "@/components/ui/Spinner";

type GenerationState = "idle" | "generating" | "polling" | "done" | "error" | "timeout";

interface Step {
  label: string;
  activeState: GenerationState[];
  completedStates: GenerationState[];
}

const STEPS: Step[] = [
  {
    label: "Analyzing transcript with AI...",
    activeState: ["generating"],
    completedStates: ["polling", "done"],
  },
  {
    label: "Creating presentation in Gamma...",
    activeState: ["polling"],
    completedStates: ["done"],
  },
  {
    label: "Presentation ready!",
    activeState: [],
    completedStates: ["done"],
  },
];

interface GenerationProgressProps {
  state: GenerationState;
}

export function GenerationProgress({ state }: GenerationProgressProps) {
  return (
    <div className="space-y-3 mt-4">
      {STEPS.map((step, i) => {
        const isActive = step.activeState.includes(state);
        const isCompleted = step.completedStates.includes(state);
        const isPending = !isActive && !isCompleted;

        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              {isActive && <Spinner size="sm" />}
              {isCompleted && (
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isPending && (
                <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
              )}
            </div>
            <span
              className={`text-sm ${
                isActive
                  ? "text-gray-900 font-medium"
                  : isCompleted
                  ? "text-green-700"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

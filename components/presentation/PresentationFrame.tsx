"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";

interface PresentationFrameProps {
  gammaUrl: string;
  title: string;
}

export function PresentationFrame({ gammaUrl, title }: PresentationFrameProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Gamma blocks iframes, so onLoad may never fire — clear spinner after 3s
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 4rem)" }}>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-500">Loading presentation...</p>
        </div>
      )}
      <iframe
        src={gammaUrl}
        title={title}
        className="w-full h-full border-0"
        onLoad={() => setIsLoading(false)}
        referrerPolicy="no-referrer"
        allow="fullscreen"
      />
      {/* Fallback link */}
      <div className="absolute top-3 right-3 z-20">
        <a
          href={gammaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs bg-white/90 backdrop-blur border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:text-brand-600 transition-colors shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open in Gamma
        </a>
      </div>
    </div>
  );
}

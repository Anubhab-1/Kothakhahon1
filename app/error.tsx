"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ideally log to Sentry or another error tracking service here in production
    console.error("Application Error Caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 font-body">
      <div className="flex w-full max-w-md flex-col items-center space-y-8 border shadow-lg border-bronze/20 bg-void/80 p-10 backdrop-blur-sm text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-red-950/30 text-red-500 border border-red-900/50">
          <AlertTriangle size={32} />
        </div>
        
        <div className="space-y-3">
          <h2 className="font-heading text-2xl font-light tracking-wide text-parchment">
            A Disruption Occurred
          </h2>
          <p className="text-sm text-parchment/70 font-mono leading-relaxed">
            We encountered an unexpected anomaly while retrieving this page.
          </p>
        </div>

        <div className="flex flex-col w-full gap-3 pt-2 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="flex-1 px-4 py-3 border border-bronze/30 hover:border-bronze hover:bg-bronze/10 transition-colors uppercase tracking-widest text-xs font-semibold text-bronze"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 px-4 py-3 bg-bronze hover:bg-bronze-light text-void transition-colors uppercase tracking-widest text-xs font-semibold"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";
import Link from "next/link";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AccountErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    logger.error("Customer account path encountered an unhandled error", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="editorial-panel max-w-md rounded-2xl p-8 border border-smoke bg-obsidian">
        <h2 className="font-title text-3xl text-ivory mb-4">Account Panel Error</h2>
        <p className="font-body text-stone mb-6">
          An error occurred while displaying your account details. Please try again.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="fx-button rounded-full border border-gold bg-gold px-6 py-2.5 font-ui text-xs tracking-wider text-void hover:bg-gold-dim transition"
          >
            TRY AGAIN
          </button>
          <Link
            href="/account"
            className="fx-button rounded-full border border-smoke bg-void px-6 py-2.5 font-ui text-xs tracking-wider text-parchment hover:border-gold hover:text-gold transition"
          >
            REFRESH
          </Link>
        </div>
      </div>
    </div>
  );
}

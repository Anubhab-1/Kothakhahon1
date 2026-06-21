"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";
import Link from "next/link";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BookDetailErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    logger.error("Book detail path encountered an unhandled error", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="editorial-panel max-w-md rounded-2xl p-8 border border-smoke bg-obsidian">
        <h2 className="font-title text-3xl text-ivory mb-4">Book Page Error</h2>
        <p className="font-body text-stone mb-6">
          We encountered an error while loading the details for this book. Let&apos;s try reloading the page.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="fx-button rounded-full border border-gold bg-gold px-6 py-2.5 font-ui text-xs tracking-wider text-void hover:bg-gold-dim transition"
          >
            RETRY
          </button>
          <Link
            href="/books"
            className="fx-button rounded-full border border-smoke bg-void px-6 py-2.5 font-ui text-xs tracking-wider text-parchment hover:border-gold hover:text-gold transition"
          >
            BACK TO CATALOG
          </Link>
        </div>
      </div>
    </div>
  );
}

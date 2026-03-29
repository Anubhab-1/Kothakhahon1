"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-[#dbb56f] font-sans antialiased">
        <div className="flex flex-col items-center justify-center space-y-6 text-center max-w-md p-8 border border-[#2a2a2a] rounded-lg bg-[#111] shadow-xl">
          <h2 className="text-3xl font-serif tracking-widest text-red-500">
            System Failure
          </h2>
          <p className="text-sm opacity-80 leading-relaxed font-mono">
            A critical error occurred while loading the application shell. Our systems have logged the fault.
          </p>
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => reset()}
              className="px-6 py-2 border border-[#dbb56f]/30 hover:border-[#dbb56f] hover:bg-[#dbb56f]/5 transition-all text-sm uppercase tracking-wider"
            >
              Attempt Recovery
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

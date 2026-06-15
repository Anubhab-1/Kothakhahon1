"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

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
      <body className="flex min-h-screen items-center justify-center bg-[#0a0908] px-4 text-[#d4c9bb] font-sans antialiased">
        <div className="relative w-full max-w-md rounded-3xl border border-[#c9973a]/20 bg-[#161311] p-8 sm:p-10 text-center shadow-[0_22px_60px_rgba(0,0,0,0.6)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#ef4444]/45 bg-[#ef4444]/5 text-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <AlertOctagon className="h-7 w-7" />
          </div>

          <p className="mt-6 font-mono text-[9px] tracking-[0.24em] text-[#ef4444] uppercase font-bold">FATAL FAULT</p>
          <h2 className="mt-3 font-serif text-3xl text-[#faf6ef]">Root Shell Failure</h2>

          <p className="mt-4 text-sm text-[#8c8275] leading-relaxed">
            A critical error occurred while loading the application container. The system has logged the exception.
          </p>

          <div className="mt-8">
            <button
              onClick={() => reset()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-[#c9973a] bg-[#c9973a] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#16130d] transition-all hover:bg-[#b98e3a] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              ATTEMPT RECOVERY
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

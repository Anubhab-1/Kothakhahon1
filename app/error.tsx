"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error Caught:", error);
  }, [error]);

  return (
    <div className="grain-overlay relative min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.08),transparent_70%)]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-ember/30 bg-obsidian/85 p-8 sm:p-12 text-center shadow-[0_22px_60px_rgba(0,0,0,0.5)] backdrop-blur-md"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-ember/45 bg-ember/5 text-ember shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <p className="mt-6 font-ui text-[10px] tracking-[0.24em] text-ember/90 uppercase font-bold">SYSTEM FAULT</p>
        <h1 className="mt-3 font-title text-4xl text-ivory sm:text-5xl">Disruption Occurred</h1>

        <p className="mt-4 font-body text-base text-stone leading-relaxed">
          An unexpected anomaly occurred while rendering this page. Our team has been logged about the error.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
          <button
            onClick={() => reset()}
            className="fx-button flex items-center justify-center gap-2 rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            TRY AGAIN
          </button>
          <Link
            href="/"
            className="fx-button flex items-center justify-center gap-2 rounded-full border border-smoke bg-void/60 px-6 py-3 font-ui text-xs tracking-[0.16em] text-parchment transition hover:border-gold hover:text-gold"
          >
            <Home className="h-3.5 w-3.5" />
            RETURN HOME
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

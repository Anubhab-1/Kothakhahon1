"use client";

import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="grain-overlay relative min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_center,rgba(216,168,75,0.12),transparent_70%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-smoke/70 bg-obsidian/80 p-8 sm:p-12 text-center shadow-[0_22px_60px_rgba(0,0,0,0.4)] backdrop-blur-md"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/45 bg-gold/5 text-gold shadow-[0_0_15px_rgba(201,151,58,0.15)]">
          <Compass className="h-7 w-7" style={{ animation: "spin 20s linear infinite" }} />
        </div>
        
        <p className="mt-6 font-ui text-[10px] tracking-[0.24em] text-gold uppercase">ERROR 404</p>
        <h1 className="mt-3 font-title text-4xl text-ivory sm:text-5xl">Lost In The Stacks</h1>
        
        <p className="mt-4 font-body text-base text-stone leading-relaxed">
          The shelf or page you are looking for does not exist in our catalog. It may have been relocated, or the binding link has expired.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
          <Link
            href="/"
            className="fx-button flex items-center justify-center gap-2 rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim"
          >
            RETURN HOME
          </Link>
          <Link
            href="/books"
            className="fx-button flex items-center justify-center gap-2 rounded-full border border-smoke bg-void/60 px-6 py-3 font-ui text-xs tracking-[0.16em] text-parchment transition hover:border-gold hover:text-gold"
          >
            BROWSE CATALOG
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </motion.div>
      
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

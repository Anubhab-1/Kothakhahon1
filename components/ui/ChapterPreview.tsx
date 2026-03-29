"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

interface ChapterPreviewProps {
  content: string;
  buyLink?: string;
}

export default function ChapterPreview({ content, buyLink }: ChapterPreviewProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-smoke bg-obsidian p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-title text-3xl text-ivory">Sample Pages</h3>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="fx-button rounded-full border border-gold bg-gold px-5 py-2.5 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
        >
          {open ? "HIDE SAMPLE" : "READ SAMPLE"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="relative mt-6">
              <div className="prose prose-invert max-w-none font-body text-lg leading-relaxed text-parchment/95">
                <div className="mx-auto max-w-3xl whitespace-pre-line">{content}</div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-obsidian to-transparent" />
            </div>
            <div className="mt-7 flex justify-center">
              {buyLink ? (
                <Link
                  href={buyLink}
                  className="fx-button rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
                >
                  ORDER THIS EDITION
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-full border border-smoke bg-ash px-6 py-3 font-ui text-xs tracking-[0.14em] text-stone"
                >
                  ORDER LINK NOT AVAILABLE YET
                </span>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

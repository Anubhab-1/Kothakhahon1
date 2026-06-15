"use client";

import { useEffect, useState } from "react";

/**
 * Thin gold reading progress bar fixed at the top of the page.
 * Fills left-to-right as the user scrolls through the article.
 */
export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setProgress(Math.min(100, pct));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[60] h-[3px] bg-gradient-to-r from-gold-dim via-gold to-gold-dim transition-none"
      style={{ width: `${progress}%` }}
    />
  );
}

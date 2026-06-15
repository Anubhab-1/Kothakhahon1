"use client";

import { useEffect } from "react";

/**
 * Fires a confetti burst on mount using canvas-confetti.
 * Loaded dynamically so it doesn't affect bundle size on other pages.
 */
export function ConfettiBurst() {
  useEffect(() => {
    let cancelled = false;
    import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      const confetti = mod.default;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#d8a84b", "#faf6ef", "#e2d7c3", "#b68530", "#ffffff"],
        gravity: 0.9,
        scalar: 1.1,
      });
      // Second smaller burst after 400ms
      setTimeout(() => {
        if (!cancelled) {
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.5, x: 0.3 },
            colors: ["#d8a84b", "#faf6ef"],
            gravity: 1,
          });
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.5, x: 0.7 },
            colors: ["#d8a84b", "#faf6ef"],
            gravity: 1,
          });
        }
      }, 400);
    });
    return () => { cancelled = true; };
  }, []);

  return null;
}

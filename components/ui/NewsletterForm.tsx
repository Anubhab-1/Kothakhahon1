"use client";

import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NewsletterFormProps {
  className?: string;
}

export default function NewsletterForm({ className }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <div className={cn("w-full max-w-xl min-h-[58px]", className)}>
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-center gap-3.5 rounded-2xl border border-gold/30 bg-gold/5 p-4 text-gold backdrop-blur-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 text-gold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-title text-base text-ivory">You're on the list!</p>
              <p className="font-body text-xs text-parchment/70 mt-0.5">
                Thank you for subscribing. We will send you updates and literary updates.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <form
              className="flex w-full flex-col items-stretch gap-2 sm:flex-row"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!email.trim()) return;
                setSubmitError(null);
                setSubmitting(true);

                try {
                  const response = await fetch("/api/newsletter", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                  });

                  if (!response.ok) {
                    const body = (await response.json().catch(() => null)) as { error?: string } | null;
                    setSubmitError(body?.error ?? "Could not subscribe right now.");
                    setSubmitting(false);
                    return;
                  }

                  setSubmitted(true);
                  setEmail("");
                } catch {
                  setSubmitError("Could not subscribe right now.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-full border border-smoke bg-void px-4 py-3 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                suppressHydrationWarning
              />
              <button
                type="submit"
                disabled={submitting}
                className="fx-button inline-flex items-center justify-center gap-2 rounded-full border border-gold bg-gold px-5 py-3 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
                suppressHydrationWarning
              >
                <Mail className="h-4 w-4" />
                {submitting ? "JOINING..." : "JOIN THE LIST"}
              </button>
            </form>
            {submitError ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 font-body text-sm text-ember"
              >
                {submitError}
              </motion.p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

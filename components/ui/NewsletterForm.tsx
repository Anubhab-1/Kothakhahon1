"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsletterFormProps {
  className?: string;
}

export default function NewsletterForm({ className }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <div className={cn("w-full max-w-xl", className)}>
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
      {submitted ? <p className="mt-2 font-body text-sm text-gold">You are on the list.</p> : null}
      {submitError ? <p className="mt-2 font-body text-sm text-ember">{submitError}</p> : null}
    </div>
  );
}

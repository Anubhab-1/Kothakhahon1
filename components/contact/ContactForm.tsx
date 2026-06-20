"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Turnstile from "@/components/ui/Turnstile";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const contactSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Enter a valid email address."),
  department: z.string().min(2, "Select a department."),
  message: z
    .string()
    .min(30, "Message should be at least 30 characters.")
    .max(1800, "Message is too long."),
});

type ContactValues = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const [captchaToken, setCaptchaToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
  });

  const messageLength = watch("message")?.length ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      setSubmitError("Please complete the CAPTCHA.");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, captchaToken }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setSubmitError(body?.error ?? "Failed to send your message. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      reset();
    } catch {
      setSubmitError("Failed to send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  });

  if (submitted) {
    return (
      <div className="editorial-panel rounded-2xl p-8 md:p-10">
        <p className="font-ui text-xs tracking-[0.15em] text-gold">MESSAGE SENT</p>
        <h3 className="mt-3 font-title text-4xl text-ivory">Your message is with the desk.</h3>
        <p className="mt-3 max-w-2xl font-body text-lg text-parchment/95">
          We have received your note. Our team usually replies within 1 to 2 business days.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="fx-button mt-6 rounded-full border border-smoke bg-obsidian px-5 py-2.5 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
        >
          WRITE ANOTHER MESSAGE
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="editorial-panel rounded-2xl p-7 md:p-9">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="font-ui text-xs tracking-[0.13em] text-parchment">
            FULL NAME <span className="text-gold ml-1 font-bold" aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            {...register("fullName")}
            className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="Your full name"
          />
          {errors.fullName ? <p className="text-sm text-ember">{errors.fullName.message as string}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="font-ui text-xs tracking-[0.13em] text-parchment">
            EMAIL <span className="text-gold ml-1 font-bold" aria-hidden="true">*</span>
          </label>
          <input
            type="email"
            {...register("email")}
            className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="you@example.com"
          />
          {errors.email ? <p className="text-sm text-ember">{errors.email.message as string}</p> : null}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <label className="font-ui text-xs tracking-[0.13em] text-parchment">
          DEPARTMENT <span className="text-gold ml-1 font-bold" aria-hidden="true">*</span>
        </label>
        <select
          {...register("department")}
          className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
        >
          <option value="">Choose the right desk</option>
          <option value="Editorial">Editorial</option>
          <option value="Submissions">Submissions</option>
          <option value="Rights & Licensing">Rights & Permissions</option>
          <option value="General">General Inquiry</option>
        </select>
        {errors.department ? <p className="text-sm text-ember">{errors.department.message as string}</p> : null}
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="font-ui text-xs tracking-[0.13em] text-parchment">
            MESSAGE <span className="text-gold ml-1 font-bold" aria-hidden="true">*</span>
          </label>
          <span className="font-mono text-xs text-stone">{messageLength}/1800</span>
        </div>
        <textarea
          rows={7}
          {...register("message")}
          className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
          placeholder="Tell us what you need, including title names or submission context if relevant..."
        />
        {errors.message ? <p className="text-sm text-ember">{errors.message.message as string}</p> : null}
      </div>

      {submitError ? <p className="mt-4 text-sm text-ember">{submitError}</p> : null}

      <Turnstile onChange={setCaptchaToken} />

      <button
        type="submit"
        disabled={submitting}
        className="fx-button mt-6 rounded-full border border-gold bg-gold px-7 py-3 font-ui text-xs tracking-[0.15em] text-void shadow-lg transition hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "SENDING..." : "SEND TO THE DESK"}
      </button>
    </form>
  );
}

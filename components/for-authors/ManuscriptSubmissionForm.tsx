"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const manuscriptSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().min(8, "Enter a valid phone number."),
  city: z.string().min(2, "Enter your city."),
  manuscriptTitle: z.string().min(2, "Enter manuscript title."),
  genre: z.string().min(2, "Select or enter a genre."),
  wordCount: z
    .number()
    .int("Word count must be a whole number.")
    .min(1000, "Minimum 1000 words.")
    .max(400000, "Word count seems too high."),
  language: z.string().min(2, "Enter manuscript language."),
  synopsis: z
    .string()
    .min(120, "Synopsis must be at least 120 characters.")
    .max(4000, "Synopsis is too long."),
});

type ManuscriptValues = z.infer<typeof manuscriptSchema>;

export default function ManuscriptSubmissionForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ManuscriptValues>({
    resolver: zodResolver(manuscriptSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/manuscript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setSubmitError(body?.error ?? "We could not submit your manuscript right now. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      reset();
    } catch {
      setSubmitError("We could not submit your manuscript right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  });

  if (submitted) {
    return (
      <div className="fx-card rounded-2xl border border-gold/45 bg-gradient-to-br from-obsidian to-ash p-8 md:p-10">
        <p className="font-ui text-xs tracking-[0.16em] text-gold">SUBMISSION RECEIVED</p>
        <h3 className="mt-3 font-title text-4xl text-ivory">Your manuscript is in the queue.</h3>
        <p className="mt-3 max-w-2xl font-body text-lg text-parchment/95">
          Our editorial team will review your submission and contact you within 4 to 6 weeks.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="fx-button mt-6 rounded-full border border-smoke bg-obsidian px-5 py-2.5 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
        >
          SEND ANOTHER SUBMISSION
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="fx-card space-y-5 rounded-2xl border border-smoke bg-obsidian p-7 md:p-9">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="font-ui text-xs tracking-[0.13em] text-parchment">FULL NAME</label>
          <input
            type="text"
            {...register("fullName")}
            className="w-full rounded-md border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="Your full name"
          />
          {errors.fullName ? <p className="text-sm text-ember">{errors.fullName.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="font-ui text-xs tracking-[0.13em] text-parchment">EMAIL</label>
          <input
            type="email"
            {...register("email")}
            className="w-full rounded-md border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="you@example.com"
          />
          {errors.email ? <p className="text-sm text-ember">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="font-ui text-xs tracking-[0.13em] text-parchment">PHONE</label>
          <input
            type="text"
            {...register("phone")}
            className="w-full rounded-md border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="+91 98XXXXXXXX"
          />
          {errors.phone ? <p className="text-sm text-ember">{errors.phone.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="font-ui text-xs tracking-[0.13em] text-parchment">CITY</label>
          <input
            type="text"
            {...register("city")}
            className="w-full rounded-md border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="Kolkata"
          />
          {errors.city ? <p className="text-sm text-ember">{errors.city.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="font-ui text-xs tracking-[0.13em] text-parchment">MANUSCRIPT TITLE</label>
          <input
            type="text"
            {...register("manuscriptTitle")}
            className="w-full rounded-md border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="Title of your manuscript"
          />
          {errors.manuscriptTitle ? (
            <p className="text-sm text-ember">{errors.manuscriptTitle.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="font-ui text-xs tracking-[0.13em] text-parchment">GENRE</label>
          <input
            type="text"
            {...register("genre")}
            className="w-full rounded-md border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="Literary Fiction / Poetry / Essays / Narrative Non-Fiction"
          />
          {errors.genre ? <p className="text-sm text-ember">{errors.genre.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="font-ui text-xs tracking-[0.13em] text-parchment">WORD COUNT</label>
          <input
            type="number"
            {...register("wordCount", { valueAsNumber: true })}
            className="w-full rounded-md border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="75000"
          />
          {errors.wordCount ? <p className="text-sm text-ember">{errors.wordCount.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="font-ui text-xs tracking-[0.13em] text-parchment">LANGUAGE</label>
          <input
            type="text"
            {...register("language")}
            className="w-full rounded-md border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="Bengali"
          />
          {errors.language ? <p className="text-sm text-ember">{errors.language.message}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-ui text-xs tracking-[0.13em] text-parchment">SYNOPSIS</label>
        <textarea
          rows={7}
          {...register("synopsis")}
          className="w-full rounded-md border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
          placeholder="Summarize the manuscript, its central conflict or idea, and where it currently stands..."
        />
        {errors.synopsis ? <p className="text-sm text-ember">{errors.synopsis.message}</p> : null}
      </div>

      {submitError ? <p className="text-sm text-ember">{submitError}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="fx-button rounded-full border border-gold bg-gold px-7 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "SUBMITTING..." : "SEND MANUSCRIPT FOR REVIEW"}
      </button>
    </form>
  );
}

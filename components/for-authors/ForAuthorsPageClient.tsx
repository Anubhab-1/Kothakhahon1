"use client";

import { CheckCircle2 } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import Accordion from "@/components/ui/Accordion";
import ManuscriptSubmissionForm from "@/components/for-authors/ManuscriptSubmissionForm";
import { motion } from "@/components/ui/StaticMotion";

const heroVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
      staggerChildren: 0.08,
    },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const lookingFor = [
  "Distinctive literary voice with clarity of intent",
  "Strong command over structure, pacing, and language",
  "Original perspective with cultural or emotional depth",
  "Manuscripts that can sustain editorial collaboration",
  "Works aligned with long-term literary value",
];

const submissionBlocks = [
  {
    title: "Format",
    description:
      "Send your manuscript as a clean digital document with clear chapter breaks and page numbers.",
  },
  {
    title: "Sample & Synopsis",
    description:
      "Include a concise synopsis and a strong representative sample if the manuscript is incomplete.",
  },
  {
    title: "Response Window",
    description:
      "Editorial review usually takes 4-6 weeks. We respond to all submissions that pass internal screening.",
  },
];

const processSteps = [
  { title: "Submission", detail: "We receive and log your manuscript." },
  { title: "Editorial Review", detail: "Internal editorial reading and evaluation." },
  { title: "Discussion", detail: "Promising works move to direct author conversation." },
  { title: "Contract", detail: "Selected manuscripts enter our publication pipeline." },
];

const faqItems = [
  {
    id: "faq-1",
    title: "Do you accept simultaneous submissions?",
    content:
      "Yes, but please mention it in your synopsis so our editorial team can assess timelines appropriately.",
  },
  {
    id: "faq-2",
    title: "Can I submit an unfinished manuscript?",
    content:
      "Yes. Provide a complete synopsis and sample chapters with a realistic completion timeline.",
  },
  {
    id: "faq-3",
    title: "Do you publish debut authors?",
    content:
      "Absolutely. We evaluate writing quality, editorial potential, and long-term fit with our catalog.",
  },
  {
    id: "faq-4",
    title: "Will I receive editorial feedback?",
    content:
      "We provide detailed feedback only for manuscripts that move past our first editorial round.",
  },
  {
    id: "faq-5",
    title: "What genres do you not publish?",
    content:
      "We currently do not publish formulaic pulp, heavily derivative writing, or AI-generated manuscripts.",
  },
];

export default function ForAuthorsPageClient() {
  return (
    <div className="grain-overlay">
      <motion.section
        variants={heroVariants}
        initial="hidden"
        animate="show"
        className="mx-auto flex min-h-[62vh] w-full max-w-7xl items-center px-4 py-16 md:px-8"
      >
        <div className="space-y-6">
          <motion.p variants={heroItem} className="font-ui text-xs tracking-[0.2em] text-gold">
            FOR AUTHORS
          </motion.p>
          <motion.h1
            variants={heroItem}
            className="max-w-4xl text-safe font-title text-5xl text-ivory md:text-7xl"
          >
            Submit work we can stand behind for years.
          </motion.h1>
          <motion.p
            variants={heroItem}
            className="max-w-3xl font-body text-xl text-parchment/90"
          >
            We are looking for manuscripts with voice, structural control, and the staying power to earn a place in a serious list.
          </motion.p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8"
      >
        <SectionHeader eyebrow="WHAT WE'RE LOOKING FOR" title="Editorial Priorities" />
        <ul className="mt-7 grid gap-3 md:grid-cols-2">
          {lookingFor.map((item) => (
            <li
              key={item}
              className="fx-card flex items-start gap-3 rounded-lg border border-smoke bg-obsidian p-4"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <span className="font-body text-lg text-parchment/95">{item}</span>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8"
      >
        <SectionHeader
          eyebrow="SUBMISSION GUIDELINES"
          title="Before You Send Anything"
          description="These basics help us evaluate manuscripts quickly, consistently, and fairly."
        />
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {submissionBlocks.map((block) => (
            <article
              key={block.title}
              className="fx-card rounded-xl border border-smoke bg-obsidian p-5 transition hover:border-gold/55"
            >
              <h3 className="text-safe font-title text-3xl text-ivory">{block.title}</h3>
              <p className="mt-3 font-body text-base text-stone">{block.description}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8"
      >
        <SectionHeader eyebrow="OUR PROCESS" title="How Editorial Review Works" />
        <div className="mt-7 grid gap-4 md:grid-cols-4">
          {processSteps.map((step, index) => (
            <article key={step.title} className="fx-card rounded-xl border border-smoke bg-obsidian p-5">
              <p className="font-mono text-xs text-gold">{`0${index + 1}`}</p>
              <h3 className="mt-2 text-safe font-title text-3xl text-ivory">{step.title}</h3>
              <p className="mt-2 font-body text-base text-stone">{step.detail}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8"
      >
        <SectionHeader
          eyebrow="MANUSCRIPT FORM"
          title="Submit Manuscript"
          description="Complete every field carefully so review can begin without back-and-forth."
        />
        <div className="mt-7">
          <ManuscriptSubmissionForm />
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-7xl px-4 pb-24 md:px-8"
      >
        <SectionHeader eyebrow="FAQ" title="Frequently Asked Questions" />
        <div className="mt-7">
          <Accordion items={faqItems} defaultOpenId="faq-1" />
        </div>
      </motion.section>
    </div>
  );
}

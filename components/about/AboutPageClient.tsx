"use client";

import { Feather, LibraryBig, ScrollText, Sparkles } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { motion } from "@/components/ui/StaticMotion";

const heroContainer = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut" as const,
      staggerChildren: 0.08,
    },
  },
};

const heroLine = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const publishCards = [
  {
    title: "Literary Fiction",
    description:
      "Character-driven novels with strong language craft, emotional precision, and social depth.",
    icon: Feather,
  },
  {
    title: "Poetry",
    description:
      "Contemporary and classical voices curated for rhythm, nuance, and editorial rigor.",
    icon: Sparkles,
  },
  {
    title: "Essays",
    description:
      "Long-form reflections on culture, history, and politics with a reader-first sensibility.",
    icon: ScrollText,
  },
  {
    title: "Narrative Non-Fiction",
    description:
      "Biographies, memoir, and criticism that bridge scholarship and accessible storytelling.",
    icon: LibraryBig,
  },
];

const stats = [
  { value: 11, suffix: "", label: "Curated Editions" },
  { value: 11, suffix: "", label: "Voices In Program" },
  { value: 4, suffix: "", label: "Publishing Tracks" },
  { value: 100, suffix: "%", label: "Editorial Review" },
];

const teamMembers = [
  {
    name: "Anirban Choudhury",
    role: "Editorial Director",
    bio: "Leads acquisitions and editorial direction, shaping a catalog rooted in language and longevity.",
  },
  {
    name: "Ritobroto Das",
    role: "Publishing Lead",
    bio: "Oversees production and design systems, ensuring every title feels deliberate and archival.",
  },
];

export default function AboutPageClient() {
  return (
    <div className="grain-overlay">
      <motion.section
        variants={heroContainer}
        initial="hidden"
        animate="show"
        className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center px-4 py-16 md:px-8"
      >
        <div className="w-full space-y-6">
          <motion.p variants={heroLine} className="font-ui text-xs tracking-[0.2em] text-gold">
            ABOUT THE PUBLISHER
          </motion.p>
          <motion.h1 variants={heroLine} className="text-safe font-title text-6xl text-ivory md:text-8xl">
            The Press & Its Purpose
          </motion.h1>
          <motion.p variants={heroLine} className="max-w-3xl font-body text-xl text-parchment/90">
            We publish books that remain useful, discussable, and re-readable long after release.
          </motion.p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45 }}
        className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8"
      >
        <SectionHeader
          eyebrow="OUR STORY"
          title="Built On Editorial Discipline"
          description="We started with a simple conviction: serious Bengali writing deserves patient, well-made publishing."
        />
        <div className="mt-8 grid gap-7 lg:grid-cols-2">
          <article className="rounded-2xl border border-smoke bg-obsidian p-7 md:p-8">
            <p className="font-body text-lg leading-relaxed text-parchment first-letter:float-left first-letter:mr-3 first-letter:font-title first-letter:text-6xl first-letter:leading-[0.9] first-letter:text-gold">
              Kothakhahon began as a small editorial room with stacks of manuscripts and a refusal
              to rush. We read carefully, edited deeply, and treated every page as a conversation
              between writer and reader. That approach shaped our list from the beginning.
            </p>
          </article>
          <article className="rounded-2xl border border-smoke bg-obsidian p-7 md:p-8">
            <p className="font-body text-lg leading-relaxed text-parchment">
              Today, we publish across fiction, poetry, essays, and narrative non-fiction while
              maintaining the same standard: language first, design with purpose, and production
              quality that honors the text. Each title is made to hold up in hand, on shelf, and in memory.
            </p>
          </article>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45 }}
        className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8"
      >
        <SectionHeader eyebrow="WHAT WE PUBLISH" title="Genres We Curate" />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {publishCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="fx-card rounded-xl border border-smoke bg-obsidian p-5 transition hover:border-gold/60"
              >
                <Icon className="h-5 w-5 text-gold" />
                <h3 className="mt-4 text-safe font-title text-3xl text-ivory">{card.title}</h3>
                <p className="mt-3 font-body text-base text-stone">{card.description}</p>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45 }}
        className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8"
      >
        <SectionHeader eyebrow="BY THE NUMBERS" title="The List At A Glance" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="fx-card rounded-xl border border-gold/35 bg-gradient-to-br from-obsidian to-ash p-5"
            >
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                className="font-mono text-5xl text-ivory"
              />
              <p className="mt-2 font-ui text-[11px] tracking-[0.14em] text-stone">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45 }}
        className="mx-auto w-full max-w-7xl px-4 pb-24 md:px-8"
      >
        <SectionHeader eyebrow="THE TEAM" title="The Editorial Board" />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {teamMembers.map((member, index) => (
            <motion.article
              key={member.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="fx-card rounded-2xl border border-smoke bg-obsidian p-6"
            >
              <div className="mb-4 h-32 rounded-xl bg-gradient-to-br from-ash via-[#1f1b17] to-void" />
              <p className="font-ui text-xs tracking-[0.16em] text-gold">{member.role.toUpperCase()}</p>
              <h3 className="mt-2 text-safe font-title text-4xl text-ivory">{member.name}</h3>
              <p className="mt-3 font-body text-lg text-stone">{member.bio}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

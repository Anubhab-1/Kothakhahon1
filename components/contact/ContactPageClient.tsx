"use client";

import Link from "next/link";
import { Copyright, Mail, MapPin, MessageCircle, Newspaper, PenSquare, Phone } from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";
import SectionHeader from "@/components/ui/SectionHeader";
import { motion } from "@/components/ui/StaticMotion";
import type { SiteSettings } from "@/lib/types";

const heroVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.52,
      ease: "easeOut" as const,
      staggerChildren: 0.08,
    },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

interface ContactPageClientProps {
  support?: SiteSettings["support"];
}

function getWhatsAppHref(value?: string) {
  if (!value) {
    return "";
  }

  const digits = value.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export default function ContactPageClient({ support }: ContactPageClientProps) {
  const contacts = [
    {
      title: "Editorial",
      email: support?.editorialEmail || "editor@kothakhahon.com",
      description: "General publishing questions, catalog requests, and editorial correspondence.",
      icon: PenSquare,
    },
    {
      title: "Submissions",
      email: support?.submissionsEmail || "submissions@kothakhahon.com",
      description: "Submission process questions and manuscript-related communication.",
      icon: Newspaper,
    },
    {
      title: "Rights & Permissions",
      email: support?.rightsEmail || "rights@kothakhahon.com",
      description: "Translation rights, extracts, reprints, and adaptation enquiries.",
      icon: Copyright,
    },
  ];
  const whatsappHref = getWhatsAppHref(support?.whatsappPhone);

  return (
    <div className="grain-overlay">
      <motion.section
        variants={heroVariants}
        initial="hidden"
        animate="show"
        className="mx-auto flex min-h-[52vh] w-full max-w-7xl items-center px-4 py-16 md:px-8"
      >
        <div className="space-y-6">
          <motion.p variants={heroItem} className="font-ui text-xs tracking-[0.2em] text-gold">
            CONTACT
          </motion.p>
          <motion.h1
            variants={heroItem}
            className="text-safe font-title text-5xl text-ivory md:text-7xl"
          >
            Talk To The Editorial Desk
          </motion.h1>
          <motion.p
            variants={heroItem}
            className="max-w-3xl font-body text-xl text-parchment/90"
          >
            Reach the right team directly, or send one message and we will route it internally.
          </motion.p>
        </div>
      </motion.section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8">
        <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            {contacts.map((contact) => {
              const Icon = contact.icon;
              return (
                <article
                  key={contact.title}
                  className="fx-card rounded-xl border border-smoke bg-obsidian p-5 transition hover:border-gold/55"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-1 h-5 w-5 text-gold" />
                    <div>
                      <p className="text-safe font-title text-3xl text-ivory">{contact.title}</p>
                      <a
                        href={`mailto:${contact.email}`}
                        className="fx-link mt-1 inline-flex items-center gap-2 font-body text-base text-parchment transition hover:text-gold"
                      >
                        <Mail className="h-4 w-4" />
                        {contact.email}
                      </a>
                      <p className="mt-2 font-body text-base text-stone">{contact.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}

            {(support?.supportPhone || support?.whatsappPhone || support?.postalAddress) ? (
              <article className="fx-card rounded-xl border border-smoke bg-obsidian p-5">
                <p className="font-title text-3xl text-ivory">Reader Support</p>
                <div className="mt-4 space-y-3">
                  {support?.supportPhone ? (
                    <a
                      href={`tel:${support.supportPhone}`}
                      className="fx-link inline-flex items-center gap-2 font-body text-base text-parchment transition hover:text-gold"
                    >
                      <Phone className="h-4 w-4" />
                      {support.supportPhone}
                    </a>
                  ) : null}
                  {support?.whatsappPhone && whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fx-link inline-flex items-center gap-2 font-body text-base text-parchment transition hover:text-gold"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp {support.whatsappPhone}
                    </a>
                  ) : null}
                  {support?.postalAddress ? (
                    <p className="flex items-start gap-2 font-body text-base text-stone">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold" />
                      <span className="whitespace-pre-line">{support.postalAddress}</span>
                    </p>
                  ) : null}
                </div>
              </article>
            ) : null}
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 md:px-8">
        <div className="fx-card rounded-2xl border border-gold/45 bg-gradient-to-r from-obsidian to-ash p-8 text-center md:p-11">
          <SectionHeader
            align="center"
            eyebrow="KEEP READING"
            title="Explore The Current Catalog"
            description="If you arrived here through the journal or submissions page, the bookstore is one click away."
            className="mx-auto max-w-3xl"
          />
          <Link
            href="/books"
            className="fx-button mt-6 inline-flex rounded-full border border-gold bg-gold px-7 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim"
          >
            BROWSE CATALOG
          </Link>
        </div>
      </section>
    </div>
  );
}

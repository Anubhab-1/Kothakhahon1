"use client";

import Link from "next/link";
import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import type { SiteSettings } from "@/lib/types";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/books", label: "Catalog" },
  { href: "/authors", label: "Authors" },
  { href: "/blog", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const socialConfig = [
  { key: "facebook", label: "FACEBOOK" },
  { key: "instagram", label: "INSTAGRAM" },
  { key: "youtube", label: "YOUTUBE" },
] as const;

const policyLinks = [
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/return-policy", label: "Return Policy" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/faq", label: "Reader FAQ" },
];

const readerServices = [
  "Cash on Delivery on eligible India orders",
  "Guest checkout for first-time readers",
  "Orders packed from Kolkata",
  "Support replies within 2 to 3 business days",
];

interface FooterClientProps {
  socialLinks: Partial<Record<(typeof socialConfig)[number]["key"], string>>;
  support?: SiteSettings["support"];
}

function getWhatsAppHref(value?: string) {
  if (!value) {
    return "";
  }

  const digits = value.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export default function FooterClient({ socialLinks, support }: FooterClientProps) {
  const whatsappHref = getWhatsAppHref(support?.whatsappPhone);

  return (
    <footer className="border-t border-smoke bg-obsidian/95">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1.1fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <BrandLogo imageSize={56} />
          <p className="max-w-xl font-body text-sm text-stone">
            Kothakhahon is an independent Bengali publishing house for literary fiction, essays,
            poetry, and enduring contemporary books. We pair slow editorial work with a modern,
            reader-first storefront built for discovery, gifting, and direct orders.
          </p>
          <div className="flex flex-wrap gap-3 font-ui text-[10px] tracking-[0.16em] text-parchment">
            {socialConfig.map((social) => {
              const href = socialLinks[social.key];
              if (!href) {
                return null;
              }

              return (
                <a
                  key={social.key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fx-link rounded-full border border-smoke px-3 py-1 transition hover:border-gold hover:text-gold"
                >
                  {social.label}
                </a>
              );
            })}
          </div>

          <div className="grid gap-3 pt-2 md:grid-cols-2">
            {readerServices.map((service) => (
              <div
                key={service}
                className="rounded-2xl border border-smoke bg-black/10 px-4 py-3 font-body text-sm text-stone"
              >
                {service}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-4">
            <p className="font-ui text-xs tracking-[0.16em] text-gold">EXPLORE</p>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="fx-link font-body text-sm text-parchment transition hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="font-ui text-xs tracking-[0.16em] text-gold">POLICIES</p>
            <ul className="space-y-2">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="fx-link font-body text-sm text-parchment transition hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <p className="font-ui text-xs tracking-[0.16em] text-gold">READER SUPPORT</p>
          {support?.editorialEmail ? (
            <a
              href={`mailto:${support.editorialEmail}`}
              className="fx-link flex items-center gap-2 font-body text-sm text-parchment transition hover:text-gold"
            >
              <Mail className="h-4 w-4" />
              {support.editorialEmail}
            </a>
          ) : null}
          {support?.supportPhone ? (
            <a
              href={`tel:${support.supportPhone}`}
              className="fx-link flex items-center gap-2 font-body text-sm text-parchment transition hover:text-gold"
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
              className="fx-link flex items-center gap-2 font-body text-sm text-parchment transition hover:text-gold"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp {support.whatsappPhone}
            </a>
          ) : null}
          <p className="flex items-start gap-2 font-body text-sm text-stone">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            Editorial desk replies within 2 to 3 business days.
          </p>
          {support?.postalAddress ? (
            <p className="flex items-start gap-2 font-body text-sm text-stone">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span className="whitespace-pre-line">{support.postalAddress}</span>
            </p>
          ) : null}
          <p className="rounded-2xl border border-smoke bg-black/10 px-4 py-3 font-body text-sm text-stone">
            For bulk orders, reading circles, event tables, or gift-copy requests, write to the
            editorial desk and mention the title list you need.
          </p>
        </div>
      </div>

      <div className="border-t border-smoke px-4 py-4 md:px-8">
        <p className="text-center font-mono text-xs text-stone">
          {"(c)"} {new Date().getFullYear()} Kothakhahon Prokashoni. Built for readers, writers, and a longer shelf life.
        </p>
      </div>
    </footer>
  );
}

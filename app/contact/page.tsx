import type { Metadata } from "next";
import ContactPageClient from "@/components/contact/ContactPageClient";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact Our Editorial Desk | Kothakhahon",
  description: "Get in touch with Kothakhahon for customer support, shipping queries, manuscript submissions, or general feedback.",
  alternates: {
    canonical: "/contact",
  },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return <ContactPageClient support={settings.support} />;
}

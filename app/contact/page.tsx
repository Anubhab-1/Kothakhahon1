import ContactPageClient from "@/components/contact/ContactPageClient";
import { getSiteSettings } from "@/lib/content";

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return <ContactPageClient support={settings.support} />;
}

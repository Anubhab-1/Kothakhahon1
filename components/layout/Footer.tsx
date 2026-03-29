import FooterClient from "@/components/layout/FooterClient";
import { getSiteSettings } from "@/lib/content";

export default async function Footer() {
  const settings = await getSiteSettings();
  const socialLinks: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  } = {
    facebook: settings?.social?.facebook ?? "",
    instagram: settings?.social?.instagram ?? "",
    youtube: settings?.social?.youtube ?? "",
  };
  return <FooterClient socialLinks={socialLinks} support={settings?.support} />;
}

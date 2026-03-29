import AdminNotice from "@/components/admin/AdminNotice";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SiteSettingsEditor from "@/components/admin/SiteSettingsEditor";
import { db } from "@/lib/db";

interface AdminSettingsPageProps {
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
}

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const [search, authors, settings] = await Promise.all([
    searchParams,
    db.author.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    db.siteSettings.findUnique({
      where: {
        id: "site-settings",
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Settings"
        title="Brand And Homepage Settings"
        description="Keep hero messaging, editorial mission, and social links aligned with the publishing identity."
      />
      <AdminNotice notice={search.saved ? "Settings saved." : undefined} error={search.error} />
      <SiteSettingsEditor
        authors={authors.map((author) => ({ id: author.id, name: author.name }))}
        settings={{
          heroTagline: settings?.heroTagline ?? "",
          heroTaglineEn: settings?.heroTaglineEn ?? "",
          missionStatement: settings?.missionStatement ?? "",
          featuredAuthorId: settings?.featuredAuthorId ?? "",
          facebookUrl: settings?.facebookUrl ?? "",
          instagramUrl: settings?.instagramUrl ?? "",
          youtubeUrl: settings?.youtubeUrl ?? "",
          linkedinUrl: settings?.linkedinUrl ?? "",
          editorialEmail: settings?.editorialEmail ?? "",
          submissionsEmail: settings?.submissionsEmail ?? "",
          rightsEmail: settings?.rightsEmail ?? "",
          supportPhone: settings?.supportPhone ?? "",
          whatsappPhone: settings?.whatsappPhone ?? "",
          postalAddress: settings?.postalAddress ?? "",
        }}
      />
    </div>
  );
}

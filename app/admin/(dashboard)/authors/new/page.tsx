import AdminNotice from "@/components/admin/AdminNotice";
import AuthorEditor from "@/components/admin/AuthorEditor";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface AdminNewAuthorPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function AdminNewAuthorPage({ searchParams }: AdminNewAuthorPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Authors"
        title="Create Author Profile"
        description="Build a strong editorial identity around each writer in the catalog."
      />
      <AdminNotice error={params.error} />
      <AuthorEditor />
    </div>
  );
}

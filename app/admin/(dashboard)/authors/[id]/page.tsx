import { notFound } from "next/navigation";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AuthorEditor from "@/components/admin/AuthorEditor";
import { db } from "@/lib/db";

interface AdminAuthorDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
}

export default async function AdminAuthorDetailPage({
  params,
  searchParams,
}: AdminAuthorDetailPageProps) {
  const { id } = await params;
  const search = await searchParams;

  const [author] = await Promise.all([
    db.author.findUnique({
      where: { id },
      include: {
        awards: {
          orderBy: {
            position: "asc",
          },
        },
      },
    }),
  ]);

  if (!author) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Authors"
        title={`Edit ${author.name}`}
        description="Refine the author page voice, profile image, and awards listing."
      />
      <AdminNotice notice={search.saved ? "Author saved." : undefined} error={search.error} />
      <AuthorEditor
        author={{
          id,
          name: author.name,
          slug: author.slug,
          bio: author.bio ?? "",
          photoUrl: author.photoUrl ?? "",
          featured: author.featured,
          awards: author.awards.map((award) => award.label),
        }}
      />
    </div>
  );
}

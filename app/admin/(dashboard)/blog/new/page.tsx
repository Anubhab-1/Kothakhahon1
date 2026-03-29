import BlogPostEditor from "@/components/admin/BlogPostEditor";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { db } from "@/lib/db";

interface AdminNewBlogPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function AdminNewBlogPage({ searchParams }: AdminNewBlogPageProps) {
  const [params, authors] = await Promise.all([
    searchParams,
    db.author.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Journal"
        title="Create Journal Entry"
        description="Publish essays, notes, and editorial commentary with the same voice as the storefront."
      />
      <AdminNotice error={params.error} />
      <BlogPostEditor authors={authors.map((author) => ({ id: author.id, name: author.name }))} />
    </div>
  );
}

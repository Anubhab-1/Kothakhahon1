import { notFound } from "next/navigation";
import BlogPostEditor from "@/components/admin/BlogPostEditor";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { db } from "@/lib/db";

interface AdminBlogDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
}

export default async function AdminBlogDetailPage({
  params,
  searchParams,
}: AdminBlogDetailPageProps) {
  const { id } = await params;
  const search = await searchParams;

  const [authors, post] = await Promise.all([
    db.author.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    db.blogPost.findUnique({
      where: { id },
    }),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Journal"
        title={`Edit ${post.title}`}
        description="Control the public journal experience without leaving the main application."
      />
      <AdminNotice notice={search.saved ? "Post saved." : undefined} error={search.error} />
      <BlogPostEditor
        authors={authors.map((author) => ({ id: author.id, name: author.name }))}
        post={{
          id,
          title: post.title,
          slug: post.slug,
          category: post.category ?? "",
          coverImageUrl: post.coverImageUrl ?? "",
          excerpt: post.excerpt ?? "",
          body: post.body ?? "",
          publishedAt: post.publishedAt ?? "",
          featured: post.featured,
          authorId: post.authorId ?? "",
        }}
      />
    </div>
  );
}

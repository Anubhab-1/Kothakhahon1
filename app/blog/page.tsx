import type { Metadata } from "next";
import BlogIndexClient from "@/components/blog/BlogIndexClient";
import { getAllBlogPosts, getBlogPostsCount } from "@/lib/content";
import type { BlogPostCardView } from "@/lib/types";

export const metadata: Metadata = {
  title: "The Kothakhahon Journal | Bengali Literary Essays & Blogs",
  description: "Read essays, journal entries, and literary thoughts on contemporary and classical Bengali literature from the Kothakhahon publishing team.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "The Kothakhahon Journal | Bengali Literary Essays & Blogs",
    description: "Read essays, journal entries, and literary thoughts on contemporary and classical Bengali literature from the Kothakhahon publishing team.",
    url: "/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Kothakhahon Journal | Bengali Literary Essays & Blogs",
    description: "Read essays, journal entries, and literary thoughts on contemporary and classical Bengali literature from the Kothakhahon publishing team.",
  },
};

export const revalidate = 60;

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

function mapPostToCard(post: Awaited<ReturnType<typeof getAllBlogPosts>>[number]): BlogPostCardView {
  return {
    id: post._id,
    slug: post.slug,
    title: post.title,
    category: post.category ?? "Journal",
    excerpt: post.excerpt ?? "Open the full essay from the Kothakhahon journal.",
    coverImageUrl: post.coverImageUrl,
    authorName: post.author?.name ?? "Kothakhahon Team",
    authorSlug: post.author?.slug,
    publishedAt: post.publishedAt,
    featured: Boolean(post.featured),
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 9;

  const [posts, totalCount] = await Promise.all([
    getAllBlogPosts({ page, limit }),
    getBlogPostsCount(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const mappedPosts = posts.map(mapPostToCard);

  return <BlogIndexClient posts={mappedPosts} currentPage={page} totalPages={totalPages} />;
}

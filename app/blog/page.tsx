import type { Metadata } from "next";
import BlogIndexClient from "@/components/blog/BlogIndexClient";
import { getAllBlogPosts } from "@/lib/content";
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

export default async function BlogPage() {
  const posts = (await getAllBlogPosts()).map(mapPostToCard);
  return <BlogIndexClient posts={posts} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostClient from "@/components/blog/BlogPostClient";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/content";
import type { BlogPostCardView, BlogPostDetailView } from "@/lib/types";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 3600; // 1 hour

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

function mapPostToDetail(post: NonNullable<Awaited<ReturnType<typeof getBlogPostBySlug>>>): BlogPostDetailView {
  return {
    id: post._id,
    slug: post.slug,
    title: post.title,
    category: post.category ?? "Journal",
    excerpt: post.excerpt ?? "Open the full essay from the Kothakhahon journal.",
    coverImageUrl: post.coverImageUrl,
    authorName: post.author?.name ?? "Kothakhahon Team",
    authorSlug: post.author?.slug,
    authorBio: post.author?.bio,
    publishedAt: post.publishedAt,
    body: post.body ?? "",
  };
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

async function getPostData(slug: string) {
  const [post, allPosts] = await Promise.all([getBlogPostBySlug(slug), getAllBlogPosts()]);
  if (!post) {
    return null;
  }

  const category = post.category ?? "Journal";

  const relatedPosts = allPosts
    .filter((candidate) => candidate.slug !== slug)
    .sort((a, b) => {
      const aMatchesCategory = (a.category ?? "Journal") === category ? -1 : 0;
      const bMatchesCategory = (b.category ?? "Journal") === category ? -1 : 0;
      if (aMatchesCategory !== bMatchesCategory) {
        return aMatchesCategory - bMatchesCategory;
      }
      const aDate = Date.parse(a.publishedAt ?? "");
      const bDate = Date.parse(b.publishedAt ?? "");
      return (Number.isNaN(bDate) ? 0 : bDate) - (Number.isNaN(aDate) ? 0 : aDate);
    })
    .slice(0, 3)
    .map(mapPostToCard);

  return {
    post: mapPostToDetail(post),
    relatedPosts,
  };
}

import { env } from "@/lib/env";

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const data = await getPostData(slug);

  if (!data) {
    notFound();
  }

  // Resolve absolute cover image URL
  const coverUrl = data.post.coverImageUrl
    ? (data.post.coverImageUrl.startsWith("http")
      ? data.post.coverImageUrl
      : `${env.SITE_URL}${data.post.coverImageUrl.startsWith("/") ? "" : "/"}${data.post.coverImageUrl}`)
    : `${env.SITE_URL}/opengraph-image`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": data.post.title,
    "description": data.post.excerpt,
    "image": coverUrl,
    "datePublished": data.post.publishedAt
      ? new Date(data.post.publishedAt).toISOString()
      : undefined,
    "author": {
      "@type": "Person",
      "name": data.post.authorName,
      "url": data.post.authorSlug ? `${env.SITE_URL}/authors/${data.post.authorSlug}` : undefined,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Kothakhahon",
      "logo": {
        "@type": "ImageObject",
        "url": `${env.SITE_URL}/favicon.ico`,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${env.SITE_URL}/blog/${data.post.slug}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": env.SITE_URL,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${env.SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": data.post.title,
        "item": `${env.SITE_URL}/blog/${data.post.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogPostClient post={data.post} relatedPosts={data.relatedPosts} />
    </>
  );
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPostData(slug);

  if (!data) {
    notFound();
  }

  // Resolve absolute cover image URL
  const coverUrl = data.post.coverImageUrl
    ? (data.post.coverImageUrl.startsWith("http")
      ? data.post.coverImageUrl
      : `${env.SITE_URL}${data.post.coverImageUrl.startsWith("/") ? "" : "/"}${data.post.coverImageUrl}`)
    : `${env.SITE_URL}/opengraph-image`;

  const twitterUrl = data.post.coverImageUrl
    ? (data.post.coverImageUrl.startsWith("http")
      ? data.post.coverImageUrl
      : `${env.SITE_URL}${data.post.coverImageUrl.startsWith("/") ? "" : "/"}${data.post.coverImageUrl}`)
    : `${env.SITE_URL}/twitter-image`;

  return {
    title: data.post.title,
    description: data.post.excerpt,
    alternates: {
      canonical: `/blog/${data.post.slug}`,
    },
    openGraph: {
      title: data.post.title,
      description: data.post.excerpt,
      type: "article",
      url: `/blog/${data.post.slug}`,
      images: [coverUrl],
    },
    twitter: {
      card: "summary_large_image",
      title: data.post.title,
      description: data.post.excerpt,
      images: [twitterUrl],
    },
  };
}

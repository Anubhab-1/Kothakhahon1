import type { MetadataRoute } from "next";
import { getAllAuthors, getAllBlogPosts, getAllBooks } from "@/lib/content";
import { getSiteUrlString } from "@/lib/env";

const staticRoutes = [
  "",
  "/books",
  "/authors",
  "/about",
  "/for-authors",
  "/blog",
  "/contact",
  "/shipping-policy",
  "/return-policy",
  "/privacy-policy",
  "/terms",
  "/faq",
];

function toDateOrNow(value?: string) {
  if (!value) return new Date();
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return new Date();
  return new Date(parsed);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrlString();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  const [books, authors, posts] = await Promise.all([
    getAllBooks(),
    getAllAuthors(),
    getAllBlogPosts(),
  ]);

  books.forEach((book) => {
    if (!book.slug) return;
    entries.push({
      url: `${baseUrl}/books/${book.slug}`,
      lastModified: toDateOrNow(book.publicationDate),
      changeFrequency: "weekly",
      priority: 0.75,
    });
  });

  authors.forEach((author) => {
    if (!author.slug) return;
    entries.push({
      url: `${baseUrl}/authors/${author.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    });
  });

  posts.forEach((post) => {
    if (!post.slug) return;
    entries.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: toDateOrNow(post.publishedAt),
      changeFrequency: "weekly",
      priority: 0.72,
    });
  });

  return entries;
}

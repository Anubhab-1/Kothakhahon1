"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDisplayDate } from "@/lib/date";
import { motion } from "@/components/ui/StaticMotion";
import type { BlogPostCardView } from "@/lib/types";
import Pagination from "@/components/ui/Pagination";

interface BlogIndexClientProps {
  posts: BlogPostCardView[];
  currentPage?: number;
  totalPages?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export default function BlogIndexClient({ posts, currentPage, totalPages }: BlogIndexClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    posts.forEach((post) => categorySet.add(post.category));
    return ["All", ...Array.from(categorySet).sort((a, b) => a.localeCompare(b))];
  }, [posts]);

  const featuredPost = useMemo(
    () => posts.find((post) => post.featured) ?? posts[0] ?? null,
    [posts],
  );

  const nonFeaturedPosts = useMemo(
    () => posts.filter((post) => post.id !== featuredPost?.id),
    [featuredPost?.id, posts],
  );

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "All") return nonFeaturedPosts;
    return nonFeaturedPosts.filter((post) => post.category === selectedCategory);
  }, [nonFeaturedPosts, selectedCategory]);

  return (
    <div className="grain-overlay">
      <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
        <p className="font-ui text-xs tracking-[0.18em] text-gold">JOURNAL</p>
        <h1 className="mt-3 text-safe font-title text-5xl text-ivory md:text-6xl">
          The Kothakhahon Journal
        </h1>
        <p className="mt-3 max-w-3xl font-body text-lg text-stone">
          Essays, editorial notes, and publishing conversations from the desk behind the list.
        </p>
      </section>

      <section className="sticky top-16 z-30 border-y border-smoke bg-void/95 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 md:px-8">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`fx-button shrink-0 rounded-full border px-3 py-1.5 font-ui text-[11px] tracking-[0.12em] transition ${
                selectedCategory === category
                  ? "border-gold bg-gold text-void"
                  : "border-smoke bg-obsidian text-parchment hover:border-gold hover:text-gold"
              }`}
            >
              {category.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
        {featuredPost ? (
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="fx-card group grid overflow-hidden rounded-2xl border border-smoke bg-obsidian transition hover:border-gold/60 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="relative min-h-[320px]">
              {featuredPost.coverImageUrl ? (
                <Image
                  src={featuredPost.coverImageUrl}
                  alt={featuredPost.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 62vw"
                  className="object-cover transition duration-400 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="h-full bg-gradient-to-br from-[#242c35] via-[#1e232a] to-[#161412]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent" />
            </div>
            <div className="space-y-4 p-7 md:p-9">
              <p className="font-ui text-[11px] tracking-[0.14em] text-gold">
                FEATURED ESSAY / {featuredPost.category.toUpperCase()}
              </p>
              <h2 className="text-safe font-title text-4xl text-ivory md:text-5xl">
                {featuredPost.title}
              </h2>
              <p className="font-body text-lg text-parchment/95">{featuredPost.excerpt}</p>
              <p className="font-mono text-xs text-stone">
                {featuredPost.authorName} / {formatDisplayDate(featuredPost.publishedAt)}
              </p>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-smoke bg-obsidian p-8">
            <p className="font-body text-lg text-stone">No journal entries have been published yet.</p>
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8">
        {filteredPosts.length === 0 ? (
          <div className="rounded-xl border border-smoke bg-obsidian p-8 text-center">
            <h3 className="font-title text-3xl text-ivory">
              {featuredPost && selectedCategory !== "All"
                ? "This section currently has one featured story"
                : "No entries in this section yet"}
            </h3>
            <p className="mt-2 font-body text-base text-stone">
              {featuredPost && selectedCategory !== "All"
                ? "The highlighted essay above is the only published entry in this category right now."
                : "Try another section from the filter bar."}
            </p>
          </div>
        ) : (
          <motion.div
            key={selectedCategory}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredPosts.map((post) => (
              <motion.article key={post.id} variants={itemVariants}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="fx-card group block overflow-hidden rounded-xl border border-smoke bg-obsidian transition hover:-translate-y-1 hover:border-gold/60"
                >
                  <div className="relative aspect-[16/10]">
                    {post.coverImageUrl ? (
                      <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        fill
                        sizes="(max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-[#242c35] to-[#161412]" />
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <p className="font-ui text-[10px] tracking-[0.13em] text-gold">
                      {post.category.toUpperCase()}
                    </p>
                    <h3 className="text-safe font-title text-3xl text-ivory">{post.title}</h3>
                    <p className="font-body text-base text-stone">{post.excerpt}</p>
                    <p className="font-mono text-xs text-stone">
                      {post.authorName} / {formatDisplayDate(post.publishedAt)}
                    </p>
                  </div>
                </Link>
              </motion.article>
            ))}
          </motion.div>
        )}
      </section>
      {totalPages !== undefined && currentPage !== undefined && totalPages > 1 && (
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/blog"
          />
        </div>
      )}
    </div>
  );
}

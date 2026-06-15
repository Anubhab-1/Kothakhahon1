"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDisplayDate } from "@/lib/date";
import { motion } from "@/components/ui/StaticMotion";
import ShareButton from "@/components/ui/ShareButton";
import type { BlogPostCardView, BlogPostDetailView } from "@/lib/types";
import { getSiteUrlString } from "@/lib/env";

interface BlogPostClientProps {
  post: BlogPostDetailView;
  relatedPosts: BlogPostCardView[];
}

const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
  const paragraphs = post.body
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);

  return (
    <article className="grain-overlay pb-20">
      <motion.header
        variants={reveal}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.45 }}
        className="mx-auto w-full max-w-5xl px-4 pt-14 md:px-8"
      >
        <div className="editorial-panel rounded-2xl p-7 md:p-9">
          <p className="font-ui text-xs tracking-[0.16em] text-gold">{post.category.toUpperCase()}</p>
          <h1 className="mt-3 text-safe font-title text-5xl text-ivory md:text-6xl">{post.title}</h1>
          <p className="mt-4 max-w-3xl font-body text-xl text-stone/90">{post.excerpt}</p>
          <p className="mt-4 font-mono text-xs text-stone">
            {post.authorName} / {formatDisplayDate(post.publishedAt)}
          </p>
          <div className="mt-5">
            <ShareButton
              title={post.title}
              text={post.excerpt}
              url={`${getSiteUrlString()}/blog/${post.slug}`}
            />
          </div>
        </div>
      </motion.header>

      <motion.section
        variants={reveal}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.45, delay: 0.06 }}
        className="mx-auto w-full max-w-5xl px-4 pt-9 md:px-8"
      >
        <div className="book-edge relative aspect-[16/9] overflow-hidden rounded-2xl border border-smoke bg-obsidian">
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1100px"
              className="object-cover"
            />
          ) : (
            <div className="h-full bg-gradient-to-br from-[#242c35] via-[#1e232a] to-[#161412]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent" />
        </div>
      </motion.section>

      <section className="mx-auto w-full max-w-4xl px-4 pt-10 md:px-8">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className="editorial-panel rounded-2xl p-7 md:p-9"
        >
          <div className="blog-prose prose prose-invert max-w-none font-body text-lg text-ivory/90 marker:text-gold prose-p:leading-relaxed prose-a:text-gold prose-a:no-underline hover:prose-a:text-gold-dim">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={`${post.id}-${index}`} className="mb-5 leading-relaxed">
                  {paragraph}
                </p>
              ))
            ) : (
              <p>{post.excerpt}</p>
            )}
          </div>

          <div className="mt-10 rounded-xl border border-smoke bg-ash/50 p-5">
            <p className="font-ui text-xs tracking-[0.14em] text-gold">ABOUT THE AUTHOR</p>
            <h2 className="mt-2 text-safe font-title text-3xl text-ivory">{post.authorName}</h2>
            <p className="mt-2 font-body text-base text-stone">
              {post.authorBio ??
                "Contributor to the Kothakhahon journal, writing on books, language, and publishing practice."}
            </p>
            {post.authorSlug ? (
              <Link
                href={`/authors/${post.authorSlug}`}
                className="fx-link mt-4 inline-block font-ui text-xs tracking-[0.13em] text-gold hover:text-gold-dim"
              >
                OPEN AUTHOR PROFILE
              </Link>
            ) : null}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pt-14 md:px-8">
        <h2 className="text-safe font-title text-4xl text-ivory">Continue Reading</h2>
        {relatedPosts.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className="fx-card group overflow-hidden rounded-xl border border-smoke bg-obsidian transition hover:-translate-y-1 hover:border-gold/60"
              >
                <div className="relative aspect-[16/10]">
                  {related.coverImageUrl ? (
                    <Image
                      src={related.coverImageUrl}
                      alt={related.title}
                      fill
                      sizes="(max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-[#242c35] to-[#161412]" />
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <p className="font-ui text-[10px] tracking-[0.13em] text-gold">{related.category.toUpperCase()}</p>
                  <h3 className="text-safe font-title text-3xl text-ivory">{related.title}</h3>
                  <p className="font-body text-base text-stone">{related.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-smoke bg-obsidian p-6">
            <p className="font-body text-base text-stone">More journal entries will appear here as the archive grows.</p>
          </div>
        )}
      </section>
    </article>
  );
}

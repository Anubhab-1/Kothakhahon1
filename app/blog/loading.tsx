"use client";

import React from "react";
import { BlogPostSkeleton, Skeleton } from "@/components/ui/skeletons";

export default function BlogLoading() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8 space-y-3">
        <Skeleton className="h-4.5 w-16 bg-ash/25 rounded-md" />
        <Skeleton className="h-12 w-64 bg-ash/40 rounded-lg sm:h-14 sm:w-80" />
        <Skeleton className="h-5 w-4/5 max-w-xl bg-ash/30 rounded" />
      </section>

      {/* Filter Category Bar Skeleton */}
      <section className="sticky top-16 z-30 border-y border-smoke bg-void/95 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 md:px-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 bg-ash/35 rounded-full" />
          ))}
        </div>
      </section>

      {/* Featured Post Skeleton */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
        <div className="grid overflow-hidden rounded-2xl border border-smoke bg-obsidian lg:grid-cols-[1.1fr_0.9fr] min-h-[320px]">
          <div className="relative bg-ash/30" />
          <div className="space-y-4 p-7 md:p-9">
            <Skeleton className="h-4 w-32 bg-gold/15 rounded" />
            <Skeleton className="h-10 w-5/6 bg-ash/40 rounded-lg" />
            <Skeleton className="h-5 w-full bg-ash/30 rounded" />
            <Skeleton className="h-5 w-2/3 bg-ash/30 rounded" />
            <Skeleton className="h-4 w-40 bg-ash/25 rounded" />
          </div>
        </div>
      </section>

      {/* Post Grid Skeletons */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BlogPostSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

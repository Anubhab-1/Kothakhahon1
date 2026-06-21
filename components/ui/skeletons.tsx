"use client";

import React from "react";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded bg-stone/20 ${className}`}
      {...props}
    />
  );
}

export function BookCardSkeleton() {
  return (
    <div className="rounded-2xl border border-smoke bg-obsidian/80 p-3 sm:p-4 space-y-4">
      {/* Cover image area */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-ash/40 animate-pulse" />

      {/* Info lines */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4 bg-ash/40 rounded-lg" />
        <Skeleton className="h-4 w-1/2 bg-ash/30 rounded-md" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-4 w-16 bg-ash/30 rounded-full" />
          <Skeleton className="h-4 w-12 bg-ash/30 rounded-full" />
        </div>
      </div>

      {/* Bottom divider and price/CTA */}
      <div className="space-y-3 pt-2">
        <div className="h-px bg-smoke" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-16 bg-ash/30 rounded-full" />
          <Skeleton className="h-8 w-24 bg-gold/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function BookDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8 lg:py-20 space-y-12">
      {/* Breadcrumbs skeleton */}
      <Skeleton className="h-4 w-48 bg-ash/30 rounded-md" />

      <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        {/* Left column - cover and thumbnails */}
        <div className="editorial-panel rounded-2xl p-5 md:p-6 space-y-6">
          <div className="relative aspect-[3/4] w-full max-w-[340px] mx-auto overflow-hidden rounded-2xl bg-ash/40 animate-pulse" />
          <div className="flex justify-center gap-2">
            <Skeleton className="h-16 w-12 bg-ash/30 rounded-md" />
            <Skeleton className="h-16 w-12 bg-ash/30 rounded-md" />
            <Skeleton className="h-16 w-12 bg-ash/30 rounded-md" />
          </div>
        </div>

        {/* Right column - details */}
        <div className="space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 bg-gold/15 rounded-full" />
            <Skeleton className="h-6 w-24 bg-gold/15 rounded-full" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-12 w-5/6 bg-ash/40 rounded-lg" />
            <Skeleton className="h-6 w-1/3 bg-ash/30 rounded-md" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-smoke bg-obsidian p-4 rounded-lg space-y-2">
                <Skeleton className="h-3.5 w-20 bg-ash/25 rounded" />
                <Skeleton className="h-5 w-32 bg-ash/30 rounded" />
              </div>
            ))}
          </div>

          <div className="editorial-panel rounded-xl p-6 space-y-4">
            <Skeleton className="h-4 w-12 bg-ash/30 rounded" />
            <Skeleton className="h-10 w-36 bg-ash/40 rounded-md" />
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-12 w-32 bg-gold/25 rounded-full" />
              <Skeleton className="h-12 w-28 bg-ash/30 rounded-full" />
              <Skeleton className="h-12 w-48 bg-ash/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-ash/40 rounded" />
          <Skeleton className="h-4 w-32 bg-ash/30 rounded" />
        </div>
        <Skeleton className="h-8 w-24 bg-ash/30 rounded-full" />
      </div>

      <div className="border border-smoke bg-obsidian rounded-2xl p-6 space-y-6">
        <Skeleton className="h-6 w-32 bg-ash/45 rounded" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-smoke/30">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-12 bg-ash/30 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40 bg-ash/35 rounded" />
                  <Skeleton className="h-4 w-24 bg-ash/25 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 bg-ash/35 rounded" />
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-4">
          <Skeleton className="h-5 w-20 bg-ash/30 rounded" />
          <Skeleton className="h-6 w-24 bg-ash/40 rounded" />
        </div>
      </div>
    </div>
  );
}

export function BlogPostSkeleton() {
  return (
    <div className="rounded-2xl border border-smoke bg-obsidian p-4 space-y-4">
      {/* Blog post image area */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-ash/40 animate-pulse" />

      {/* Blog content skeletons */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 bg-ash/25 rounded" />
        <Skeleton className="h-7 w-5/6 bg-ash/40 rounded" />
        <Skeleton className="h-4 w-full bg-ash/30 rounded" />
        <Skeleton className="h-4 w-2/3 bg-ash/30 rounded" />
      </div>
    </div>
  );
}

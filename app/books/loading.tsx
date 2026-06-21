"use client";

import React from "react";
import { BookCardSkeleton, Skeleton } from "@/components/ui/skeletons";

export default function BooksLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-12 space-y-8 animate-pulse">
      {/* Header Loading Skeleton */}
      <div className="space-y-4 pb-6 text-center md:pb-10">
        <Skeleton className="mx-auto h-4.5 w-16 bg-ash/25 rounded-md" />
        <Skeleton className="mx-auto h-12 w-64 bg-ash/40 rounded-lg sm:h-14 sm:w-80" />
        <div className="mx-auto max-w-3xl space-y-2 mt-4">
          <Skeleton className="mx-auto h-4 w-5/6 bg-ash/30 rounded" />
          <Skeleton className="mx-auto h-4 w-4/6 bg-ash/30 rounded" />
        </div>
      </div>

      {/* Filter Row Loading Skeleton */}
      <div className="border-b border-smoke bg-transparent pb-6 pt-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1 bg-ash/20 rounded-md" />
          <Skeleton className="h-10 w-24 bg-ash/30 rounded-md sm:w-28" />
        </div>
      </div>

      {/* Info strip */}
      <div className="flex flex-col gap-3 rounded-2xl border border-smoke bg-obsidian/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16 bg-ash/25 rounded" />
          <Skeleton className="h-4 w-48 bg-ash/35 rounded" />
        </div>
        <Skeleton className="h-8 w-32 bg-ash/30 rounded" />
      </div>

      {/* 12 Book Grid Skeletons */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

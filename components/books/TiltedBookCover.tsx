"use client";

import Image from "next/image";
import DecorativeBookCover from "@/components/ui/DecorativeBookCover";

interface TiltedBookCoverProps {
  title: string;
  authorName?: string;
  coverImageUrl?: string;
}

export default function TiltedBookCover({
  title,
  authorName,
  coverImageUrl,
}: TiltedBookCoverProps) {
  return (
    <div className="relative mx-auto w-full max-w-[340px] [perspective:1100px]">
      <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-gold/20 blur-2xl" />
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-b from-ash to-void shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 80vw, 340px"
            className="object-cover"
          />
        ) : (
          <DecorativeBookCover
            title={title}
            subtitle={authorName}
            className="rounded-none border-0"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(255,255,255,0.24),transparent_35%)]" />
      </div>
    </div>
  );
}

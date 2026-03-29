"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  imageSize?: number;
  showWordmark?: boolean;
}

export default function BrandLogo({
  className,
  imageSize = 44,
  showWordmark = true,
}: BrandLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const fallbackGlyph = useMemo(() => "K", []);

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-gold/35 bg-gradient-to-br from-obsidian to-ash transition hover:border-gold/65 hover:shadow-[0_0_26px_rgba(201,151,58,0.32)] hover:animate-[logoBreath_1.7s_ease-in-out_infinite]",
          imageSize >= 56 ? "h-14 w-14" : "h-11 w-11",
        )}
      >
        {!imageFailed ? (
          <Image
            src="/images/logo.png"
            alt="Kothakhahon Prokashoni logo"
            fill
            sizes={`${imageSize}px`}
            className="object-contain p-1"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="font-title text-2xl leading-none text-gold/85">{fallbackGlyph}</span>
        )}
      </span>

      {showWordmark ? (
        <span className="leading-tight">
          <span className="block font-title text-xl tracking-[0.06em] text-ivory">Kothakhahon</span>
          <span className="block font-ui text-[10px] tracking-[0.18em] text-gold/90">
            PROKASHONI
          </span>
        </span>
      ) : null}
    </span>
  );
}


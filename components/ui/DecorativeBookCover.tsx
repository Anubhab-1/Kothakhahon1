"use client";

import { cn } from "@/lib/utils";

interface DecorativeBookCoverProps {
  title: string;
  subtitle?: string;
  tag?: string;
  compact?: boolean;
  className?: string;
}

const palettes = [
  "from-[#1B1A22] via-[#253046] to-[#111114]",
  "from-[#231917] via-[#3A2A20] to-[#16120F]",
  "from-[#12222A] via-[#20303A] to-[#111214]",
  "from-[#281A18] via-[#432B22] to-[#17110F]",
  "from-[#181E28] via-[#2B3341] to-[#131417]",
];

function getPalette(seed: string) {
  const hash = seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

export default function DecorativeBookCover({
  title,
  subtitle,
  tag = "KOTHAKHAHON",
  compact = false,
  className,
}: DecorativeBookCoverProps) {
  const palette = getPalette(`${title}-${subtitle ?? ""}`);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-[inherit] border border-white/8 bg-gradient-to-br",
        palette,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%),linear-gradient(150deg,transparent_0%,rgba(0,0,0,0.28)_100%)]" />
      <div className="absolute inset-3 rounded-[calc(theme(borderRadius.xl)-2px)] border border-gold/20" />
      <div className="absolute left-0 top-[14%] h-px w-full bg-gradient-to-r from-transparent via-gold/55 to-transparent" />
      <div className="absolute left-0 top-[78%] h-px w-full bg-gradient-to-r from-transparent via-white/18 to-transparent" />

      <div className={cn("relative flex h-full flex-col justify-between p-5", compact && "p-4")}>
        <div className="space-y-3">
          <div className="inline-flex rounded-full border border-gold/35 bg-black/15 px-2.5 py-1 font-ui text-[9px] tracking-[0.22em] text-gold">
            {tag}
          </div>
          <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5" />
        </div>

        <div>
          <p
            className={cn(
              "text-balance font-title text-4xl text-ivory drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]",
              compact && "text-[1.75rem]",
            )}
          >
            {title}
          </p>
          {subtitle ? (
            <p
              className={cn(
                "mt-2 font-ui text-[10px] tracking-[0.18em] text-parchment/80",
                compact && "mt-1 text-[9px]",
              )}
            >
              {subtitle.toUpperCase()}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

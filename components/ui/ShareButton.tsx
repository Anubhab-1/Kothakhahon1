"use client";

import { useState } from "react";
import { Share2, Twitter, MessageCircle, Link2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  text?: string;
  url: string;
  className?: string;
}

export default function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const fullText = text ?? title;

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: fullText, url });
        return;
      } catch {
        // User cancelled — fall through to dropdown
      }
    }
    setOpen((v) => !v);
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${fullText}\n${url}`)}`;
  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}&url=${encodeURIComponent(url)}`;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Share"
        className="fx-button inline-flex items-center gap-2 rounded-full border border-smoke bg-obsidian px-5 py-3 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
      >
        <Share2 className="h-4 w-4" />
        SHARE
      </button>

      {/* Dropdown fallback (non-native) */}
      {open && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close share menu"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute left-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-2xl border border-smoke bg-obsidian shadow-2xl"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 font-ui text-[11px] tracking-[0.12em] text-parchment transition hover:bg-white/5 hover:text-gold"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              WHATSAPP
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 font-ui text-[11px] tracking-[0.12em] text-parchment transition hover:bg-white/5 hover:text-gold"
            >
              <Twitter className="h-4 w-4 text-sky-400" />
              TWITTER / X
            </a>
            <button
              type="button"
              onClick={() => { copyLink(); setOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-3 font-ui text-[11px] tracking-[0.12em] text-parchment transition hover:bg-white/5 hover:text-gold"
            >
              {copied ? (
                <Check className="h-4 w-4 text-gold" />
              ) : (
                <Link2 className="h-4 w-4 text-stone" />
              )}
              {copied ? "LINK COPIED!" : "COPY LINK"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

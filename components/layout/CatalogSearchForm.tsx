"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CatalogSearchFormProps {
  compact?: boolean;
  className?: string;
}

interface Suggestion {
  id: string;
  title: string;
  titleEn?: string;
  slug: string;
  coverImageUrl?: string;
  authorName: string;
}

export default function CatalogSearchForm({
  compact = false,
  className,
}: CatalogSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search suggestion loading
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error("Autocomplete search error:", error);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside detector
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (event.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        event.preventDefault();
        const selected = suggestions[activeIndex];
        router.push(`/books/${selected.slug}`);
        setShowSuggestions(false);
        setQuery("");
      }
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      router.push(`/books?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-2 rounded-full border border-smoke bg-void/90 px-3",
          compact ? "py-2" : "py-2.5"
        )}
        role="search"
        aria-label="Search books and authors"
      >
        <Search className="h-4 w-4 shrink-0 text-gold" />
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search books or authors"
          className={cn(
            "min-w-0 flex-1 bg-transparent font-body text-parchment outline-none placeholder:text-stone",
            compact ? "text-sm" : "text-[15px]"
          )}
          autoComplete="off"
          suppressHydrationWarning
        />
        <button
          type="submit"
          suppressHydrationWarning
          className={cn(
            "rounded-full border border-gold/35 bg-gold/10 px-3 font-ui tracking-[0.14em] text-gold transition hover:border-gold hover:bg-gold hover:text-void",
            compact ? "py-1 text-[10px]" : "py-1.5 text-[11px]"
          )}
        >
          SEARCH
        </button>
      </form>

      {/* Autocomplete Dropdown list */}
      {showSuggestions && (query.trim().length >= 2) && (suggestions.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[360px] overflow-y-auto rounded-2xl border border-smoke bg-obsidian/95 p-2 shadow-2xl backdrop-blur-md">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              <span className="ml-3 font-body text-xs text-stone">Searching catalog...</span>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="px-3 py-1.5 font-ui text-[9px] tracking-[0.16em] text-gold/70">
                SUGGESTED TITLES
              </p>
              {suggestions.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    router.push(`/books/${item.slug}`);
                    setShowSuggestions(false);
                    setQuery("");
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition duration-150",
                    index === activeIndex
                      ? "bg-gold/15 border-gold/20"
                      : "hover:bg-white/5 border-transparent",
                    "border"
                  )}
                >
                  <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded border border-smoke bg-ash">
                    {item.coverImageUrl ? (
                      <Image
                        src={item.coverImageUrl}
                        alt={item.title}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#242c35] to-[#161412]">
                        <span className="font-title text-sm text-gold/30">
                          {item.title.trim().charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-title text-base text-ivory">
                      {item.title}
                      {item.titleEn && (
                        <span className="ml-2 font-body text-xs text-stone">
                          ({item.titleEn})
                        </span>
                      )}
                    </p>
                    <p className="truncate font-body text-xs text-stone">{item.authorName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State suggestions */}
      {showSuggestions && (query.trim().length >= 2) && !loading && suggestions.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-smoke bg-obsidian/95 p-4 text-center shadow-2xl backdrop-blur-md">
          <p className="font-body text-sm text-stone">No matching books or authors found</p>
        </div>
      )}
    </div>
  );
}

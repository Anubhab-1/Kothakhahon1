"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "kothakhahon_recent_searches_v1";

interface SearchBoxClientProps {
  initialQuery: string;
}

export default function SearchBoxClient({ initialQuery }: SearchBoxClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((q) => typeof q === "string" && q.trim().length > 0);
        }
      } catch {
        window.localStorage.removeItem(RECENT_SEARCHES_KEY);
      }
    }
    return [];
  });
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);

  // 1. Fetch trending searches
  useEffect(() => {
    async function loadTrending() {
      try {
        const res = await fetch("/api/search?trending=true");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.queries)) {
            setTrendingSearches(data.queries);
          }
        }
      } catch (err) {
        console.error("Failed to load trending searches:", err);
      }
    }

    void loadTrending();
  }, []);

  const saveSearchTerm = (term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const targetQuery = query.trim();
    if (targetQuery.length >= 2) {
      saveSearchTerm(targetQuery);
      router.push(`/search?q=${encodeURIComponent(targetQuery)}`);
    }
  };

  const handlePillClick = (term: string) => {
    setQuery(term);
    saveSearchTerm(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const removeRecentTerm = (e: React.MouseEvent, term: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((q) => q !== term);
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isQueryEmpty = query.trim().length < 2;

  return (
    <div className="space-y-6">
      <div className="relative">
        <form onSubmit={handleSubmit}>
          <span className="relative flex items-center">
            <Search className="pointer-events-none absolute left-4 h-5 w-5 text-stone" />
            <input
              type="search"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              autoComplete="off"
              placeholder="Search books, authors, journal posts…"
              className="w-full rounded-2xl border border-smoke bg-void py-4 pl-12 pr-12 font-body text-lg text-ivory outline-none ring-gold transition placeholder:text-stone/50 focus:ring-1"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-24 p-1.5 text-stone hover:text-gold transition-colors duration-200 font-sans leading-none cursor-pointer"
                title="Clear search input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-3 rounded-xl border border-gold bg-gold px-4 py-2 font-ui text-[11px] tracking-[0.14em] text-void transition hover:bg-gold-dim cursor-pointer"
            >
              SEARCH
            </button>
          </span>
        </form>
      </div>

      {/* Local History & Trending Suggestion lists when query is empty */}
      {isQueryEmpty && (
        <div className="grid gap-6 md:grid-cols-2 pt-4 animation-reveal">
          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-smoke/60 bg-obsidian/40 p-5">
              <div className="flex items-center justify-between border-b border-smoke/30 pb-2">
                <h3 className="flex items-center gap-2 font-ui text-[10px] tracking-[0.18em] text-gold uppercase">
                  <Clock className="h-3.5 w-3.5" />
                  RECENT SEARCHES
                </h3>
                <button
                  onClick={clearRecent}
                  className="font-ui text-[9px] tracking-[0.14em] text-stone hover:text-ember transition duration-150 cursor-pointer"
                >
                  CLEAR ALL
                </button>
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    onClick={() => handlePillClick(term)}
                    className="group flex items-center justify-between px-3 py-2 rounded-xl bg-void/40 border border-smoke/30 hover:border-gold/30 hover:bg-gold/5 transition duration-200 cursor-pointer"
                  >
                    <span className="font-body text-sm text-parchment group-hover:text-gold transition">
                      {term}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => removeRecentTerm(e, term)}
                      className="p-1 rounded-full text-stone hover:text-ember transition duration-150"
                      title="Delete entry"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending queries */}
          {trendingSearches.length > 0 && (
            <div className={cn(
              "space-y-3 rounded-2xl border border-smoke/60 bg-obsidian/40 p-5",
              recentSearches.length === 0 && "md:col-span-2 max-w-xl mx-auto w-full"
            )}>
              <div className="border-b border-smoke/30 pb-2">
                <h3 className="flex items-center gap-2 font-ui text-[10px] tracking-[0.18em] text-gold uppercase">
                  <TrendingUp className="h-3.5 w-3.5" />
                  TRENDING SEARCHES
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handlePillClick(term)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-smoke/80 bg-white/4 px-4 py-2 font-body text-sm text-parchment hover:border-gold/50 hover:bg-gold/5 transition duration-250 cursor-pointer"
                  >
                    #{term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CatalogSearchFormProps {
  compact?: boolean;
  className?: string;
}

export default function CatalogSearchForm({
  compact = false,
  className,
}: CatalogSearchFormProps) {
  return (
    <form
      action="/books"
      className={cn(
        "flex items-center gap-2 rounded-full border border-smoke bg-void/90 px-3",
        compact ? "py-2" : "py-2.5",
        className,
      )}
      role="search"
      aria-label="Search books and authors"
    >
      <Search className="h-4 w-4 shrink-0 text-gold" />
      <input
        type="search"
        name="q"
        placeholder="Search books or authors"
        className={cn(
          "min-w-0 flex-1 bg-transparent font-body text-parchment outline-none placeholder:text-stone",
          compact ? "text-sm" : "text-[15px]",
        )}
      />
      <button
        type="submit"
        className={cn(
          "rounded-full border border-gold/35 bg-gold/10 px-3 font-ui tracking-[0.14em] text-gold transition hover:border-gold hover:bg-gold hover:text-void",
          compact ? "py-1 text-[10px]" : "py-1.5 text-[11px]",
        )}
      >
        SEARCH
      </button>
    </form>
  );
}

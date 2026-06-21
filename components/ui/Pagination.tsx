import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    }
    if (page > 1) {
      params.set("page", String(page));
    }
    const queryStr = params.toString();
    return queryStr ? `${baseUrl}?${queryStr}` : baseUrl;
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      if (start === 1) {
        end = 5;
      } else if (end === totalPages) {
        start = totalPages - 4;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={cn("flex items-center justify-center gap-2 py-8 mt-8 border-t border-smoke/30", className)}
    >
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-smoke/70 bg-obsidian/60 text-stone hover:border-gold hover:text-gold transition-colors duration-200"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span
          className="flex h-10 w-10 items-center justify-center rounded-md border border-smoke/30 text-stone/40 pointer-events-none"
          aria-disabled="true"
        >
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {/* Numbered pages */}
      {pages[0] > 1 && (
        <>
          <Link
            href={buildUrl(1)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-smoke/70 bg-obsidian/60 text-stone hover:border-gold hover:text-gold transition-colors duration-200 font-mono text-sm"
          >
            1
          </Link>
          {pages[0] > 2 && (
            <span className="flex h-10 w-10 items-center justify-center text-stone/50 font-mono text-sm">
              ...
            </span>
          )}
        </>
      )}

      {pages.map((page) => {
        const isCurrent = page === currentPage;
        return (
          <Link
            key={page}
            href={buildUrl(page)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md border font-mono text-sm transition-colors duration-200",
              isCurrent
                ? "border-gold bg-gold/10 text-gold font-bold"
                : "border-smoke/70 bg-obsidian/60 text-stone hover:border-gold hover:text-gold"
            )}
            aria-current={isCurrent ? "page" : undefined}
            aria-label={`Go to page ${page}`}
          >
            {page}
          </Link>
        );
      })}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="flex h-10 w-10 items-center justify-center text-stone/50 font-mono text-sm">
              ...
            </span>
          )}
          <Link
            href={buildUrl(totalPages)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-smoke/70 bg-obsidian/60 text-stone hover:border-gold hover:text-gold transition-colors duration-200 font-mono text-sm"
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-smoke/70 bg-obsidian/60 text-stone hover:border-gold hover:text-gold transition-colors duration-200"
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span
          className="flex h-10 w-10 items-center justify-center rounded-md border border-smoke/30 text-stone/40 pointer-events-none"
          aria-disabled="true"
        >
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}

"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { CatalogBook } from "@/lib/types";
import CatalogBookCard from "@/components/books/CatalogBookCard";
import { motion } from "@/components/ui/StaticMotion";

interface BooksCatalogClientProps {
  books: CatalogBook[];
}

interface BooksCatalogStatefulProps extends BooksCatalogClientProps {
  initialSearchTerm: string;
  initialGenre: string;
  initialSort: SortOption;
  initialPriceFilter: PriceFilter;
}

type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "title-az";
type PriceFilter = "all" | "under-400" | "400-600" | "above-600";

const PAGE_SIZE = 12;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function getComparableDate(dateValue?: string) {
  if (!dateValue) return 0;
  const parsed = Date.parse(dateValue);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatSortLabel(sortOption: SortOption) {
  switch (sortOption) {
    case "oldest":
      return "Oldest First";
    case "price-low":
      return "Price: Low to High";
    case "price-high":
      return "Price: High to Low";
    case "title-az":
      return "Title: A to Z";
    case "newest":
    default:
      return "Newest First";
  }
}

function formatPriceFilterLabel(priceFilter: PriceFilter) {
  switch (priceFilter) {
    case "under-400":
      return "Under INR 400";
    case "400-600":
      return "INR 400 To 600";
    case "above-600":
      return "Above INR 600";
    case "all":
    default:
      return "All Prices";
  }
}

function parseSortOption(sortOption?: string): SortOption {
  if (
    sortOption === "newest" ||
    sortOption === "oldest" ||
    sortOption === "price-low" ||
    sortOption === "price-high" ||
    sortOption === "title-az"
  ) {
    return sortOption;
  }

  return "newest";
}

function parsePriceFilter(priceFilter?: string): PriceFilter {
  if (
    priceFilter === "all" ||
    priceFilter === "under-400" ||
    priceFilter === "400-600" ||
    priceFilter === "above-600"
  ) {
    return priceFilter;
  }

  return "all";
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

function BooksCatalogStateful({
  books,
  initialSearchTerm,
  initialGenre,
  initialSort,
  initialPriceFilter,
}: BooksCatalogStatefulProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [sortOption, setSortOption] = useState<SortOption>(initialSort);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(initialPriceFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    books.forEach((book) => {
      book.genreNames.forEach((genre) => genreSet.add(genre));
    });
    return Array.from(genreSet).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const filteredBooks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = books.filter((book) => {
      const inGenre =
        selectedGenre === "all" || book.genreNames.some((genre) => genre === selectedGenre);
      if (!inGenre) {
        return false;
      }

      const inPriceBand =
        priceFilter === "all" ||
        (priceFilter === "under-400" && typeof book.price === "number" && book.price < 400) ||
        (priceFilter === "400-600" &&
          typeof book.price === "number" &&
          book.price >= 400 &&
          book.price <= 600) ||
        (priceFilter === "above-600" && typeof book.price === "number" && book.price > 600);
      if (!inPriceBand) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = `${book.title} ${book.authorName} ${book.genreNames.join(" ")}`.toLowerCase();
      return searchable.includes(query);
    });

    filtered.sort((a, b) => {
      switch (sortOption) {
        case "title-az":
          return a.title.localeCompare(b.title);
        case "price-low":
          return (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY);
        case "price-high":
          return (b.price ?? 0) - (a.price ?? 0);
        case "oldest":
          return getComparableDate(a.publicationDate) - getComparableDate(b.publicationDate);
        case "newest":
        default:
          return getComparableDate(b.publicationDate) - getComparableDate(a.publicationDate);
      }
    });

    return filtered;
  }, [books, priceFilter, searchTerm, selectedGenre, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const hasActiveFilters =
    selectedGenre !== "all" ||
    sortOption !== "newest" ||
    priceFilter !== "all" ||
    Boolean(searchTerm.trim());

  const visibleBooks = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredBooks.slice(start, start + PAGE_SIZE);
  }, [filteredBooks, safeCurrentPage]);

  const visiblePages = getVisiblePages(safeCurrentPage, totalPages);
  const showingFrom = filteredBooks.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const showingTo = filteredBooks.length === 0 ? 0 : showingFrom + visibleBooks.length - 1;

  return (

    <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-12">
      <section className="border-b border-smoke bg-transparent pb-8 pt-2">
        <div className="space-y-6">
          {/* Top Row: Search & Sort */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Minimal Search Bar */}
            <div className="relative flex-1 max-w-md group">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-stone/80 group-focus-within:text-gold transition-colors duration-300" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search title, author, or genre..."
                className="w-full border-b border-smoke/70 bg-transparent pl-7 pr-8 py-2 font-body text-base text-ivory outline-none transition-all duration-300 focus:border-gold placeholder:text-stone/50"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-stone/70 hover:text-gold transition-colors duration-200 font-sans text-base leading-none cursor-pointer"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sleek Custom Sort Dropdown */}
            <div className="flex items-center gap-3 self-start md:self-auto" ref={sortDropdownRef}>
              <span className="font-ui text-[9px] tracking-[0.18em] text-stone">SORT</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-4 px-3 py-1.5 border border-smoke/75 rounded-md font-ui text-[9px] tracking-[0.12em] text-parchment hover:border-gold/50 focus:border-gold transition-all duration-200 cursor-pointer min-w-[155px] justify-between uppercase"
                >
                  <span>{formatSortLabel(sortOption)}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-stone/80 transition-transform duration-300 ${isSortOpen ? 'rotate-180 text-gold' : ''}`} />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-void/98 border border-smoke/80 rounded-md shadow-2xl backdrop-blur-md z-30 overflow-hidden py-1 reveal-up">
                    {(["newest", "oldest", "price-low", "price-high", "title-az"] as SortOption[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSortOption(option);
                          setIsSortOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-4 py-2 font-ui text-[9px] tracking-[0.12em] uppercase transition-colors duration-150 cursor-pointer ${
                          sortOption === option
                            ? "bg-gold/8 text-gold font-medium"
                            : "text-stone hover:bg-ash/50 hover:text-gold"
                        }`}
                      >
                        {formatSortLabel(option)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Filter lists */}
          <div className="space-y-4">
            {/* Genre Filter Tabs Wrapper with Fade Gradients */}
            <div className="relative -mx-4 md:-mx-8">
              {/* Left fade indicator */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-void via-void/40 to-transparent z-10" />
              {/* Right fade indicator */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-void via-void/40 to-transparent z-10" />

              <div className="flex items-center gap-4 overflow-x-auto px-6 md:px-10 pb-2 scrollbar-none">
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-gold/75 mr-1" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGenre("all");
                    setCurrentPage(1);
                  }}
                  className={`shrink-0 border-b-2 px-1 pb-1 pt-0.5 font-ui text-[10px] tracking-[0.16em] uppercase transition duration-200 ${
                    selectedGenre === "all"
                      ? "border-gold text-gold font-semibold"
                      : "border-transparent text-stone hover:text-gold"
                  }`}
                >
                  ALL
                </button>

                {genres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => {
                      setSelectedGenre(genre);
                      setCurrentPage(1);
                    }}
                    className={`shrink-0 border-b-2 px-1 pb-1 pt-0.5 font-ui text-[10px] tracking-[0.16em] uppercase transition duration-200 ${
                      selectedGenre === genre
                        ? "border-gold text-gold font-semibold"
                        : "border-transparent text-stone hover:text-gold"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-smoke/35">
              <span className="font-ui text-[10px] tracking-[0.16em] text-stone/75 mr-2">PRICE</span>
              {[
                { value: "all", label: "All Prices" },
                { value: "under-400", label: "Under ₹400" },
                { value: "400-600", label: "₹400 - ₹600" },
                { value: "above-600", label: "Above ₹600" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPriceFilter(option.value as PriceFilter);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full border px-3 py-1 font-ui text-[9px] tracking-[0.14em] transition ${
                    priceFilter === option.value
                      ? "border-gold/60 bg-gold/8 text-gold font-medium"
                      : "border-smoke/70 bg-transparent text-stone hover:border-gold/40 hover:text-gold"
                  }`}
                >
                  {option.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 border-t border-smoke/70 pt-4">
              <span className="font-ui text-[9px] tracking-[0.16em] text-stone">ACTIVE FILTERS</span>

              {selectedGenre !== "all" && (
                <button
                  type="button"
                  onClick={() => { setSelectedGenre("all"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[9px] tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  {selectedGenre.toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {priceFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => { setPriceFilter("all"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[9px] tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  {formatPriceFilterLabel(priceFilter).toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {sortOption !== "newest" && (
                <button
                  type="button"
                  onClick={() => { setSortOption("newest"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-smoke/70 bg-transparent px-2.5 py-0.5 font-ui text-[9px] tracking-[0.12em] text-stone transition-all duration-200 hover:border-gold/40 hover:text-gold cursor-pointer"
                >
                  {formatSortLabel(sortOption).toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {searchTerm.trim() && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[9px] tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  QUERY: {searchTerm.trim().toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedGenre("all");
                  setPriceFilter("all");
                  setSortOption("newest");
                  setCurrentPage(1);
                }}
                className="ml-auto font-ui text-[9px] tracking-[0.14em] text-stone hover:text-ember transition-colors duration-200 cursor-pointer border-b border-transparent hover:border-ember pb-0.5"
              >
                CLEAR ALL
              </button>
            </div>
          )}

        </div>
      </section>

      {filteredBooks.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-smoke bg-obsidian p-8 text-center">
          <h2 className="font-title text-3xl text-ivory">No books found</h2>
          <p className="mt-2 font-body text-base text-stone">
            Try a broader search or reset the active shelf filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedGenre("all");
              setPriceFilter("all");
              setSortOption("newest");
              setCurrentPage(1);
            }}
            className="fx-button mt-5 rounded-full border border-gold bg-gold px-5 py-2.5 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
          >
            RESET FILTERS
          </button>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-smoke bg-obsidian/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-ui text-[10px] tracking-[0.16em] text-gold">CATALOG VIEW</p>
              <p className="mt-1 font-body text-sm text-parchment">
                Showing {showingFrom}-{showingTo} of {filteredBooks.length} titles
              </p>
            </div>
            <p className="font-ui text-[10px] tracking-[0.14em] text-stone">
              Page {safeCurrentPage} of {totalPages}
            </p>
          </div>

          <motion.div
            key={`${selectedGenre}-${priceFilter}-${sortOption}-${searchTerm}-${safeCurrentPage}`}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4"
          >
            {visibleBooks.map((book) => (
              <motion.div key={book.id} variants={itemVariants} transition={{ duration: 0.25 }}>
                <CatalogBookCard book={book} />
              </motion.div>
            ))}
          </motion.div>

          {totalPages > 1 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, Math.min(page, totalPages) - 1))
                }
                className="fx-button rounded-md border border-smoke px-3 py-2 font-ui text-[10px] tracking-[0.12em] text-parchment transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50 sm:text-[11px]"
              >
                PREV
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`fx-button rounded-md border px-3 py-2 font-ui text-[10px] tracking-[0.12em] transition sm:text-[11px] ${
                    safeCurrentPage === page
                      ? "border-gold bg-gold text-void"
                      : "border-smoke text-parchment hover:border-gold hover:text-gold"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="fx-button rounded-md border border-smoke px-3 py-2 font-ui text-[10px] tracking-[0.12em] text-parchment transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50 sm:text-[11px]"
              >
                NEXT
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function BooksCatalogClient({ books }: BooksCatalogClientProps) {
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  return (
    <BooksCatalogStateful
      key={paramsKey}
      books={books}
      initialSearchTerm={(searchParams.get("q") ?? "").trim()}
      initialGenre={searchParams.get("genre")?.trim() || "all"}
      initialSort={parseSortOption(searchParams.get("sort") ?? undefined)}
      initialPriceFilter={parsePriceFilter(searchParams.get("price") ?? undefined)}
    />
  );
}

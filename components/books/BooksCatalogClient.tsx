"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List, X } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import type { CatalogBook } from "@/lib/types";
import CatalogBookCard from "@/components/books/CatalogBookCard";
import { motion } from "@/components/ui/StaticMotion";
import Image from "next/image";
import Link from "next/link";
import AddToCart from "@/components/ui/AddToCart";
import DecorativeBookCover from "@/components/ui/DecorativeBookCover";
import { getStockStatusLabel, isBookAvailableForSale } from "@/lib/inventory";
import { formatINR, cn } from "@/lib/utils";

interface BooksCatalogClientProps {
  books: CatalogBook[];
}

interface BooksCatalogStatefulProps extends BooksCatalogClientProps {
  initialSearchTerm: string;
  initialGenre: string;
  initialSort: SortOption;
  initialPriceFilter: PriceFilter;
  initialAuthor: string;
  initialLanguage: string;
  initialInStock: boolean;
}

type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "title-az" | "best-selling" | "highest-rated";
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
    case "best-selling":
      return "Best Selling";
    case "highest-rated":
      return "Highest Rated";
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
    sortOption === "title-az" ||
    sortOption === "best-selling" ||
    sortOption === "highest-rated"
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
  initialAuthor,
  initialLanguage,
  initialInStock,
}: BooksCatalogStatefulProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedAuthor, setSelectedAuthor] = useState(initialAuthor);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [inStockOnly, setInStockOnly] = useState(initialInStock);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState<SortOption>(initialSort);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(initialPriceFilter);

  // Sync state back to URL query parameters
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedGenre !== "all") params.set("genre", selectedGenre);
    if (selectedAuthor !== "all") params.set("author", selectedAuthor);
    if (selectedLanguage !== "all") params.set("language", selectedLanguage);
    if (inStockOnly) params.set("inStock", "true");
    if (priceFilter !== "all") params.set("price", priceFilter);
    if (sortOption !== "newest") params.set("sort", sortOption);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

    window.history.replaceState(null, "", newUrl);
  }, [searchTerm, selectedGenre, selectedAuthor, selectedLanguage, inStockOnly, priceFilter, sortOption]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedGenre !== "all") count++;
    if (selectedAuthor !== "all") count++;
    if (selectedLanguage !== "all") count++;
    if (inStockOnly) count++;
    if (priceFilter !== "all") count++;
    if (sortOption !== "newest") count++;
    return count;
  }, [selectedGenre, selectedAuthor, selectedLanguage, inStockOnly, priceFilter, sortOption]);

  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    books.forEach((book) => {
      book.genreNames.forEach((genre) => genreSet.add(genre));
    });
    return Array.from(genreSet).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const authors = useMemo(() => {
    const authorSet = new Set<string>();
    books.forEach((book) => {
      if (book.authorName) authorSet.add(book.authorName);
    });
    return Array.from(authorSet).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((book) => {
      book.genreNames.forEach((genre) => {
        counts[genre] = (counts[genre] ?? 0) + 1;
      });
    });
    return counts;
  }, [books]);

  const authorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((book) => {
      if (book.authorName) {
        counts[book.authorName] = (counts[book.authorName] ?? 0) + 1;
      }
    });
    return counts;
  }, [books]);

  const languageCounts = useMemo(() => {
    const counts: Record<string, number> = { Bengali: 0, English: 0 };
    books.forEach((book) => {
      if (book.language) {
        const lang = book.language.toLowerCase() === "english" ? "English" : "Bengali";
        counts[lang] = (counts[lang] ?? 0) + 1;
      }
    });
    return counts;
  }, [books]);

  const priceCounts = useMemo(() => {
    const counts: Record<PriceFilter, number> = { all: books.length, "under-400": 0, "400-600": 0, "above-600": 0 };
    books.forEach((book) => {
      if (typeof book.price === "number") {
        if (book.price < 400) {
          counts["under-400"]++;
        } else if (book.price <= 600) {
          counts["400-600"]++;
        } else {
          counts["above-600"]++;
        }
      }
    });
    return counts;
  }, [books]);

  const inStockCount = useMemo(() => {
    return books.filter((book) => book.stockStatus !== "out_of_stock").length;
  }, [books]);

  const filteredBooks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = books.filter((book) => {
      const inGenre =
        selectedGenre === "all" || book.genreNames.some((genre) => genre === selectedGenre);
      if (!inGenre) {
        return false;
      }

      const inAuthor = selectedAuthor === "all" || book.authorName === selectedAuthor;
      if (!inAuthor) {
        return false;
      }

      const inLanguage =
        selectedLanguage === "all" ||
        (book.language?.toLowerCase() === selectedLanguage.toLowerCase());
      if (!inLanguage) {
        return false;
      }

      const inStock = !inStockOnly || book.stockStatus !== "out_of_stock";
      if (!inStock) {
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
        case "best-selling":
          return (b.soldCount ?? 0) - (a.soldCount ?? 0);
        case "highest-rated":
          return (b.averageRating ?? 0) - (a.averageRating ?? 0);
        case "newest":
        default:
          return getComparableDate(b.publicationDate) - getComparableDate(a.publicationDate);
      }
    });

    return filtered;
  }, [books, priceFilter, searchTerm, selectedGenre, selectedAuthor, selectedLanguage, inStockOnly, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const hasActiveFilters =
    selectedGenre !== "all" ||
    selectedAuthor !== "all" ||
    selectedLanguage !== "all" ||
    inStockOnly ||
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
      <div className="space-y-4 pb-6 text-center md:pb-10">
        <p className="font-ui text-[10px] uppercase tracking-[0.26em] text-gold">Books</p>
        <h1 className="text-4xl font-title text-ivory sm:text-5xl">Kothakhahon catalog</h1>
        <p className="mx-auto max-w-3xl font-body text-base leading-8 text-parchment sm:text-lg">
          Browse the latest and most enduring Bengali literature editions, poetry, essays, and translated works.
          Use search, filters, and sorting to narrow the catalog to your reading preferences.
        </p>
      </div>

      <section className="border-b border-smoke bg-transparent pb-6 pt-2">
        <div className="space-y-4">
          {/* Top Row: Search & Toggle Filters Button */}
          <div className="flex items-center gap-3">
            {/* Minimal Search Bar */}
            <div className="relative flex-1 group">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-stone/80 group-focus-within:text-gold transition-colors duration-300" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search books by title, author, or genre"
                placeholder="Search catalog..."
                className="w-full border-b border-smoke/70 bg-transparent pl-7 pr-8 py-2 font-body text-sm sm:text-base text-ivory outline-none transition-all duration-300 focus:border-gold placeholder:text-stone/60"
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

            {/* Toggle Filters Button */}
            <button
              type="button"
              onClick={() => setIsFiltersOpen(true)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md font-ui text-[10px] sm:text-xs tracking-[0.14em] uppercase transition duration-200 cursor-pointer shrink-0",
                activeFiltersCount > 0
                  ? "border-gold bg-gold/8 text-gold"
                  : "border-smoke bg-obsidian/60 text-parchment hover:border-gold/50 hover:text-gold"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gold text-void font-sans text-[9px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="font-ui text-[9px] tracking-[0.16em] text-stone">ACTIVE FILTERS:</span>

              {selectedGenre !== "all" && (
                <button
                  type="button"
                  onClick={() => { setSelectedGenre("all"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[10px] sm:text-xs tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  GENRE: {selectedGenre.toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {selectedAuthor !== "all" && (
                <button
                  type="button"
                  onClick={() => { setSelectedAuthor("all"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[10px] sm:text-xs tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  AUTHOR: {selectedAuthor.toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {selectedLanguage !== "all" && (
                <button
                  type="button"
                  onClick={() => { setSelectedLanguage("all"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[10px] sm:text-xs tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  LANG: {selectedLanguage.toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {inStockOnly && (
                <button
                  type="button"
                  onClick={() => { setInStockOnly(false); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[10px] sm:text-xs tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  IN STOCK ONLY
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {priceFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => { setPriceFilter("all"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[10px] sm:text-xs tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  PRICE: {formatPriceFilterLabel(priceFilter).toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {sortOption !== "newest" && (
                <button
                  type="button"
                  onClick={() => { setSortOption("newest"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[10px] sm:text-xs tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  SORT: {formatSortLabel(sortOption).toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {searchTerm.trim() && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[10px] sm:text-xs tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
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
                  setSelectedAuthor("all");
                  setSelectedLanguage("all");
                  setInStockOnly(false);
                  setPriceFilter("all");
                  setSortOption("newest");
                  setCurrentPage(1);
                }}
                className="ml-auto font-ui text-[10px] tracking-[0.14em] text-stone hover:text-ember transition-colors duration-200 cursor-pointer border-b border-transparent hover:border-ember pb-0.5"
              >
                CLEAR ALL
              </button>
            </div>
          )}

          {/* Sliding Filter Drawer Panel */}
          <AnimatePresence>
            {isFiltersOpen && (
              <>
                {/* Backdrop Overlay */}
                <Motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsFiltersOpen(false)}
                  className="fixed inset-0 z-50 bg-void/65 backdrop-blur-[1px] w-full h-full cursor-default"
                  aria-label="Close filters"
                />

                {/* Drawer Aside */}
                <Motion.aside
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                  className="fixed top-0 right-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-smoke bg-obsidian shadow-2xl"
                >
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-smoke px-5 py-4">
                    <div>
                      <p className="font-ui text-[10px] tracking-[0.15em] text-gold">CATALOG</p>
                      <h2 className="mt-1 text-safe font-title text-3xl text-ivory">Filter & Sort</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFiltersOpen(false)}
                      className="rounded-full border border-smoke p-2 text-stone transition hover:border-gold hover:text-gold cursor-pointer"
                      aria-label="Close filters drawer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Drawer Body - Scrollable Form elements */}
                  <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
                    {/* Sort By */}
                    <div>
                      <span className="block font-ui text-[10px] tracking-[0.18em] text-stone mb-2 uppercase">SORT BY</span>
                      <select
                        value={sortOption}
                        onChange={(e) => {
                          setSortOption(e.target.value as SortOption);
                          setCurrentPage(1);
                        }}
                        className="w-full bg-obsidian border border-smoke/75 rounded-md px-3 py-2.5 font-ui text-[11px] tracking-[0.12em] text-parchment hover:border-gold/50 focus:border-gold outline-none transition uppercase"
                      >
                        <option value="newest">NEWEST FIRST</option>
                        <option value="oldest">OLDEST FIRST</option>
                        <option value="price-low">PRICE: LOW TO HIGH</option>
                        <option value="price-high">PRICE: HIGH TO LOW</option>
                        <option value="title-az">TITLE: A TO Z</option>
                        <option value="best-selling">BEST SELLING</option>
                        <option value="highest-rated">HIGHEST RATED</option>
                      </select>
                    </div>

                    {/* Price Band */}
                    <div>
                      <span className="block font-ui text-[10px] tracking-[0.18em] text-stone mb-2 uppercase">PRICE BAND</span>
                      <select
                        value={priceFilter}
                        onChange={(e) => {
                          setPriceFilter(e.target.value as PriceFilter);
                          setCurrentPage(1);
                        }}
                        className="w-full bg-obsidian border border-smoke/75 rounded-md px-3 py-2.5 font-ui text-[11px] tracking-[0.12em] text-parchment hover:border-gold/50 focus:border-gold outline-none transition uppercase"
                      >
                        <option value="all">ALL PRICES ({priceCounts["all"]})</option>
                        <option value="under-400">UNDER ₹400 ({priceCounts["under-400"]})</option>
                        <option value="400-600">₹400 - ₹600 ({priceCounts["400-600"]})</option>
                        <option value="above-600">ABOVE ₹600 ({priceCounts["above-600"]})</option>
                      </select>
                    </div>

                    {/* Author */}
                    <div>
                      <span className="block font-ui text-[10px] tracking-[0.18em] text-stone mb-2 uppercase">AUTHOR</span>
                      <select
                        value={selectedAuthor}
                        onChange={(e) => {
                          setSelectedAuthor(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full bg-obsidian border border-smoke/75 rounded-md px-3 py-2.5 font-ui text-[11px] tracking-[0.12em] text-parchment hover:border-gold/50 focus:border-gold outline-none transition uppercase"
                      >
                        <option value="all">ALL AUTHORS ({books.length})</option>
                        {authors.map((authorName) => (
                          <option key={authorName} value={authorName}>
                            {authorName.toUpperCase()} ({authorCounts[authorName] ?? 0})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Genre */}
                    <div>
                      <span className="block font-ui text-[10px] tracking-[0.18em] text-stone mb-2 uppercase">GENRE</span>
                      <select
                        value={selectedGenre}
                        onChange={(e) => {
                          setSelectedGenre(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full bg-obsidian border border-smoke/75 rounded-md px-3 py-2.5 font-ui text-[11px] tracking-[0.12em] text-parchment hover:border-gold/50 focus:border-gold outline-none transition uppercase"
                      >
                        <option value="all">ALL GENRES ({books.length})</option>
                        {genres.map((genre) => (
                          <option key={genre} value={genre}>
                            {genre.toUpperCase()} ({genreCounts[genre] ?? 0})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Language */}
                    <div>
                      <span className="block font-ui text-[10px] tracking-[0.18em] text-stone mb-2 uppercase">LANGUAGE</span>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => {
                          setSelectedLanguage(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full bg-obsidian border border-smoke/75 rounded-md px-3 py-2.5 font-ui text-[11px] tracking-[0.12em] text-parchment hover:border-gold/50 focus:border-gold outline-none transition uppercase"
                      >
                        <option value="all">ALL LANGUAGES ({books.length})</option>
                        <option value="Bengali">BENGALI ({languageCounts["Bengali"] ?? 0})</option>
                        <option value="English">ENGLISH ({languageCounts["English"] ?? 0})</option>
                      </select>
                    </div>

                    {/* Availability */}
                    <div>
                      <span className="block font-ui text-[10px] tracking-[0.18em] text-stone mb-2 uppercase">AVAILABILITY</span>
                      <button
                        type="button"
                        onClick={() => {
                          setInStockOnly(!inStockOnly);
                          setCurrentPage(1);
                        }}
                        className={cn(
                          "w-full rounded-md border py-2.5 px-3 font-ui text-[11px] tracking-[0.14em] uppercase transition-all duration-200 cursor-pointer text-center",
                          inStockOnly
                            ? "border-gold bg-gold/8 text-gold font-medium"
                            : "border-smoke/70 bg-transparent text-stone hover:border-gold/40 hover:text-gold"
                        )}
                      >
                        IN STOCK ONLY ({inStockCount})
                      </button>
                    </div>
                  </div>

                  {/* Drawer Footer */}
                  <div className="border-t border-smoke px-5 py-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedGenre("all");
                        setSelectedAuthor("all");
                        setSelectedLanguage("all");
                        setInStockOnly(false);
                        setPriceFilter("all");
                        setSortOption("newest");
                        setCurrentPage(1);
                      }}
                      className="rounded-full border border-smoke px-4 py-2 font-ui text-[10px] tracking-[0.12em] text-parchment transition hover:border-ember hover:text-ember cursor-pointer"
                    >
                      CLEAR
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFiltersOpen(false)}
                      className="fx-button inline-flex flex-1 items-center justify-center rounded-full border border-gold bg-gold px-4 py-2.5 font-mono text-xs font-medium tracking-widest text-void shadow-lg transition hover:bg-ivory hover:border-ivory cursor-pointer"
                    >
                      SHOW {filteredBooks.length} BOOKS
                    </button>
                  </div>
                </Motion.aside>
              </>
            )}
          </AnimatePresence>

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
              setSelectedAuthor("all");
              setSelectedLanguage("all");
              setInStockOnly(false);
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
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-smoke/70 rounded-md overflow-hidden bg-void/50">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    viewMode === "grid" ? "bg-gold text-void" : "text-stone hover:text-gold"
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    viewMode === "list" ? "bg-gold text-void" : "text-stone hover:text-gold"
                  }`}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <p className="font-ui text-[10px] tracking-[0.14em] text-stone hidden sm:block">
                Page {safeCurrentPage} of {totalPages}
              </p>
            </div>
          </div>

          {viewMode === "grid" ? (
            <motion.div
              key={`grid-${selectedGenre}-${priceFilter}-${sortOption}-${searchTerm}-${safeCurrentPage}`}
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
          ) : (
            <motion.div
              key={`list-${selectedGenre}-${priceFilter}-${sortOption}-${searchTerm}-${safeCurrentPage}`}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="mt-6 flex flex-col gap-4"
            >
              {visibleBooks.map((book) => {
                const isAvailable = isBookAvailableForSale(book);
                return (
                  <motion.div
                    key={book.id}
                    variants={itemVariants}
                    transition={{ duration: 0.25 }}
                    className="fx-card group relative overflow-hidden rounded-2xl border border-smoke bg-obsidian/85 p-4 transition hover:border-gold/60 hover:shadow-[0_16px_45px_rgba(201,151,58,0.12)] flex gap-5 items-stretch"
                  >
                    <Link
                      href={`/books/${book.slug}`}
                      className="absolute inset-0 z-10 rounded-2xl"
                      aria-label={`Open ${book.title}`}
                    />
                    
                    {/* Cover Image on Left */}
                    <div className="book-edge relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl bg-void/50">
                      {book.coverImageUrl ? (
                        <Image
                          src={book.coverImageUrl}
                          alt={book.title}
                          fill
                          sizes="96px"
                          className="object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <DecorativeBookCover
                          title={book.title}
                          subtitle={book.authorName}
                          compact
                          className="rounded-none border-0"
                        />
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/90 via-transparent to-transparent" />
                    </div>

                    {/* Info on Right */}
                    <div className="flex-1 flex flex-col justify-between relative z-20">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="rounded-full border border-gold/40 bg-void/80 px-2 py-0.5 font-ui text-[10px] tracking-[0.14em] text-gold uppercase">
                            BOOK
                          </span>
                          <span className="rounded-full border border-smoke bg-void/80 px-2 py-0.5 font-ui text-[10px] tracking-[0.14em] text-parchment uppercase">
                            {getStockStatusLabel(book.stockStatus).toUpperCase()}
                          </span>
                        </div>

                        <h3 className="text-safe font-title text-[1.4rem] leading-tight text-ivory sm:text-[1.7rem]">
                          {book.title}
                        </h3>
                        <p className="font-body text-sm text-stone">{book.authorName}</p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {book.genreNames.map((genre, idx) => (
                            <span key={`${book.id}-${genre}`}>
                              {idx > 0 && <span className="sr-only">, </span>}
                              <span className="rounded-full border border-smoke/70 px-2.5 py-0.5 font-mono text-[10px] text-stone">
                                {genre}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pricing and Action row */}
                      <div className="flex items-center justify-between gap-4 pt-3 border-t border-smoke/45 mt-2">
                        <p className="rounded-full border border-smoke px-3 py-1 font-mono text-xs text-parchment">
                          {formatINR(book.price)}
                        </p>
                        <AddToCart
                          bookId={book.id}
                          title={book.title}
                          price={book.price}
                          authorName={book.authorName}
                          coverImageUrl={book.coverImageUrl}
                          disabled={!isAvailable}
                          label="ADD TO CART"
                          addedLabel="ADDED TO CART"
                          mobileLabel="ADD"
                          mobileAddedLabel="ADDED"
                          className="px-4 py-2 text-[10px] tracking-[0.14em]"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

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

export default function BooksCatalogClient({
  books,
}: BooksCatalogClientProps) {
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
      initialAuthor={searchParams.get("author")?.trim() || "all"}
      initialLanguage={searchParams.get("language")?.trim() || "all"}
      initialInStock={searchParams.get("inStock") === "true"}
    />
  );
}

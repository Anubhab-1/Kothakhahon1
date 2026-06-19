"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, ChevronDown, LayoutGrid, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { CatalogBook } from "@/lib/types";
import CatalogBookCard from "@/components/books/CatalogBookCard";
import { motion } from "@/components/ui/StaticMotion";
import Image from "next/image";
import Link from "next/link";
import AddToCart from "@/components/ui/AddToCart";
import DecorativeBookCover from "@/components/ui/DecorativeBookCover";
import { getStockStatusLabel, isBookAvailableForSale } from "@/lib/inventory";
import { formatINR } from "@/lib/utils";

interface BooksCatalogClientProps {
  books: CatalogBook[];
}

interface BooksCatalogStatefulProps extends BooksCatalogClientProps {
  initialSearchTerm: string;
  initialGenre: string;
  initialSort: SortOption;
  initialPriceFilter: PriceFilter;
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
}: BooksCatalogStatefulProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  const authors = useMemo(() => {
    const authorSet = new Set<string>();
    books.forEach((book) => {
      if (book.authorName) authorSet.add(book.authorName);
    });
    return Array.from(authorSet).sort((a, b) => a.localeCompare(b));
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
                aria-label="Search books by title, author, or genre"
                placeholder="Search title, author, or genre..."
                className="w-full border-b border-smoke/70 bg-transparent pl-7 pr-8 py-2 font-body text-base text-ivory outline-none transition-all duration-300 focus:border-gold placeholder:text-stone/60"
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
                  aria-haspopup="listbox"
                  aria-expanded={isSortOpen}
                  className="flex items-center gap-4 px-3 py-1.5 border border-smoke/75 rounded-md font-ui text-[9px] tracking-[0.12em] text-parchment hover:border-gold/50 focus:border-gold transition-all duration-200 cursor-pointer min-w-[155px] justify-between uppercase"
                >
                  <span>{formatSortLabel(sortOption)}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-stone/80 transition-transform duration-300 ${isSortOpen ? 'rotate-180 text-gold' : ''}`} />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-void/98 border border-smoke/80 rounded-md shadow-2xl backdrop-blur-md z-30 overflow-hidden py-1 reveal-up">
                    {(["newest", "oldest", "price-low", "price-high", "title-az", "best-selling", "highest-rated"] as SortOption[]).map((option) => (
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
                            : "text-stone hover:bg-obsidian hover:text-gold"
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

            {/* Author, Language, Availability Filters */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-smoke/35">
              <div className="flex items-center gap-2">
                <span className="font-ui text-[10px] tracking-[0.16em] text-stone/75 mr-1">AUTHOR</span>
                <select
                  value={selectedAuthor}
                  onChange={(e) => {
                    setSelectedAuthor(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-obsidian border border-smoke/75 rounded px-2.5 py-1 font-ui text-[9px] tracking-[0.12em] text-parchment hover:border-gold/50 focus:border-gold outline-none transition uppercase"
                >
                  <option value="all">ALL AUTHORS</option>
                  {authors.map((authorName) => (
                    <option key={authorName} value={authorName}>
                      {authorName.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 ml-2">
                <span className="font-ui text-[10px] tracking-[0.16em] text-stone/75 mr-1">LANGUAGE</span>
                {["all", "Bengali", "English"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setCurrentPage(1);
                    }}
                    className={`rounded-full border px-3 py-1 font-ui text-[9px] tracking-[0.14em] uppercase transition ${
                      selectedLanguage === lang
                        ? "border-gold/60 bg-gold/8 text-gold font-medium"
                        : "border-smoke/70 bg-transparent text-stone hover:border-gold/40 hover:text-gold"
                    }`}
                  >
                    {lang === "all" ? "ALL LANGUAGES" : lang}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ml-2">
                <span className="font-ui text-[10px] tracking-[0.16em] text-stone/75 mr-1">AVAILABILITY</span>
                <button
                  type="button"
                  onClick={() => {
                    setInStockOnly(!inStockOnly);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full border px-3 py-1 font-ui text-[9px] tracking-[0.14em] uppercase transition ${
                    inStockOnly
                      ? "border-gold/60 bg-gold/8 text-gold font-medium"
                      : "border-smoke/70 bg-transparent text-stone hover:border-gold/40 hover:text-gold"
                  }`}
                >
                  IN STOCK ONLY
                </button>
              </div>
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
                  GENRE: {selectedGenre.toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {selectedAuthor !== "all" && (
                <button
                  type="button"
                  onClick={() => { setSelectedAuthor("all"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[9px] tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  AUTHOR: {selectedAuthor.toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {selectedLanguage !== "all" && (
                <button
                  type="button"
                  onClick={() => { setSelectedLanguage("all"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[9px] tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  LANG: {selectedLanguage.toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {inStockOnly && (
                <button
                  type="button"
                  onClick={() => { setInStockOnly(false); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[9px] tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  IN STOCK ONLY
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {priceFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => { setPriceFilter("all"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[9px] tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  PRICE: {formatPriceFilterLabel(priceFilter).toUpperCase()}
                  <span aria-hidden className="text-[11px] opacity-70 ml-0.5">×</span>
                </button>
              )}

              {sortOption !== "newest" && (
                <button
                  type="button"
                  onClick={() => { setSortOption("newest"); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 font-ui text-[9px] tracking-[0.12em] text-gold transition-all duration-200 hover:border-gold/60 hover:bg-gold/10 cursor-pointer"
                >
                  SORT: {formatSortLabel(sortOption).toUpperCase()}
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
                  setSelectedAuthor("all");
                  setSelectedLanguage("all");
                  setInStockOnly(false);
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
                          <span className="rounded-full border border-gold/40 bg-void/80 px-2 py-0.5 font-ui text-[9px] tracking-[0.14em] text-gold uppercase">
                            BOOK
                          </span>
                          <span className="rounded-full border border-smoke bg-void/80 px-2 py-0.5 font-ui text-[9px] tracking-[0.14em] text-parchment uppercase">
                            {getStockStatusLabel(book.stockStatus).toUpperCase()}
                          </span>
                        </div>

                        <h3 className="text-safe font-title text-[1.4rem] leading-tight text-ivory sm:text-[1.7rem]">
                          {book.title}
                        </h3>
                        <p className="font-body text-sm text-stone">{book.authorName}</p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {book.genreNames.map((genre) => (
                            <span
                              key={`${book.id}-${genre}`}
                              className="rounded-full border border-smoke/70 px-2.5 py-0.5 font-mono text-[9px] text-stone"
                            >
                              {genre}
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
    />
  );
}

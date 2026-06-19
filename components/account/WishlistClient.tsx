"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { formatINR } from "@/lib/utils";
import { motion } from "@/components/ui/StaticMotion";

interface WishlistItem {
  id: string;
  bookId: string;
  bookSlug: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl: string | null;
  price: number | null;
}

interface WishlistClientProps {
  initialItems: WishlistItem[];
}

export default function WishlistClient({ initialItems }: WishlistClientProps) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const { addItem, openDrawer } = useCart();

  const handleRemove = async (bookId: string) => {
    setLoadingMap((prev) => ({ ...prev, [bookId]: true }));
    try {
      const res = await fetch(`/api/wishlist?bookId=${bookId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((current) => current.filter((item) => item.bookId !== bookId));
      }
    } catch (err) {
      console.error("Failed to remove item from wishlist:", err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [bookId]: false }));
    }
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    setLoadingMap((prev) => ({ ...prev, [item.bookId]: true }));
    try {
      // 1. Add to cart client/server sync
      addItem({
        bookId: item.bookId,
        title: item.bookTitle,
        authorName: item.bookAuthor,
        coverImageUrl: item.bookCoverUrl ?? undefined,
        price: item.price ?? undefined,
      });

      // 2. Remove from wishlist database
      const res = await fetch(`/api/wishlist?bookId=${item.bookId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((current) => current.filter((i) => i.bookId !== item.bookId));
      }
      
      // 3. Open cart drawer so user sees it was added
      openDrawer();
    } catch (err) {
      console.error("Failed to move item to cart:", err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [item.bookId]: false }));
    }
  };

  return (
    <div className="grain-overlay mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs tracking-[0.18em] text-gold">ACCOUNT</p>
          <h1 className="mt-2 font-title text-5xl text-ivory">My Wishlist</h1>
          <p className="mt-3 max-w-3xl font-body text-base text-stone">
            Save the literary pieces you plan to read next. Move them to your cart when you are ready to check out.
          </p>
        </div>
        <Link
          href="/account"
          className="fx-button inline-flex rounded-full border border-smoke bg-obsidian px-5 py-2.5 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
        >
          BACK TO ACCOUNT
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const isLoading = !!loadingMap[item.bookId];
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fx-card group relative overflow-hidden rounded-[24px] border border-smoke bg-obsidian/80 p-4 transition-all duration-300 hover:border-gold/60 flex flex-col justify-between"
              >
                <div>
                  {/* Image */}
                  <div className="book-edge relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-void/50">
                    {item.bookCoverUrl ? (
                      <Image
                        src={item.bookCoverUrl}
                        alt={item.bookTitle}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-obsidian text-stone/50 font-title text-center p-4">
                        {item.bookTitle}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleRemove(item.bookId)}
                      className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-void/80 border border-smoke text-stone hover:text-ember hover:border-ember/50 transition duration-200"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/90 via-transparent to-transparent" />
                  </div>

                  {/* Info */}
                  <div className="mt-4 space-y-1">
                    <Link href={`/books/${item.bookSlug}`} className="hover:text-gold transition">
                      <h3 className="line-clamp-2 text-safe font-title text-xl text-ivory leading-tight">
                        {item.bookTitle}
                      </h3>
                    </Link>
                    <p className="font-body text-sm text-stone">{item.bookAuthor}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 pt-3 border-t border-smoke/35">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-parchment font-semibold">
                      {item.price ? formatINR(item.price) : "Not Priced"}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleMoveToCart(item)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-dim px-3 py-2.5 font-ui text-[10px] font-bold tracking-[0.14em] text-void transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    MOVE TO BAG
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-[30px] border border-smoke bg-void/70 p-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/5 text-gold">
            <Heart className="h-6 w-6 fill-none" />
          </div>
          <h2 className="font-title text-3xl text-ivory">Your Wishlist is Empty</h2>
          <p className="max-w-xl mx-auto font-body text-base text-stone leading-relaxed">
            There are no books currently on your shelf. Head over to our catalog to discover beautiful editions of Bengali literature.
          </p>
          <div className="pt-2">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs font-semibold tracking-wider text-void transition hover:bg-gold-dim"
            >
              BROWSE BOOKS
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

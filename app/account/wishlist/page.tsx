import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, BookOpen, ShoppingBag } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { toggleWishlistAction } from "./actions";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const session = await requireSession("/login?next=/account/wishlist");

  if (session.role === "ADMIN") redirect("/admin");

  const items = await db.wishlistItem.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grain-overlay mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
      <section className="editorial-panel rounded-[30px] p-6 md:p-8">
        <p className="font-ui text-xs tracking-[0.18em] text-gold">YOUR READING LIST</p>
        <h1 className="mt-3 text-safe font-title text-5xl text-ivory md:text-6xl">Wishlist</h1>
        <p className="mt-3 font-body text-lg text-stone">
          Books you&apos;ve saved for later.{" "}
          {items.length > 0 && (
            <span className="text-parchment">{items.length} title{items.length !== 1 ? "s" : ""} saved.</span>
          )}
        </p>
      </section>

      {items.length === 0 ? (
        <div className="mt-8 rounded-[30px] border border-smoke bg-obsidian/50 p-10 text-center">
          <Heart className="mx-auto h-10 w-10 text-stone/30" />
          <p className="mt-4 font-title text-3xl text-ivory">Nothing saved yet</p>
          <p className="mt-2 font-body text-base text-stone">
            Tap the heart icon on any book to save it here for later.
          </p>
          <Link
            href="/books"
            className="fx-button mt-6 inline-flex rounded-full border border-gold bg-gold px-5 py-3 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
          >
            BROWSE CATALOG
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="fx-card group relative rounded-2xl border border-smoke bg-obsidian transition hover:-translate-y-1 hover:border-gold/50"
            >
              {/* Remove from wishlist */}
              <form action={toggleWishlistAction} className="absolute right-3 top-3 z-10">
                <input type="hidden" name="bookId" value={item.bookId} />
                <input type="hidden" name="bookSlug" value={item.bookSlug} />
                <input type="hidden" name="bookTitle" value={item.bookTitle} />
                <input type="hidden" name="bookAuthor" value={item.bookAuthor} />
                {item.bookCoverUrl && (
                  <input type="hidden" name="bookCoverUrl" value={item.bookCoverUrl} />
                )}
                {item.price != null && (
                  <input type="hidden" name="price" value={String(item.price)} />
                )}
                <button
                  type="submit"
                  title="Remove from wishlist"
                  className="rounded-full bg-obsidian/80 p-1.5 text-ember backdrop-blur transition hover:scale-110"
                  aria-label={`Remove ${item.bookTitle} from wishlist`}
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </form>

              <Link href={`/books/${item.bookSlug}`} className="block">
                {/* Cover */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl bg-ash">
                  {item.bookCoverUrl ? (
                    <Image
                      src={item.bookCoverUrl}
                      alt={item.bookTitle}
                      fill
                      sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="h-10 w-10 text-stone/30" />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/70 to-transparent" />
                </div>

                {/* Info */}
                <div className="space-y-1 p-4">
                  <p className="line-clamp-2 text-safe font-title text-xl text-ivory">
                    {item.bookTitle}
                  </p>
                  <p className="font-body text-sm text-stone">{item.bookAuthor}</p>
                  {item.price != null && (
                    <p className="font-mono text-xs text-gold">{formatINR(item.price)}</p>
                  )}
                </div>
              </Link>

              {/* Add to cart */}
              <div className="px-4 pb-4">
                <Link
                  href={`/books/${item.bookSlug}`}
                  className="fx-button flex w-full items-center justify-center gap-2 rounded-full border border-gold bg-gold py-2.5 font-ui text-[11px] tracking-[0.14em] text-void transition hover:bg-gold-dim"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  VIEW &amp; ADD TO BAG
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

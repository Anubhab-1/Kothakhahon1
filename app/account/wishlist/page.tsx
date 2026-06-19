import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import WishlistClient from "@/components/account/WishlistClient";

export const metadata: Metadata = {
  title: "My Wishlist",
};

export default async function WishlistPage() {
  const session = await requireSession("/account/wishlist");

  const items = await db.wishlistItem.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      bookId: true,
      bookSlug: true,
      bookTitle: true,
      bookAuthor: true,
      bookCoverUrl: true,
      price: true,
    },
  });

  return <WishlistClient initialItems={items} />;
}

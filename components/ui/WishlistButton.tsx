"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { usePublicSession } from "@/components/auth/PublicSessionProvider";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WishlistButtonProps {
  bookId: string;
  bookSlug: string;
  className?: string;
}

interface WishlistResponseItem {
  bookId: string;
}

export default function WishlistButton({ bookId, className }: WishlistButtonProps) {
  const session = usePublicSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!session?.id) {
      setIsInWishlist(false);
      return;
    }

    let active = true;
    async function checkWishlistStatus() {
      setChecking(true);
      try {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.items)) {
            const found = data.items.some((item: WishlistResponseItem) => item.bookId === bookId);
            setIsInWishlist(found);
          }
        }
      } catch (err) {
        console.error("Failed to check wishlist status:", err);
      } finally {
        if (active) setChecking(false);
      }
    }

    void checkWishlistStatus();
    return () => {
      active = false;
    };
  }, [bookId, session?.id]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.id) {
      // Redirect to login page with callback
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (loading || checking) return;

    setLoading(true);
    try {
      if (isInWishlist) {
        const res = await fetch(`/api/wishlist?bookId=${bookId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsInWishlist(false);
          toast.info("Removed from wishlist");
        }
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId }),
        });
        if (res.ok) {
          setIsInWishlist(true);
          toast.success("Added to wishlist");
        }
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={checking}
      className={cn(
        "fx-button inline-flex items-center justify-center rounded-full border px-5 py-3 font-ui text-xs tracking-[0.13em] transition-all duration-300 gap-2 cursor-pointer",
        isInWishlist
          ? "border-ember/50 bg-ember/10 text-ember hover:bg-ember/20"
          : "border-smoke bg-obsidian text-parchment hover:border-gold hover:text-gold",
        className
      )}
      title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-transform duration-300",
          isInWishlist ? "fill-ember text-ember scale-110" : "fill-none"
        )}
      />
      <span>{isInWishlist ? "WISHLISTED" : "ADD TO WISHLIST"}</span>
    </button>
  );
}

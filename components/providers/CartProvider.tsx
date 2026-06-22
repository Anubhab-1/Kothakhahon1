"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePublicSession } from "@/components/auth/PublicSessionProvider";
import { toast } from "sonner";

const STORAGE_KEY = "kothakhahon_cart_v1";

export interface CartLineItem {
  bookId: string;
  title: string;
  authorName?: string;
  coverImageUrl?: string;
  price: number;
  quantity: number;
}

interface AddCartInput {
  bookId: string;
  title: string;
  authorName?: string;
  coverImageUrl?: string;
  price?: number;
}

interface CartContextValue {
  items: CartLineItem[];
  itemCount: number;
  subtotal: number;
  isDrawerOpen: boolean;
  isHydrated: boolean;
  addItem: (item: AddCartInput, quantity?: number) => void;
  removeItem: (bookId: string) => void;
  setQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const noop = () => {};

const fallbackCartContext: CartContextValue = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  isDrawerOpen: false,
  isHydrated: false,
  addItem: noop,
  removeItem: noop,
  setQuantity: noop,
  clearCart: noop,
  openDrawer: noop,
  closeDrawer: noop,
  toggleDrawer: noop,
};

function sanitizePrice(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return 0;
  }
  return value;
}

function normalizeItem(item: CartLineItem): CartLineItem {
  return {
    bookId: item.bookId,
    title: item.title,
    authorName: item.authorName,
    coverImageUrl: item.coverImageUrl,
    price: sanitizePrice(item.price),
    quantity: Math.max(1, Math.floor(item.quantity || 1)),
  };
}

function parseStoredItems(value: string | null): CartLineItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as CartLineItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.bookId === "string" && typeof item.title === "string")
      .map((item) => normalizeItem(item));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const session = usePublicSession();
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);

  // 1. Initial hydration from local storage
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setItems(parseStoredItems(stored));
    }
    const owner = window.localStorage.getItem(STORAGE_KEY + "_owner");
    if (!owner) {
      window.localStorage.setItem(STORAGE_KEY + "_owner", "guest");
    }
    setIsHydrated(true);
  }, []);

  // 2. Synchronize with localStorage
  useEffect(() => {
    if (isHydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);

  // 3. Sync and merge guest cart with DB cart on login / session change
  useEffect(() => {
    if (!isHydrated) return;

    if (session?.id) {
      if (session.id !== syncedUserId) {
        const syncCart = async () => {
          try {
            const storedOwner = window.localStorage.getItem(STORAGE_KEY + "_owner");
            
            // If it was a guest cart and has items, merge it
            if (storedOwner !== session.id && storedOwner === "guest" && items.length > 0) {
              const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
                }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.items) {
                  setItems(data.items);
                }
              }
            } else {
              // Otherwise, fetch the DB cart (source of truth) and update the local state
              const res = await fetch("/api/cart");
              if (res.ok) {
                const data = await res.json();
                if (data.items) {
                  setItems(data.items);
                }
              }
            }
            
            // Mark as synced with this user
            window.localStorage.setItem(STORAGE_KEY + "_owner", session.id);
            setSyncedUserId(session.id);
          } catch (error) {
            console.error("Cart sync failed:", error);
          }
        };
        void syncCart();
      }
    } else {
      if (syncedUserId !== null) {
        setSyncedUserId(null);
        setItems([]);
        window.localStorage.setItem(STORAGE_KEY + "_owner", "guest");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, isHydrated, syncedUserId]);

  const addItem = useCallback((item: AddCartInput, quantity = 1) => {
    const safeQuantity = Math.max(1, Math.floor(quantity || 1));
    const nextItem: CartLineItem = normalizeItem({
      bookId: item.bookId,
      title: item.title,
      authorName: item.authorName,
      coverImageUrl: item.coverImageUrl,
      price: sanitizePrice(item.price),
      quantity: safeQuantity,
    });

    toast.success("Added to cart");

    setItems((current) => {
      const existing = current.find((entry) => entry.bookId === nextItem.bookId);
      const newItems = existing
        ? current.map((entry) =>
            entry.bookId === nextItem.bookId
              ? { ...entry, quantity: entry.quantity + nextItem.quantity }
              : entry,
          )
        : [...current, nextItem];

      if (session?.id) {
        const targetQty = existing ? existing.quantity + nextItem.quantity : nextItem.quantity;
        fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: nextItem.bookId, quantity: targetQty }),
        }).catch((err) => console.warn("Failed to add cart item to server:", err));
      }

      return newItems;
    });
  }, [session?.id]);

  const removeItem = useCallback((bookId: string) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.bookId === bookId);
      if (existing) {
        toast.info("Removed from cart");
      }
      const newItems = current.filter((entry) => entry.bookId !== bookId);
      if (session?.id) {
        fetch(`/api/cart?bookId=${bookId}`, { method: "DELETE" })
          .catch((err) => console.warn("Failed to delete cart item from server:", err));
      }
      return newItems;
    });
  }, [session?.id]);

  const setQuantity = useCallback((bookId: string, quantity: number) => {
    const safeQuantity = Math.max(0, Math.floor(quantity));
    setItems((current) => {
      const existing = current.find((entry) => entry.bookId === bookId);
      if (existing) {
        if (safeQuantity === 0) {
          toast.info("Removed from cart");
        } else {
          toast.success("Added to cart");
        }
      }
      const newItems = safeQuantity === 0
        ? current.filter((entry) => entry.bookId !== bookId)
        : current.map((entry) =>
            entry.bookId === bookId ? { ...entry, quantity: safeQuantity } : entry,
          );

      if (session?.id) {
        fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId, quantity: safeQuantity }),
        }).catch((err) => console.warn("Failed to update cart item quantity on server:", err));
      }

      return newItems;
    });
  }, [session?.id]);

  const clearCart = useCallback(() => {
    toast.info("Cart cleared");
    setItems([]);
    if (session?.id) {
      fetch("/api/cart", { method: "DELETE" })
        .catch((err) => console.warn("Failed to clear cart on server:", err));
    }
  }, [session?.id]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((value) => !value), []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + sanitizePrice(item.price) * Math.max(1, item.quantity), 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      isDrawerOpen,
      isHydrated,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }),
    [
      items,
      itemCount,
      subtotal,
      isDrawerOpen,
      isHydrated,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context) {
    return context;
  }
  return fallbackCartContext;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setItems(parseStoredItems(stored));
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);

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

    setItems((current) => {
      const existing = current.find((entry) => entry.bookId === nextItem.bookId);
      if (!existing) {
        return [...current, nextItem];
      }

      return current.map((entry) =>
        entry.bookId === nextItem.bookId
          ? { ...entry, quantity: entry.quantity + nextItem.quantity }
          : entry,
      );
    });
  }, []);

  const removeItem = useCallback((bookId: string) => {
    setItems((current) => current.filter((entry) => entry.bookId !== bookId));
  }, []);

  const setQuantity = useCallback((bookId: string, quantity: number) => {
    const safeQuantity = Math.max(0, Math.floor(quantity));
    setItems((current) => {
      if (safeQuantity === 0) {
        return current.filter((entry) => entry.bookId !== bookId);
      }

      return current.map((entry) =>
        entry.bookId === bookId ? { ...entry, quantity: safeQuantity } : entry,
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

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

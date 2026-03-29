"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { formatINR } from "@/lib/utils";

export default function CartDrawer() {
  const {
    items,
    subtotal,
    isDrawerOpen,
    closeDrawer,
    removeItem,
    setQuantity,
    clearCart,
  } = useCart();

  return (
    <AnimatePresence>
      {isDrawerOpen ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-50 bg-void/65 backdrop-blur-[1px]"
            aria-label="Close cart"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-smoke bg-obsidian shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-smoke px-5 py-4">
              <div>
                <p className="font-ui text-[10px] tracking-[0.15em] text-gold">YOUR CART</p>
                <h2 className="mt-1 text-safe font-title text-3xl text-ivory">Selected Books</h2>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-full border border-smoke p-2 text-stone transition hover:border-gold hover:text-gold"
                aria-label="Close cart drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {items.length > 0 ? (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {items.map((item) => (
                    <article
                      key={item.bookId}
                      className="rounded-xl border border-smoke bg-ash/40 p-3"
                    >
                      <div className="flex gap-3">
                        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md border border-smoke bg-ash">
                          {item.coverImageUrl ? (
                            <Image
                              src={item.coverImageUrl}
                              alt={item.title}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <span className="font-title text-2xl text-gold/30">
                                {item.title.trim().charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-safe font-title text-2xl text-ivory">
                            {item.title}
                          </h3>
                          {item.authorName ? (
                            <p className="mt-0.5 line-clamp-1 font-body text-sm text-stone">
                              {item.authorName}
                            </p>
                          ) : null}
                          <p className="mt-1 font-mono text-xs text-parchment">
                            {formatINR(item.price)}
                          </p>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setQuantity(item.bookId, item.quantity - 1)}
                                className="rounded border border-smoke p-1 text-stone transition hover:border-gold hover:text-gold"
                                aria-label={`Decrease quantity for ${item.title}`}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-7 text-center font-mono text-xs text-parchment">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQuantity(item.bookId, item.quantity + 1)}
                                className="rounded border border-smoke p-1 text-stone transition hover:border-gold hover:text-gold"
                                aria-label={`Increase quantity for ${item.title}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.bookId)}
                              className="inline-flex items-center gap-1 font-ui text-[10px] tracking-[0.11em] text-stone transition hover:text-ember"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              REMOVE
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="space-y-4 border-t border-smoke px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="font-ui text-[11px] tracking-[0.13em] text-stone">SUBTOTAL</p>
                    <p className="text-safe font-title text-3xl text-ivory">{formatINR(subtotal)}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={clearCart}
                      className="rounded-full border border-smoke px-4 py-2 font-ui text-[10px] tracking-[0.12em] text-parchment transition hover:border-ember hover:text-ember"
                    >
                      CLEAR
                    </button>
                    <Link
                      href="/checkout"
                      onClick={closeDrawer}
                      className="fx-button inline-flex flex-1 items-center justify-center rounded-full border border-gold bg-gold px-4 py-2.5 font-mono text-xs font-medium tracking-widest text-void shadow-lg transition hover:bg-ivory hover:border-ivory"
                    >
                      PROCEED TO CHECKOUT
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <h3 className="text-safe font-title text-4xl text-ivory">Your cart is empty</h3>
                <p className="mt-3 font-body text-base text-stone">
                  Add books to cart and continue to checkout.
                </p>
                <Link
                  href="/books"
                  onClick={closeDrawer}
                  className="fx-button mt-6 rounded-full border border-gold bg-gold px-5 py-2.5 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
                >
                  BROWSE BOOKS
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

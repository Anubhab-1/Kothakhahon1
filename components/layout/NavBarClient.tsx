"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/layout/BrandLogo";
import CatalogSearchForm from "@/components/layout/CatalogSearchForm";
import CartIcon from "@/components/ui/CartIcon";
import Magnetic from "@/components/ui/Magnetic";
import { usePublicSession } from "@/components/auth/PublicSessionProvider";

const links = [
  { href: "/", label: "HOME" },
  { href: "/books", label: "CATALOG" },
  { href: "/authors", label: "AUTHORS" },
  { href: "/blog", label: "JOURNAL" },
  { href: "/about", label: "ABOUT" },
  { href: "/contact", label: "CONTACT" },
];

export default function NavBarClient() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const user = usePublicSession();
  const accountHref = user?.role === "ADMIN" ? "/admin" : "/account";
  const accountLabel = user?.role === "ADMIN" ? "DASHBOARD" : "ACCOUNT";
  const accountSummary = user?.fullName ?? user?.email ?? "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
        <div
          className={cn(
            "flex items-center justify-between rounded-full border px-4 py-2 transition-all duration-300 md:px-6",
            scrolled
              ? "border-gold/30 bg-void/95 shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(216,168,75,0.06)] backdrop-blur-md scale-[0.98]"
              : "border-smoke bg-obsidian/85 backdrop-blur-sm",
          )}
        >
          <Link href="/" className="fx-link transition hover:text-gold" aria-label="Kothakhahon home">
              <BrandLogo />
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {links.map((link) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Magnetic key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "rounded-full px-3 py-1.5 font-ui text-[10px] tracking-[0.16em] transition",
                        active
                          ? "border border-gold/40 bg-gold/15 text-gold"
                          : "text-parchment hover:bg-gold/10 hover:text-gold",
                      )}
                    >
                      {link.label}
                    </Link>
                  </Magnetic>
                );
              })}
            </nav>

            <div className="hidden items-center gap-2 md:flex xl:gap-4">
              <CatalogSearchForm className="hidden w-[200px] lg:block xl:w-[280px]" />
              <Link
                href="/account/wishlist"
                className="fx-button rounded-full border border-smoke p-2 text-parchment transition hover:border-gold hover:text-gold"
                aria-label="View wishlist"
              >
                <Heart className="h-4 w-4" />
              </Link>
              <CartIcon />
              {user ? (
                <Link
                  href={accountHref}
                  className="fx-button flex items-center gap-2 rounded-full border border-smoke px-4 py-2 font-ui text-[10px] tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
                  title={`${accountLabel}: ${accountSummary}`}
                >
                  <User className="h-3.5 w-3.5 text-gold/80" />
                  <span className="text-gold font-semibold">{accountLabel}</span>
                  <span className="h-3 w-[1px] bg-smoke/40" />
                  <span className="max-w-[7rem] truncate text-[9px] tracking-normal font-sans text-stone">{accountSummary}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="fx-button rounded-full border border-smoke px-4 py-2 font-ui text-[10px] tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
                >
                  LOGIN
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <Link
                href="/account/wishlist"
                className="rounded-full border border-smoke p-2 text-parchment transition hover:border-gold hover:text-gold"
                aria-label="View wishlist"
              >
                <Heart className="h-4 w-4" />
              </Link>
              <CartIcon />
              <button
                type="button"
                className="rounded-md border border-smoke p-2 text-parchment"
                onClick={() => setMobileOpen((value) => !value)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.nav
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="border-b border-smoke bg-obsidian px-4 py-4 md:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              <CatalogSearchForm compact />

              {links.map((link) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-md border px-3 py-2 font-ui text-xs tracking-[0.14em] transition",
                      active
                        ? "border-gold/45 bg-gold/10 text-gold"
                        : "border-smoke text-parchment hover:border-gold hover:text-gold",
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {user ? (
                <Link
                  href={accountHref}
                  className="rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3"
                  onClick={() => setMobileOpen(false)}
                >
                  <p className="font-ui text-[11px] tracking-[0.14em] text-gold">{accountLabel}</p>
                  <p className="mt-1 font-body text-sm text-parchment">{accountSummary}</p>
                </Link>
              ) : null}
              {user ? null : (
                <Link
                  href="/login"
                  className="fx-button rounded-full border border-smoke px-4 py-2 text-center font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
                  onClick={() => setMobileOpen(false)}
                >
                  LOGIN
                </Link>
              )}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

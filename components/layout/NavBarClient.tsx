"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
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
  const user = usePublicSession();
  const scrolled = false;
  const accountHref = user?.role === "ADMIN" ? "/admin" : "/account";
  const accountLabel = user?.role === "ADMIN" ? "DASHBOARD" : "ACCOUNT";
  const accountSummary = user?.fullName ?? user?.email ?? "";

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
      <div
        className={cn(
          "border-b bg-void/90 backdrop-blur transition-colors",
          scrolled ? "border-gold/45" : "border-smoke",
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
          <div
            className={cn(
              "flex items-center justify-between rounded-2xl border px-3 py-3 transition md:px-4",
              scrolled
                ? "border-gold/30 bg-obsidian/90 shadow-[0_10px_30px_rgba(0,0,0,0.34)]"
                : "border-smoke bg-obsidian/70",
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
              <CatalogSearchForm className="hidden w-[280px] xl:block" />
              <CartIcon />
              {user ? (
                <Link
                  href={accountHref}
                  className="fx-button rounded-full border border-smoke px-4 py-2 text-right transition hover:border-gold hover:text-gold"
                >
                  <p className="font-ui text-[10px] tracking-[0.14em] text-gold">{accountLabel}</p>
                  <p className="max-w-[11rem] truncate font-body text-sm text-parchment">{accountSummary}</p>
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

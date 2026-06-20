"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="mx-auto w-full max-w-7xl px-4 pt-6 md:px-8 font-ui text-[10px] sm:text-xs tracking-[0.14em] text-stone uppercase" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <li>
          <Link href="/" className="hover:text-gold transition">
            HOME
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5 sm:gap-2">
              <ChevronRight className="h-3 w-3 text-stone/50" />
              {isLast || !item.href ? (
                <span className="text-parchment font-medium max-w-[150px] sm:max-w-[280px] truncate" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-gold transition">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

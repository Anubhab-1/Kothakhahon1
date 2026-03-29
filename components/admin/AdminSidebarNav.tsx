"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/books", label: "Books" },
  { href: "/admin/authors", label: "Authors" },
  { href: "/admin/blog", label: "Journal" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/inbox/contact", label: "Contact Inbox" },
  { href: "/admin/inbox/manuscripts", label: "Manuscripts" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {sections.map((section) => {
        const active =
          section.href === "/admin"
            ? pathname === section.href
            : pathname === section.href || pathname.startsWith(`${section.href}/`);

        return (
          <Link
            key={section.href}
            href={section.href}
            className={cn("admin-sidebar-link", active && "admin-sidebar-link-active")}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}

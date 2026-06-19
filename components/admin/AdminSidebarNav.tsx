"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  ShoppingBag,
  Inbox,
  ScrollText,
  Send,
  Settings,
  Mail,
  Star,
  Tag,
} from "lucide-react";

const sections = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/books", label: "Books", icon: BookOpen },
  { href: "/admin/authors", label: "Authors", icon: Users },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/blog", label: "Journal", icon: FileText },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/inbox/contact", label: "Contact Inbox", icon: Inbox },
  { href: "/admin/inbox/manuscripts", label: "Manuscripts", icon: ScrollText },
  { href: "/admin/newsletter", label: "Newsletter", icon: Send },
  { href: "/admin/email-jobs", label: "Email Jobs", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const active =
          section.href === "/admin"
            ? pathname === section.href
            : pathname === section.href || pathname.startsWith(`${section.href}/`);

        const Icon = section.icon;

        return (
          <Link
            key={section.href}
            href={section.href}
            className={cn("admin-sidebar-link", active && "admin-sidebar-link-active")}
          >
            <Icon
              style={{
                width: 15,
                height: 15,
                flexShrink: 0,
                color: active ? "#a5b4fc" : "#4f5a7a",
                transition: "color 200ms ease",
              }}
            />
            <span style={{ flex: 1 }}>{section.label}</span>
            {active && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  flexShrink: 0,
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

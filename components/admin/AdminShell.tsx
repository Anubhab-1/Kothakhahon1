import Link from "next/link";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  FileText,
  ShoppingBag,
  Mail,
  ScrollText,
  Send,
  Settings,
  LogOut,
  Zap,
  Shield,
} from "lucide-react";
import { logoutAdminAction } from "@/app/admin/actions";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";

export default function AdminShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: {
    email: string;
    fullName?: string;
  };
}) {
  const initials = (session.fullName ?? session.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="admin-theme min-h-screen">
      <div
        className="mx-auto grid min-h-screen w-full max-w-[1700px]"
        style={{ gridTemplateColumns: "270px 1fr" }}
      >
        {/* ── Sidebar ── */}
        <aside
          style={{
            background:
              "linear-gradient(180deg, #0a0908 0%, #100e0c 60%, #0a0908 100%)",
            borderRight: "1px solid rgba(201,151,58,0.15)",
          }}
          className="flex flex-col min-h-screen p-5 gap-0"
        >
          {/* Brand block */}
          <Link
            href="/admin"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,151,58,0.15) 0%, rgba(223,179,98,0.10) 100%)",
              border: "1px solid rgba(201,151,58,0.22)",
              borderRadius: "18px",
              boxShadow: "0 8px 32px rgba(201,151,58,0.12)",
            }}
            className="block p-5 transition-all duration-300 hover:border-gold/40 hover:shadow-[0_12px_40px_rgba(201,151,58,0.22)]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #c9973a, #dfb362)",
                  borderRadius: "10px",
                  padding: "7px",
                  boxShadow: "0 4px 12px rgba(201,151,58,0.4)",
                }}
              >
                <BookOpen className="h-5 w-5 text-void" />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    background: "linear-gradient(90deg, #c9973a, #dfb362)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Kothakhahon
                </p>
                <p
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#f0f2ff",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  Admin Console
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: "0.775rem",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Catalog · Publishing · Orders · Inbox
            </p>
          </Link>

          {/* Feature pills */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              { icon: BookOpen, label: "Catalog" },
              { icon: FileText, label: "Journal" },
              { icon: Mail, label: "Inbox" },
              { icon: ShoppingBag, label: "Orders" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="admin-mini-card">
                <Icon
                  style={{ width: 14, height: 14, color: "#c9973a", flexShrink: 0 }}
                />
                <span style={{ fontSize: "0.78rem" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-7 flex-1">
            <p
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#3d4460",
                marginBottom: "0.6rem",
                paddingLeft: "0.25rem",
              }}
            >
              Navigation
            </p>
            <AdminSidebarNav />
          </div>

          {/* Version badge */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "10px",
                background: "rgba(201,151,58,0.05)",
                border: "1px solid rgba(201,151,58,0.08)",
              }}
            >
              <Shield style={{ width: 13, height: 13, color: "#c9973a" }} />
              <span style={{ fontSize: "0.7rem", color: "#8c8275", fontWeight: 600 }}>
                Internal Workspace
              </span>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="min-w-0 flex flex-col">
          {/* Top bar */}
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 30,
              background: "rgba(13,15,20,0.82)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(201,151,58,0.15)",
              padding: "0.875rem 2rem",
              boxShadow: "0 1px 0 rgba(201,151,58,0.06)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 8px #10b981",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#3d4460",
                    }}
                  >
                    Internal Workspace
                  </p>
                  <p
                    style={{
                      fontSize: "0.825rem",
                      color: "#64748b",
                      marginTop: "1px",
                    }}
                  >
                    Manage storefront without scattered backend tools
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* User badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.45rem 0.9rem 0.45rem 0.45rem",
                    borderRadius: "999px",
                    background: "rgba(201,151,58,0.08)",
                    border: "1px solid rgba(201,151,58,0.16)",
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #c9973a, #dfb362)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      color: "#16130d",
                      letterSpacing: "0.04em",
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#dfb362",
                        lineHeight: 1.2,
                      }}
                    >
                      {session.fullName ?? "Admin"}
                    </p>
                    <p
                      style={{
                        fontSize: "0.68rem",
                        color: "#64748b",
                      }}
                    >
                      {session.email}
                    </p>
                  </div>
                </div>

                {/* Log out */}
                <form action={logoutAdminAction}>
                  <button
                    type="submit"
                    className="admin-button admin-button-secondary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.8rem",
                      padding: "0.5rem 0.9rem",
                    }}
                  >
                    <LogOut style={{ width: 14, height: 14 }} />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </header>

          {/* Page content */}
          <div
            style={{ padding: "2rem 2.5rem", flex: 1 }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Inbox, LibraryBig, Newspaper, PackageOpen } from "lucide-react";
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
  return (
    <div className="admin-theme min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[290px_1fr]">
        <aside className="border-b border-ink/10 bg-[linear-gradient(180deg,rgba(255,253,249,0.95),rgba(249,242,231,0.96))] p-6 lg:border-b-0 lg:border-r">
          <Link href="/admin" className="block rounded-[26px] border border-ink/10 bg-paper px-5 py-5 shadow-[0_18px_40px_rgba(54,44,32,0.08)]">
            <p className="admin-eyebrow">Kothakhahon Admin</p>
            <h1 className="mt-2 font-title text-4xl text-ink">Editorial Desk</h1>
            <p className="mt-3 font-body text-base leading-relaxed text-ink/68">
              A custom workspace for catalog, publishing, submissions, and order operations.
            </p>
          </Link>

          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            <div className="admin-mini-card">
              <LibraryBig className="h-4 w-4 text-brass" />
              <span>Catalog control</span>
            </div>
            <div className="admin-mini-card">
              <Newspaper className="h-4 w-4 text-brass" />
              <span>Journal editing</span>
            </div>
            <div className="admin-mini-card">
              <Inbox className="h-4 w-4 text-brass" />
              <span>Inbox triage</span>
            </div>
            <div className="admin-mini-card">
              <PackageOpen className="h-4 w-4 text-brass" />
              <span>Order tracking</span>
            </div>
          </div>

          <div className="mt-8">
            <p className="admin-eyebrow mb-3">Navigation</p>
            <AdminSidebarNav />
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/88 px-5 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="admin-eyebrow">Internal Workspace</p>
                <p className="mt-1 font-body text-base text-ink/72">
                  Manage the storefront without a third-party CMS or scattered backend tools.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full border border-ink/10 bg-white px-4 py-2 text-right shadow-[0_10px_24px_rgba(54,44,32,0.06)]">
                  <p className="font-ui text-[11px] tracking-[0.16em] text-brass">
                    {(session.fullName ?? "ADMIN").toUpperCase()}
                  </p>
                  <p className="font-body text-sm text-ink/68">{session.email}</p>
                </div>
                <form action={logoutAdminAction}>
                  <button type="submit" className="admin-button admin-button-secondary">
                    Log Out
                  </button>
                </form>
              </div>
            </div>
          </header>

          <div className="px-5 py-8 md:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

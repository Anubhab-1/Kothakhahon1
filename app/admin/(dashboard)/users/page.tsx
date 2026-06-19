import AdminNotice from "@/components/admin/AdminNotice";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import { db } from "@/lib/db";
import {
  buildAdminListHref,
  getPagination,
  normalizeSearchTerm,
  parsePageParam,
} from "@/lib/admin-list";
import { toggleUserStatusAction } from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import type { Prisma } from "@/generated/prisma/client";

interface AdminUsersPageProps {
  searchParams: Promise<{
    notice?: string;
    error?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const q = normalizeSearchTerm(params.q);
  const requestedPage = parsePageParam(params.page);

  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const totalCount = await db.user.count({ where });
  const pagination = getPagination(totalCount, requestedPage, 15);
  const users = await db.user.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: pagination.skip,
    take: pagination.take,
  });

  const persistedParams = {
    q: q || undefined,
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="User Accounts"
        title="Manage Customers & Staff"
        description="Search user registry, verify administrative privileges, or suspend/unsuspend account access in real time."
      />
      <AdminNotice notice={params.notice} error={params.error} />

      <section className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-eyebrow">Search Registry</p>
            <h2 className="mt-2 font-title text-3xl text-ink">Find registered accounts</h2>
          </div>
          <span style={{ display:"inline-flex", alignItems:"center", borderRadius:"999px", border:"1px solid rgba(99,102,241,0.2)", background:"rgba(99,102,241,0.08)", padding:"0.25rem 0.85rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#a5b4fc" }}>
            {totalCount} total users
          </span>
        </div>

        <form className="flex items-center gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by full name or email address..."
            className="admin-input min-w-0 flex-1"
          />
          <button type="submit" className="admin-button">
            Search
          </button>
        </form>
      </section>

      <div style={{ overflow:"hidden", borderRadius:"20px", border:"1px solid rgba(99,102,241,0.12)", background:"linear-gradient(135deg,#181c27,#1e2233)", boxShadow:"0 8px 24px rgba(0,0,0,0.5)" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Details</th>
              <th>System Role</th>
              <th>Account Status</th>
              <th>Registered Date</th>
              <th className="text-right">Manage Access</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "#f8fafc" }}>
                      {u.fullName || "Unnamed User"}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{u.email}</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "1px" }}>{u.id}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: "999px",
                        padding: "0.15rem 0.5rem",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        background: u.role === "ADMIN" ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)",
                        color: u.role === "ADMIN" ? "#ef4444" : "#3b82f6",
                        border: u.role === "ADMIN" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(59,130,246,0.2)",
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className="admin-status-pill"
                      style={{
                        background: u.isActive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: u.isActive ? "#10b981" : "#ef4444",
                        border: u.isActive ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td>{u.createdAt.toLocaleDateString("en-IN")}</td>
                  <td className="text-right">
                    {u.role !== "ADMIN" ? (
                      <form action={toggleUserStatusAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <AdminSubmitButton
                          idleLabel={u.isActive ? "Suspend Access" : "Restore Access"}
                          pendingLabel={u.isActive ? "Suspending..." : "Restoring..."}
                          className={u.isActive ? "admin-button admin-button-danger" : "admin-button"}
                        />
                      </form>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#64748b", fontStyle: "italic" }}>
                        Admin (Protected)
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No accounts match the query criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        hrefForPage={(page) => buildAdminListHref("/admin/users", persistedParams, { page })}
      />
    </div>
  );
}

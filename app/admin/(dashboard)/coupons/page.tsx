import Link from "next/link";
import { ToggleLeft, ToggleRight, Trash2, Tag } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { db } from "@/lib/db";
import { createCouponAction, toggleCouponAction, deleteCouponAction } from "./actions";

export const metadata = { title: "Admin – Coupons" };

interface AdminCouponsPageProps {
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function AdminCouponsPage({ searchParams }: AdminCouponsPageProps) {
  const { saved, error } = await searchParams;

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { uses: true } } },
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Marketing"
        title="Discount Coupons"
        description={`${coupons.length} coupon${coupons.length !== 1 ? "s" : ""} · ${coupons.filter((c) => c.isActive).length} active`}
      />

      <AdminNotice notice={saved ? "Coupon created." : undefined} error={error} />

      {/* Create form */}
      <div className="admin-card">
        <p className="admin-eyebrow">Create New Coupon</p>
        <form action={createCouponAction} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="admin-field-label">Code</span>
            <input name="code" required placeholder="e.g. WELCOME20" className="admin-input uppercase" />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-field-label">Type</span>
            <select name="type" className="admin-select">
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="admin-field-label">Value</span>
            <input name="value" type="number" min="1" step="any" required placeholder="e.g. 20" className="admin-input" />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-field-label">Min. Order Amount (₹, optional)</span>
            <input name="minOrderAmount" type="number" min="0" step="any" placeholder="e.g. 500" className="admin-input" />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-field-label">Max Uses (optional)</span>
            <input name="maxUses" type="number" min="1" placeholder="e.g. 100" className="admin-input" />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-field-label">Expires At (optional)</span>
            <input name="expiresAt" type="datetime-local" className="admin-input" />
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <AdminSubmitButton idleLabel="Create Coupon" pendingLabel="Creating…" />
          </div>
        </form>
      </div>

      {/* Coupons list */}
      {coupons.length === 0 ? (
        <div className="admin-card text-center">
          <Tag className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-slate-400">No coupons yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <article
              key={coupon.id}
              style={{
                borderRadius: "16px",
                border: `1px solid ${coupon.isActive ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.07)"}`,
                background: "linear-gradient(135deg,#181c27,#1e2233)",
                padding: "1rem 1.25rem",
                opacity: coupon.isActive ? 1 : 0.55,
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    style={{
                      fontFamily: "ui-monospace,monospace",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#a5b4fc",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {coupon.code}
                  </span>
                  <span
                    style={{
                      borderRadius: "999px",
                      border: "1px solid rgba(99,102,241,0.25)",
                      background: "rgba(99,102,241,0.1)",
                      padding: "2px 10px",
                      fontSize: "11px",
                      letterSpacing: "0.1em",
                      color: "#818cf8",
                    }}
                  >
                    {coupon.type === "percent" ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                  </span>
                  {coupon.minOrderAmount && (
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Min ₹{coupon.minOrderAmount}
                    </span>
                  )}
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Used {coupon._count.uses}{coupon.maxUses ? ` / ${coupon.maxUses}` : ""} times
                  </span>
                  {coupon.expiresAt && (
                    <span style={{ fontSize: "12px", color: coupon.expiresAt < new Date() ? "#fca5a5" : "#94a3b8" }}>
                      Expires {new Date(coupon.expiresAt).toLocaleDateString("en-IN")}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <form action={toggleCouponAction}>
                    <input type="hidden" name="id" value={coupon.id} />
                    <button
                      type="submit"
                      title={coupon.isActive ? "Deactivate" : "Activate"}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        borderRadius: "999px",
                        border: `1px solid ${coupon.isActive ? "rgba(52,211,153,0.3)" : "rgba(99,102,241,0.2)"}`,
                        background: `${coupon.isActive ? "rgba(52,211,153,0.08)" : "rgba(99,102,241,0.08)"}`,
                        padding: "5px 12px",
                        fontSize: "11px",
                        letterSpacing: "0.1em",
                        color: coupon.isActive ? "#6ee7b7" : "#a5b4fc",
                        cursor: "pointer",
                      }}
                    >
                      {coupon.isActive ? (
                        <><ToggleRight className="h-4 w-4" /> ACTIVE</>
                      ) : (
                        <><ToggleLeft className="h-4 w-4" /> INACTIVE</>
                      )}
                    </button>
                  </form>
                  <form action={deleteCouponAction}>
                    <input type="hidden" name="id" value={coupon.id} />
                    <button
                      type="submit"
                      title="Delete coupon"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: "999px",
                        border: "1px solid rgba(239,68,68,0.2)",
                        background: "rgba(239,68,68,0.06)",
                        padding: "5px 10px",
                        color: "#fca5a5",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

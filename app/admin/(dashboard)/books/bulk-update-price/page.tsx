import Link from "next/link";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { bulkUpdatePriceAction } from "@/app/admin/actions";
import { db } from "@/lib/db";

interface AdminBulkUpdatePricePageProps {
  searchParams: Promise<{
    error?: string;
    notice?: string;
  }>;
}

export default async function AdminBulkUpdatePricePage({ searchParams }: AdminBulkUpdatePricePageProps) {
  const params = await searchParams;
  
  // Load genres for the Target Shelf selection dropdown
  const genres = await db.genre.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AdminPageHeader
          eyebrow="Pricing Operations"
          title="Bulk Price Adjustment"
          description="Modify book prices catalog-wide or target specific genre shelves using flat rates or percentages."
        />
        <Link href="/admin/books" className="admin-button admin-button-secondary">
          Back to Books
        </Link>
      </div>

      <AdminNotice notice={params.notice} error={params.error} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="admin-card space-y-6">
          <form action={bulkUpdatePriceAction} className="space-y-6">
            
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="admin-field-label">Adjustment Direction</span>
                <select
                  name="adjustDirection"
                  required
                  className="block w-full border border-ink/10 rounded-xl bg-white/50 px-4 py-3 text-base text-ink outline-none focus:border-[var(--brass)]"
                  style={{ background: "#1e2233", color: "#f8fafc", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <option value="increase">Increase Price (+)</option>
                  <option value="decrease">Decrease Price (-)</option>
                </select>
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Choose whether to increase or decrease prices.
                </p>
              </label>

              <label className="block space-y-2">
                <span className="admin-field-label">Adjustment Type</span>
                <select
                  name="adjustType"
                  required
                  className="block w-full border border-ink/10 rounded-xl bg-white/50 px-4 py-3 text-base text-ink outline-none focus:border-[var(--brass)]"
                  style={{ background: "#1e2233", color: "#f8fafc", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (INR)</option>
                </select>
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Select calculation mode: percentage vs flat rate.
                </p>
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="admin-field-label">Amount / Percentage Value</span>
                <input
                  type="number"
                  name="amount"
                  step="any"
                  min="0.01"
                  required
                  placeholder="e.g. 10 for 10% or Rs. 10"
                  className="block w-full border border-ink/10 rounded-xl bg-white/50 px-4 py-3 text-base text-ink outline-none focus:border-[var(--brass)]"
                  style={{ background: "#1e2233", color: "#f8fafc", border: "1px solid rgba(99,102,241,0.2)" }}
                />
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Must be a positive number greater than zero.
                </p>
              </label>

              <label className="block space-y-2">
                <span className="admin-field-label">Target Shelf (Genre)</span>
                <select
                  name="targetShelf"
                  required
                  className="block w-full border border-ink/10 rounded-xl bg-white/50 px-4 py-3 text-base text-ink outline-none focus:border-[var(--brass)]"
                  style={{ background: "#1e2233", color: "#f8fafc", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <option value="all">All Catalog Books</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Limit adjustment to a specific genre, or apply globally.
                </p>
              </label>
            </div>

            <div className="border-t border-ink/10 pt-6 flex items-center gap-3">
              <AdminSubmitButton idleLabel="Execute Bulk Price Update" pendingLabel="Updating book prices..." />
            </div>
          </form>
        </div>

        <aside className="admin-card space-y-4">
          <p className="admin-eyebrow">Price Adjustments Warning</p>
          <h2 className="font-title text-3xl text-ink">Price adjustments are irreversible.</h2>
          <p className="font-body text-base leading-relaxed text-ink/70">
            This tool performs a transaction block updating prices directly in the database.
          </p>
          <ul className="space-y-3 font-body text-base leading-relaxed text-ink/70">
            <li><strong>MSRP Sync</strong>: Note that this adjustment only updates the active selling <code>price</code>, and does not alter the <code>compareAtPrice</code> (MSRP).</li>
            <li><strong>Floor Value</strong>: Adjustments cannot lower a book price below <code>0.00</code>.</li>
            <li><strong>Rounding</strong>: Computed prices are rounded to two decimal places (e.g. <code>249.99</code>).</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

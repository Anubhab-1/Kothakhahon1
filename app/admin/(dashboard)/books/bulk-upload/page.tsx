import Link from "next/link";
import AdminNotice from "@/components/admin/AdminNotice";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { bulkUploadBooksAction } from "@/app/admin/actions";

interface AdminBulkUploadPageProps {
  searchParams: Promise<{
    error?: string;
    notice?: string;
  }>;
}

export default async function AdminBulkUploadPage({ searchParams }: AdminBulkUploadPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AdminPageHeader
          eyebrow="Books Catalog"
          title="Bulk Upload Titles"
          description="Import multiple books, authors, and genre relations into the store catalog using a CSV template."
        />
        <Link href="/admin/books" className="admin-button admin-button-secondary">
          Back to Books
        </Link>
      </div>

      <AdminNotice notice={params.notice} error={params.error} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="admin-card space-y-6">
          <form action={bulkUploadBooksAction} className="space-y-6">
            <label className="block space-y-2">
              <span className="admin-field-label">Select CSV File</span>
              <input
                type="file"
                name="file"
                accept=".csv"
                required
                className="block w-full border border-ink/10 rounded-xl bg-white/50 px-4 py-3 text-base text-ink outline-none cursor-pointer focus:border-[var(--brass)]"
              />
              <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Make sure the file uses standard UTF-8 encoding and fields are comma-separated.
              </p>
            </label>

            <div className="flex items-center gap-3">
              <AdminSubmitButton idleLabel="Upload & Process CSV" pendingLabel="Processing upload..." />
            </div>
          </form>

          <div className="border-t border-ink/10 pt-6 space-y-4">
            <h3 className="font-ui text-xs font-semibold tracking-[0.12em] text-ink/70 uppercase">CSV Structure Specifications</h3>
            <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/40">
              <table className="admin-table text-sm">
                <thead>
                  <tr>
                    <th>Column Header</th>
                    <th>Type</th>
                    <th>Requirement</th>
                    <th>Default / Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>title</strong></td>
                    <td>String</td>
                    <td><span className="text-red-500 font-semibold">Required</span></td>
                    <td>Main storefront book title.</td>
                  </tr>
                  <tr>
                    <td><strong>titleEn</strong></td>
                    <td>String</td>
                    <td>Optional</td>
                    <td>English title translation.</td>
                  </tr>
                  <tr>
                    <td><strong>author</strong></td>
                    <td>String</td>
                    <td>Optional</td>
                    <td>Linked author name (will be created if missing).</td>
                  </tr>
                  <tr>
                    <td><strong>genres</strong></td>
                    <td>String</td>
                    <td>Optional</td>
                    <td>Semicolon-separated categories (e.g. <code>Fiction; Translation</code>).</td>
                  </tr>
                  <tr>
                    <td><strong>price</strong></td>
                    <td>Number</td>
                    <td>Optional</td>
                    <td>Float values representing price in INR. Defaults to 0.</td>
                  </tr>
                  <tr>
                    <td><strong>compareAtPrice</strong></td>
                    <td>Number</td>
                    <td>Optional</td>
                    <td>MSRP strike-through price.</td>
                  </tr>
                  <tr>
                    <td><strong>stockQuantity</strong></td>
                    <td>Integer</td>
                    <td>Optional</td>
                    <td>Available books inventory. Defaults to 12.</td>
                  </tr>
                  <tr>
                    <td><strong>lowStockThreshold</strong></td>
                    <td>Integer</td>
                    <td>Optional</td>
                    <td>Alert threshold. Defaults to 3.</td>
                  </tr>
                  <tr>
                    <td><strong>isbn</strong></td>
                    <td>String</td>
                    <td>Optional</td>
                    <td>ISBN number.</td>
                  </tr>
                  <tr>
                    <td><strong>language</strong></td>
                    <td>String</td>
                    <td>Optional</td>
                    <td>Default: &quot;Bengali&quot;.</td>
                  </tr>
                  <tr>
                    <td><strong>publisher</strong></td>
                    <td>String</td>
                    <td>Optional</td>
                    <td>Default: &quot;Kothakhahon&quot;.</td>
                  </tr>
                  <tr>
                    <td><strong>synopsis</strong></td>
                    <td>Text</td>
                    <td>Optional</td>
                    <td>Detailed description on the book card.</td>
                  </tr>
                  <tr>
                    <td><strong>pullQuote</strong></td>
                    <td>Text</td>
                    <td>Optional</td>
                    <td>Editorial display quote.</td>
                  </tr>
                  <tr>
                    <td><strong>chapterPreview</strong></td>
                    <td>Text</td>
                    <td>Optional</td>
                    <td>Book first pages sample text.</td>
                  </tr>
                  <tr>
                    <td><strong>buyLink</strong></td>
                    <td>URL</td>
                    <td>Optional</td>
                    <td>External marketplace purchase link.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="admin-card space-y-4">
          <p className="admin-eyebrow">Upload Guidance</p>
          <h2 className="font-title text-3xl text-ink">Bulk imports match existing items by slug.</h2>
          <p className="font-body text-base leading-relaxed text-ink/70">
            If the slug matching the title (or explicitly provided <code>slug</code> column) already exists, the record will be updated in-place. Otherwise, a new catalog entry is created.
          </p>
          <ul className="space-y-3 font-body text-base leading-relaxed text-ink/70">
            <li><strong>Quotes</strong>: Wrap text fields containing commas or newlines in double quotes (<code>&quot;like, this&quot;</code>).</li>
            <li><strong>Encoding</strong>: Save files as UTF-8 in Excel / Google Sheets to preserve Bengali script text characters.</li>
            <li><strong>Relation matching</strong>: Genres listed will be mapped and associated with the book automatically.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

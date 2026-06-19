import { deleteBookAction, saveBookAction } from "@/app/admin/actions";
import AdminImageField from "@/components/admin/AdminImageField";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";

export interface BookEditorAuthor {
  id: string;
  name: string;
}

export interface BookEditorData {
  id: string;
  title: string;
  titleEn: string;
  slug: string;
  authorId: string;
  coverImageUrl: string;
  synopsis: string;
  pullQuote: string;
  price: string;
  stockQuantity: string;
  lowStockThreshold: string;
  buyLink: string;
  publicationDate: string;
  pageCount: string;
  isbn: string;
  language: string;
  featured: boolean;
  chapterPreview: string;
  averageRating: string;
  reviewCount: string;
  genres: string[];
  publisher?: string;
  compareAtPrice?: string;
  galleryImages: string[];
  tableOfContents?: string;
}

export default function BookEditor({
  book,
  authors,
}: {
  book?: BookEditorData;
  authors: BookEditorAuthor[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <form action={saveBookAction} className="admin-card space-y-6">
        <input type="hidden" name="id" value={book?.id ?? ""} />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="admin-field-label">Title</span>
            <input name="title" required className="admin-input" defaultValue={book?.title ?? ""} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">English Title</span>
            <input name="titleEn" className="admin-input" defaultValue={book?.titleEn ?? ""} />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="admin-field-label">Slug</span>
            <input name="slug" className="admin-input" defaultValue={book?.slug ?? ""} placeholder="auto-generated if left blank" />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Author</span>
            <select name="authorId" className="admin-select" defaultValue={book?.authorId ?? ""}>
              <option value="">No linked author</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="admin-field-label">Price (INR)</span>
            <input name="price" type="number" step="0.01" className="admin-input" defaultValue={book?.price ?? ""} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Compare At Price (INR)</span>
            <input name="compareAtPrice" type="number" step="0.01" className="admin-input" defaultValue={book?.compareAtPrice ?? ""} placeholder="Strike-through MSRP" />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Publication Date</span>
            <input name="publicationDate" type="date" className="admin-input" defaultValue={book?.publicationDate ?? ""} />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="admin-field-label">Stock Quantity</span>
            <input
              name="stockQuantity"
              type="number"
              min="0"
              className="admin-input"
              defaultValue={book?.stockQuantity ?? "12"}
            />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Low-Stock Threshold</span>
            <input
              name="lowStockThreshold"
              type="number"
              min="0"
              className="admin-input"
              defaultValue={book?.lowStockThreshold ?? "3"}
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="admin-field-label">Page Count</span>
            <input name="pageCount" type="number" className="admin-input" defaultValue={book?.pageCount ?? ""} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Average Rating</span>
            <input name="averageRating" type="number" step="0.1" className="admin-input" defaultValue={book?.averageRating ?? ""} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Review Count</span>
            <input name="reviewCount" type="number" className="admin-input" defaultValue={book?.reviewCount ?? ""} />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="admin-field-label">ISBN</span>
            <input name="isbn" className="admin-input" defaultValue={book?.isbn ?? ""} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Language</span>
            <input name="language" className="admin-input" defaultValue={book?.language ?? ""} placeholder="Bengali" />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Publisher</span>
            <input name="publisher" className="admin-input" defaultValue={book?.publisher ?? ""} placeholder="Kothakhahon" />
          </label>
        </div>

        <AdminImageField
          label="Cover Image"
          name="coverImageUrl"
          folder="books/covers"
          initialValue={book?.coverImageUrl ?? ""}
          hint="Use a clean portrait cover. Direct uploads land in Cloudinary when credentials are configured."
        />

        <div className="border-t border-ink/10 pt-6 space-y-4">
          <span className="admin-field-label block font-semibold uppercase tracking-wider text-xs text-ink/70">Gallery Images (Visual Previews)</span>
          <div className="grid gap-5 md:grid-cols-3">
            <AdminImageField
              label="Gallery Image 1"
              name="galleryImage1"
              folder="books/gallery"
              initialValue={book?.galleryImages?.[0] ?? ""}
              stacked
            />
            <AdminImageField
              label="Gallery Image 2"
              name="galleryImage2"
              folder="books/gallery"
              initialValue={book?.galleryImages?.[1] ?? ""}
              stacked
            />
            <AdminImageField
              label="Gallery Image 3"
              name="galleryImage3"
              folder="books/gallery"
              initialValue={book?.galleryImages?.[2] ?? ""}
              stacked
            />
          </div>
        </div>

        <label className="block space-y-2">
          <span className="admin-field-label">Buy Link</span>
          <input type="url" name="buyLink" className="admin-input" defaultValue={book?.buyLink ?? ""} placeholder="Optional external purchase link" />
        </label>

        <label className="block space-y-2">
          <span className="admin-field-label">Genres</span>
          <textarea
            name="genres"
            rows={3}
            className="admin-textarea"
            defaultValue={book?.genres.join(", ") ?? ""}
            placeholder="Comma or line separated, e.g. Literary Fiction, Contemporary"
          />
        </label>

        <label className="block space-y-2">
          <span className="admin-field-label">Synopsis</span>
          <textarea name="synopsis" rows={6} className="admin-textarea" defaultValue={book?.synopsis ?? ""} />
        </label>

        <label className="block space-y-2">
          <span className="admin-field-label">Table of Contents</span>
          <textarea name="tableOfContents" rows={4} className="admin-textarea" defaultValue={book?.tableOfContents ?? ""} placeholder="1. Chapter One..." />
        </label>

        <label className="block space-y-2">
          <span className="admin-field-label">Pull Quote</span>
          <textarea name="pullQuote" rows={3} className="admin-textarea" defaultValue={book?.pullQuote ?? ""} />
        </label>

        <label className="block space-y-2">
          <span className="admin-field-label">Chapter Preview</span>
          <textarea name="chapterPreview" rows={8} className="admin-textarea" defaultValue={book?.chapterPreview ?? ""} />
        </label>

        <label className="flex items-center gap-3 rounded-[20px] border border-ink/10 bg-white/72 px-4 py-3 font-body text-base text-ink/74">
          <input type="checkbox" name="featured" defaultChecked={book?.featured ?? false} className="h-4 w-4 accent-[var(--brass)]" />
          Mark this title as featured on the storefront
        </label>

        <div className="flex flex-wrap gap-3">
          <AdminSubmitButton idleLabel={book ? "Save Book" : "Create Book"} pendingLabel="Saving book..." />
          {book ? (
            <button type="submit" formAction={deleteBookAction} formNoValidate className="admin-button admin-button-danger">
              Delete Book
            </button>
          ) : null}
        </div>
      </form>

      <aside className="admin-card space-y-4">
        <p className="admin-eyebrow">Catalog Guidance</p>
        <h2 className="font-title text-3xl text-ink">Write for the shelf, not for a commodity grid.</h2>
        <p className="font-body text-base leading-relaxed text-ink/70">
          The synopsis should feel edited and intentional. The pull quote should deepen tone, not repeat the synopsis.
        </p>
        <ul className="space-y-3 font-body text-base leading-relaxed text-ink/70">
          <li>Genres can be freeform. The system normalizes them into reusable tags.</li>
          <li>Cover images should read clearly at thumbnail size before they are judged at full size.</li>
          <li>Stock status is now derived from quantity and the low-stock threshold.</li>
          <li>Keep chapter previews clean and well broken into paragraphs for the reader-facing modal.</li>
        </ul>
      </aside>
    </div>
  );
}

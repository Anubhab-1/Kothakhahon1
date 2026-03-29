import { deleteBlogPostAction, saveBlogPostAction } from "@/app/admin/actions";
import AdminImageField from "@/components/admin/AdminImageField";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";

export interface BlogPostEditorAuthor {
  id: string;
  name: string;
}

export interface BlogPostEditorData {
  id: string;
  title: string;
  slug: string;
  category: string;
  coverImageUrl: string;
  excerpt: string;
  body: string;
  publishedAt: string;
  featured: boolean;
  authorId: string;
}

export default function BlogPostEditor({
  post,
  authors,
}: {
  post?: BlogPostEditorData;
  authors: BlogPostEditorAuthor[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <form action={saveBlogPostAction} className="admin-card space-y-6">
        <input type="hidden" name="id" value={post?.id ?? ""} />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="admin-field-label">Post Title</span>
            <input name="title" required className="admin-input" defaultValue={post?.title ?? ""} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Slug</span>
            <input name="slug" className="admin-input" defaultValue={post?.slug ?? ""} placeholder="auto-generated if left blank" />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="admin-field-label">Category</span>
            <input name="category" className="admin-input" defaultValue={post?.category ?? ""} placeholder="Editorial / Publishing / Design" />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Published Date</span>
            <input name="publishedAt" type="date" className="admin-input" defaultValue={post?.publishedAt ?? ""} />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="admin-field-label">Author</span>
            <select name="authorId" className="admin-select" defaultValue={post?.authorId ?? ""}>
              <option value="">No linked author</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </label>
          <AdminImageField
            label="Cover Image"
            name="coverImageUrl"
            folder="journal"
            initialValue={post?.coverImageUrl ?? ""}
            hint="Landscape or atmospheric stills work best for journal posts."
          />
        </div>

        <label className="block space-y-2">
          <span className="admin-field-label">Excerpt</span>
          <textarea name="excerpt" rows={4} className="admin-textarea" defaultValue={post?.excerpt ?? ""} />
        </label>

        <label className="block space-y-2">
          <span className="admin-field-label">Body</span>
          <textarea
            name="body"
            rows={14}
            className="admin-textarea"
            defaultValue={post?.body ?? ""}
            placeholder="Use clean paragraphs separated by blank lines."
          />
        </label>

        <label className="flex items-center gap-3 rounded-[20px] border border-ink/10 bg-white/72 px-4 py-3 font-body text-base text-ink/74">
          <input type="checkbox" name="featured" defaultChecked={post?.featured ?? false} className="h-4 w-4 accent-[var(--brass)]" />
          Highlight this post on the journal index
        </label>

        <div className="flex flex-wrap gap-3">
          <AdminSubmitButton idleLabel={post ? "Save Post" : "Create Post"} pendingLabel="Saving post..." />
          {post ? (
            <button type="submit" formAction={deleteBlogPostAction} formNoValidate className="admin-button admin-button-danger">
              Delete Post
            </button>
          ) : null}
        </div>
      </form>

      <aside className="admin-card space-y-4">
        <p className="admin-eyebrow">Journal Guidance</p>
        <h2 className="font-title text-3xl text-ink">Write like a publisher with taste, not a content mill.</h2>
        <p className="font-body text-base leading-relaxed text-ink/70">
          The journal is part of brand voice. Keep category, title, excerpt, and body aligned in tone and seriousness.
        </p>
        <p className="font-body text-base leading-relaxed text-ink/70">
          Images should feel editorial, not stock-generic. Choose covers that match the subject and pacing of the piece.
        </p>
      </aside>
    </div>
  );
}

import { deleteAuthorAction, saveAuthorAction } from "@/app/admin/actions";
import AdminImageField from "@/components/admin/AdminImageField";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";

export interface AuthorEditorData {
  id: string;
  name: string;
  slug: string;
  bio: string;
  photoUrl: string;
  featured: boolean;
  awards: string[];
}

export default function AuthorEditor({
  author,
}: {
  author?: AuthorEditorData;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <form action={saveAuthorAction} className="admin-card space-y-6">
        <input type="hidden" name="id" value={author?.id ?? ""} />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="admin-field-label">Author Name</span>
            <input name="name" required className="admin-input" defaultValue={author?.name ?? ""} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Slug</span>
            <input name="slug" className="admin-input" defaultValue={author?.slug ?? ""} placeholder="auto-generated if left blank" />
          </label>
        </div>

        <AdminImageField
          label="Author Photo"
          name="photoUrl"
          folder="authors"
          initialValue={author?.photoUrl ?? ""}
          hint="Portrait crops work best. Upload directly or paste a stable hosted URL."
        />

        <label className="block space-y-2">
          <span className="admin-field-label">Biography</span>
          <textarea
            name="bio"
            rows={8}
            className="admin-textarea"
            defaultValue={author?.bio ?? ""}
            placeholder="Editorial biography and positioning."
          />
        </label>

        <label className="block space-y-2">
          <span className="admin-field-label">Awards</span>
          <textarea
            name="awards"
            rows={5}
            className="admin-textarea"
            defaultValue={author?.awards.join("\n") ?? ""}
            placeholder="One award per line"
          />
        </label>

        <label className="flex items-center gap-3 rounded-[20px] border border-ink/10 bg-white/72 px-4 py-3 font-body text-base text-ink/74">
          <input type="checkbox" name="featured" defaultChecked={author?.featured ?? false} className="h-4 w-4 accent-[var(--brass)]" />
          Mark this author as featured
        </label>

        <div className="flex flex-wrap gap-3">
          <AdminSubmitButton idleLabel={author ? "Save Author" : "Create Author"} pendingLabel="Saving author..." />
          {author ? (
            <button type="submit" formAction={deleteAuthorAction} formNoValidate className="admin-button admin-button-danger">
              Delete Author
            </button>
          ) : null}
        </div>
      </form>

      <aside className="admin-card space-y-4">
        <p className="admin-eyebrow">Editorial Notes</p>
        <h2 className="font-title text-3xl text-ink">Author pages should read like a serious publisher wrote them.</h2>
        <p className="font-body text-base leading-relaxed text-ink/70">
          Avoid generic bios. Keep the voice focused on literary position, subjects, and contribution to the list.
        </p>
        <ul className="space-y-3 font-body text-base leading-relaxed text-ink/70">
          <li>Use a portrait image with clean contrast and enough space around the face for cropping.</li>
          <li>List awards one per line. Leave blank if the author should feel understated instead of over-decorated.</li>
        </ul>
      </aside>
    </div>
  );
}

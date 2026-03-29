import { saveSiteSettingsAction } from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";

export interface SiteSettingsAuthorOption {
  id: string;
  name: string;
}

export interface SiteSettingsEditorData {
  heroTagline: string;
  heroTaglineEn: string;
  missionStatement: string;
  featuredAuthorId: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  editorialEmail: string;
  submissionsEmail: string;
  rightsEmail: string;
  supportPhone: string;
  whatsappPhone: string;
  postalAddress: string;
}

export default function SiteSettingsEditor({
  settings,
  authors,
}: {
  settings: SiteSettingsEditorData;
  authors: SiteSettingsAuthorOption[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <form action={saveSiteSettingsAction} className="admin-card space-y-6">
        <label className="block space-y-2">
          <span className="admin-field-label">Hero Tagline</span>
          <input name="heroTagline" className="admin-input" defaultValue={settings.heroTagline} />
        </label>

        <label className="block space-y-2">
          <span className="admin-field-label">Hero Supporting Line</span>
          <textarea name="heroTaglineEn" rows={4} className="admin-textarea" defaultValue={settings.heroTaglineEn} />
        </label>

        <label className="block space-y-2">
          <span className="admin-field-label">Mission Statement</span>
          <textarea name="missionStatement" rows={5} className="admin-textarea" defaultValue={settings.missionStatement} />
        </label>

        <label className="block space-y-2">
          <span className="admin-field-label">Featured Author</span>
          <select name="featuredAuthorId" className="admin-select" defaultValue={settings.featuredAuthorId}>
            <option value="">No featured author</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="admin-field-label">Editorial Email</span>
            <input type="email" name="editorialEmail" className="admin-input" defaultValue={settings.editorialEmail} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Submissions Email</span>
            <input type="email" name="submissionsEmail" className="admin-input" defaultValue={settings.submissionsEmail} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Rights Email</span>
            <input type="email" name="rightsEmail" className="admin-input" defaultValue={settings.rightsEmail} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Support Phone</span>
            <input name="supportPhone" className="admin-input" defaultValue={settings.supportPhone} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">WhatsApp Number</span>
            <input name="whatsappPhone" className="admin-input" defaultValue={settings.whatsappPhone} />
          </label>
          <label className="block space-y-2 md:col-span-2">
            <span className="admin-field-label">Postal Address</span>
            <textarea name="postalAddress" rows={4} className="admin-textarea" defaultValue={settings.postalAddress} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Facebook URL</span>
            <input type="url" name="facebookUrl" className="admin-input" defaultValue={settings.facebookUrl} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">Instagram URL</span>
            <input type="url" name="instagramUrl" className="admin-input" defaultValue={settings.instagramUrl} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">YouTube URL</span>
            <input type="url" name="youtubeUrl" className="admin-input" defaultValue={settings.youtubeUrl} />
          </label>
          <label className="block space-y-2">
            <span className="admin-field-label">LinkedIn URL</span>
            <input type="url" name="linkedinUrl" className="admin-input" defaultValue={settings.linkedinUrl} />
          </label>
        </div>

        <AdminSubmitButton idleLabel="Save Settings" pendingLabel="Saving settings..." />
      </form>

      <aside className="admin-card space-y-4">
        <p className="admin-eyebrow">Brand Guidance</p>
        <h2 className="font-title text-3xl text-ink">The public homepage should sound deliberate and editorial.</h2>
        <p className="font-body text-base leading-relaxed text-ink/70">
          Keep the hero and mission lines sharp. Then fill the support fields with real contact data so the storefront stops feeling anonymous at launch.
        </p>
      </aside>
    </div>
  );
}

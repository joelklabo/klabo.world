import type { Metadata } from 'next';
import { runAdminPage } from '@/lib/adminPageHelpers';
import { Surface } from '@/components/ui/surface';
import { ImageListUploadField } from '@/app/(admin)/components/image-list-upload-field';
import { ImageUploadField } from '@/app/(admin)/components/image-upload-field';
import { AdminSectionHeader } from '@/app/(admin)/components/admin-section-header';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Image uploads • Admin',
};

export default async function AdminImagesPage() {
  return runAdminPage(async () => (
    <div className="space-y-6">
      <AdminSectionHeader
        label="Media"
        title="Image uploads"
        description="Upload assets and grab URLs for posts, dashboards, and app listings."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Surface
          className="rounded-2xl shadow-2xl"
          innerClassName="rounded-2xl border border-border/60 bg-card"
        >
          <div className="space-y-4 p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Single</p>
              <h2 className="text-xl font-semibold text-foreground text-balance">Upload one image</h2>
              <p className="text-sm text-muted-foreground text-pretty">
                The input keeps the latest URL so you can copy it anytime.
              </p>
            </div>
            <ImageUploadField
              name="admin-upload-single"
              label="Image URL"
              helperText="Uploads are stored under /uploads — link directly to the generated path."
              placeholder="/uploads/your-image.png"
            />
          </div>
        </Surface>
        <Surface
          className="rounded-2xl shadow-2xl"
          innerClassName="rounded-2xl border border-border/60 bg-card"
        >
          <div className="space-y-4 p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Batch</p>
              <h2 className="text-xl font-semibold text-foreground text-balance">Upload multiple images</h2>
              <p className="text-sm text-muted-foreground text-pretty">
                Each upload appends to the list for easy copy/paste.
              </p>
            </div>
            <ImageListUploadField
              name="admin-upload-multiple"
              label="Image URLs (one per line)"
              placeholder="/uploads/first.png"
              helperText="Great for app screenshots or galleries."
            />
          </div>
        </Surface>
      </div>
    </div>
  ));
}

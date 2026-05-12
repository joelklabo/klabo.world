'use server';

import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/adminSession';
import { upsertApp, deleteApp, type AppInput } from '@/lib/appPersistence';
import { revalidateAppCache } from '@/lib/adminRevalidation';
import { withSpan } from '@/lib/telemetry';
import { parseFormData, type ActionState as SharedActionState } from '@/lib/formActions';
import { normalizeSlug } from '@/lib/slugUtils';
import { splitTrimmedList } from '@/lib/formTransforms';

const appSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  publishDate: z.string().refine((val) => !Number.isNaN(new Date(val).getTime()), 'Invalid date'),
  version: z.string().min(1, 'Version is required'),
  fullDescription: z.string().min(1, 'Description is required'),
  features: z.string().transform((val) => splitTrimmedList(val, /\r?\n/)),
  screenshots: z.string().transform((val) => splitTrimmedList(val, /\r?\n/)),
  appStoreURL: z.string().url().optional().or(z.literal('')),
  githubURL: z.string().url().optional().or(z.literal('')),
  icon: z.string().optional(),
});

export type ActionState = SharedActionState;

export async function upsertAppAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdminSession();
    const parsed = parseFormData(appSchema, formData);
    if (!parsed.ok) {
      return parsed.state;
    }

    const data = parsed.data;
    const derivedSlug = data.slug
      ? normalizeSlug(data.slug)
      : normalizeSlug(data.name);

    const input: AppInput = {
      name: data.name,
      slug: derivedSlug,
      publishDate: new Date(data.publishDate).toISOString(),
      version: data.version,
      fullDescription: data.fullDescription,
      features: data.features,
      screenshots: data.screenshots,
      appStoreURL: data.appStoreURL || undefined,
      githubURL: data.githubURL || undefined,
      icon: data.icon || undefined,
    };

    await upsertApp(input.slug, input);

    after(async () => {
      await withSpan('admin.app.upsert', async (span) => {
        span.setAttributes({ 'app.slug': input.slug });
      });
    });

    revalidateAppCache(input.slug);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Failed to save app',
      success: false,
    };
  }
  
  redirect('/admin/apps');
}

export async function deleteAppAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdminSession();
    const slug = formData.get('slug')?.toString().trim();
    if (!slug) {
      throw new Error('Missing app slug');
    }

    await deleteApp(slug);

    after(async () => {
      await withSpan('admin.app.delete', async (span) => {
        span.setAttributes({ 'app.slug': slug });
      });
    });

    revalidateAppCache();
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Failed to delete app',
      success: false,
    };
  }
  redirect('/admin/apps');
}

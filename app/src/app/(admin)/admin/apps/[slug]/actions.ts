'use server';

import { after } from 'next/server';
import { z } from 'zod';
import { upsertApp, deleteApp, type AppInput } from '@/lib/appPersistence';
import { revalidateAppCache } from '@/lib/adminRevalidation';
import { withSpan } from '@/lib/telemetry';
import { optionalUrlField, parseNewlineList, requiredTextField } from '@/lib/adminFormSchemas';
import { parseFormData, type ActionState as SharedActionState } from '@/lib/formActions';
import { normalizeSlug } from '@/lib/slugUtils';
import { getFormSlug, runAdminActionAndRedirect } from '@/lib/adminActionHelpers';

const appSchema = z.object({
  name: requiredTextField('Name'),
  slug: z.string().optional(),
  publishDate: z.string().refine((val) => !Number.isNaN(new Date(val).getTime()), 'Invalid date'),
  version: requiredTextField('Version'),
  fullDescription: requiredTextField('Description'),
  features: parseNewlineList,
  screenshots: parseNewlineList,
  appStoreURL: optionalUrlField(),
  githubURL: optionalUrlField(),
  icon: z.string().optional(),
});

export type ActionState = SharedActionState;

export async function upsertAppAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAdminActionAndRedirect(async () => {
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
    return { message: 'App saved', success: true };
  }, 'Failed to save app', '/admin/apps');
}

export async function deleteAppAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAdminActionAndRedirect(async () => {
    const slug = getFormSlug(formData, 'app');
    await deleteApp(slug);

    after(async () => {
      await withSpan('admin.app.delete', async (span) => {
        span.setAttributes({ 'app.slug': slug });
      });
    });

    revalidateAppCache();
    return { message: 'App deleted', success: true };
  }, 'Failed to delete app', '/admin/apps');
}

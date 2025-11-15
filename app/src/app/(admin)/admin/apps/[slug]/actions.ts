'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import slugify from 'slugify';
import { requireAdminSession } from '@/lib/adminSession';
import { upsertApp, deleteApp, type AppInput } from '@/lib/appPersistence';
import { withSpan } from '@/lib/telemetry';

function parseAppInput(formData: FormData): AppInput {
  const name = formData.get('name')?.toString().trim();
  const rawSlug = formData.get('slug')?.toString().trim();
  const publishDate = formData.get('publishDate')?.toString().trim();
  const version = formData.get('version')?.toString().trim();
  const fullDescription = formData.get('fullDescription')?.toString().trim();
  const featuresRaw = formData.get('features')?.toString() ?? '';
  const screenshotsRaw = formData.get('screenshots')?.toString() ?? '';
  const appStoreURL = formData.get('appStoreURL')?.toString().trim() || undefined;
  const githubURL = formData.get('githubURL')?.toString().trim() || undefined;
  const icon = formData.get('icon')?.toString().trim() || undefined;
  if (!name || !publishDate || !version || !fullDescription) {
    throw new Error('Missing required fields');
  }
  const publishDateISO = new Date(publishDate);
  if (Number.isNaN(publishDateISO.getTime())) {
    throw new Error('Invalid publish date');
  }
  const derivedSlug = rawSlug ? slugify(rawSlug, { lower: true, strict: true }) : slugify(name, { lower: true, strict: true });
  return {
    name,
    slug: derivedSlug,
    publishDate: publishDateISO.toISOString(),
    version,
    fullDescription,
    features: featuresRaw.split('\n').map((line) => line.trim()).filter(Boolean),
    icon,
    screenshots: screenshotsRaw.split('\n').map((line) => line.trim()).filter(Boolean),
    appStoreURL,
    githubURL,
  };
}

export async function upsertAppAction(formData: FormData) {
  await requireAdminSession();
  const input = parseAppInput(formData);
  await withSpan('admin.app.upsert', async (span) => {
    span.setAttributes({ 'app.slug': input.slug });
    await upsertApp(input.slug, input);
  });
  revalidatePath('/');
  revalidatePath('/apps');
  revalidatePath(`/apps/${input.slug}`);
  redirect('/admin/apps');
}

export async function deleteAppAction(slug: string) {
  await requireAdminSession();
  await withSpan('admin.app.delete', async (span) => {
    span.setAttributes({ 'app.slug': slug });
    await deleteApp(slug);
  });
  revalidatePath('/');
  revalidatePath('/apps');
  redirect('/admin/apps');
}

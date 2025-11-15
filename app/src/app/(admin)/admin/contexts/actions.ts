'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import slugify from 'slugify';
import { requireAdminSession } from '@/lib/adminSession';
import { upsertContext, deleteContext, type ContextInput } from '@/lib/contextPersistence';
import { withSpan } from '@/lib/telemetry';

function parseContextInput(formData: FormData): ContextInput {
  const title = formData.get('title')?.toString().trim();
  const rawSlug = formData.get('slug')?.toString().trim();
  const summary = formData.get('summary')?.toString().trim();
  const content = formData.get('content')?.toString();
  const createdDate = formData.get('createdDate')?.toString() || new Date().toISOString();
  const updatedDate = formData.get('updatedDate')?.toString() || new Date().toISOString();
  const isPublished = formData.get('isPublished')?.toString() === 'published';
  const tagsRaw = formData.get('tags')?.toString() ?? '';
  if (!title || !summary || !content) {
    throw new Error('Missing required fields');
  }
  const slug = rawSlug ? slugify(rawSlug, { lower: true, strict: true }) : slugify(title, { lower: true, strict: true });
  return {
    title,
    slug,
    summary,
    content,
    createdDate,
    updatedDate,
    isPublished,
    tags: tagsRaw
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

export async function upsertContextAction(formData: FormData) {
  await requireAdminSession();
  const input = parseContextInput(formData);
  await withSpan('admin.context.upsert', async (span) => {
    span.setAttributes({ 'context.slug': input.slug, 'context.published': input.isPublished });
    await upsertContext(input.slug, input);
  });
  revalidatePath('/');
  revalidatePath('/contexts');
  revalidatePath('/contexts/tags');
  revalidatePath(`/contexts/${input.slug}`);
  redirect('/admin/contexts');
}

export async function deleteContextAction(slug: string) {
  await requireAdminSession();
  await withSpan('admin.context.delete', async (span) => {
    span.setAttributes({ 'context.slug': slug });
    await deleteContext(slug);
  });
  revalidatePath('/');
  revalidatePath('/contexts');
  revalidatePath('/contexts/tags');
  redirect('/admin/contexts');
}

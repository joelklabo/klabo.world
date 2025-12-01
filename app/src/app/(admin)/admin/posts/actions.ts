'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createPost, deletePost, updatePost } from '@/lib/postPersistence';
import { requireAdminSession } from '@/lib/adminSession';
import { withSpan } from '@/lib/telemetry';

async function extractPostInput(formData: FormData) {
  await requireAdminSession();
  const title = formData.get('title')?.toString().trim();
  const summary = formData.get('summary')?.toString().trim();
  const body = formData.get('content')?.toString().trim();
  if (!title || !summary || !body) {
    throw new Error('Missing required fields');
  }
  const publishDateRaw = formData.get('publishDate')?.toString().trim();
  const publishDate = publishDateRaw ? publishDateRaw : null;
  const featuredImage = formData.get('featuredImage')?.toString().trim() || null;
  const tagsInput = formData.get('tags')?.toString() ?? '';
  const tags = tagsInput
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  const lightningAddress = formData.get('lightningAddress')?.toString().trim() || null;
  const nostrPubkey = formData.get('nostrPubkey')?.toString().trim() || null;
  const nostrRelaysInput = formData.get('nostrRelays')?.toString() ?? '';
  const nostrRelays = nostrRelaysInput
    .split(/[,\n]/)
    .map((relay) => relay.trim())
    .filter(Boolean);
  const nostrstackEnabled = formData.get('nostrstackEnabled') ? true : false;
  return {
    title,
    summary,
    body,
    tags,
    publishDate,
    featuredImage,
    lightningAddress,
    nostrPubkey,
    nostrRelays,
    nostrstackEnabled,
  };
}

export async function createPostAction(formData: FormData) {
  const input = await extractPostInput(formData);
  const { slug } = await withSpan('admin.post.create', async (span) => {
    span.setAttributes({ 'post.title': input.title });
    return createPost(input);
  });
  revalidatePath('/');
  revalidatePath('/posts');
  revalidatePath(`/posts/${slug}`);
  redirect('/admin');
}

export async function updatePostAction(slug: string, formData: FormData) {
  const input = await extractPostInput(formData);
  await withSpan('admin.post.update', async (span) => {
    span.setAttributes({ 'post.slug': slug });
    await updatePost(slug, input);
  });
  revalidatePath('/');
  revalidatePath('/posts');
  revalidatePath(`/posts/${slug}`);
  redirect('/admin');
}

export async function deletePostAction(slug: string) {
  await requireAdminSession();
  await withSpan('admin.post.delete', async (span) => {
    span.setAttributes({ 'post.slug': slug });
    await deletePost(slug);
  });
  revalidatePath('/');
  revalidatePath('/posts');
  redirect('/admin');
}

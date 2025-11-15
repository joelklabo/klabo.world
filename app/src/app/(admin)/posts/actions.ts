'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createPost } from '@/lib/postPersistence';
import { requireAdminSession } from '@/lib/adminSession';

export async function createPostAction(formData: FormData) {
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

  const { slug } = await createPost({
    title,
    summary,
    body,
    tags,
    publishDate,
    featuredImage,
  });

  revalidatePath('/');
  revalidatePath('/posts');
  revalidatePath(`/posts/${slug}`);
  redirect('/admin');
}

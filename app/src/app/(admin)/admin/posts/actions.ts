'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import { createPost, deletePost, updatePost } from '@/lib/postPersistence';
import { requireAdminSession } from '@/lib/adminSession';
import { withSpan } from '@/lib/telemetry';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required'),
  content: z.string().min(1, 'Content is required'),
  publishDate: z.string().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  tags: z.string().transform((val) => val.split(',').map((t) => t.trim()).filter(Boolean)),
  lightningAddress: z.string().email().optional().or(z.literal('')),
  nostrPubkey: z.string().optional().nullable(),
  nostrRelays: z.string().transform((val) => val.split(/[,\n]/).map((r) => r.trim()).filter(Boolean)),
  nostrstackEnabled: z.coerce.boolean().optional(),
});

export type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
};

export async function createPostAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let slug: string | undefined;
  try {
    await requireAdminSession();
    const raw = Object.fromEntries(formData.entries());
    // Checkbox handling: if unchecked, it's missing from formData.
    // We can manually set it to 'false' if missing, or let Zod handle optional.
    // But Zod coerce boolean treats "on" as true, missing as undefined.
    // Let's ensure it's handled correctly.
    if (!raw.nostrstackEnabled) raw.nostrstackEnabled = 'false';
    else raw.nostrstackEnabled = 'true';

    const result = postSchema.safeParse(raw);

    if (!result.success) {
      return {
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
        success: false,
      };
    }

    const data = result.data;
    const input = {
      title: data.title,
      summary: data.summary,
      body: data.content,
      tags: data.tags,
      publishDate: data.publishDate || null,
      featuredImage: data.featuredImage || null,
      lightningAddress: data.lightningAddress || null,
      nostrPubkey: data.nostrPubkey || null,
      nostrRelays: data.nostrRelays,
      nostrstackEnabled: data.nostrstackEnabled,
    };

    const createResult = await createPost(input);
    slug = createResult.slug;

    after(async () => {
      await withSpan('admin.post.create', async (span) => {
        span.setAttributes({ 'post.title': input.title, 'post.slug': slug! });
      });
    });

    revalidatePath('/');
    revalidatePath('/posts');
    revalidatePath(`/posts/${slug}`);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Failed to create post',
      success: false,
    };
  }
  
  redirect('/admin');
}

export async function updatePostAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdminSession();
    const slug = formData.get('slug')?.toString().trim();
    if (!slug) {
      throw new Error('Missing post slug');
    }

    const raw = Object.fromEntries(formData.entries());
    if (!raw.nostrstackEnabled) raw.nostrstackEnabled = 'false';
    else raw.nostrstackEnabled = 'true';

    const result = postSchema.safeParse(raw);

    if (!result.success) {
      return {
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
        success: false,
      };
    }

    const data = result.data;
    const input = {
      title: data.title,
      summary: data.summary,
      body: data.content,
      tags: data.tags,
      publishDate: data.publishDate || null,
      featuredImage: data.featuredImage || null,
      lightningAddress: data.lightningAddress || null,
      nostrPubkey: data.nostrPubkey || null,
      nostrRelays: data.nostrRelays,
      nostrstackEnabled: data.nostrstackEnabled,
    };

    await updatePost(slug, input);

    after(async () => {
      await withSpan('admin.post.update', async (span) => {
        span.setAttributes({ 'post.slug': slug });
      });
    });

    revalidatePath('/');
    revalidatePath('/posts');
    revalidatePath(`/posts/${slug}`);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Failed to update post',
      success: false,
    };
  }
  redirect('/admin');
}

export async function deletePostAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdminSession();
    const slug = formData.get('slug')?.toString().trim();
    if (!slug) {
      throw new Error('Missing post slug');
    }

    await deletePost(slug);

    after(async () => {
      await withSpan('admin.post.delete', async (span) => {
        span.setAttributes({ 'post.slug': slug });
      });
    });

    revalidatePath('/');
    revalidatePath('/posts');
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Failed to delete post',
      success: false,
    };
  }
  redirect('/admin');
}

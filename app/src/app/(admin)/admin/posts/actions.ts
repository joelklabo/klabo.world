'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import { createPost, deletePost, updatePost, updatePostXPostId } from '@/lib/postPersistence';
import { requireAdminSession } from '@/lib/adminSession';
import { withSpan } from '@/lib/telemetry';
import { getEditablePostBySlug } from '@/lib/posts';
import { isXPublishingEnabled, publishToX } from '@/lib/x-publisher';
import { env } from '@/lib/env';

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
    raw.nostrstackEnabled = raw.nostrstackEnabled ? 'true' : 'false';

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
  let slug: string | undefined;
  let shouldAutoPost = false;
  let postTitle = '';
  let postSummary = '';

  try {
    await requireAdminSession();
    slug = formData.get('slug')?.toString().trim();
    if (!slug) {
      throw new Error('Missing post slug');
    }

    // Get existing post state to detect publish transition
    const existingPost = await getEditablePostBySlug(slug);
    const existingPublishDate = existingPost?.publishDate;
    const existingXPostId = (existingPost as { xPostId?: string } | undefined)?.xPostId;

    const raw = Object.fromEntries(formData.entries());
    raw.nostrstackEnabled = raw.nostrstackEnabled ? 'true' : 'false';

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

    // Detect if this is a publish transition (immediate publish only)
    const wasPublished = existingPublishDate && new Date(existingPublishDate) <= new Date();
    const newPublishDate = input.publishDate ? new Date(input.publishDate) : null;
    const isNowPublished = newPublishDate && newPublishDate <= new Date();
    const isImmediatePublish = !wasPublished && isNowPublished && !existingXPostId;

    if (isImmediatePublish && isXPublishingEnabled()) {
      shouldAutoPost = true;
      postTitle = input.title;
      postSummary = input.summary;
    }

    after(async () => {
      await withSpan('admin.post.update', async (span) => {
        span.setAttributes({ 'post.slug': slug! });
      });

      // Auto-post to X if this is an immediate publish
      if (shouldAutoPost && slug) {
        const siteUrl = env.SITE_URL;
        const postUrl = `${siteUrl}/posts/${slug}`;
        const result = await publishToX({
          title: postTitle,
          summary: postSummary,
          url: postUrl,
        });
        if (result.success) {
          await updatePostXPostId(slug, result.postId);
          console.log(`Auto-posted to X: ${result.postId}`);
        } else {
          console.error(`Failed to auto-post to X: ${result.error}`);
        }
      }
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

export type ShareToXResult = {
  success: boolean;
  postId?: string;
  error?: string;
};

/**
 * Manually share a post to X (Twitter).
 * Used for scheduled posts, retries, or posts that weren't auto-posted.
 */
export async function shareToXAction(slug: string): Promise<ShareToXResult> {
  try {
    await requireAdminSession();

    const post = await getEditablePostBySlug(slug);
    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    // Check if already shared
    const existingXPostId = (post as { xPostId?: string }).xPostId;
    if (existingXPostId) {
      return { success: false, error: 'Post has already been shared to X' };
    }

    if (!isXPublishingEnabled()) {
      return { success: false, error: 'X publishing is not enabled' };
    }

    const siteUrl = env.SITE_URL;
    const postUrl = `${siteUrl}/posts/${slug}`;

    const result = await publishToX({
      title: post.title,
      summary: post.summary,
      url: postUrl,
    });

    if (result.success) {
      await updatePostXPostId(slug, result.postId);
      revalidatePath(`/posts/${slug}`);
      revalidatePath('/admin');
      return { success: true, postId: result.postId };
    }

    return { success: false, error: result.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share to X',
    };
  }
}

'use server';

import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import { createPost, deletePost, updatePost, updatePostXPostId } from '@/lib/postPersistence';
import { revalidatePostCache } from '@/lib/adminRevalidation';
import { withSpan } from '@/lib/telemetry';
import { getEditablePostBySlug } from '@/lib/posts';
import { isXPublishingEnabled, publishToX } from '@/lib/x-publisher';
import { env } from '@/lib/env';
import { requiredTextField, parseListField } from '@/lib/adminFormSchemas';
import { parseFormValues, type ActionState as SharedActionState } from '@/lib/formActions';
import { requireAdminSession } from '@/lib/adminSession';
import { getFormSlug, runAdminAction } from '@/lib/adminActionHelpers';

const postSchema = z.object({
  title: requiredTextField('Title'),
  summary: requiredTextField('Summary'),
  content: requiredTextField('Content'),
  publishDate: z.string().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  tags: parseListField(','),
  lightningAddress: z.string().email().optional().or(z.literal('')),
  nostrPubkey: z.string().optional().nullable(),
  nostrRelays: parseListField(/[,\n]/),
  nostrstackEnabled: z.coerce.boolean().optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

function buildPostPersistenceInput(data: PostFormValues) {
  return {
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
}

export type ActionState = SharedActionState;

export async function createPostAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await runAdminAction(async () => {
    // Checkbox handling: if unchecked, it's missing from formData.
    // We can manually set it to 'false' if missing, or let Zod handle optional.
    // But Zod coerce boolean treats "on" as true, missing as undefined.
    // Let's ensure it's handled correctly.
    const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
    raw.nostrstackEnabled = raw.nostrstackEnabled ? 'true' : 'false';
    const parsed = parseFormValues(postSchema, raw);
    if (!parsed.ok) {
      return parsed.state;
    }

    const data = parsed.data;
    const input = buildPostPersistenceInput(data);
    const createResult = await createPost(input);

    after(async () => {
      await withSpan('admin.post.create', async (span) => {
        span.setAttributes({ 'post.title': input.title, 'post.slug': createResult.slug });
      });
    });

    revalidatePostCache(createResult.slug);
    return { message: 'Post created', success: true };
  }, 'Failed to create post');

  if (!result.success) {
    return result;
  }

  redirect('/admin');
}

export async function updatePostAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await runAdminAction(async () => {
    const slug = getFormSlug(formData, 'post');

    // Get existing post state to detect publish transition
    const existingPost = await getEditablePostBySlug(slug);
    const existingPublishDate = existingPost?.publishDate;
    const existingXPostId = (existingPost as { xPostId?: string } | undefined)?.xPostId;

    const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
    raw.nostrstackEnabled = raw.nostrstackEnabled ? 'true' : 'false';

    const parsed = parseFormValues(postSchema, raw);
    if (!parsed.ok) {
      return parsed.state;
    }

    const data = parsed.data;
    const input = buildPostPersistenceInput(data);
    const now = new Date();
    let shouldAutoPost = false;
    let postTitle = '';
    let postSummary = '';

    await updatePost(slug, input);

    // Detect if this is a publish transition (immediate publish only)
    const wasPublished = existingPublishDate && new Date(existingPublishDate) <= now;
    const newPublishDate = input.publishDate ? new Date(input.publishDate) : null;
    const isNowPublished = newPublishDate && newPublishDate <= now;
    const isImmediatePublish = !wasPublished && isNowPublished && !existingXPostId;

    if (isImmediatePublish && isXPublishingEnabled()) {
      shouldAutoPost = true;
      postTitle = input.title;
      postSummary = input.summary;
    }

    after(async () => {
      await withSpan('admin.post.update', async (span) => {
        span.setAttributes({ 'post.slug': slug });
      });

      // Auto-post to X if this is an immediate publish
      if (shouldAutoPost) {
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

    revalidatePostCache(slug);
    return { message: 'Post updated', success: true };
  }, 'Failed to update post');

  if (!result.success) {
    return result;
  }

  redirect('/admin');
}

export async function deletePostAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await runAdminAction(async () => {
    const slug = getFormSlug(formData, 'post');
    await deletePost(slug);

    after(async () => {
      await withSpan('admin.post.delete', async (span) => {
        span.setAttributes({ 'post.slug': slug });
      });
    });

    revalidatePostCache();
    return { message: 'Post deleted', success: true };
  }, 'Failed to delete post');

  if (!result.success) {
    return result;
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
      revalidatePostCache(slug, true);
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

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import slugify from 'slugify';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/adminSession';
import { upsertApp, deleteApp, type AppInput } from '@/lib/appPersistence';
import { withSpan } from '@/lib/telemetry';

const appSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  publishDate: z.string().refine((val) => !Number.isNaN(new Date(val).getTime()), 'Invalid date'),
  version: z.string().min(1, 'Version is required'),
  fullDescription: z.string().min(1, 'Description is required'),
  features: z.string().transform((val) => val.split('\n').map((l) => l.trim()).filter(Boolean)),
  screenshots: z.string().transform((val) => val.split('\n').map((l) => l.trim()).filter(Boolean)),
  appStoreURL: z.string().url().optional().or(z.literal('')),
  githubURL: z.string().url().optional().or(z.literal('')),
  icon: z.string().optional(),
});

export type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
};

export async function upsertAppAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdminSession();
    const raw = Object.fromEntries(formData.entries());
    const result = appSchema.safeParse(raw);

    if (!result.success) {
      return {
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
        success: false,
      };
    }

    const data = result.data;
    const derivedSlug = data.slug
      ? slugify(data.slug, { lower: true, strict: true })
      : slugify(data.name, { lower: true, strict: true });

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

    revalidatePath('/');
    revalidatePath('/apps');
    revalidatePath(`/apps/${input.slug}`);
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

    revalidatePath('/');
    revalidatePath('/apps');
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Failed to delete app',
      success: false,
    };
  }
  redirect('/admin/apps');
}

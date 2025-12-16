'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import {
  createDashboard,
  deleteDashboard,
  updateDashboard,
  type DashboardInput,
} from '@/lib/dashboardPersistence';
import { requireAdminSession } from '@/lib/adminSession';
import { withSpan } from '@/lib/telemetry';

const optionalUrl = z
  .union([z.string().url('Invalid URL'), z.literal('')])
  .optional()
  .nullable()
  .transform((value) => value || undefined);

const dashboardSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    summary: z.string().min(1, 'Summary is required'),
    panelType: z.enum(['chart', 'logs', 'embed', 'link']),
    tags: z.string().transform((val) =>
      val
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    ),
    chartType: z.string().optional().nullable(),
    kqlQuery: z.string().optional().nullable(),
    iframeUrl: optionalUrl,
    externalUrl: optionalUrl,
    refreshIntervalSeconds: z.coerce.number().min(0).optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if ((data.panelType === 'chart' || data.panelType === 'logs') && !data.kqlQuery) {
        return false;
      }
      if (data.panelType === 'embed' && !data.iframeUrl) {
        return false;
      }
      if (data.panelType === 'link' && !data.externalUrl) {
        return false;
      }
      return true;
    },
    {
      message: 'Missing required fields for selected panel type',
      path: ['panelType'],
    },
  );

export type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
};

export async function extractDashboardInput(formData: FormData): Promise<DashboardInput> {
  await requireAdminSession();
  const raw = Object.fromEntries(formData.entries());
  const result = dashboardSchema.safeParse(raw);

  if (!result.success) {
    const errorMessages = result.error.flatten().fieldErrors;
    // Throwing here to be caught by the action handler, but ideally we'd return the errors directly
    // For now, we'll join them into a string to fit the existing error handling structure
    // or we can update the caller to handle ZodError.
    // Given the current structure, let's throw a formatted error or handle it in the action.
    throw new Error(JSON.stringify(errorMessages));
  }

  return result.data as DashboardInput;
}

export async function createDashboardAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let slug: string | undefined;
  try {
    await requireAdminSession();
    const raw = Object.fromEntries(formData.entries());
    const result = dashboardSchema.safeParse(raw);

    if (!result.success) {
      return {
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
        success: false,
      };
    }

    const input = result.data as DashboardInput;
    const createResult = await createDashboard(input);
    slug = createResult.slug;

    after(async () => {
      await withSpan('admin.dashboard.create', async (span) => {
        span.setAttributes({ 'dashboard.title': input.title, 'dashboard.slug': slug! });
      });
    });

    revalidatePath('/admin/dashboards');
    revalidatePath(`/admin/dashboards/${slug}`);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Failed to create dashboard',
      success: false,
    };
  }
  if (slug) {
    redirect(`/admin/dashboards/${slug}`);
  }
  return { message: 'Dashboard created', success: true };
}

export async function updateDashboardAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let slug: string | undefined;
  try {
    await requireAdminSession();
    slug = formData.get('slug')?.toString().trim();
    if (!slug) {
      throw new Error('Missing dashboard slug');
    }

    const raw = Object.fromEntries(formData.entries());
    const result = dashboardSchema.safeParse(raw);

    if (!result.success) {
      return {
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
        success: false,
      };
    }

    const input = result.data as DashboardInput;
    await updateDashboard(slug!, input);

    after(async () => {
      await withSpan('admin.dashboard.update', async (span) => {
        span.setAttributes({ 'dashboard.slug': slug! });
      });
    });

    revalidatePath('/admin/dashboards');
    revalidatePath(`/admin/dashboards/${slug}`);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Failed to update dashboard',
      success: false,
    };
  }
  if (slug) {
    redirect(`/admin/dashboards/${slug}`);
  }
  return { message: 'Dashboard updated', success: true };
}

export async function deleteDashboardAction(formData: FormData) {
  await requireAdminSession();
  const slug = formData.get('slug')?.toString().trim();
  if (!slug) {
    throw new Error('Missing dashboard slug');
  }
  await deleteDashboard(slug);

  after(async () => {
    await withSpan('admin.dashboard.delete', async (span) => {
      span.setAttributes({ 'dashboard.slug': slug });
    });
  });

  revalidatePath('/admin/dashboards');
  redirect('/admin/dashboards');
}

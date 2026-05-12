'use server';

import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import {
  createDashboard,
  deleteDashboard,
  updateDashboard,
} from '@/lib/dashboardPersistence';
import { requireAdminSession } from '@/lib/adminSession';
import { revalidateDashboardCache } from '@/lib/adminRevalidation';
import {
  DASHBOARD_PANEL_REQUIREMENTS,
  DASHBOARD_PANEL_TYPE_VALUES,
} from '@/lib/dashboardPanelTypes';
import { withSpan } from '@/lib/telemetry';
import { optionalUrlField, parseListField, requiredTextField } from '@/lib/adminFormSchemas';
import { parseFormData, type ActionState as SharedActionState } from '@/lib/formActions';

const dashboardSchema = z
  .object({
    title: requiredTextField('Title'),
    summary: requiredTextField('Summary'),
    panelType: z.enum(DASHBOARD_PANEL_TYPE_VALUES),
    tags: parseListField(','),
    chartType: z.string().optional().nullable(),
    kqlQuery: z.string().optional().nullable(),
    iframeUrl: optionalUrlField(),
    externalUrl: optionalUrlField(),
    refreshIntervalSeconds: z.coerce.number().min(0).optional().nullable(),
    notes: z.string().optional().nullable(),
  })
    .refine(
    (data) => {
      const requirements = DASHBOARD_PANEL_REQUIREMENTS[data.panelType];
      if (requirements.requiresKqlQuery && !data.kqlQuery) {
        return false;
      }
      if (requirements.requiresIFrameUrl && !data.iframeUrl) {
        return false;
      }
      if (requirements.requiresExternalUrl && !data.externalUrl) {
        return false;
      }
      return true;
    },
    {
      message: 'Missing required fields for selected panel type',
      path: ['panelType'],
    },
  );

export type ActionState = SharedActionState;

export async function createDashboardAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let slug: string | undefined;
  try {
    await requireAdminSession();
    const parsed = parseFormData(dashboardSchema, formData);
    if (!parsed.ok) {
      return parsed.state;
    }

    const input = parsed.data;
    const createResult = await createDashboard(input);
    slug = createResult.slug;

    after(async () => {
      await withSpan('admin.dashboard.create', async (span) => {
        span.setAttributes({ 'dashboard.title': input.title, 'dashboard.slug': slug! });
      });
    });

    revalidateDashboardCache(slug);
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

    const parsed = parseFormData(dashboardSchema, formData);
    if (!parsed.ok) {
      return parsed.state;
    }

    const input = parsed.data;
    await updateDashboard(slug!, input);

    after(async () => {
      await withSpan('admin.dashboard.update', async (span) => {
        span.setAttributes({ 'dashboard.slug': slug! });
      });
    });

    revalidateDashboardCache(slug);
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

  revalidateDashboardCache();
  redirect('/admin/dashboards');
}

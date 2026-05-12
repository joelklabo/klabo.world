'use server';

import { after } from 'next/server';
import { z } from 'zod';
import {
  createDashboard,
  deleteDashboard,
  updateDashboard,
} from '@/lib/dashboardPersistence';
import { revalidateDashboardCache } from '@/lib/adminRevalidation';
import {
  DASHBOARD_PANEL_REQUIREMENTS,
  DASHBOARD_PANEL_TYPE_VALUES,
} from '@/lib/dashboardPanelTypes';
import { withSpan } from '@/lib/telemetry';
import { optionalUrlField, parseListField, requiredTextField } from '@/lib/adminFormSchemas';
import { parseFormData, type ActionState as SharedActionState } from '@/lib/formActions';
import { getFormSlug, runAdminActionAndRedirect } from '@/lib/adminActionHelpers';

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
  return runAdminActionAndRedirect(
    async () => {
      const parsed = parseFormData(dashboardSchema, formData);
      if (!parsed.ok) {
        return parsed.state;
      }

      const input = parsed.data;
      const createResult = await createDashboard(input);
      slug = createResult.slug;

    after(async () => {
      await withSpan('admin.dashboard.create', async (span) => {
        span.setAttributes({ 'dashboard.title': input.title, 'dashboard.slug': slug });
      });
    });

      revalidateDashboardCache(slug);
      return { message: 'Dashboard created', success: true };
    },
    'Failed to create dashboard',
    () => (slug ? `/admin/dashboards/${slug}` : undefined),
  );
}

export async function updateDashboardAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let slug: string | undefined;
  return runAdminActionAndRedirect(
    async () => {
      slug = getFormSlug(formData, 'dashboard');
      const parsed = parseFormData(dashboardSchema, formData);
      if (!parsed.ok) {
        return parsed.state;
      }

      const input = parsed.data;
      await updateDashboard(slug, input);

      after(async () => {
        await withSpan('admin.dashboard.update', async (span) => {
          span.setAttributes({ 'dashboard.slug': slug });
        });
      });

      revalidateDashboardCache(slug);
      return { message: 'Dashboard updated', success: true };
    },
    'Failed to update dashboard',
    () => (slug ? `/admin/dashboards/${slug}` : undefined),
  );
}

export async function deleteDashboardAction(formData: FormData): Promise<ActionState> {
  return runAdminActionAndRedirect(async () => {
    const slug = getFormSlug(formData, 'dashboard');
    await deleteDashboard(slug);

    after(async () => {
      await withSpan('admin.dashboard.delete', async (span) => {
        span.setAttributes({ 'dashboard.slug': slug });
      });
    });

    revalidateDashboardCache();
    return { message: 'Dashboard deleted', success: true };
  }, 'Failed to delete dashboard', '/admin/dashboards');
}

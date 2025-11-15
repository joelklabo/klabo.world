'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createDashboard,
  deleteDashboard,
  updateDashboard,
  type DashboardInput,
  type DashboardType,
} from '@/lib/dashboardPersistence';
import { requireAdminSession } from '@/lib/adminSession';
import { withSpan } from '@/lib/telemetry';

const PANEL_TYPES: DashboardType[] = ['chart', 'logs', 'embed', 'link'];

function normalizePanelType(value: string | null): DashboardType {
  const fallback: DashboardType = 'chart';
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return (PANEL_TYPES.find((type) => type === normalized) ?? fallback) as DashboardType;
}

function enforcePanelRequirements(input: DashboardInput) {
  if ((input.panelType === 'chart' || input.panelType === 'logs') && !input.kqlQuery) {
    throw new Error('KQL query is required for chart/log panels.');
  }
  if (input.panelType === 'embed' && !input.iframeUrl) {
    throw new Error('Iframe URL is required for embed panels.');
  }
  if (input.panelType === 'link' && !input.externalUrl) {
    throw new Error('External URL is required for link panels.');
  }
}

function sanitizeByPanelType(input: DashboardInput): DashboardInput {
  const next: DashboardInput = { ...input };
  if (next.panelType !== 'embed') {
    next.iframeUrl = null;
  }
  if (next.panelType !== 'link') {
    next.externalUrl = null;
  }
  if (next.panelType !== 'chart' && next.panelType !== 'logs') {
    next.kqlQuery = null;
  }
  return next;
}

async function extractDashboardInput(formData: FormData): Promise<DashboardInput> {
  await requireAdminSession();
  const title = formData.get('title')?.toString().trim();
  const summary = formData.get('summary')?.toString().trim();
  const panelType = normalizePanelType(formData.get('panelType')?.toString() ?? null);
  if (!title || !summary) {
    throw new Error('Title and summary are required');
  }
  const tags = Array.from(
    new Set(
      formData
        .get('tags')
        ?.toString()
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean) ?? [],
    ),
  );
  const chartType = formData.get('chartType')?.toString().trim() || null;
  const kqlQuery = formData.get('kqlQuery')?.toString().trim() || null;
  const iframeUrl = formData.get('iframeUrl')?.toString().trim() || null;
  const externalUrl = formData.get('externalUrl')?.toString().trim() || null;
  const refreshRaw = formData.get('refreshIntervalSeconds')?.toString().trim();
  const refreshIntervalSeconds = refreshRaw ? Math.max(Number(refreshRaw) || 0, 0) : null;
  const notes = formData.get('notes')?.toString().trim() || null;
  const input: DashboardInput = {
    title,
    summary,
    panelType,
    tags,
    chartType,
    kqlQuery,
    iframeUrl,
    externalUrl,
    refreshIntervalSeconds,
    notes,
  };
  enforcePanelRequirements(input);
  return sanitizeByPanelType(input);
}

export async function createDashboardAction(formData: FormData) {
  const input = await extractDashboardInput(formData);
  const { slug } = await withSpan('admin.dashboard.create', async (span) => {
    span.setAttributes({ 'dashboard.title': input.title });
    return createDashboard(input);
  });
  revalidatePath('/admin/dashboards');
  revalidatePath(`/admin/dashboards/${slug}`);
  redirect(`/admin/dashboards/${slug}`);
}

export async function updateDashboardAction(formData: FormData) {
  const slug = formData.get('slug')?.toString().trim();
  if (!slug) {
    throw new Error('Missing dashboard slug');
  }
  const input = await extractDashboardInput(formData);
  await withSpan('admin.dashboard.update', async (span) => {
    span.setAttributes({ 'dashboard.slug': slug });
    await updateDashboard(slug, input);
  });
  revalidatePath('/admin/dashboards');
  revalidatePath(`/admin/dashboards/${slug}`);
  redirect(`/admin/dashboards/${slug}`);
}

export async function deleteDashboardAction(formData: FormData) {
  await requireAdminSession();
  const slug = formData.get('slug')?.toString().trim();
  if (!slug) {
    throw new Error('Missing dashboard slug');
  }
  await withSpan('admin.dashboard.delete', async (span) => {
    span.setAttributes({ 'dashboard.slug': slug });
    await deleteDashboard(slug);
  });
  revalidatePath('/admin/dashboards');
  redirect('/admin/dashboards');
}

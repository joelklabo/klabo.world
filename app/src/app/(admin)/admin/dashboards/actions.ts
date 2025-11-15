'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createDashboard, deleteDashboard, updateDashboard, type DashboardInput } from '@/lib/dashboardPersistence';
import { requireAdminSession } from '@/lib/adminSession';
import { withSpan } from '@/lib/telemetry';

async function extractDashboardInput(formData: FormData): Promise<DashboardInput> {
  await requireAdminSession();
  const title = formData.get('title')?.toString().trim();
  const summary = formData.get('summary')?.toString().trim();
  const panelType = formData.get('panelType')?.toString().trim() ?? 'chart';
  if (!title || !summary) {
    throw new Error('Title and summary are required');
  }
  const tags =
    formData
      .get('tags')
      ?.toString()
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean) ?? [];
  const chartType = formData.get('chartType')?.toString().trim() || null;
  const kqlQuery = formData.get('kqlQuery')?.toString().trim() || null;
  const iframeUrl = formData.get('iframeUrl')?.toString().trim() || null;
  const externalUrl = formData.get('externalUrl')?.toString().trim() || null;
  const refreshRaw = formData.get('refreshIntervalSeconds')?.toString().trim();
  const refreshIntervalSeconds = refreshRaw ? Number(refreshRaw) || null : null;
  const notes = formData.get('notes')?.toString() ?? null;
  return {
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

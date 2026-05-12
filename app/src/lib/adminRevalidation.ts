import { revalidatePath } from 'next/cache';

export function revalidatePostCache(slug?: string, includeAdmin = false) {
  revalidatePath('/');
  revalidatePath('/posts');
  if (slug) {
    revalidatePath(`/posts/${slug}`);
  }
  if (includeAdmin) {
    revalidatePath('/admin');
  }
}

export function revalidateAppCache(slug?: string) {
  revalidatePath('/');
  revalidatePath('/apps');
  if (slug) {
    revalidatePath(`/apps/${slug}`);
  }
}

export function revalidateDashboardCache(slug?: string) {
  revalidatePath('/admin/dashboards');
  if (slug) {
    revalidatePath(`/admin/dashboards/${slug}`);
  }
}

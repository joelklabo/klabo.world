import { revalidatePath } from 'next/cache';

function revalidateCollection(basePath: string, slug?: string, includeRoot = false) {
  if (includeRoot) {
    revalidatePath('/');
  }
  revalidatePath(basePath);
  if (slug) {
    revalidatePath(`${basePath}/${slug}`);
  }
}

export function revalidatePostCache(slug?: string, includeAdmin = false) {
  revalidateCollection('/posts', slug, true);
  if (includeAdmin) {
    revalidatePath('/admin');
  }
}

export function revalidateAppCache(slug?: string) {
  revalidateCollection('/apps', slug, true);
}

export function revalidateDashboardCache(slug?: string) {
  revalidateCollection('/admin/dashboards', slug);
}

import { requireAdminSession } from '@/lib/adminSession';
import { notFound } from 'next/navigation';

type SlugParams = { slug: string } | Promise<{ slug: string }>;

export async function runAdminPage<T>(render: () => Promise<T>): Promise<T> {
  await requireAdminSession();
  return render();
}

export async function runAdminMetadata<T>(render: () => Promise<T>): Promise<T> {
  await requireAdminSession();
  return render();
}

export async function runAdminSlugPage<TResource, TOutput>(
  params: SlugParams,
  loadResource: (slug: string) => Promise<TResource | null | undefined>,
  render: (resource: TResource) => Promise<TOutput> | TOutput,
): Promise<TOutput> {
  return runAdminPage(async () => {
    const { slug } = await params;
    const resource = await loadResource(slug);
    if (!resource) {
      notFound();
    }
    return render(resource);
  });
}

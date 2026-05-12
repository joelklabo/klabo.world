import { notFound } from 'next/navigation';
import { runWithAdminSession } from '@/lib/adminGuards';

type SlugParams = { slug: string } | Promise<{ slug: string }>;

type SlugResourceResult<TResource> = TResource | Promise<TResource | null | undefined>;

type SlugMissingRenderer<TOutput> = () => Promise<TOutput> | TOutput;

async function runAdminSlugResource<TResource, TOutput>(
  params: SlugParams,
  loadResource: (slug: string) => SlugResourceResult<TResource>,
  render: (resource: TResource) => Promise<TOutput> | TOutput,
  renderMissing?: SlugMissingRenderer<TOutput>,
): Promise<TOutput> {
  return runAdminPage(async () => {
    const { slug } = await params;
    const resource = await loadResource(slug);

    if (!resource) {
      if (renderMissing) {
        return renderMissing();
      }
      notFound();
    }

    return render(resource);
  });
}

export async function runAdminPage<T>(render: () => Promise<T>): Promise<T> {
  return runWithAdminSession(
    () => render(),
    (error) => {
      throw error;
    },
  );
}

export async function runAdminSlugPage<TResource, TOutput>(
  params: SlugParams,
  loadResource: (slug: string) => SlugResourceResult<TResource>,
  render: (resource: TResource) => Promise<TOutput> | TOutput,
): Promise<TOutput> {
  return runAdminSlugResource(params, loadResource, render);
}

export async function runAdminSlugMetadata<TResource, TOutput>(
  params: SlugParams,
  loadResource: (slug: string) => SlugResourceResult<TResource>,
  render: (resource: TResource) => Promise<TOutput> | TOutput,
  renderMissing: () => Promise<TOutput> | TOutput,
): Promise<TOutput> {
  return runAdminSlugResource(params, loadResource, render, renderMissing);
}

type SlugParams = { slug: string } | Promise<{ slug: string }>;

export async function runPublicSlugPage<TResource, TOutput>(
  params: SlugParams,
  loadResource: (slug: string) => TResource | Promise<TResource | null | undefined>,
  render: (resource: TResource, requestedSlug: string) => Promise<TOutput> | TOutput,
  renderMissing: () => Promise<TOutput> | TOutput,
): Promise<TOutput> {
  const { slug } = await params;
  const resource = await loadResource(slug);
  if (!resource) {
    return renderMissing();
  }
  return render(resource, slug);
}

export async function runPublicSlugMetadata<TResource, TOutput>(
  params: SlugParams,
  loadResource: (slug: string) => TResource | Promise<TResource | null | undefined>,
  render: (resource: TResource, requestedSlug: string) => Promise<TOutput> | TOutput,
  renderMissing: () => Promise<TOutput> | TOutput,
): Promise<TOutput> {
  return runPublicSlugPage(params, loadResource, render, renderMissing);
}

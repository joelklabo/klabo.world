import { GitHubProject } from "@/lib/github-projects";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/surface";
import { ArrowUpRight, GitFork, Star } from "lucide-react";

function formatProjectDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type Props = {
  projects: GitHubProject[];
  className?: string;
  featuredTestId?: string;
  listItemTestId?: string;
};

function withAlpha(hexColor: string, alphaHex: string) {
  const normalized = hexColor.trim();
  if (!/^#[0-9a-f]{6}$/i.test(normalized)) return null;
  return `${normalized}${alphaHex}`;
}

export function GitHubProjectsShowcase({
  projects,
  className,
  featuredTestId = "home-github-featured",
  listItemTestId = "home-github-project",
}: Props) {
  if (projects.length === 0) return null;

  const featured = projects[0];
  const rest = projects.slice(1, 4);

  const featuredDescription = featured.description?.trim() || null;
  const featuredUpdatedLabel = featured.updatedAt
    ? formatProjectDate(featured.updatedAt)
    : null;
  const featuredHasStars = featured.stargazerCount > 0;
  const featuredHasForks = featured.forkCount > 0;
  const featuredAccent =
    featured.primaryLanguage?.color &&
    /^#[0-9a-f]{6}$/i.test(featured.primaryLanguage.color)
      ? featured.primaryLanguage.color
      : null;
  const featuredBackground = {
    backgroundImage: [
      `radial-gradient(680px circle at 18% 8%, ${
        withAlpha(featuredAccent ?? "#FFBF47", "3a") ??
        "color-mix(in oklch, var(--primary) 35%, transparent)"
      } 0%, transparent 56%)`,
      `radial-gradient(560px circle at 92% 18%, ${
        withAlpha("#FF7A45", "24") ??
        "color-mix(in oklch, var(--secondary) 30%, transparent)"
      } 0%, transparent 52%)`,
      "linear-gradient(180deg, rgba(6,10,20,0.05) 0%, rgba(6,10,20,0.35) 100%)",
    ].join(", "),
  } as const;

  return (
    <Surface
      className={cn(
        "rounded-3xl shadow-[0_18px_50px_rgba(6,10,20,0.4)]",
        className,
      )}
      innerClassName="overflow-hidden rounded-3xl border border-border/70 bg-card/70"
    >
      <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr] md:divide-x md:divide-border/40">
        <a
          href={featured.url}
          target="_blank"
          rel="noreferrer"
          data-testid={featuredTestId}
          data-analytics-event="ui.home.github_project"
          data-analytics-label={featured.fullName}
          data-analytics-featured="true"
          className="group relative block overflow-hidden p-6 motion-safe:transition-colors hover:bg-background/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50 md:p-7"
          aria-label={`${featured.name} - featured project on GitHub (opens in new tab)`}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-90 motion-safe:transition-opacity motion-safe:duration-200 group-hover:opacity-100"
            style={featuredBackground}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,191,71,0.08)_0%,transparent_46%,rgba(255,122,69,0.07)_100%)] opacity-70" aria-hidden="true" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-border/50 bg-background/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Featured
                </span>
                {featured.isArchived ? (
                  <span className="rounded-full border border-border/50 bg-background/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    Archived
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                <span className="hidden sm:inline">{featured.fullName}</span>
                <ArrowUpRight className="size-4 text-muted-foreground motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold tracking-tight text-foreground text-balance sm:text-2xl">
                  {featured.name}
                </h3>
                {featuredUpdatedLabel ? (
                  <div className="shrink-0 text-right text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    <div>Updated</div>
                    <div className="mt-1 font-medium normal-case tracking-normal text-muted-foreground">
                      {featuredUpdatedLabel}
                    </div>
                  </div>
                ) : null}
              </div>
              {featuredDescription ? (
                <p className="max-w-xl text-sm text-muted-foreground line-clamp-3 sm:text-base">
                  {featuredDescription}
                </p>
              ) : (
                <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                  A recently shipped repository.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {featured.primaryLanguage ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-semibold text-foreground">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor:
                        featured.primaryLanguage.color ??
                        "var(--muted-foreground)",
                    }}
                    aria-hidden="true"
                  />
                  {featured.primaryLanguage.name}
                </span>
              ) : null}
              {featured.homepageUrl ? (
                <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground">
                  Live
                </span>
              ) : null}
              {featuredHasStars ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-semibold text-foreground">
                  <Star className="size-3.5" aria-hidden="true" />
                  {featured.stargazerCount.toLocaleString()}
                </span>
              ) : null}
              {featuredHasForks ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-semibold text-foreground">
                  <GitFork className="size-3.5" aria-hidden="true" />
                  {featured.forkCount.toLocaleString()}
                </span>
              ) : null}
            </div>
          </div>
        </a>

        <div className="divide-y divide-border/40">
          {rest.map((project) => {
            const description = project.description?.trim() || null;
            const hasStars = project.stargazerCount > 0;
            const hasForks = project.forkCount > 0;
            const updatedLabel = project.updatedAt
              ? formatProjectDate(project.updatedAt)
              : null;
            const isLive = Boolean(
              project.homepageUrl &&
                normalizeExternalUrl(project.homepageUrl) !== null,
            );

            return (
              <a
                key={project.fullName}
                href={project.url}
                target="_blank"
                rel="noreferrer"
                data-testid={listItemTestId}
                data-analytics-event="ui.home.github_project"
                data-analytics-label={project.fullName}
                className="group block px-5 py-4 motion-safe:transition-colors hover:bg-background/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                aria-label={`${project.name} on GitHub (opens in new tab)`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-foreground transition group-hover:text-primary">
                        {project.name}
                      </h4>
                      {isLive ? (
                        <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground">
                          Live
                        </span>
                      ) : null}
                    </div>

                    {description ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {description}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                      {project.primaryLanguage ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor:
                                project.primaryLanguage.color ??
                                "var(--muted-foreground)",
                            }}
                            aria-hidden="true"
                          />
                          <span className="font-medium">
                            {project.primaryLanguage.name}
                          </span>
                        </span>
                      ) : null}
                      {hasStars ? (
                        <span
                          className="font-medium"
                          aria-label={`${project.stargazerCount.toLocaleString()} GitHub stars`}
                        >
                          ★ {project.stargazerCount.toLocaleString()}
                        </span>
                      ) : null}
                      {hasForks ? (
                        <span
                          className="font-medium"
                          aria-label={`${project.forkCount.toLocaleString()} forks`}
                        >
                          ⑂ {project.forkCount.toLocaleString()}
                        </span>
                      ) : null}
                      {updatedLabel && project.updatedAt ? (
                        <time dateTime={project.updatedAt} className="hidden sm:inline">
                          Updated {updatedLabel}
                        </time>
                      ) : null}
                    </div>
                  </div>

                  <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/70 motion-safe:transition-[transform,color] motion-safe:duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-muted-foreground" aria-hidden="true" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </Surface>
  );
}

import { GitHubProject } from "@/lib/github-projects";
import { cn } from "@/lib/utils";

function formatProjectDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  projects: GitHubProject[];
  className?: string;
  featuredTestId?: string;
  listItemTestId?: string;
};

export function GitHubProjectsShowcase({
  projects,
  className,
  featuredTestId = "home-github-featured",
  listItemTestId = "home-github-project",
}: Props) {
  if (projects.length === 0) return null;

  const [featured, ...rest] = projects;
  const featuredUpdatedLabel = featured.updatedAt
    ? formatProjectDate(featured.updatedAt)
    : null;
  const list = rest.slice(0, 4);

  return (
    <div className={cn("space-y-4", className)}>
      <article className="group relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card/95 to-background/70 p-6 shadow-[0_24px_70px_rgba(6,10,20,0.5)]">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-primary/18 blur-3xl" />
          <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-secondary/14 blur-3xl" />
        </div>
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {featured.fullName}
            </p>
            <a
              href={featured.url}
              target="_blank"
              rel="noreferrer"
              data-testid={featuredTestId}
              className="mt-2 inline-flex max-w-full items-center gap-2 text-2xl font-semibold text-foreground transition group-hover:text-primary"
            >
              <span className="truncate">{featured.name}</span>
              <span className="text-base text-muted-foreground">↗</span>
            </a>
          </div>
          {featured.homepageUrl ? (
            <a
              href={featured.homepageUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            >
              Live
            </a>
          ) : null}
        </div>

        <p className="relative mt-4 text-sm text-muted-foreground line-clamp-3">
          {featured.description ?? "No description provided."}
        </p>

        <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {featured.primaryLanguage ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    featured.primaryLanguage.color ?? "var(--muted-foreground)",
                }}
                aria-hidden="true"
              />
              <span className="font-medium">{featured.primaryLanguage.name}</span>
            </span>
          ) : null}
          <span className="font-medium">
            ★ {featured.stargazerCount.toLocaleString()}
          </span>
          {featuredUpdatedLabel ? (
            <span>Updated {featuredUpdatedLabel}</span>
          ) : null}
        </div>

        {featured.topics.length ? (
          <div className="relative mt-5 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            {featured.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-foreground"
              >
                {topic}
              </span>
            ))}
          </div>
        ) : null}
      </article>

      {list.length ? (
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-[0_18px_50px_rgba(6,10,20,0.4)]">
          <div className="divide-y divide-border/40">
            {list.map((project) => {
              const updatedLabel = project.updatedAt
                ? formatProjectDate(project.updatedAt)
                : null;
              return (
                <a
                  key={project.fullName}
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  data-testid={listItemTestId}
                  className="group block px-5 py-4 transition hover:bg-background/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                        {project.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {project.description ?? "No description provided."}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                      <div>★ {project.stargazerCount.toLocaleString()}</div>
                      {updatedLabel ? (
                        <div className="mt-1 font-medium normal-case tracking-normal text-muted-foreground">
                          {updatedLabel}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}


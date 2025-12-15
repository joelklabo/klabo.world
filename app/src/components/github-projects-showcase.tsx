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

export function GitHubProjectsShowcase({
  projects,
  className,
  featuredTestId = "home-github-featured",
  listItemTestId = "home-github-project",
}: Props) {
  if (projects.length === 0) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-[0_18px_50px_rgba(6,10,20,0.4)]",
        className,
      )}
    >
      <div className="divide-y divide-border/40">
        {projects.slice(0, 4).map((project, index) => {
          const updatedLabel = project.updatedAt
            ? formatProjectDate(project.updatedAt)
            : null;
          const description = project.description?.trim() || null;
          const liveUrl = project.homepageUrl
            ? normalizeExternalUrl(project.homepageUrl)
            : null;
          const hasStars = project.stargazerCount > 0;
          const isFeatured = index === 0;

          return (
            <div
              key={project.fullName}
              className={cn(
                "group px-5 py-4 transition hover:bg-background/40",
                isFeatured ? "bg-background/10" : "",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  {isFeatured ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                      {project.fullName}
                    </p>
                  ) : null}
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    data-testid={isFeatured ? featuredTestId : listItemTestId}
                    className={cn(
                      "block truncate font-semibold text-foreground transition group-hover:text-primary",
                      isFeatured ? "text-base" : "text-sm",
                    )}
                  >
                    {project.name}
                  </a>

                  {description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {description}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    {project.primaryLanguage ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
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
                    {liveUrl ? (
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground transition hover:border-primary/40 hover:bg-primary/15"
                      >
                        Live
                      </a>
                    ) : null}
                    {hasStars ? (
                      <span className="font-medium">
                        ★ {project.stargazerCount.toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </div>

                {isFeatured && updatedLabel ? (
                  <div className="shrink-0 text-right text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    <div>Updated</div>
                    <div className="mt-1 font-medium normal-case tracking-normal text-muted-foreground">
                      {updatedLabel}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

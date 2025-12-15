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
                <div className="min-w-0">
                  {isFeatured ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                      {project.fullName}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                      data-testid={isFeatured ? featuredTestId : listItemTestId}
                      className={cn(
                        "truncate font-semibold text-foreground transition group-hover:text-primary",
                        isFeatured ? "text-base" : "text-sm",
                      )}
                    >
                      {project.name}
                    </a>
                    <span className="text-sm text-muted-foreground">↗</span>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {project.description ?? "No description provided."}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
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
                    {project.homepageUrl ? (
                      <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground">
                        Live
                      </span>
                    ) : null}
                  </div>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

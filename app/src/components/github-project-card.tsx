import { GitHubProject } from "@/lib/github-projects";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/surface";

function formatProjectDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type GitHubProjectCardProps = {
  project: GitHubProject;
  showTopics?: boolean;
  topicLimit?: number;
  className?: string;
  testId?: string;
};

export function GitHubProjectCard({
  project,
  showTopics = false,
  topicLimit = 3,
  className,
  testId,
}: GitHubProjectCardProps) {
  const updatedLabel = project.updatedAt ? formatProjectDate(project.updatedAt) : null;
  const topics = showTopics ? project.topics.slice(0, topicLimit) : [];
  const description = project.description?.trim() || null;
  const hasStars = project.stargazerCount > 0;

  return (
    <Surface
      className={cn(
        "group h-full rounded-2xl shadow-[0_18px_45px_rgba(6,10,20,0.45)] card-hover-lift",
        className,
      )}
      innerClassName="rounded-2xl border border-border/60 bg-card/80 transition group-hover:border-primary/40 group-hover:bg-card"
    >
      <a
        href={project.url}
        target="_blank"
        rel="noreferrer"
        data-testid={testId}
        className="block h-full p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {project.fullName}
            </p>
            <h3 className="mt-2 truncate text-xl font-semibold text-foreground group-hover:text-primary">
              {project.name}
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            GitHub
          </span>
        </div>

        {description ? (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{description}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {project.primaryLanguage ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: project.primaryLanguage.color ?? "var(--muted-foreground)",
                }}
                aria-hidden="true"
              />
              <span className="font-medium">{project.primaryLanguage.name}</span>
            </span>
          ) : null}
          {hasStars ? (
            <span className="font-medium">★ {project.stargazerCount.toLocaleString()}</span>
          ) : null}
          {updatedLabel ? <span>Updated {updatedLabel}</span> : null}
        </div>

        {topics.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            {topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-foreground"
              >
                {topic}
              </span>
            ))}
          </div>
        ) : null}
      </a>
    </Surface>
  );
}

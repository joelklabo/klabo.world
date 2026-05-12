import { GitHubProject } from "@/lib/github-projects";
import { formatProjectDate } from "@/lib/github-projects-display";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/surface";

const starFormatter = new Intl.NumberFormat("en-US");

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
  const updatedLabel = project.updatedAt
    ? formatProjectDate(project.updatedAt, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : null;
  const topics = showTopics ? project.topics.slice(0, topicLimit) : [];
  const description = project.description?.trim() || null;
  const hasStars = project.stargazerCount > 0;
  const starsLabel = hasStars ? starFormatter.format(project.stargazerCount) : null;

  return (
    <Surface
      className={cn(
        "group h-full rounded-2xl shadow-[0_18px_45px_rgba(6,10,20,0.45)] card-hover-lift",
        className,
      )}
      innerClassName="rounded-2xl border border-border/50 bg-card/80 motion-safe:transition-[border-color,background-color,box-shadow] motion-safe:duration-200 group-hover:border-primary/60 group-hover:bg-card group-hover:shadow-[inset_0_0_20px_rgba(184,136,54,0.08)]"
    >
      <a
        href={project.url}
        target="_blank"
        rel="noreferrer"
        data-testid={testId}
        className="block h-full p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-2xl"
        aria-label={`${project.name} on GitHub (opens in new tab)`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <span className="sm:hidden">Repository</span>
              <span className="hidden break-words sm:block">{project.fullName}</span>
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-tight text-foreground text-balance group-hover:text-primary">
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
            <span className="inline-flex items-center gap-2.5">
              <span
                className="relative h-2.5 w-2.5 rounded-full shadow-lg shadow-current/20 motion-safe:transition-transform motion-safe:duration-200 group-hover:scale-125"
                style={{
                  backgroundColor: project.primaryLanguage.color ?? "var(--muted-foreground)",
                }}
                aria-hidden="true"
              />
              <span className="font-medium text-foreground group-hover:text-primary/90 transition-colors">{project.primaryLanguage.name}</span>
            </span>
          ) : null}
          {starsLabel ? <span className="font-medium tabular-nums" aria-label={`${starsLabel} GitHub stars`}>★ {starsLabel}</span> : null}
          {updatedLabel && project.updatedAt ? <time dateTime={project.updatedAt}>Updated {updatedLabel}</time> : null}
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

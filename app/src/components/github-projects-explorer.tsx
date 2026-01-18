"use client";

import { useMemo, useState } from "react";
import { GitHubProject } from "@/lib/github-projects";
import { cn } from "@/lib/utils";
import { GitHubProjectCard } from "@/components/github-project-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey = "updated" | "stars";

type Props = {
  projects: GitHubProject[];
  className?: string;
  cardTestId?: string;
};

function getProjectTime(project: GitHubProject) {
  const value = project.updatedAt ?? project.pushedAt;
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return date.getTime();
}

function getTopLanguages(projects: GitHubProject[], limit = 6) {
  const counts = new Map<string, number>();
  for (const project of projects) {
    const lang = project.primaryLanguage?.name?.trim();
    if (!lang) continue;
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([lang]) => lang);
}

export function GitHubProjectsExplorer({ projects, className, cardTestId }: Props) {
  const [language, setLanguage] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");

  const languages = useMemo(() => getTopLanguages(projects), [projects]);

  const visibleProjects = useMemo(() => {
    const filtered =
      language === "all"
        ? projects
        : projects.filter((project) => project.primaryLanguage?.name === language);

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "stars") {
        const starsDelta = (b.stargazerCount ?? 0) - (a.stargazerCount ?? 0);
        if (starsDelta !== 0) return starsDelta;
      }
      return getProjectTime(b) - getProjectTime(a);
    });

    return sorted;
  }, [language, projects, sortKey]);

  const animationKey = `${language}:${sortKey}`;

  return (
    <div className={cn("space-y-4", className)} data-testid="projects-explorer">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="projects-filter-languages"
          role="group"
          aria-label="Filter by programming language"
        >
          <button
            type="button"
            onClick={() => setLanguage("all")}
            aria-pressed={language === "all"}
            data-testid="projects-filter-all"
            className={cn(
              "min-h-9 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] motion-safe:transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              language === "all"
                ? "border-primary/35 bg-primary/10 text-foreground shadow-[0_12px_30px_rgba(255,191,71,0.10)]"
                : "border-border/55 bg-card/60 text-muted-foreground hover:border-primary/35 hover:bg-background/30 hover:text-foreground",
            )}
          >
            All
          </button>

          {languages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              aria-pressed={language === lang}
              data-testid="projects-filter-language"
              className={cn(
                "min-h-9 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] motion-safe:transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                language === lang
                  ? "border-primary/35 bg-primary/10 text-foreground shadow-[0_12px_30px_rgba(255,191,71,0.10)]"
                  : "border-border/55 bg-card/60 text-muted-foreground hover:border-primary/35 hover:bg-background/30 hover:text-foreground",
              )}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Sort
          </span>
          <Select
            value={sortKey}
            onValueChange={(value) => setSortKey(value as SortKey)}
            name="projects-sort"
          >
            <SelectTrigger size="sm" data-testid="projects-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="updated">Recently updated</SelectItem>
              <SelectItem value="stars">Most starred</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {visibleProjects.length > 0 ? (
        <div
          key={animationKey}
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
          data-testid="projects-grid"
        >
          {visibleProjects.map((project, index) => (
            <div
              key={`${animationKey}:${project.fullName}`}
              className="motion-fade-up"
              style={
                {
                  animationDelay: `${Math.min(index * 45, 180)}ms`,
                } as React.CSSProperties
              }
            >
              <GitHubProjectCard
                project={project}
                showTopics={false}
                testId={cardTestId}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl border border-border/60 bg-card/80 p-6 text-sm text-muted-foreground"
          data-testid="projects-empty"
        >
          No projects match this filter yet.
        </div>
      )}
    </div>
  );
}

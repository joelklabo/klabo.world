import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
import {
  getPinnedGitHubProjects,
  getRecentGitHubProjects,
  getFeaturedGitHubProjects,
} from "@/lib/github-projects";
import { GitHubProjectCard } from "@/components/github-project-card";
import { GitHubProjectsExplorer } from "@/components/github-projects-explorer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Projects",
  description: "Recent GitHub projects and experiments by klabo.world.",
};

export const revalidate = 3600;

export default async function ProjectsPage() {
  const [pinned, initialRecent] = await Promise.all([
    getPinnedGitHubProjects(env.GITHUB_OWNER, 6).catch(() => []),
    getRecentGitHubProjects(env.GITHUB_OWNER, 18).catch(() => []),
  ]);

  let recent = initialRecent;
  if (pinned.length === 0 && recent.length === 0) {
    recent = await getFeaturedGitHubProjects(env.GITHUB_OWNER, 18);
  }

  const hasPinned = pinned.length > 0;
  const recentWithoutPinned = recent.filter(
    (repo) => !pinned.some((p) => p.fullName === repo.fullName),
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-secondary/18 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-10 px-6 py-16">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              Projects
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              GitHub projects
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              A curated view of my recent work—repos, experiments, and
              production-grade utilities.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="soft" size="sm">
              <Link href="/posts">Writing</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href={`https://github.com/${env.GITHUB_OWNER}`}
                target="_blank"
                rel="noreferrer"
                data-testid="projects-github-profile"
              >
                GitHub profile
              </a>
            </Button>
          </div>
        </header>

        {hasPinned ? (
          <section className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Featured
              </h2>
              <p className="text-sm text-muted-foreground">
                Pinned repos—hand-picked for the best overview.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {pinned.map((project) => (
                <GitHubProjectCard
                  key={project.fullName}
                  project={project}
                  showTopics
                  testId="projects-featured-project"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Recent</h2>
            <p className="text-sm text-muted-foreground">
              Recently updated public repositories.
            </p>
          </div>
          {recentWithoutPinned.length > 0 ? (
            <GitHubProjectsExplorer
              projects={recentWithoutPinned}
              cardTestId="projects-recent-project"
            />
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
              GitHub projects are temporarily unavailable. Visit{" "}
              <a
                className="font-semibold text-primary hover:text-primary/80"
                href={`https://github.com/${env.GITHUB_OWNER}`}
                target="_blank"
                rel="noreferrer"
              >
                github.com/{env.GITHUB_OWNER}
              </a>{" "}
              to browse repos directly.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

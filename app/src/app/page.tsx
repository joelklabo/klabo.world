import Link from "next/link";
import type { Route } from "next";
import { env } from "@/lib/env";
import { getRecentPosts } from "@/lib/posts";
import { getFeaturedGitHubProjects } from "@/lib/github-projects";
import { GitHubProjectCard } from "@/components/github-project-card";
import { Button } from "@/components/ui/button";

export const revalidate = 60 * 60;

export default async function Home() {
  const recentPosts = getRecentPosts(3);
  const projects = await getFeaturedGitHubProjects(env.GITHUB_OWNER, 6);

  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/50 py-16">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -left-24 -top-16 h-72 w-72 rounded-full bg-primary/18 blur-3xl" />
          <div className="absolute right-0 top-8 h-80 w-80 rounded-full bg-secondary/12 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              Bitcoin · Lightning · Nostr · Agentic engineering
            </p>
            <h1
              className="text-4xl font-bold tracking-tight text-foreground md:text-5xl"
              data-testid="home-hero-title"
            >
              Notes, playbooks, and projects for shipping on decentralized
              rails.
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Practical writing and small tools—built so future me (and you) can
              move faster with fewer regressions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/posts" data-testid="home-cta-writing">
                  Read the writing
                </Link>
              </Button>
              <Button asChild variant="soft" size="lg">
                <Link href="/projects" data-testid="home-cta-projects">
                  Explore projects
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-6xl space-y-8 px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Writing
              </p>
              <h2 className="text-3xl font-bold text-foreground">
                Recent articles
              </h2>
              <p className="text-sm text-muted-foreground">
                Deep dives, implementation notes, and small dispatches.
              </p>
            </div>
            <Button asChild variant="link" size="sm" className="px-0">
              <Link href="/posts" data-testid="home-writing-all">
                View all →
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {recentPosts.map((post) => (
              <article
                key={post._id}
                className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-[0_20px_50px_rgba(6,10,20,0.35)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
              >
                <time className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  {new Date(post.publishDate ?? post.date).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric", year: "numeric" },
                  )}
                </time>
                <h3 className="mt-3 text-xl font-semibold leading-snug text-foreground">
                  <Link
                    href={`/posts/${post.slug}` as Route}
                    className="hover:text-primary"
                    data-testid="home-writing-post"
                  >
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {post.summary}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 py-14">
        <div className="mx-auto max-w-6xl space-y-8 px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Projects
              </p>
              <h2 className="text-3xl font-bold text-foreground">
                Recent GitHub work
              </h2>
              <p className="text-sm text-muted-foreground">
                A small selection of repos I&apos;ve touched recently.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="soft" size="sm">
                <Link href="/apps" data-testid="home-projects-apps">
                  Apps
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a
                  href={`https://github.com/${env.GITHUB_OWNER}`}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="home-projects-github"
                >
                  GitHub profile
                </a>
              </Button>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {projects.map((project) => (
                <GitHubProjectCard
                  key={project.fullName}
                  project={project}
                  testId="home-github-project"
                />
              ))}
            </div>
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
              to browse recent work.
            </div>
          )}

          <div>
            <Button asChild variant="link" size="sm" className="px-0">
              <Link href="/projects" data-testid="home-projects-all">
                View all projects →
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}


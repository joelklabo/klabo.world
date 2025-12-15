import Link from "next/link";
import type { Route } from "next";
import { env } from "@/lib/env";
import { getRecentPosts } from "@/lib/posts";
import { getFeaturedGitHubProjects } from "@/lib/github-projects";
import { GitHubProjectsShowcase } from "@/components/github-projects-showcase";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export default async function Home() {
  const recentPosts = getRecentPosts(2);
  const projects = await getFeaturedGitHubProjects(env.GITHUB_OWNER, 5);

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
        <div className="mx-auto max-w-6xl space-y-10 px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <section className="space-y-6" data-testid="home-section-writing">
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                    Writing
                  </p>
                  <h2 className="text-3xl font-bold text-foreground">
                    Latest posts
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

              <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-[0_18px_50px_rgba(6,10,20,0.4)]">
                <div className="divide-y divide-border/40">
                  {recentPosts.map((post) => (
                    <Link
                      key={post._id}
                      href={`/posts/${post.slug}` as Route}
                      data-testid="home-writing-post"
                      className="group block px-5 py-4 transition hover:bg-background/40"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="min-w-0 truncate text-base font-semibold text-foreground transition group-hover:text-primary">
                          {post.title}
                        </h3>
                        <time className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                          {new Date(post.publishDate ?? post.date).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </time>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {post.summary}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-6" data-testid="home-section-projects">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                    Projects
                  </p>
                  <h2 className="text-3xl font-bold text-foreground">
                    Recent GitHub work
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    A small selection of repos I&apos;ve shipped recently.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild variant="soft" size="sm">
                    <Link href="/projects" data-testid="home-projects-all">
                      View all →
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`https://github.com/${env.GITHUB_OWNER}`}
                      target="_blank"
                      rel="noreferrer"
                      data-testid="home-projects-github"
                    >
                      GitHub
                    </a>
                  </Button>
                </div>
              </div>

              {projects.length > 0 ? (
                <GitHubProjectsShowcase projects={projects} />
              ) : (
                <div className="rounded-3xl border border-border/70 bg-card/70 p-6 text-sm text-muted-foreground shadow-[0_18px_50px_rgba(6,10,20,0.4)]">
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
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

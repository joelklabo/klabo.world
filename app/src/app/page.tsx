import Link from "next/link";
import type { Route } from "next";
import { getPublicGitHubOwner } from "@/lib/public-env";
import { getApps } from "@/lib/apps";
import { getDashboards } from "@/lib/dashboards";
import { getFeaturedGitHubProjects } from "@/lib/github-projects";
import { getPosts, getRecentPosts } from "@/lib/posts";
import { getPostTagCloud } from "@/lib/tagCloud";
import { GitHubProjectsShowcase } from "@/components/github-projects-showcase";
import { HomeQuickLinks } from "@/components/home-quick-links";
import { HomeStats } from "@/components/home-stats";
import { HomeTopics } from "@/components/home-topics";
import { HomeLightningSection } from "@/components/lightning";
import { Button } from "@/components/ui/button";
import { ViewTransitionLink } from "@/components/view-transition-link";

export const revalidate = 3600;

export default async function Home() {
  const recentPosts = getRecentPosts(2);
  const githubOwner = getPublicGitHubOwner();
  const projects = await getFeaturedGitHubProjects(githubOwner, 4);
  const postCount = getPosts().length;
  const appCount = getApps().length;
  const dashboardCount = getDashboards().length;
  const topics = getPostTagCloud(6);
  const hasTopics = topics.length > 0;

  const stats = [
    {
      label: "Posts",
      value: postCount,
      helper: "Notes",
      href: "/posts",
      analyticsEvent: "ui.home.stat_click",
      analyticsLabel: "posts",
    },
    {
      label: "Apps",
      value: appCount,
      helper: "Experiments",
      href: "/apps",
      analyticsEvent: "ui.home.stat_click",
      analyticsLabel: "apps",
    },
    {
      label: "Dashboards",
      value: dashboardCount,
      helper: "Signals",
      href: "/dashboards",
      analyticsEvent: "ui.home.stat_click",
      analyticsLabel: "dashboards",
    },
    {
      label: "Repos",
      value: projects.length,
      helper: "Featured",
      href: "/projects",
      analyticsEvent: "ui.home.stat_click",
      analyticsLabel: "projects",
    },
  ];

  const quickLinks = [
    {
      label: "Writing",
      helper: "All posts",
      href: "/posts",
      analyticsEvent: "ui.home.quick_link",
      analyticsLabel: "writing",
    },
    {
      label: "Projects",
      helper: "GitHub work",
      href: "/projects",
      analyticsEvent: "ui.home.quick_link",
      analyticsLabel: "projects",
    },
    {
      label: "Apps",
      helper: "Experiments",
      href: "/apps",
      analyticsEvent: "ui.home.quick_link",
      analyticsLabel: "apps",
    },
    {
      label: "Dashboards",
      helper: "Signals",
      href: "/dashboards",
      analyticsEvent: "ui.home.quick_link",
      analyticsLabel: "dashboards",
    },
    {
      label: "Search",
      helper: "Find posts",
      href: "/search",
      analyticsEvent: "ui.home.quick_link",
      analyticsLabel: "search",
    },
  ];

  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-x-hidden py-16 sm:py-20">
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6">
          <div className="max-w-3xl space-y-5">
            <h1
              className="text-4xl font-bold tracking-tight text-foreground text-balance md:text-5xl"
              data-testid="home-hero-title"
            >
              Notes, playbooks, and projects for shipping software.
            </h1>
            <p className="text-base text-muted-foreground text-pretty md:text-lg">
              Practical notes and small tools for Bitcoin, Lightning, and agentic
              engineering.
            </p>
            <ul className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground" role="list" aria-label="Main topics">
              {["Bitcoin", "Lightning", "Agentic systems"].map((topic) => (
                <li key={topic}>
                  <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-foreground">
                    {topic}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link
                  href="/posts"
                  data-testid="home-cta-writing"
                  data-analytics-event="ui.home.cta"
                  data-analytics-label="writing"
                >
                  Read the writing
                </Link>
              </Button>
              <Button
                asChild
                variant="link"
                size="lg"
                className="px-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground hover:text-primary"
              >
                <Link
                  href="/projects"
                  data-testid="home-cta-projects"
                  data-analytics-event="ui.home.cta"
                  data-analytics-label="projects"
                >
                  Explore projects →
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-12 sm:pb-16">
        <div className="mx-auto max-w-6xl space-y-8 px-6" data-testid="home-section-overview">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-foreground">At a glance</h2>
            <p className="text-sm text-muted-foreground">Counts + shortcuts.</p>
          </div>

          <HomeStats stats={stats} itemTestId="home-stat-item" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Quick links
              </h3>
              <HomeQuickLinks links={quickLinks} itemTestId="home-quick-link" />
            </div>
            {hasTopics ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Topics
                </h3>
                <HomeTopics
                  topics={topics.map((topic) => ({
                    tag: topic.tag,
                    count: topic.count,
                  }))}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <HomeLightningSection />

      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <section className="space-y-5" data-testid="home-section-writing">
              <div className="flex items-baseline justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-foreground">
                    Latest writing
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Deep dives, distilled.
                  </p>
                </div>
                <Button
                  asChild
                  variant="link"
                  size="sm"
                  className="px-0 text-xs font-semibold uppercase tracking-[0.28em]"
                >
                  <Link
                    href="/posts"
                    data-testid="home-writing-all"
                    data-analytics-event="ui.home.section_link"
                    data-analytics-label="all_posts"
                  >
                    All posts →
                  </Link>
                </Button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-[0_18px_50px_rgba(6,10,20,0.4)]">
                <div className="divide-y divide-border/40">
                  {recentPosts.map((post) => (
                    <ViewTransitionLink
                      key={post._id}
                      href={`/posts/${post.slug}` as Route}
                      data-testid="home-writing-post"
                      data-analytics-event="ui.home.latest_post"
                      data-analytics-label={post.slug}
                      className="group block px-5 py-4 motion-safe:transition-colors hover:bg-background/15"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="min-w-0 truncate text-base font-semibold text-foreground motion-safe:transition-colors group-hover:text-primary">
                          {post.title}
                        </h3>
                        <time dateTime={new Date(post.publishDate ?? post.date).toISOString()} className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                          {new Date(post.publishDate ?? post.date).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </time>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {post.summary}
                      </p>
                    </ViewTransitionLink>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-5" data-testid="home-section-projects">
              <div className="flex items-baseline justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-foreground">
                    Recent GitHub work
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Recently shipped repos.
                  </p>
                </div>
                <Button
                  asChild
                  variant="link"
                  size="sm"
                  className="px-0 text-xs font-semibold uppercase tracking-[0.28em]"
                >
                  <Link
                    href="/projects"
                    data-testid="home-projects-all"
                    data-analytics-event="ui.home.section_link"
                    data-analytics-label="all_projects"
                  >
                    All projects →
                  </Link>
                </Button>
              </div>

              {projects.length > 0 ? (
                <GitHubProjectsShowcase projects={projects} />
              ) : (
                <div className="rounded-3xl border border-border/70 bg-card/70 p-6 text-sm text-muted-foreground shadow-[0_18px_50px_rgba(6,10,20,0.4)]">
                  GitHub projects are temporarily unavailable. Visit{" "}
                  <a
                    className="font-semibold text-primary hover:text-primary/80 motion-safe:transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    href={`https://github.com/${githubOwner}`}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="home-projects-github"
                  >
                    github.com/{githubOwner}
                    <span className="sr-only"> (opens in new tab)</span>
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

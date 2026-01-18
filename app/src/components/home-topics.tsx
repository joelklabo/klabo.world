import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";

const countFormatter = new Intl.NumberFormat("en-US");

type HomeTopic = {
  tag: string;
  count?: number;
  href?: string;
  testId?: string;
  analyticsEvent?: string;
  analyticsLabel?: string;
};

type HomeTopicsProps = {
  topics: HomeTopic[];
  className?: string;
  sectionTestId?: string;
  itemTestId?: string;
};

export function HomeTopics({
  topics,
  className,
  sectionTestId = "home-section-topics",
  itemTestId = "home-topic-chip",
}: HomeTopicsProps) {
  if (topics.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-3", className)} data-testid={sectionTestId} role="list" aria-label="Topics">
      {topics.map((topic) => {
        const href = topic.href ?? `/posts/tag/${encodeURIComponent(topic.tag)}`;
        const countLabel =
          typeof topic.count === "number"
            ? countFormatter.format(topic.count)
            : null;

        return (
          <li key={`${topic.tag}-${href}`}>
            <Link
              href={href as Route}
              data-testid={topic.testId ?? itemTestId}
              data-analytics-event={topic.analyticsEvent ?? "ui.home.topic"}
              data-analytics-label={topic.analyticsLabel ?? topic.tag}
              className="group inline-flex max-w-full min-h-11 items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground motion-safe:transition-[transform,border-color,background-color] hover:border-primary/60 hover:bg-primary/15 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_12px_28px_rgba(6,10,20,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <span className="max-w-[10rem] truncate">{topic.tag}</span>
              {countLabel ? (
                <span className="text-[10px] font-medium normal-case tracking-normal text-muted-foreground" aria-label={`${countLabel} posts`}>
                  ({countLabel})
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

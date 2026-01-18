import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/surface";

const numberFormatter = new Intl.NumberFormat("en-US");

function formatValue(value: number | string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return numberFormatter.format(value);
  }
  return value;
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

type HomeStat = {
  label: string;
  value: number | string;
  helper?: string;
  href?: string;
  testId?: string;
  analyticsEvent?: string;
  analyticsLabel?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
};

type HomeStatsProps = {
  stats: HomeStat[];
  className?: string;
  itemTestId?: string;
};

export function HomeStats({ stats, className, itemTestId = "home-stat-item" }: HomeStatsProps) {
  if (stats.length === 0) return null;

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((stat) => {
        const formattedValue = formatValue(stat.value);
        const content = (
          <div className="flex h-full flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {stat.label}
            </p>
            <div className="text-2xl font-semibold text-foreground tabular-nums sm:text-3xl">
              {formattedValue}
            </div>
            {stat.helper ? (
              <p className="text-xs text-muted-foreground">{stat.helper}</p>
            ) : null}
          </div>
        );

        const inner = stat.href ? (
          isExternal(stat.href) ? (
            <a
              href={stat.href}
              target={stat.target ?? "_blank"}
              rel={stat.rel ?? "noreferrer"}
              data-testid={stat.testId ?? itemTestId}
              data-analytics-event={stat.analyticsEvent}
              data-analytics-label={stat.analyticsLabel}
              className="block h-full"
            >
              {content}
            </a>
          ) : (
            <Link
              href={stat.href as Route}
              data-testid={stat.testId ?? itemTestId}
              data-analytics-event={stat.analyticsEvent}
              data-analytics-label={stat.analyticsLabel}
              className="block h-full"
            >
              {content}
            </Link>
          )
        ) : (
          <div data-testid={stat.testId ?? itemTestId}>{content}</div>
        );

        return (
          <Surface
            key={`${stat.label}-${stat.href ?? "static"}`}
            className="rounded-2xl shadow-[0_18px_45px_rgba(6,10,20,0.35)]"
            innerClassName="h-full rounded-2xl border border-border/60 bg-card/70 p-5 transition-colors hover:border-primary/40"
          >
            {inner}
          </Surface>
        );
      })}
    </div>
  );
}

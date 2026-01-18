import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/surface";

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

type HomeQuickLink = {
  label: string;
  href: string;
  helper?: string;
  testId?: string;
  analyticsEvent?: string;
  analyticsLabel?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
};

type HomeQuickLinksProps = {
  links: HomeQuickLink[];
  className?: string;
  itemTestId?: string;
};

export function HomeQuickLinks({
  links,
  className,
  itemTestId = "home-quick-link",
}: HomeQuickLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {links.map((link) => {
        const content = (
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {link.label}
              </p>
              {link.helper ? (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {link.helper}
                </p>
              ) : null}
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/70 motion-safe:transition-[transform,color] motion-safe:duration-200 group-hover:text-muted-foreground motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5" aria-hidden="true" />
          </div>
        );

        const inner = isExternal(link.href) ? (
          <a
            href={link.href}
            target={link.target ?? "_blank"}
            rel={link.rel ?? "noreferrer"}
            data-testid={link.testId ?? itemTestId}
            data-analytics-event={link.analyticsEvent}
            data-analytics-label={link.analyticsLabel}
            className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-2xl"
          >
            {content}
            <span className="sr-only">(opens in new tab)</span>
          </a>
        ) : (
          <Link
            href={link.href as Route}
            data-testid={link.testId ?? itemTestId}
            data-analytics-event={link.analyticsEvent}
            data-analytics-label={link.analyticsLabel}
            className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-2xl"
          >
            {content}
          </Link>
        );

        return (
          <Surface
            key={`${link.label}-${link.href}`}
            className="rounded-2xl shadow-[0_18px_45px_rgba(6,10,20,0.35)]"
            innerClassName="h-full rounded-2xl border border-border/60 bg-card/70 p-4 transition-colors hover:border-primary/40"
          >
            {inner}
          </Surface>
        );
      })}
    </div>
  );
}

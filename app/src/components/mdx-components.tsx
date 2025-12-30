import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import React, { type ReactNode } from 'react';
import { Surface } from '@/components/ui/surface';
import { CodeBlock } from '@/components/mdx-code-block';

function InlineCode(props: { children: ReactNode }) {
  return (
    <code
      className="break-words rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[13px] font-semibold leading-6 text-foreground shadow-inner shadow-primary/10"
      {...props}
    />
  );
}

function Paragraph({ children, ...props }: { children: ReactNode; [key: string]: unknown }) {
  const unwrapFigure = () => {
    if (Array.isArray(children)) {
      const onlyChild = children.find(Boolean);
      if (React.isValidElement(onlyChild) && (onlyChild.type === 'figure' || onlyChild.type === ProseImage)) {
        return onlyChild;
      }
    } else if (React.isValidElement(children) && children.type === 'figure') {
      return children;
    } else if (React.isValidElement(children) && children.type === ProseImage) {
      return children;
    }
    return null;
  };

  const figure = unwrapFigure();
  if (figure) {
    return figure;
  }

  return <p {...props}>{children}</p>;
}

function ProseImage(props: {
  src?: string | null;
  alt?: string;
  title?: string;
  markFirstImage?: () => boolean;
}) {
  const { src, alt, title, markFirstImage } = props;
  if (!src) {
    return null;
  }
  const priority = markFirstImage ? markFirstImage() : false;
  const showBadge = priority && process.env.NODE_ENV !== 'production';
  return (
    <figure className="group relative my-10" data-hero-image={priority ? 'true' : undefined}>
      <Link href={src as Route} target="_blank" rel="noreferrer" className="pointer-events-auto">
        <Surface
          className="relative rounded-[32px] shadow-[0_24px_60px_rgba(6,10,20,0.55)] transition hover:-translate-y-1.5 hover:shadow-[0_30px_50px_rgba(6,10,20,0.7)]"
          innerClassName="relative overflow-hidden rounded-[32px] border border-border/60 bg-card/80"
        >
          <Image
            src={src}
            alt={alt ?? 'Illustration'}
            title={title}
            width={1600}
            height={900}
            sizes="(max-width: 768px) 100vw, 800px"
            className="w-full max-h-[70vh] object-contain transition duration-300 group-hover:scale-105 md:max-h-[80vh]"
            priority={priority}
          />
          {showBadge && (
            <span className="absolute left-4 top-4 rounded-full border border-primary/50 bg-primary/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-primary shadow-[0_10px_25px_rgba(6,10,20,0.4)]">
              Hero
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60 opacity-0 transition group-hover:opacity-100" />
        </Surface>
      </Link>
      {(alt || title) && (
        <figcaption className="mt-3 text-xs uppercase tracking-[0.4em] text-muted-foreground">
          {alt ?? title}
        </figcaption>
      )}
    </figure>
  );
}

function BlockQuote(props: { children: ReactNode }) {
  return (
    <blockquote className="rounded-2xl border-l-4 border-primary/70 bg-primary/10 p-5 text-base leading-relaxed text-foreground shadow-[0_14px_32px_rgba(6,10,20,0.4)]">
      {props.children}
    </blockquote>
  );
}

type MdxComponentsOptions = {
  markFirstImage?: () => boolean;
};

export function createMdxComponents(options: MdxComponentsOptions = {}) {
  const { markFirstImage } = options;
  return {
    pre: ({ children }: { children: ReactNode }) => <CodeBlock>{children}</CodeBlock>,
    code: InlineCode,
    p: Paragraph,
    img: (props: { src?: string | null; alt?: string; title?: string }) => (
      <ProseImage {...props} markFirstImage={markFirstImage} />
    ),
    blockquote: BlockQuote,
    table: (props: { children: ReactNode }) => (
      <Surface
        className="rounded-2xl shadow-[0_24px_60px_rgba(6,10,20,0.45)]"
        innerClassName="overflow-hidden rounded-2xl border border-border/60 bg-card/80"
      >
        {/* eslint-disable-next-line sonarjs/table-header */}
        <table className="min-w-full divide-y divide-border/60 bg-background/40" {...props} />
      </Surface>
    ),
    thead: (props: { children: ReactNode }) => (
      <thead className="bg-background/80 text-xs uppercase tracking-[0.28em] text-muted-foreground" {...props} />
    ),
    th: (props: { children: ReactNode }) => (
      <th className="border-b border-border/60 px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
    ),
    td: (props: { children: ReactNode }) => (
      <td className="border-b border-border/60 px-4 py-3 text-sm text-muted-foreground" {...props} />
    ),
    ul: (props: { children: ReactNode }) => (
      <ul className="space-y-2 pl-5 text-sm text-muted-foreground marker:text-primary/80" {...props} />
    ),
    ol: (props: { children: ReactNode }) => (
      <ol className="space-y-2 pl-5 text-sm text-muted-foreground" {...props} />
    ),
    li: (props: { children: ReactNode }) => <li className="leading-relaxed" {...props} />,
  };
}

import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicGitHubOwner } from '@/lib/public-env';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';
import { LightningNodeCard, LightningTipWidget } from '@/components/lightning';

export const metadata: Metadata = {
  title: 'About',
  description: 'About klabo.world.',
};

export default function AboutPage() {
  const githubOwner = getPublicGitHubOwner();
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-secondary/18 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">About</p>
            <h1 className="text-4xl font-bold tracking-tight text-balance">klabo.world</h1>
            <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
              A home for practical notes, experiments, and shipping logs around Bitcoin,
              Lightning, Nostr, and agentic engineering.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="sm">
              <Link href="/posts">Read the writing</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/projects">Explore projects</Link>
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Surface
            className="rounded-3xl shadow-[0_20px_45px_rgba(6,10,20,0.45)]"
            innerClassName="h-full rounded-3xl border border-border/60 bg-card/80 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Focus</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">Decentralized systems</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Deep dives into protocols, deployment notes, and hands-on experiments that
              prioritize resilient infrastructure.
            </p>
          </Surface>

          <Surface
            className="rounded-3xl shadow-[0_20px_45px_rgba(6,10,20,0.45)]"
            innerClassName="h-full rounded-3xl border border-border/60 bg-card/80 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">What you&apos;ll find</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">Posts + playbooks</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Long-form writing, implementation checklists, and a trail of lessons learned
              while shipping new tools.
            </p>
          </Surface>

          <Surface
            className="rounded-3xl shadow-[0_20px_45px_rgba(6,10,20,0.45)]"
            innerClassName="h-full rounded-3xl border border-border/60 bg-card/80 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Connect</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">GitHub</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Follow along with the code and experiments that power these notes.
            </p>
            <Button asChild variant="link" size="sm" className="mt-3 px-0 text-xs font-semibold uppercase tracking-[0.3em]">
              <a href={`https://github.com/${githubOwner}`} target="_blank" rel="noreferrer" aria-label={`Visit GitHub profile for ${githubOwner} (opens in new tab)`}>
                github.com/{githubOwner} →
              </a>
            </Button>
          </Surface>
        </div>

        {/* Lightning Section */}
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Lightning Network</p>
            <h2 className="text-2xl font-bold tracking-tight">Connect & Support</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Open a channel to my Lightning node or send a tip via Lightning. All tips go directly to the node with zero fees.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LightningNodeCard
              alias="klabo.world"
              pubkey="0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68"
              color="#f7931a"
              host="klabo.world"
              port={9735}
            />
            <LightningTipWidget lightningAddress="joel@klabo.world" namespace="about" />
          </div>
        </section>
      </div>
    </div>
  );
}

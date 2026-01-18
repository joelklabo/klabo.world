'use client';

import { Tweet as ReactTweet } from 'react-tweet';
import { Surface } from '@/components/ui/surface';

type TweetProps = {
  id: string;
};

/**
 * Embedded Tweet component for MDX posts.
 * Uses react-tweet for server-side rendering of tweets.
 *
 * Usage in MDX:
 * <Tweet id="1234567890123456789" />
 */
export function Tweet({ id }: TweetProps) {
  return (
    <div className="my-8 flex justify-center not-prose">
      <Surface
        className="w-full max-w-[550px] rounded-2xl shadow-[0_24px_60px_rgba(6,10,20,0.45)]"
        innerClassName="overflow-hidden rounded-2xl border border-border/60 bg-card/80"
      >
        <div
          className="[&_.react-tweet-theme]:!bg-transparent [&_.react-tweet-theme]:!border-none [&_article]:!bg-transparent [&_article]:!border-none"
          data-theme="dark"
        >
          <ReactTweet id={id} />
        </div>
      </Surface>
    </div>
  );
}

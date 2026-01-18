import { TwitterApi } from 'twitter-api-v2';
import { env } from './env';

export type PublishResult =
  | { success: true; postId: string }
  | { success: false; error: string };

export type PublishInput = {
  title: string;
  summary: string;
  url: string;
  tags?: string[];
};

const MAX_TWEET_LENGTH = 280;
const URL_LENGTH = 23; // X counts all URLs as 23 characters

/**
 * Check if X publishing is enabled and configured
 */
export function isXPublishingEnabled(): boolean {
  return (
    env.X_AUTO_POST_ENABLED &&
    Boolean(env.X_API_KEY) &&
    Boolean(env.X_API_SECRET) &&
    Boolean(env.X_ACCESS_TOKEN) &&
    Boolean(env.X_ACCESS_SECRET)
  );
}

/**
 * Compose tweet text from post data, respecting character limits.
 * Format: "Title\n\nSummary\n\nURL"
 * If too long, truncates summary with ellipsis.
 */
export function composeTweet(input: PublishInput): string {
  const { title, summary, url } = input;

  // URL always counts as 23 chars regardless of actual length
  const urlPlaceholderLength = URL_LENGTH;
  const newlines = '\n\n';
  const ellipsis = '...';

  // Calculate available space for title + summary
  // Format: title + \n\n + summary + \n\n + url
  const fixedLength = newlines.length * 2 + urlPlaceholderLength;
  const availableForContent = MAX_TWEET_LENGTH - fixedLength;

  // Title gets priority, then summary fills remaining space
  const titlePart = title.slice(0, availableForContent);
  const remainingForSummary = availableForContent - titlePart.length - newlines.length;

  let summaryPart = '';
  if (remainingForSummary > ellipsis.length + 10) {
    // Only include summary if we have meaningful space
    summaryPart =
      summary.length <= remainingForSummary
        ? summary
        : summary.slice(0, remainingForSummary - ellipsis.length).trimEnd() + ellipsis;
  }

  if (summaryPart) {
    return `${titlePart}${newlines}${summaryPart}${newlines}${url}`;
  }
  return `${titlePart}${newlines}${url}`;
}

/**
 * Publish a post to X (Twitter)
 */
export async function publishToX(input: PublishInput): Promise<PublishResult> {
  if (!isXPublishingEnabled()) {
    return { success: false, error: 'X publishing is not enabled or configured' };
  }

  const client = new TwitterApi({
    appKey: env.X_API_KEY!,
    appSecret: env.X_API_SECRET!,
    accessToken: env.X_ACCESS_TOKEN!,
    accessSecret: env.X_ACCESS_SECRET!,
  });

  const tweet = composeTweet(input);

  try {
    const result = await client.v2.tweet(tweet);
    return { success: true, postId: result.data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error posting to X';
    console.error('Failed to publish to X:', message);
    return { success: false, error: message };
  }
}

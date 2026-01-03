import { getPublicSiteUrl } from './public-env';
import { getPosts } from './posts';

const SITE_NAME = 'klabo.world';
const SITE_DESCRIPTION = 'Bitcoin, Lightning, Nostr & Agentic Engineering insights from klabo.world.';

function absoluteUrl(path: string): string {
  const base = getPublicSiteUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function getFeedItems(limit = 20) {
  return getPosts().slice(0, limit).map((post) => ({
    id: absoluteUrl(post.url),
    url: absoluteUrl(post.url),
    title: post.title,
    summary: post.summary,
    datePublished: new Date(post.publishDate ?? post.date).toISOString(),
  }));
}

export function buildRssFeed(limit = 20): string {
  const items = getFeedItems(limit);
  const feedUrl = absoluteUrl('/rss.xml');

  const rssItems = items
    .map(
      (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.url}</link>
      <guid>${item.id}</guid>
      <pubDate>${new Date(item.datePublished).toUTCString()}</pubDate>
      <description><![CDATA[${item.summary}]]></description>
    </item>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title><![CDATA[${SITE_NAME}]]></title>
    <link>${absoluteUrl('/')}</link>
    <description><![CDATA[${SITE_DESCRIPTION}]]></description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>
    ${rssItems}
  </channel>
</rss>`;
}

export function buildJsonFeed(limit = 20) {
  const items = getFeedItems(limit);
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE_NAME,
    home_page_url: absoluteUrl('/'),
    feed_url: absoluteUrl('/feed.json'),
    description: SITE_DESCRIPTION,
    items: items.map((item) => ({
      id: item.id,
      url: item.url,
      title: item.title,
      summary: item.summary,
      date_published: item.datePublished,
    })),
  };
}

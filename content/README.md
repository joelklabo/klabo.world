# Content Source of Truth

MDX + JSON content lives here. Posts and apps (plus dashboards) are ingested via Contentlayer.

## Posts

Post source files live in `content/posts/*.mdx`.

Required frontmatter:

- `title`
- `summary`
- `date`

Recommended frontmatter:

- `publishDate` for the public publishing date
- `tags` as a YAML array
- `featuredImage` for post-specific hero art
- `aliases` for legacy slugs
- `lightningAddress`, `nostrPubkey`, `nostrRelays`, `xPostId` when relevant

Hero images are served from the Next app public root, `app/public`. Use paths like `/images/posts/example/featured.webp`.

The default blog hero is `/images/posts/klabo-world-editorial-hero.webp`. Post-specific hero art should match the AGENTS.md theme: dark obsidian/navy editorial technology photography, amber Lightning/circuit energy, restrained secondary accents, no embedded text or logos, and a calm left-side area for title overlays.

Use descriptive image alt text in MDX. Avoid generic captions such as `![image]`; the MDX renderer may display alt text as a caption.

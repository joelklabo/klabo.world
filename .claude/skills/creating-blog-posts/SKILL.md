---
name: creating-blog-posts
description: Creates and iterates on blog posts with visual feedback loop. Use when writing posts, creating diagrams, improving layouts, or verifying content renders correctly.
invocation: user
arguments: "[title]"
---

# Creating Blog Posts

Iterative blog post creation with Playwright visual verification.

## Contents
- [Workflow](#workflow)
- [Draft Management](#draft-management)
- [Visual Feedback Loop](#visual-feedback-loop)
- [Enhancements](#enhancements)
- [Publishing](#publishing)
- **References:**
  - [references/enhancement-ideas.md](references/enhancement-ideas.md) - Common improvements

## Workflow

```
1. Create draft (MCP or CLI)
2. Start dev server
3. Visual loop: snapshot → improve → rebuild → verify
4. Publish when ready
```

## Draft Management

### Create Draft (MCP)

```
mcp__klaboworld__kw_draft_create
  title: "Post Title"
  summary: "One-line description"
  body: "Markdown content..."
  tags: ["tag1", "tag2"]
```

### Update Draft (MCP)

```
mcp__klaboworld__kw_draft_update
  slug: "post-slug"
  body: "Updated content..."
```

### CLI Alternative

```bash
# From monorepo root
node packages/content/dist/cli/bin.js draft create -t "Title" -s "Summary" -b ./content.md
node packages/content/dist/cli/bin.js draft update <slug> -b ./content.md
```

### After Content Changes

```bash
cd /Users/klabo/Documents/klabo.world/app && pnpm contentlayer build
```

## Visual Feedback Loop

**Critical:** Always verify changes visually using Playwright MCP.

### 1. Capture Before

```
browser_navigate → http://localhost:3000/drafts/<slug>
browser_snapshot → analyze current state
browser_take_screenshot → save before.png
```

### 2. Make Changes

- Edit MDX content
- Add images/diagrams
- Update styling

### 3. Rebuild & Verify

```bash
pnpm contentlayer build
```

```
browser_navigate → http://localhost:3000/drafts/<slug>
browser_snapshot → check for errors
browser_console_messages → verify no errors
browser_take_screenshot → save after.png
```

### 4. Iterate or Complete

- If issues: fix and repeat
- If good: continue to next enhancement

## Enhancements

### Quick Wins

| Enhancement | How |
|-------------|-----|
| Table of Contents | Add `## Contents` with anchor links |
| Quote attributions | Add author links after blockquotes |
| Callout boxes | Use amber callout pattern |
| Code highlighting | Ensure language specified |

### Visual Upgrades

| Enhancement | How |
|-------------|-----|
| SVG diagrams | Create in `/app/public/images/posts/<slug>/` |
| Featured image | Set `featuredImage` in frontmatter |
| Side-by-side | Use grid comparison pattern |
| Full-width breaks | Use `-mx-4 md:-mx-8` |

### Image Locations

```
/app/public/images/posts/<slug>/
├── featured.svg     # Hero image
├── diagram-1.svg    # Inline diagrams
└── screenshot.png   # Screenshots
```

Reference in MDX as: `/images/posts/<slug>/filename.ext`

## Publishing

### Pre-publish Checklist

- [ ] Title compelling
- [ ] Summary concise (<160 chars)
- [ ] Tags relevant (2-4)
- [ ] Featured image set
- [ ] No console errors
- [ ] Mobile looks good
- [ ] Links work
- [ ] Code blocks have language

### Publish

```
mcp__klaboworld__kw_draft_publish
  slug: "post-slug"
  publishDate: "2026-01-17"  # Optional, defaults to today
```

### Post-publish

- Verify at `/posts/<slug>`
- Share URL
- Monitor for issues

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 404 on draft | `pnpm contentlayer build` |
| MDX error | Check closing tags, escape `<` |
| Image 404 | Check path starts with `/images/` |
| Console errors | Fix component issues |
| Hydration mismatch | Check dynamic content |

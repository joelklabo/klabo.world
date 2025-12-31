# Landing Page Info-Dense Spec

Goal: show more information on the home page with less copy. Keep the current visual language while increasing scan-ability.

## Objectives
- Increase information density without adding long paragraphs.
- Preserve existing CTA intent and test IDs.
- Keep layout responsive and accessible.
- Avoid new external data dependencies.

## Section map (proposed)
1) Hero
   - Keep the existing headline.
   - Replace multi-sentence paragraph with a single concise subhead.
   - Add a compact list or chips for focus areas (e.g., Bitcoin, Lightning, Nostr, agentic engineering).
   - Preserve existing CTAs and test IDs.

2) At-a-glance stats
   - Compact stat cards with counts and optional links.
   - Example stats: Posts, Apps, Dashboards, GitHub projects (featured count).

3) Quick links
   - Small tiles or chips for the main entry points (Writing, Projects, Apps, Dashboards, Search).
   - Each is a single-tap CTA with minimal copy.

4) Topics/tags
   - Display top tags as compact chips (limit to 6-8).
   - Hide the section if no tags are available.

5) Latest writing (existing)
   - Keep the current list and test IDs.
   - Trim subhead copy to a short phrase if needed.

6) Recent GitHub work (existing)
   - Keep the current showcase and fallback.
   - Trim subhead copy to a short phrase if needed.

## Data sources
- Posts: `getPosts()` or `getRecentPosts()` from `app/src/lib/posts.ts`
  - Stats: total count from `getPosts().length`.
  - Latest writing: `getRecentPosts(2)` (current behavior) or 3 if layout allows.
- Apps: `getApps()` from `app/src/lib/apps.ts` for total count.
- Dashboards: `getDashboards()` from `app/src/lib/dashboards.ts` for total count.
- Tags: `getPostTagCloud(limit)` from `app/src/lib/tagCloud.ts` for top tags.
- GitHub projects: `getFeaturedGitHubProjects()` already used in `app/src/app/page.tsx`.

## Copy reduction guidance
- Prefer short, active phrases (5-9 words).
- Use lists/chips instead of sentences for secondary details.
- Remove repeated context between headings and subheads.
- Avoid stacked paragraphs; keep each section to one short subhead max.

## Test IDs and analytics
Preserve existing IDs:
- `home-hero-title`
- `home-cta-writing`
- `home-cta-projects`
- `home-section-writing`
- `home-writing-post`
- `home-section-projects`
- `home-github-featured`

Add new IDs for the new sections:
- `home-section-overview` (wrapper for stats + quick links)
- `home-stat-item` (per stat card)
- `home-quick-link` (per quick link)
- `home-section-topics`
- `home-topic-chip`

Analytics event naming (match existing pattern):
- `ui.home.stat_click` (stat cards that link)
- `ui.home.quick_link` (quick links)
- `ui.home.topic` (topic chips)

## Accessibility
- Maintain a clear heading order (h1 then h2 for sections).
- Use `section` + heading to define landmarks.
- Ensure stat cards include visible labels (not icon-only).
- Provide sufficient contrast for chips and badges.

## Edge cases
- No posts: hide latest writing list and show a short empty state.
- No tags: hide topics section entirely.
- GitHub unavailable: keep existing fallback copy.
- Large counts: format with `Intl.NumberFormat`.

## Non-goals
- No new data APIs.
- No navigation redesign.
- No new content creation.

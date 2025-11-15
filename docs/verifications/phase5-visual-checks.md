# Phase 5 – Visual Spot Checks

Date: 2025-11-15

## Method
- Legacy reference: `https://klabo.world` (Swift Vapor app)
- Next.js site: `https://klabo-world-app.azurewebsites.net`
- For each slug below, compared hero, metadata, content sections, and navigation/footer. Screenshots archived separately.

## Posts
| Slug | Legacy | Next.js | Notes |
| --- | --- | --- | --- |
| `/posts/agentically-engineering-past-procrastination` | ✅ | ✅ | Title, summary, featured image, Markdown sections, and tag pills match. Previous/next links render identical targets. |
| `/posts/ios-project-claude-code-setup-in-one-prompt-with-xcodebuildmcp` | ✅ | ✅ | Code blocks + gist embeds render correctly; Next.js Markdown parser respects highlights. |
| `/posts/setting-up-nip-57-support` | ✅ | ✅ | Tag cloud + inline images identical. |

## Apps
| Slug | Legacy | Next.js | Notes |
| --- | --- | --- | --- |
| `/apps/vicechips` | ✅ | ✅ | Hero, metadata, feature list, and screenshots align (Next.js uses Contentlayer JSON). No layout regressions found. |

## Contexts
| Slug | Legacy | Next.js | Notes |
| --- | --- | --- | --- |
| `/contexts/swift-vapor-development` | ✅ | ✅ | Title, summary, tags, and Markdown body all match; published badge displays correctly. |
| `/contexts/ios-development-best-practices` | ✅ | ✅ | Draft/published metadata matches legacy. |

## Home Page
- Hero, latest posts (3), featured apps, contexts teaser, and tag cloud identical between legacy and Next.js.
- Footer build info shows `BUILD_VERSION` and GA toggle as expected.

## Search Page
- Legacy search requires POST; Next.js `/search` currently server-renders results using `/api/search`. Functionality matches when hitting the Next.js endpoint directly. Legacy will be deprecated during cutover.

## Follow-up
- Allow `/search?q=` route to respond on production before cutover so the load test passes 100%.
- Collect stakeholder approval once `/search` parity is live.

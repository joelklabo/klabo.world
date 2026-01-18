# Annotation Patterns Reference

## Database Schema

Annotations are stored in SQLite with this schema:

```prisma
model Annotation {
  id          String   @id @default(cuid())
  draftSlug   String   // Which draft this annotates
  type        String   // TEXT_HIGHLIGHT, RECTANGLE, POINT
  status      String   @default("OPEN") // OPEN, RESOLVED, ARCHIVED
  content     String   // The feedback text
  selectors   String   // JSON array of selectors
  color       String?  @default("#3b82f6")
  pinNumber   Int?     // Visual number (root annotations only)
  parentId    String?  // For threading
  depth       Int      @default(0)
  createdAt   DateTime
  updatedAt   DateTime
  resolvedAt  DateTime?
  authorId    String?  // Links to Admin
}
```

## Status Lifecycle

```
OPEN → RESOLVED (user addresses feedback)
OPEN → ARCHIVED (orphaned due to content change)
RESOLVED → OPEN (reopen if needed)
```

## Selector Strategy

Multi-selector approach for robust anchoring:

1. **TextQuoteSelector**: Primary - survives content edits if text still exists
2. **TextPositionSelector**: Fallback - fast lookup but fragile
3. **XPathSelector**: Future - for structural anchoring

When content changes and selectors can't anchor, annotations become "orphaned" and should be archived.

## Threading

- Root annotations have `parentId = null` and get `pinNumber`
- Replies have `parentId` set and no `pinNumber`
- Depth is calculated from parent
- Resolving root resolves all replies

## API Endpoints

```
GET    /api/annotations?draftSlug=xxx&status=OPEN
POST   /api/annotations
GET    /api/annotations/:id
PATCH  /api/annotations/:id
DELETE /api/annotations/:id
POST   /api/annotations/:id/resolve
```

## UI Keyboard Shortcuts

| Key | Action |
|-----|--------|
| C | Toggle comment mode (text selection) |
| D | Toggle draw mode (rectangles) |
| Escape | Exit mode / close popover |
| j | Next annotation |
| k | Previous annotation |
| Space | Resolve selected |
| r | Reply to selected |

## Watcher Daemon

The annotation watcher polls the database and broadcasts changes via Unix socket:

- Socket: `/tmp/klaboworld-annotations.sock`
- Poll interval: 500ms
- Events: `created`, `updated`, `deleted`

Install with launchd:
```bash
mise run watcher-install
```

Check status:
```bash
mise run watcher-status
```

View logs:
```bash
mise run watcher-logs
```

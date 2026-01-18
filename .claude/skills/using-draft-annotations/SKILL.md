---
name: using-draft-annotations
description: Reads and responds to draft annotations via MCP. Use when user mentions annotations, feedback, or reviewing drafts.
invocation: auto
---

# Using Draft Annotations

This skill enables reading and responding to user annotations on blog draft posts. Annotations are comments attached to specific text highlights or drawn regions.

## When to Use

- User mentions "annotations", "feedback", or "comments" on a draft
- User asks you to review annotations
- User wants you to address feedback on a post
- Checking for open annotations before publishing

## MCP Tools

### List Annotations
```
kw_annotation_list
  draftSlug: string (required)
  status: "OPEN" | "RESOLVED" | "ARCHIVED" (optional filter)
```

Returns all annotations for a draft with counts by status.

### Get Single Annotation
```
kw_annotation_get
  id: string (required)
```

Returns annotation with full thread (replies).

### Create Annotation
```
kw_annotation_create
  draftSlug: string
  type: "TEXT_HIGHLIGHT" | "RECTANGLE" | "POINT"
  content: string (the comment)
  selectors: array of selector objects
  color: hex color (optional)
  parentId: string (for replies)
```

Use this to create annotations yourself, such as:
- Flagging issues you notice in the draft
- Suggesting improvements
- Marking sections that need attention

### Update Annotation
```
kw_annotation_update
  id: string
  content: string (optional)
  status: "OPEN" | "RESOLVED" | "ARCHIVED" (optional)
  color: hex color (optional)
```

### Resolve Annotation
```
kw_annotation_resolve
  id: string
```

Resolves the annotation and all its replies. Use after addressing feedback.

### Delete Annotation
```
kw_annotation_delete
  id: string
```

Deletes annotation and all replies.

## Selector Types

### TextQuoteSelector (most robust)
```json
{
  "type": "TextQuoteSelector",
  "exact": "the highlighted text",
  "prefix": "text before",
  "suffix": "text after"
}
```

### TextPositionSelector
```json
{
  "type": "TextPositionSelector",
  "start": 100,
  "end": 200
}
```

### RectangleSelector
```json
{
  "type": "RectangleSelector",
  "x": 10, "y": 25,
  "width": 80, "height": 30,
  "pageWidth": 1280, "pageHeight": 2400
}
```

## Response Workflow

1. **Read annotations**: `kw_annotation_list` with the draft slug
2. **Understand context**: Read the actual draft content to understand what each annotation refers to
3. **Address feedback**: Make the requested changes to the draft
4. **Resolve annotations**: After addressing, use `kw_annotation_resolve`
5. **Reply if needed**: Create reply annotations to explain changes

## Common Feedback Patterns

| Feedback Type | Action |
|--------------|--------|
| Typo/grammar | Fix directly, resolve |
| Unclear text | Rewrite section, resolve |
| Missing info | Add content, resolve |
| Question | Reply with answer, then resolve |
| Suggestion | Evaluate, implement or reply why not |

## Example Conversation

User: "Check the annotations on my-draft-post"

1. Call `kw_annotation_list` with draftSlug "my-draft-post"
2. Report findings: "Found 3 open annotations..."
3. For each annotation, summarize:
   - Pin number and location (from TextQuoteSelector.exact)
   - The feedback content
4. Offer to address specific annotations

## Tips

- Always resolve annotations after addressing them
- Reply to complex feedback before resolving to explain your changes
- When creating annotations yourself, use descriptive content
- TEXT_HIGHLIGHT annotations should include both TextQuoteSelector and TextPositionSelector for robustness

# Blog Post Enhancement Ideas

Common improvements to elevate posts.

## Structure Enhancements

### Table of Contents

```mdx
## Contents

- [Section One](#section-one)
- [Section Two](#section-two)
- [Conclusion](#conclusion)

---
```

### Section Dividers

```mdx
---

## New Section
```

### Pull Quotes

```mdx
<blockquote className="text-2xl font-light text-zinc-300 border-l-4 border-amber-500 pl-6 my-8">
  Key insight that deserves emphasis.
</blockquote>
```

## Visual Enhancements

### Workflow Diagram (SVG)

Show process flows, before/after comparisons, architecture.

```xml
<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
  <!-- Use zinc-900/800/700 for backgrounds -->
  <!-- Use amber-500 for accents -->
  <!-- Use zinc-100/300/400 for text -->
</svg>
```

### Stats Grid

```mdx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
  <div className="text-center p-4 bg-zinc-900/50 rounded-lg">
    <div className="text-3xl font-bold text-amber-500">10x</div>
    <div className="text-sm text-zinc-500">Faster</div>
  </div>
</div>
```

### Timeline

```mdx
<div className="border-l-2 border-zinc-700 pl-6 space-y-8 my-8">
  <div className="relative">
    <div className="absolute -left-8 w-3 h-3 bg-amber-500 rounded-full"></div>
    <div className="text-sm text-zinc-500">Step 1</div>
    <div className="text-zinc-100">Description</div>
  </div>
</div>
```

## Content Enhancements

### Quote Attribution

```mdx
> "The quote text here."
> — [Author Name](https://link-to-source)
```

### Code with Filename

````mdx
<div className="relative">
<div className="absolute top-0 left-4 px-2 py-1 bg-zinc-800 text-xs text-zinc-400 rounded-b">
config.ts
</div>

```typescript
export const config = {}
```

</div>
````

### Comparison Table

```mdx
| Aspect | Before | After |
|--------|--------|-------|
| Speed | Slow | Fast |
| Effort | High | Low |
```

### Pros/Cons

```mdx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
<div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
<p className="font-semibold text-green-400 mb-2">Pros</p>

- Pro 1
- Pro 2

</div>
<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
<p className="font-semibold text-red-400 mb-2">Cons</p>

- Con 1
- Con 2

</div>
</div>
```

## Interactive Elements

### Collapsible Section

```mdx
<details className="my-4 border border-zinc-800 rounded-lg">
  <summary className="p-4 cursor-pointer hover:bg-zinc-800/50">
    Click to expand
  </summary>
  <div className="p-4 border-t border-zinc-800">
    Hidden content here
  </div>
</details>
```

### Keyboard Shortcuts

```mdx
<kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm">⌘</kbd> +
<kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm">K</kbd>
```

## Tweet Embeds

For embedding tweets with proper styling:

```mdx
<Tweet id="1234567890" />
```

(Requires Tweet component - see maintaining-design-system)

## SEO Enhancements

### Meta Description

Keep summary under 160 characters for optimal SEO.

### Structured Data

Handled automatically by contentlayer, but ensure:
- `date` is valid ISO format
- `tags` are relevant keywords
- `featuredImage` is set

### Internal Links

Link to related posts:
```mdx
See also: [Related Post Title](/posts/related-slug)
```

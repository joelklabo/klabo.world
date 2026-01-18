# MDX Component Patterns

Reusable patterns for klabo.world blog posts.

## Callout Box

```mdx
<div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg p-4 my-6">

**Title:**
*Description here*

</div>
```

## Side-by-Side Comparison

```mdx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
<div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
<p className="text-sm font-semibold text-zinc-400 mb-2">BEFORE</p>

Content here

</div>
<div className="bg-zinc-900/50 rounded-lg p-4 border border-amber-500/30">
<p className="text-sm font-semibold text-amber-500 mb-2">AFTER</p>

Content here

</div>
</div>
```

## Figure with Caption

```mdx
<figure>
  <img src="/images/posts/slug/image.svg" alt="Description" />
  <figcaption className="text-sm text-zinc-500 mt-2 text-center">Caption text</figcaption>
</figure>
```

## Quote with Attribution

```mdx
> "Quote text here"
> — [Author Name](https://url)
```

## Table of Contents

```mdx
## Contents

- [Section One](#section-one)
- [Section Two](#section-two)
- [Section Three](#section-three)

---
```

## Styled List

```mdx
<ul className="space-y-2 my-4">
  <li className="flex items-start gap-2">
    <span className="text-amber-500">→</span>
    <span>Item text</span>
  </li>
</ul>
```

## Code Block with Title

````mdx
<div className="relative">
<div className="absolute top-0 left-4 px-2 py-1 bg-zinc-800 text-xs text-zinc-400 rounded-b">
filename.ts
</div>

```typescript
// code here
```

</div>
````

## Stats/Numbers Grid

```mdx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
  <div className="text-center">
    <div className="text-3xl font-bold text-amber-500">42</div>
    <div className="text-sm text-zinc-500">Label</div>
  </div>
</div>
```

## Full-Width Image Break

```mdx
<div className="my-12 -mx-4 md:-mx-8">
  <img src="/images/posts/slug/wide.svg" alt="Description" className="w-full" />
</div>
```

## Warning/Note Box

```mdx
<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-6">
<p className="text-red-400 font-semibold mb-2">⚠️ Warning</p>

Content here

</div>
```

## Timeline

```mdx
<div className="border-l-2 border-zinc-700 pl-6 space-y-6 my-8">
  <div className="relative">
    <div className="absolute -left-8 w-3 h-3 bg-amber-500 rounded-full"></div>
    <div className="text-sm text-zinc-500">Date</div>
    <div>Event description</div>
  </div>
</div>
```

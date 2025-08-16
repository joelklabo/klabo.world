# CLAUDE.md - Views Directory

This file provides guidance for working with Leaf templates in the Views directory.

## Template Structure

### Base Templates
- **base.leaf** - Main layout template that all pages extend. Includes:
  - Standard HTML structure with Tailwind CSS via CDN
  - Inter and JetBrains Mono fonts
  - Google Analytics integration (if configured)
  - Dark mode support with theme detection
  - Global search functionality
  - Footer with build information

### Template Hierarchy
```
base.leaf (main layout)
├── index.leaf (homepage)
├── posts/
│   ├── index.leaf (blog listing)
│   ├── show.leaf (individual post)
│   └── tags.leaf (posts by tag)
├── apps/
│   ├── index.leaf (apps listing)
│   └── show.leaf (individual app)
└── admin/
    ├── index.leaf (admin dashboard)
    ├── compose.leaf (create post)
    ├── login.leaf (admin login)
    └── posts/edit.leaf (edit post)
```

## ViewContext Protocol

All templates receive contexts implementing the `ViewContext` protocol which provides:
- `title`: Page title
- `gaTrackingID`: Google Analytics ID (optional)
- `popularTags`: Array of TagCount objects for tag cloud
- `buildVersion`: Git commit hash (optional)
- `buildDate`: Build timestamp (optional)
- `buildInfo`: Combined build information string

## Common Template Patterns

### Extending Base Layout
```leaf
#extend("base"):
    #export("content"):
        <!-- Page content here -->
    #endexport
#endextend
```

### Conditional Rendering
```leaf
#if(isLoggedIn):
    <!-- Admin controls -->
#endif
```

### Loop Iteration
```leaf
#for(post in posts):
    <article>
        <h2>#(post.title)</h2>
        <p>#(post.summary)</p>
    </article>
#endfor
```

### Date Formatting
```leaf
#date(post.date, "MMM d, yyyy")
```

## Admin Templates

Admin templates in `admin/` directory require authentication and include:
- Additional JavaScript for markdown preview
- Image upload functionality
- Form validation
- CSRF protection considerations

### Admin-Specific Context
Admin templates receive additional context:
- `isLoggedIn`: Boolean for auth status
- `message`: Flash message for user feedback
- `messageType`: success/error/info for styling

## Partials

### logo-svg.leaf
Reusable SVG logo component. Usage:
```leaf
#extend("partials/logo-svg")
```

## Styling Conventions

- Uses Tailwind CSS utility classes
- Dark mode support via `dark:` prefix
- Responsive design with `sm:`, `md:`, `lg:` breakpoints
- Typography plugin for prose content
- Custom CSS for syntax highlighting (uses highlight.js)

## JavaScript Integration

### Global Search
Available on all pages via base.leaf:
```javascript
searchDebounce() - Debounced search function
performSearch() - Executes search API call
```

### Admin Features
- Markdown preview with real-time updates
- Image upload with drag-and-drop
- Tag management
- Post scheduling

## Important Considerations

1. **HTML Escaping**: Leaf automatically escapes variables. Use `#unsafeHTML()` only for trusted content
2. **Post Content**: Blog post HTML is pre-rendered and safe to use with `#unsafeHTML()`
3. **Build Info**: Footer displays git commit and date when available (production builds)
4. **Theme Detection**: Respects user's system theme preference
5. **Mobile Responsiveness**: All templates must work on mobile devices

## Testing Templates

To test template changes:
1. Run `make run` to start the development server
2. Templates are automatically reloaded on change
3. Check both light and dark modes
4. Test on mobile viewport sizes
5. Verify admin functionality with authenticated session
# CLAUDE.md - Controllers Directory

This file provides guidance for working with controllers in the KlaboWorld application.

## Controller Architecture

All controllers implement `RouteCollection` protocol and register their routes via the `boot(routes:)` method.

## Controller Responsibilities

### PostsController
**Routes**: `/posts/*`
- Displays blog posts listing and individual posts
- Handles markdown rendering using Down library
- Implements tag filtering
- Manages post caching via PostsCacheKey

**Key Methods**:
- `index()` - Lists all published posts with pagination
- `show()` - Displays individual post with rendered markdown
- `tags()` - Shows posts filtered by tag

**Special Features**:
- Automatic code syntax highlighting
- Reading time calculation
- Related posts suggestions
- GitHub integration for fetching remote content

### AdminController
**Routes**: `/admin/*`
- Protected by SessionAuthMiddleware
- Full CRUD operations for posts and apps
- Image upload handling
- Post scheduling functionality

**Key Methods**:
- `index()` - Admin dashboard with all posts/apps
- `compose()` - Create new content
- `upload()` - Handle image uploads (10MB limit)
- `publish()` - Publish/unpublish posts

**Security**:
- Session-based authentication required
- Rate limiting on login attempts
- File upload validation (images only)
- bcrypt password hashing

### AuthController
**Routes**: `/auth/*`
- Handles admin authentication
- Session management
- Password change functionality

**Key Methods**:
- `showLogin()` - Display login form
- `login()` - Process login with rate limiting
- `logout()` - Clear session
- `changePassword()` - Update admin password

**Session Management**:
- Sessions stored in memory (app.storage)
- 24-hour session timeout
- Secure random session tokens

### AppsController
**Routes**: `/apps/*`
- Showcases personal applications/projects
- Supports App Store and Google Play links
- GitHub integration for project details

**Key Methods**:
- `index()` - Lists all published apps
- `show()` - Display app details with screenshots
- `create()` - Admin route for new apps

### GistController
**Routes**: `/gists/*`
- Embeds GitHub Gists in posts
- Caches gist content for performance
- Syntax highlighting support

**Key Methods**:
- `embed()` - Fetch and render gist
- `raw()` - Return raw gist content

## Common Patterns

### Route Registration
```swift
func boot(routes: RoutesBuilder) throws {
    let posts = routes.grouped("posts")
    posts.get(use: index)
    posts.get(":slug", use: show)
}
```

### Context Creation
```swift
struct PostContext: Content, ViewContext {
    let title: String
    let gaTrackingID: String?
    let post: PostMetadata
    // ... other fields
}
```

### Error Handling
```swift
guard let post = findPost(slug: slug) else {
    throw Abort(.notFound, reason: "Post not found")
}
```

### Cache Access
```swift
let posts = req.application.storage[PostsCacheKey.self] ?? []
```

## Middleware Usage

### Protected Routes
```swift
let protected = routes.grouped(SessionAuthMiddleware())
protected.get("admin", use: adminIndex)
```

### Rate Limiting
Controllers use RateLimiterKey for preventing abuse:
```swift
let limiter = req.application.storage[RateLimiterKey.self]
guard limiter?.canMakeRequest(from: clientIP) ?? true else {
    throw Abort(.tooManyRequests)
}
```

## Content Management

### Dual Source Strategy
Controllers check both locations for content:
1. Resources directory (bundled content)
2. Uploads directory (dynamic content)

Uploads take precedence when slugs conflict.

### GitHub Integration
When GITHUB_TOKEN is configured:
```swift
if let github = req.application.github {
    let content = try await github.getFileContent(path: path)
    // Process content
}
```

## Response Types

### HTML Responses
```swift
return try await req.view.render("template", context)
```

### JSON API Responses
```swift
return posts.map { $0.toDTO() }
```

### File Downloads
```swift
return req.fileio.streamFile(at: path)
```

## Testing Controllers

Controllers are tested using Swift Testing framework:
```swift
@Test("Test posts index")
func testPostsIndex() async throws {
    try await withApp { app in
        try await app.test(.GET, "/posts") { res in
            #expect(res.status == .ok)
        }
    }
}
```

## Performance Considerations

1. **Caching**: All metadata cached at startup
2. **Lazy Loading**: Post content loaded only when needed
3. **Image Optimization**: Uploaded images should be optimized
4. **Query Optimization**: Use array operations efficiently on cached data

## Security Best Practices

1. **Input Validation**: Always validate user input
2. **File Uploads**: Check file type and size
3. **Authentication**: Use SessionAuthMiddleware for protected routes
4. **CSRF Protection**: Consider for form submissions
5. **Rate Limiting**: Prevent abuse on public endpoints

## Error Messages

Provide helpful error messages:
- 404: "Post not found" with suggestions
- 401: "Please log in to continue"
- 429: "Too many requests, please try again later"
- 500: Log detailed error, show generic message to user
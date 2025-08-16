# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

klabo.world is a personal website and blog platform for Joel Klabo built with Vapor 4 (Swift web framework). The site features a dual-source content management system, supporting both local files and GitHub-backed storage, with an admin interface for content management.

## Essential Commands

### Development
```bash
# Run development server (with automatic port cleanup)
make run

# Run tests
make test

# Run specific test suite
swift test --filter PostsTests

# Format code
make format

# Lint code  
make lint

# Clean build artifacts
make clean
```

### Docker Development
```bash
# Run with Docker in development mode (recommended for macOS)
make docker-dev

# Run production build locally
make docker-prod

# View Docker logs
make docker-logs
```

### Content Management
```bash
# Create a new blog post
make new-post title="My Title"

# List all posts
make list-posts
```

### Deployment
```bash
# Pre-deployment checks
make pre-commit
make deploy-checklist

# Test Azure deployment locally
make test-azure-local
```

## Architecture Overview

### Content Management Strategy
The application implements a **dual-source content system** that loads content from two locations:
1. **Resources/** - Bundled content (posts/apps) included in the Docker image
2. **Uploads directory** (configured via UPLOADS_DIR) - Runtime-uploaded content that persists across deployments

Content from uploads takes precedence over Resources when slugs conflict. This enables:
- Static content bundled with deployments
- Dynamic content creation via admin interface
- Content persistence in Azure deployment using mounted storage

### Caching Architecture
All content metadata is loaded and cached at application startup:
- **PostsCacheKey**: All post metadata loaded from Resources/Posts/ and uploads/posts/
- **AppsCacheKey**: All app metadata loaded from Resources/Apps/ and uploads/apps/
- **TagCountsCacheKey**: Computed tag frequency for tag cloud display

This approach trades memory for performance, eliminating file I/O on every request.

### GitHub Integration
When GITHUB_TOKEN is configured, the application can:
- Fetch posts directly from the GitHub repository
- Create new posts as GitHub commits
- Fallback to local filesystem when GitHub is unavailable

Implementation in `Sources/KlabowWorld/Services/GitHubService.swift`

## Key Components

### Controllers Architecture
- **PostsController**: Handles blog post display, markdown rendering using Down library
- **AdminController**: Protected routes for content management, image uploads
- **AuthController**: Session-based authentication for admin access
- **AppsController**: Showcases personal applications/projects
- **GistController**: GitHub Gist embedding functionality

### Session Management
Custom in-memory session storage (not using Vapor's default sessions):
- Sessions stored in `app.storage[SessionStorageKey.self]`
- Authentication via `SessionAuthMiddleware`
- Rate limiting implemented via `RateLimiterKey`

### Configuration System
Environment-based configuration through `SiteConfiguration`:
- Required: ADMIN_PASSWORD, UPLOADS_DIR
- Optional: GA_TRACKING_ID, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO
- Build info: BUILD_VERSION, BUILD_DATE (injected during CI/CD)

## Testing Approach

Uses Swift Testing framework (not XCTest) with `@Test` attributes:
```swift
@Test("Test description")
func testSomething() async throws {
    try await withApp(configure: configure) { app in
        // Test implementation
    }
}
```

Test files:
- PostsTests.swift - Blog functionality
- AdminTests.swift - Authentication and admin features  
- KlabowWorldTests.swift - Core application tests

## Deployment Configuration

### Azure App Service
- Container deployment via GitHub Actions
- Environment variables set via Azure Portal or CLI
- Persistent storage mounted at /home/site/wwwroot/uploads
- WEBSITES_PORT=8080 must be configured

### GitHub Actions Pipeline
The `.github/workflows/deploy.yml` handles:
1. Docker image build with caching
2. Push to GitHub Container Registry (ghcr.io)
3. Deploy to Azure Web App using publish profile
4. Deployment verification with health checks

### Docker Optimization
- Multi-stage build for smaller production images
- Named volumes for build cache (improves macOS performance)
- Non-root user (vapor) for security
- Separate dev/prod configurations in docker-compose.yml

## Important Implementation Details

### Markdown Rendering
Uses Down library (cmark wrapper) for proper code block support. Previous Ink library had issues with code blocks.

### File Serving Strategy
Two FileMiddleware instances:
1. Public directory for static assets
2. Uploads directory for user-uploaded content (persists in Azure)

### Rate Limiting
Custom rate limiter prevents abuse of contact forms and admin endpoints.

### Password Hashing
Custom `HashPasswordCommand` for generating bcrypt hashes for admin passwords.

### Post Metadata Parsing
Front matter parsing supports both array format `[tag1, tag2]` and comma-separated format for tags.

### View Context Protocol
All Leaf templates receive contexts implementing `ViewContext` protocol, ensuring consistent data availability (GA tracking, build info, popular tags).

## Performance Considerations

- All content metadata loaded at startup (trades memory for speed)
- No database queries - all content file-based
- Docker build cache optimization via GitHub Actions
- Static asset serving via FileMiddleware

## Security Notes

- Admin authentication uses bcrypt password hashing
- Session-based auth with secure random tokens
- File upload validation enforced
- Non-root Docker container execution
- Rate limiting on sensitive endpoints
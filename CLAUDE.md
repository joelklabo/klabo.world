# klabo.world - Vapor 4 Personal Website Project

## Site Owner
**Owner Name**: Joel Klabo  
Always use "Joel Klabo" when displaying the site owner's name (e.g., in footer copyright, email sender names, etc.).

## Project Overview
Building a personal website with blog functionality using Vapor 4 (Swift web framework), Docker, and deploying to Azure App Service with GitHub Actions CI/CD.

## Key Architecture Decisions

### Technology Stack
- **Framework**: Vapor 4 (Swift)
- **Templating**: Leaf (Vapor's templating engine)
- **Styling**: Tailwind CSS (via CDN)
- **Content**: Markdown files for blog posts
- **Email**: SMTP integration via Mikroservices/Smtp package
- **Development**: Docker with optimized macOS configuration
- **Deployment**: Azure App Service (Linux container)
- **CI/CD**: GitHub Actions
- **Testing**: Swift Testing framework (not XCTest)

## Critical Implementation Details

### 1. Project Structure
```
KlaboWorld/
├── Sources/KlaboWorld/
│   ├── Controllers/     # Route handlers (PostsController, AdminController, ContactController, AppsController)
│   ├── Models/          # Data models and Content structs
│   ├── Middleware/      # Admin auth middleware
│   ├── configure.swift  # App configuration on startup
│   ├── routes.swift     # Route registration
│   └── entrypoint.swift # App entry point
├── Resources/
│   ├── Views/          # Leaf templates
│   ├── Posts/          # Markdown blog posts
│   └── Apps/           # JSON app metadata files
├── Public/             # Static assets (CSS, JS, images)
├── Tests/              # Swift Testing framework tests
├── scripts/            # Helper scripts
├── Makefile           # Command shortcuts
└── docker-compose.yml # Docker services
```

### 2. Configuration Management
**ALWAYS** use type-safe configuration via `SiteConfiguration` struct:
```swift
struct SiteConfiguration: Codable {
    let smtpHost: String
    let smtpUsername: String
    let smtpPassword: String
    let adminPassword: String
    let uploadsDir: String
    let gaTrackingID: String? // Optional for dev
}
```
Access via: `req.application.storage[ConfigKey.self]!`

### 3. Security Requirements
- **File Uploads**: NEVER use user-provided filenames. Always generate UUID-based names
- **Admin Routes**: Protected by AdminAuthMiddleware checking environment variable
- **Content Type Validation**: Check `file.contentType` for allowed image types
- **Request Size**: Increase limit for admin routes: `app.routes.defaultMaxBodySize = "10mb"`
- **Docker Container**: Runs as non-root user

### 4. Performance Optimizations
- **Post Caching**: Load all post metadata on startup into `app.storage[PostsCacheKey.self]`
- **App Caching**: Load all app metadata on startup into `app.storage[AppsCacheKey.self]`
- **Docker Volumes**: Use named volume for `.build` directory in docker-compose.yml
- **Vapor Binding**: Must bind to `0.0.0.0` in container (already in default Dockerfile)

### 5. Deployment Specifics
- **Persistent Storage**: Azure mounts at `/home`, configure `UPLOADS_DIR=/home/site/wwwroot/uploads`
- **Port Configuration**: Set `WEBSITES_PORT=8080` in Azure App Service
- **Image Tagging**: Use Git SHA for immutable deployments: `ghcr.io/${{ github.repository }}/image:${{ github.sha }}`
- **Two FileMiddleware**: One for baked-in Public/, another for persistent uploads

### 6. Email Configuration
```swift
app.smtp.configuration.hostname = config.smtpHost
app.smtp.configuration.signInMethod = .credentials(username: config.smtpUsername, password: config.smtpPassword)
app.smtp.configuration.secure = .ssl
```

### 7. Markdown Blog System
- **Front Matter**: Parse metadata (title, date, summary, publishDate)
- **Scheduling**: Filter posts where `publishDate > Date()`
- **Rendering**: Use Ink library, render with Leaf's `#raw()` tag
- **File Location**: `Resources/Posts/` directory

### 8. Apps Showcase System
- **JSON Storage**: App metadata stored as JSON files in `Resources/Apps/`
- **App Model**: AppMetadata with fields: name, slug, fullDescription, version, publishDate, icon, screenshots, appStoreURL, githubURL, features
- **Publishing**: Apps can be scheduled with publishDate like blog posts
- **Admin Management**: Full CRUD operations for apps via admin panel
- **Image Handling**: App icons and screenshots uploaded to persistent storage
- **Display**: Grid layout on index, detailed view for individual apps

### 9. Testing Requirements
- Write integration tests in `Tests/KlaboWorldTests/`
- Use Swift Testing framework with `@Test` and `@Suite` attributes
- Use `VaporTesting` for HTTP request testing
- CI/CD runs `swift test` before deployment
- Test route responses, middleware, and configuration
- Example test structure:
```swift
@Test("Test posts index returns ok")
func testPostsIndex() async throws {
    try await withApp(configure: configure) { app in
        try await app.testing().test(.GET, "posts", afterResponse: { res async in
            #expect(res.status == .ok)
        })
    }
}
```

### 10. Styling with Tailwind CSS
- **Implementation**: Tailwind CSS via CDN (no build step required)
- **Configuration**: Custom config in base.leaf template
- **Syntax Highlighting**: Highlight.js with GitHub Dark theme
- **Responsive Design**: Mobile-first approach using Tailwind's responsive utilities
- **Key Classes**:
  - Containers: `max-w-4xl mx-auto px-6`
  - Headers: `text-4xl font-bold text-gray-900`
  - Links: `text-blue-600 hover:text-blue-700 transition-colors`
  - Forms: `border-gray-300 focus:ring-2 focus:ring-blue-500`
  - Buttons: `bg-blue-600 hover:bg-blue-700 text-white`
- **Prose Styling**: Using Tailwind's typography plugin classes for blog content
- **Code Blocks**: Styled with `prose-pre:bg-gray-900` and Highlight.js
- **NO CUSTOM CSS**: All styling done through Tailwind utilities

## Vapor Documentation References
Key documentation files available in `docs/vapor/`:
- `routing.md` - Route handling and parameter extraction
- `controllers.md` - Organizing routes with RouteCollection
- `content.md` - Content protocol for request/response encoding
- `middleware.md` - Custom middleware implementation
- `leaf-getting-started.md` - Leaf templating syntax
- `docker.md` - Docker deployment guide
- `testing.md` - XCTVapor testing patterns
- `folder-structure.md` - Project organization

## Environment Variables Required
Development (.env file):
```
SMTP_HOST=smtp.example.com
SMTP_USERNAME=username
SMTP_PASSWORD=password
ADMIN_PASSWORD=secure-password
UPLOADS_DIR=./Public/uploads
GA_TRACKING_ID=UA-XXXXXXXXX-X (optional in dev)
```

Production (Azure App Service Configuration):
- All above variables
- `WEBSITES_PORT=8080`
- `UPLOADS_DIR=/home/site/wwwroot/uploads`

## Common Commands

### Quick Commands (via Makefile)
```bash
# Initial setup
make setup

# Run development server
make run

# Run tests
make test

# Docker development (optimized for macOS)
make docker-dev

# Create new blog post
make new-post title="My New Post"

# Create new app (manual - create JSON in Resources/Apps/)
# Example: Resources/Apps/my-app.json

# View all commands
make help
```

### Direct Commands
```bash
# Local development
swift run

# Run tests
swift test

# Docker development
docker-compose up app-dev

# Docker production
docker-compose up app

# Build for production
docker build -t klabo-world .
```

## GitHub Actions Workflow Key Points
- Cache Swift PM dependencies with `.build` directory
- Run tests before deployment
- Use GitHub Container Registry (ghcr.io)
- Deploy with Azure publish profile secret
- Tag images with commit SHA for traceability

## Important Reminders
1. **ALWAYS** validate and sanitize file uploads
2. **NEVER** use `:latest` Docker tag in production
3. **ALWAYS** use type-safe configuration
4. **NEVER** store secrets in code
5. **ALWAYS** run as non-root in containers
6. **Log to stdout** for Azure compatibility
7. **Test before deployment** with CI/CD pipeline
8. **Use Makefile** for common commands - it's there to help!
9. **Check deployment readiness** with `make deploy-check`

## Implemented Features
- ✅ Blog system with Markdown and front matter
- ✅ Apps showcase system with JSON storage
- ✅ Admin panel with authentication
- ✅ Contact form with SMTP email
- ✅ Image upload with security
- ✅ Post scheduling via publishDate
- ✅ App scheduling via publishDate
- ✅ Full CRUD operations for both posts and apps
- ✅ Google Analytics integration
- ✅ Docker setup optimized for macOS
- ✅ Comprehensive test suite
- ✅ GitHub Actions CI/CD
- ✅ Helper scripts and Makefile
- ✅ Tailwind CSS for modern, responsive styling
- ✅ Syntax highlighting with Highlight.js

## Development Reminders
- Use the makefile for running, if it's not doing what you want, update the makefile, or add to it
- **CRITICAL**: ALWAYS ensure the server is running before attempting to view changes. Use `make run` in a separate terminal or run in background with `make run > server.log 2>&1 &`

## Task Completion Checklist
When completing any development task, ALWAYS:
1. **Ensure server is running**: The server must be accessible at http://localhost:8080
2. **Verify with curl**: Test the implemented feature with curl to confirm it's working
   - Example: `curl -s http://localhost:8080/posts | grep "search-input"`
3. **Open in browser**: Use `open http://localhost:8080/[relevant-path]` to show the user the changes

### Example completion workflow:
```bash
# 1. Start/verify server
make run  # or ensure it's already running
curl -I http://localhost:8080  # Verify it's responding

# 2. Test the feature
curl -s http://localhost:8080/posts/search?q=bitcoin | jq '.'  # Test API
curl -s http://localhost:8080/posts | grep -o "new-feature"     # Test HTML

# 3. Open for user
open http://localhost:8080/posts  # Show the implemented feature
```

This ensures the user can immediately see and interact with the changes without manual steps.

## Key Files to Know
- `Makefile` - All common commands
- `scripts/new-post.sh` - Create blog posts
- `scripts/deploy-check.sh` - Pre-deployment checklist
- `.env` - Local configuration (never commit!)
- `docker-compose.yml` - Docker services (app and app-dev)

## CI/CD Memory
- Got a CI error, can you check those actions after you push from now on. And check it now.
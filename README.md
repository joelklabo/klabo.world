# klabow.world - Personal Website & Blog

A modern personal website and blog built with Vapor 4 (Swift), featuring Markdown-based content management, an admin interface, and automated deployment to Azure.

## Quick Start

```bash
# First time setup
make setup

# Run development server
make run

# Run tests
make test

# Run with Docker
make docker-dev
```

## Features

- **Blog System**: Markdown-based blog posts with front matter metadata
- **Admin Interface**: Password-protected admin panel for content management
- **Contact Form**: SMTP-integrated contact form
- **Performance**: In-memory post caching for fast page loads
- **SEO**: Google Analytics integration
- **Security**: Type-safe configuration, secure file uploads, non-root Docker container
- **CI/CD**: Automated testing and deployment with GitHub Actions

## Tech Stack

- **Framework**: Vapor 4 (Swift)
- **Templating**: Leaf
- **Markdown**: Ink parser
- **Email**: SMTP via Mikroservices/Smtp
- **Container**: Docker with multi-stage builds
- **Deployment**: Azure App Service
- **CI/CD**: GitHub Actions

## Prerequisites

- Swift 6.0+
- Docker (optional, but recommended)
- Vapor toolbox: `brew install vapor`
- Make (usually pre-installed on macOS/Linux)

## Project Setup

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd KlaboWorld
make setup  # Creates .env file and installs dependencies
```

### 2. Configure Environment

Edit the `.env` file with your settings:

```bash
SMTP_HOST=smtp.example.com
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-smtp-password
ADMIN_PASSWORD=choose-a-strong-password
UPLOADS_DIR=./Public/uploads
# GA_TRACKING_ID=UA-XXXXXXXXX-X  # Optional Google Analytics
```

### 3. Run the Application

```bash
# Development server (Swift)
make run
# OR
swift run

# Development with Docker (recommended for macOS)
make docker-dev
# OR
docker-compose up app-dev

# Production mode with Docker
make docker-prod
```

The site will be available at `http://localhost:8080`

## Common Commands

### Development

```bash
# Build the project
make build
# OR
swift build

# Run tests
make test
# OR
swift test

# Clean build artifacts
make clean
# OR
swift package clean

# Format code
make format
# OR
swift-format -i -r Sources/ Tests/
```

### Docker Operations

```bash
# Build Docker image
make docker-build
# OR
docker-compose build

# Run development container
make docker-dev
# OR
docker-compose up app-dev

# Run production container
make docker-prod
# OR
docker-compose up app

# Stop all containers
make docker-down
# OR
docker-compose down

# View logs
make docker-logs
# OR
docker-compose logs -f
```

### Content Management

```bash
# Create a new blog post
make new-post title="My New Post"
# OR
./scripts/new-post.sh "My New Post"

# List all posts
make list-posts

# Build and serve for preview
make preview
```

## Admin Interface

### Accessing Admin Panel

1. Navigate to `http://localhost:8080/admin`
2. Login with:
   - Username: `admin`
   - Password: (value from `ADMIN_PASSWORD` in `.env`)

### Admin Features

- **Dashboard**: View all posts and their publish status
- **Compose**: Create new blog posts with Markdown
- **Image Upload**: Upload images for blog posts
- **Scheduling**: Set future publish dates for posts

## Blog Post Management

### Creating Posts Manually

Create a new Markdown file in `Resources/Posts/` with this format:

```markdown
---
title: Your Post Title
summary: A brief description of your post
date: 2025-01-03
publishDate: 2025-01-03
tags: swift, vapor, web
---

# Your Post Content

Write your content here using Markdown...
```

### Creating Posts via Script

```bash
make new-post title="My Awesome Post"
```

This creates a template in `Resources/Posts/` with:
- Proper front matter
- URL-friendly slug
- Today's date
- Ready for content

### Post Features

- **Scheduling**: Set `publishDate` in the future to schedule posts
- **Tags**: Comma-separated tags for categorization
- **Markdown Support**: Full Markdown syntax including code blocks
- **Image Embedding**: Upload via admin panel or place in `Public/uploads/`

## Development Workflow

### 1. Local Development

```bash
# Start the server with auto-reload
make dev

# In another terminal, run tests in watch mode
make test-watch
```

### 2. Making Changes

1. Edit code in `Sources/KlaboWorld/`
2. Server auto-reloads (if using `make dev`)
3. View changes at `http://localhost:8080`

### 3. Testing Changes

```bash
# Run all tests
make test

# Run specific test file
swift test --filter PostsTests

# Run with verbose output
make test-verbose
```

### 4. Committing Changes

```bash
# Check what will be committed
git status

# Run tests before committing
make pre-commit

# Commit changes
git add .
git commit -m "Your commit message"
```

## Project Structure

```
KlaboWorld/
├── Sources/KlaboWorld/
│   ├── Controllers/        # Route handlers
│   │   ├── PostsController.swift
│   │   ├── AdminController.swift
│   │   └── ContactController.swift
│   ├── Models/            # Data models
│   │   ├── PostMetadata.swift
│   │   └── SiteConfiguration.swift
│   ├── Middleware/        # Custom middleware
│   │   └── AdminAuthMiddleware.swift
│   ├── configure.swift    # App configuration
│   ├── routes.swift       # Route definitions
│   └── entrypoint.swift   # App entry point
├── Resources/
│   ├── Views/            # Leaf templates
│   │   ├── base.leaf     # Base layout
│   │   ├── index.leaf    # Homepage
│   │   ├── contact.leaf  # Contact form
│   │   ├── posts/        # Blog templates
│   │   └── admin/        # Admin templates
│   └── Posts/            # Markdown blog posts
├── Public/               # Static assets
│   ├── css/             # Stylesheets
│   └── uploads/         # User uploads
├── Tests/               # Test suite
├── Package.swift        # Swift package manifest
├── Dockerfile          # Production Docker image
├── docker-compose.yml  # Docker services
├── Makefile           # Command shortcuts
└── .env               # Environment variables (git-ignored)
```

## Deployment

### Local Production Test

```bash
# Build and run production Docker image
make docker-prod

# Test production build locally
make test-prod
```

### Azure Deployment

#### 1. Azure Setup

```bash
# Create Azure resources
az group create --name klabo-world-rg --location eastus
az appservice plan create --name klabo-world-plan --resource-group klabo-world-rg --sku B1 --is-linux
az webapp create --resource-group klabo-world-rg --plan klabo-world-plan --name klabow-world-app --deployment-container-image-name ghcr.io/yourusername/klabow-world:latest
```

#### 2. Configure Azure

```bash
# Set environment variables
az webapp config appsettings set --resource-group klabo-world-rg --name klabow-world-app --settings \
  WEBSITES_PORT=8080 \
  SMTP_HOST=$SMTP_HOST \
  SMTP_USERNAME=$SMTP_USERNAME \
  SMTP_PASSWORD=$SMTP_PASSWORD \
  ADMIN_PASSWORD=$ADMIN_PASSWORD \
  UPLOADS_DIR=/home/site/wwwroot/uploads \
  GA_TRACKING_ID=$GA_TRACKING_ID

# Enable persistent storage
az webapp config set --resource-group klabo-world-rg --name klabow-world-app --always-on true
```

#### 3. GitHub Actions Setup

1. Download publish profile from Azure Portal
2. Add to GitHub secrets as `AZURE_WEBAPP_PUBLISH_PROFILE`
3. Push to main branch to trigger deployment

### Manual Deployment

```bash
# Build and push Docker image
make docker-push

# Deploy to Azure
make deploy-azure
```

## Troubleshooting

### Common Issues

#### Swift Build Fails
```bash
# Clean and rebuild
make clean
make build
```

#### Docker Performance (macOS)
The docker-compose.yml is already optimized with named volumes for build cache.

#### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

#### Environment Variables Not Loading
```bash
# Check .env file exists
ls -la .env

# Verify format (no spaces around =)
cat .env
```

#### Admin Login Not Working
- Verify `ADMIN_PASSWORD` is set in `.env`
- Username must be exactly `admin`
- Check logs: `make logs`

### Debugging

```bash
# View application logs
make logs

# Run with debug logging
LOG_LEVEL=debug make run

# Check Docker container status
docker ps
docker logs klabowworld-app-1
```

## Testing

### Running Tests

```bash
# All tests
make test

# Specific test suite
swift test --filter PostsTests

# With coverage
make test-coverage
```

### Test Structure

- `PostsTests.swift` - Blog functionality tests
- `AdminTests.swift` - Admin authentication and features
- `KlaboWorldTests.swift` - Core application tests

### Writing Tests

Tests use Swift's built-in testing framework with the `@Test` attribute:

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

## Best Practices

### Security

1. **Never commit `.env` file** - It's gitignored for a reason
2. **Use strong passwords** - Especially for `ADMIN_PASSWORD`
3. **Validate uploads** - File type checking is enforced
4. **HTTPS in production** - Azure provides SSL certificates

### Performance

1. **Image optimization** - Compress images before uploading
2. **Post caching** - Posts are cached on startup
3. **Static assets** - Served efficiently via FileMiddleware

### Development

1. **Test before deploy** - Run `make pre-commit`
2. **Use Docker locally** - Matches production environment
3. **Check logs often** - `make logs` is your friend
4. **Keep posts organized** - Use consistent naming

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test`
5. Submit a pull request

## License

Copyright © 2025 klabow.world. All rights reserved.

## Support

- **Documentation**: See `docs/` folder
- **Vapor Docs**: https://docs.vapor.codes
- **Issues**: GitHub Issues
- **Contact**: Use the contact form on the site

---

Made with ❤️ using Vapor and Swift
***

# Implementing klabow.world: A Comprehensive Guide to Vapor, Docker, Azure, and CI/CD

Building a personal website with Vapor involves setting up the project with the latest conventions, structuring the code and content, and configuring a smooth development and deployment workflow. This guide is a complete walkthrough for creating a new Vapor 4 project from scratch, using Docker for local development, managing Markdown content, implementing a secure admin panel, and deploying to Azure App Service with a robust CI/CD pipeline on GitHub Actions. All steps and configurations adhere to current Vapor documentation and professional best practices.

### 0. IMPORTANT (Vapor documentation is in this folder, make sure to use this as a reference: https://github.com/vapor/docs/tree/main/docs)

Move the relevant documentation from this folder into a folder called `vapor/` inside the `docs/` directory so you can reference it more easily. Then Create a CLAUDE.md with whatever information woiuld be most useful to you (you can reference the files in the `vapor/` directory). Including the details from the plan itself. Whatever would be useful to you.

### 1. Creating a New Vapor Project (Swift & Vapor Setup)

**Install Swift and Vapor Toolbox:** Ensure you have an up-to-date Swift toolchain (Swift 5.8+). On macOS, install the Vapor Toolbox via Homebrew: `brew install vapor`. This provides a CLI for creating projects and other utilities.

**Initialize the Vapor app:** Use the Vapor CLI to create a new project named "KlaboWorld".

```bash
vapor new KlaboWorld
```

Vapor will fetch a template and prompt for components. To match our use case, **enable Leaf templating** (for rendering HTML pages) when prompted, and **include the Docker files**. Decline Fluent for now, as we will use Markdown files for blog posts. After creation, navigate into the project folder:

```bash
cd KlaboWorld
```

**Project’s initial build and run:** Vapor projects use Swift Package Manager (SPM). Open the project in VS Code (`code .`) or Xcode (`open Package.swift`). If using VS Code, install the official Vapor extension. To build and run the project, execute:

```bash
swift run
```

The first build resolves and downloads dependencies. On success, Vapor starts a development server on port 8080. Open a browser to `http://localhost:8080` to verify the “Hello, world!” page.

### 2. Project Structure and Vapor Best Practices

Vapor’s default project structure is organized for clarity and follows SPM conventions. Key directories include:
*   `Sources/App/`: Your application’s code.
    *   `Controllers/`: Define route handlers grouped by feature (e.g., `PostsController`).
    *   `Models/`: Define data models and `Content` structs.
    *   `configure.swift`: Called on startup to configure services, middleware, and routes.
    *   `routes.swift`: Registers the routes/endpoints for your app.
*   `Public/`: Static files that should be publicly served (images, CSS, JS, etc.).
*   `Resources/`: Non-public resources like Leaf views (`Views/`) or Markdown posts.
*   `Tests/`: Your application's test suite.

**Use Controllers for organization:** Rather than defining all routes in `routes.swift`, use controllers conforming to `RouteCollection` for modularity. Create `Sources/App/Controllers/PostsController.swift` and in `routes.swift`, register it:
`try app.register(collection: PostsController())`

**The `Content` Protocol:** Understand that `Content` is Vapor's cornerstone protocol for anything that can be encoded or decoded. It's used not just for database models, but for automatically decoding JSON request bodies, URL-encoded form data, and multipart form data directly into your Swift structs. This is the core mechanism for handling user input.

**Middleware Setup:** In `configure.swift`, ensure you enable `FileMiddleware` to serve static files from the `Public` directory. This one-liner makes assets like `/css/style.css` publicly accessible.
`app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))`

**Leaf Templating and Google Analytics:**
Leaf is used for rendering HTML. Create a base layout, `Resources/Views/base.leaf`, containing the common HTML structure. To add Google Analytics, embed the tracking script in this base template, using an environment variable for the Tracking ID to keep it out of your code.

In `base.leaf`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>#(title) - klabow.world</title>
    <!-- other head elements -->
    #if(gaTrackingID):
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=#(gaTrackingID)"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '#(gaTrackingID)');
    </script>
    #endif
</head>
<body>
    <header>...</header>
    <main>
        #import("body")
    </main>
    <footer>...</footer>
</body>
</html>
```
When rendering a view, pass the ID to the context. We'll manage this cleanly in the Configuration section.

### 3. Managing Blog Posts as Markdown Files

**Content Storage:** Create a folder for your Markdown posts at `Resources/Posts/`. These will be baked into the Docker image for fast, read-only access.

**Loading and Parsing:** Use a Swift Markdown library like `Ink` to convert `.md` files to HTML. Your route handler will read a file, parse its front matter (metadata like title, date) and content, convert the Markdown to HTML, and pass it to a Leaf template using Leaf's `#raw()` tag to render the generated HTML.

**Content Caching for Performance:** Reading from the disk for every request to the blog index page is inefficient. A robust approach is to scan the directory and parse all post metadata *once* on application startup and cache it.

In `configure.swift`:
```swift
// Define a PostMetadata struct to hold parsed data
struct PostMetadata: Codable { /* title, summary, date, slug, etc. */ }

// Define a key for application storage
struct PostsCacheKey: StorageKey { typealias Value = [PostMetadata] }

// On startup, load all posts and store them in the application's memory
let postMetadata = try await loadAllPostMetadata(from: app.directory.resourcesDirectory + "Posts/", on: app.fileio)
app.storage[PostsCacheKey.self] = postMetadata

// In your route, access the fast, in-memory cache:
let posts = req.application.storage[PostsCacheKey.self] ?? []
```
This avoids repeated disk I/O and dramatically improves performance.

### 4. Admin Interface: Composer, Image Uploads, and Scheduling

An admin panel needs authentication, secure file upload handling, and content creation logic.

**Authentication:** Protect admin routes with middleware. A simple, effective approach is a custom `AdminAuthMiddleware` that checks for a password or token stored securely in an environment variable.

**Image Uploads - Security and Limits:**
Vapor decodes multipart form data into a `Content` struct containing a `File` object.
1.  **Increase Upload Limit:** Vapor defaults to a 1MB request body limit. Increase this in `configure.swift` for your admin routes to allow for larger images and prevent `413 Payload Too Large` errors.
    `app.routes.defaultMaxBodySize = "10mb"`
2.  **Handle Uploads Securely:**
    *   **Validate File Type:** Check `file.contentType` to ensure it's an allowed type (e.g., `image/jpeg`, `image/png`). Reject unexpected types.
    *   **Sanitize Filename:** **Never** use the user-provided filename directly. Generate a unique, random filename (e.g., using `UUID().uuidString`) to prevent path traversal attacks and filename collisions.
    *   **Save to Persistent Storage:** Write the sanitized file to a persistent directory, which will be configured in the deployment section.

    ```swift
    // In your upload handler
    guard let imageFile = form.image, imageFile.data.readableBytes > 0 else {
        throw Abort(.badRequest, reason: "Image required.")
    }
    // This path will point to persistent storage in production
    let config = req.application.storage[ConfigKey.self]!
    let uniqueFilename = "\(UUID().uuidString).jpg" // Or use original extension
    
    try await req.fileio.writeFile(imageFile.data, at: config.uploadsDir + uniqueFilename)
    let publicURL = "/uploads/\(uniqueFilename)" // The URL to store and use
    ```

**Scheduling Posts:** Include a `publishDate` in your Markdown front matter. In your rendering logic, filter out any posts where `post.publishDate > Date()` to prevent them from appearing on the site until their scheduled time. This requires no background jobs and is simple and effective.

### 5. Configuration, Logging, and Environment Management

Vapor uses `.env` files for local development and environment variables in production.

**Type-Safe Configuration:** Instead of littering your code with `Environment.get("VAR_NAME")`, decode all required variables into a single, type-safe struct on startup. This fails fast if a configuration is missing and provides compile-time safety.

Create `Sources/App/Models/SiteConfiguration.swift`:
```swift
struct SiteConfiguration: Codable {
    let smtpHost: String
    let smtpUsername: String
    let smtpPassword: String
    let adminPassword: String
    let uploadsDir: String
    let gaTrackingID: String? // Optional so it can be omitted in dev
}
```
In `configure.swift`, decode this struct and register it as a service:
```swift
// Decode all env vars into the struct
let config = try Environment.decode(SiteConfiguration.self)

// Register it as a service for easy access
struct ConfigKey: StorageKey { typealias Value = SiteConfiguration }
app.storage[ConfigKey.self] = config

// Access it later in a route:
let siteConfig = req.application.storage[ConfigKey.self]!
// Now use siteConfig.smtpHost, siteConfig.adminPassword, etc.
```

**Logging:**
Vapor uses SwiftLog, which logs to `stdout` by default. This is the ideal behavior for containerized environments like Docker and Azure.
*   **Log Levels:** Configure log verbosity based on the environment in `configure.swift`:
    ```swift
    switch app.environment {
    case .production:
        app.logger.logLevel = .notice // Log important events
    case .development:
        app.logger.logLevel = .info   // More detailed for local dev
    default:
        app.logger.logLevel = .debug  // Most verbose for testing
    }
    ```
*   **Azure Log Integration:** Because Vapor logs to standard output, **Azure App Service will automatically capture these logs.** You can view them in real-time via the "Log stream" feature in the Azure Portal, requiring no extra configuration.

### 6. Docker-Based Local Development (macOS + VS Code)

Using Docker ensures your local environment mirrors production, preventing "it works on my machine" issues.

**Docker Performance on macOS:** Bind-mounting your source code from macOS into the Linux container can severely slow down SwiftPM compilations. The solution is to use a named Docker volume for the high-I/O `.build` directory.

Modify your `docker-compose.yml` for development:
```yaml
services:
  app:
    # ...
    volumes:
      - .:/app          # Mount your code for live editing
      - .build:/app/.build # Use a named volume for build artifacts

volumes:
  .build: {}           # Declare the named volume
```
This simple change keeps build artifacts on Docker's native Linux filesystem, dramatically speeding up compilation.

**Container Host Binding:** When running Vapor inside a container, it must bind to `0.0.0.0` to be accessible from your host machine, not `127.0.0.1`. The default Vapor `Dockerfile` already configures this (`--hostname 0.0.0.0`), but it's a critical detail to be aware of.

### 7. Email via SMTP in Vapor

Use a community package like `Mikroservices/Smtp`. Add it to `Package.swift`, then configure it in `configure.swift` using your type-safe config struct for robustness.

In `configure.swift`:
```swift
import Smtp

let config = app.storage[ConfigKey.self]!
app.smtp.configuration.hostname = config.smtpHost
app.smtp.configuration.signInMethod = .credentials(username: config.smtpUsername, password: config.smtpPassword)
app.smtp.configuration.secure = .ssl
```

Sending an email from a route handler at `no-reply@klabow.world` is straightforward with async/await:
`try await req.smtp.send(email)`

### 8. Deployment to Azure App Service (Docker)

Deploying to Azure involves building a production-ready Docker image and configuring Azure App Service to run it.

**Dockerfile:** The default Vapor `Dockerfile` is a multi-stage build optimized for production. It compiles the app, copies only the necessary binaries and `Resources`/`Public` directories, and runs as a non-root user for security.

**Persistent Storage for Uploads:** The Docker image is read-only. For file uploads and new Markdown posts, you must use persistent storage. Azure App Service provides a persistent volume automatically mounted at `/home`.
1.  **Configure Paths:** Use an environment variable (`UPLOADS_DIR`) in Azure to point to a directory on this share, e.g., `/home/site/wwwroot/uploads`.
2.  **Serve Persistent Files:** Your app must be told to serve files from this second location. In `configure.swift`, add a second `FileMiddleware`:

    ```swift
    // Serve from baked-in Public directory
    app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))
    
    // Also serve from the persistent uploads folder
    let config = app.storage[ConfigKey.self]!
    app.middleware.use(FileMiddleware(publicDirectory: config.uploadsDir))
    ```

**Azure App Service Configuration:**
*   Create an Azure App Service (Linux) and a Web App for Containers.
*   In **Configuration -> Application Settings**, add all your environment variables (from your `SiteConfiguration` struct).
*   Set `WEBSITES_PORT` to `8080`, as this is the port your Vapor container exposes.

### 9. Testing Your Application for Reliability

Testing is non-negotiable for a robust and maintainable application. Vapor has excellent testing support via the `XCTVapor` library. Writing tests ensures you can add features and refactor code with confidence.

**Test Targets:** Write tests in the `Tests/AppTests` directory, which is already set up in your project.

**Integration Tests:** The most valuable tests for a web app. They simulate real HTTP requests and assert responses, verifying that your routes, controllers, and logic work together correctly.

Example test for the blog index in `Tests/AppTests/PostTests.swift`:
```swift
@testable import App
import XCTVapor

final class PostTests: XCTestCase {
    func testGetPostsReturnsOk() throws {
        let app = Application(.testing)
        defer { app.shutdown() }
        try configure(app)

        try app.test(.GET, "posts") { res in
            XCTAssertEqual(res.status, .ok)
            XCTAssertContent([PostMetadata].self, res) { posts in
                XCTAssert(posts.count >= 0, "Post array should be returned")
            }
        }
    }
}
```
Your test suite must be executed in your CI/CD pipeline to automatically prevent broken code from being deployed.

### 10. Continuous Integration and Deployment with GitHub Actions

Automate your testing, building, and deployment pipeline with GitHub Actions. This creates a frictionless workflow from `git push` to a live site.

**GitHub Secrets:** In your repository settings under **Secrets and variables > Actions**, add a secret named `AZURE_WEBAPP_PUBLISH_PROFILE`. You can download this from your Azure Web App's deployment center.

**Production-Ready Workflow (`.github/workflows/deploy.yml`):**
This workflow tests the code, then builds and deploys a uniquely tagged Docker image on every push to the `main` branch.

```yaml
name: Build, Test, and Deploy to Azure

on:
  push:
    branches: [ main ]

env:
  AZURE_WEBAPP_NAME: klabow-world-app  # Your Azure Web App name
  IMAGE_NAME: klabow-world           # Name for your Docker image

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Cache Swift PM dependencies
        uses: actions/cache@v3
        with:
          path: .build
          key: ${{ runner.os }}-spm-${{ hashFiles('**/Package.resolved') }}
          restore-keys: |
            ${{ runner.os }}-spm-
      
      - name: Run Tests
        run: swift test

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          images: 'ghcr.io/${{ github.repository }}/${{ env.IMAGE_NAME }}:${{ github.sha }}'
```
**Key Workflow Features:**
*   **Testing:** The `swift test` step gates the deployment on code quality.
*   **Caching:** Speeds up the CI build process by caching dependencies.
*   **Immutable Image Tagging:** Uses the Git commit SHA (`${{ github.sha }}`) for image tags. This is a critical best practice that provides immutable, traceable deployments and enables easy rollbacks, unlike the risky `:latest` tag.


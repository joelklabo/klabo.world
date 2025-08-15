import Vapor
import Down

func routes(_ app: Application) throws {
    app.get { req async throws -> View in
        req.logger.info("Processing home page request")
        
        struct HomeContext: Content, ViewContext {
            let title: String
            let gaTrackingID: String?
            let popularTags: [TagCount]
            let recentPosts: [PostMetadata]
            let apps: [AppMetadata]
            let buildVersion: String?
            let buildDate: String?
            let buildInfo: String?
        }
        
        // Get recent posts
        let allPosts = req.application.storage[PostsCacheKey.self] ?? []
        let recentPosts = allPosts
            .filter { $0.isPublished }
            .sorted { $0.date > $1.date }
            .prefix(3)
            .map { $0 }
        
        // Get all apps
        let allApps = req.application.storage[AppsCacheKey.self] ?? []
        let publishedApps = allApps
            .filter { $0.isPublished }
            .sorted { $0.publishDate > $1.publishDate }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = HomeContext(
            title: "Welcome to klabo.world",
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            recentPosts: recentPosts,
            apps: publishedApps,
            buildVersion: baseContext.buildVersion,
            buildDate: baseContext.buildDate,
            buildInfo: baseContext.buildInfo
        )
        
        req.logger.info("Rendering home page")
        return try await req.view.render("index", context)
    }
    
    // Debug route for testing markdown parsing
    app.get("debug", "markdown") { req async throws -> Response in
        let testMarkdown = """
        # Test Heading
        
        This is a paragraph with **bold** and *italic* text.
        
        ```json
        {
          "test": "value",
          "number": 123
        }
        ```
        
        > This is a blockquote
        
        - List item 1
        - List item 2
        """
        
        let down = Down(markdownString: testMarkdown)
        let html = (try? down.toHTML()) ?? "<p>Error parsing markdown</p>"
        
        let debugHTML = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: monospace; margin: 20px; }
                .section { margin: 20px 0; padding: 20px; border: 1px solid #ccc; }
                pre { background: #f0f0f0; padding: 10px; overflow: auto; }
            </style>
        </head>
        <body>
            <h1>Markdown Debug</h1>
            
            <div class="section">
                <h2>Raw HTML from Ink:</h2>
                <pre>\(html.replacingOccurrences(of: "<", with: "&lt;").replacingOccurrences(of: ">", with: "&gt;"))</pre>
            </div>
            
            <div class="section">
                <h2>Rendered HTML:</h2>
                \(html)
            </div>
        </body>
        </html>
        """
        
        return Response(status: .ok, headers: ["Content-Type": "text/html"], body: .init(string: debugHTML))
    }
    
    // Debug route to check the hashing post specifically
    app.get("debug", "hashing-post") { req async throws -> Response in
        let postPath = req.application.directory.resourcesDirectory + "Posts/hashing-understanding-mining.md"
        
        do {
            let data = try await req.fileio.readFile(at: postPath).collect(upTo: 1024 * 1024)
            let fileContent = String(buffer: data)
            
            // Parse it the same way PostsController does
            let lines = fileContent.split(separator: "\n", omittingEmptySubsequences: false)
            
            var contentStartIndex = 0
            if lines.first == "---" {
                for (index, line) in lines.dropFirst().enumerated() {
                    if line == "---" {
                        contentStartIndex = index + 2
                        break
                    }
                }
            }
            
            let contentLines = lines.dropFirst(contentStartIndex)
            let content = contentLines.joined(separator: "\n")
            
            let down = Down(markdownString: content)
            let html = (try? down.toHTML()) ?? "<p>Error parsing markdown</p>"
            
            let debugHTML = """
            <!DOCTYPE html>
            <html>
            <head>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/swift.min.js"></script>
                <script>hljs.highlightAll();</script>
            </head>
            <body style="max-width: 800px; margin: 50px auto; font-family: sans-serif;">
                \(html)
            </body>
            </html>
            """
            
            return Response(status: .ok, headers: ["Content-Type": "text/html"], body: .init(string: debugHTML))
        } catch {
            return Response(status: .internalServerError, body: .init(string: "Error: \(error)"))
        }
    }
    
    // Global search endpoint
    app.get("search") { req async throws -> [SearchResult] in
        struct SearchQuery: Content {
            let q: String
        }
        
        let query = try req.query.decode(SearchQuery.self)
        let searchTerm = query.q.lowercased()
        
        guard searchTerm.count >= 2 else {
            throw Abort(.badRequest, reason: "Search query must be at least 2 characters")
        }
        
        var results: [SearchResult] = []
        
        // Search posts
        let posts = req.application.storage[PostsCacheKey.self] ?? []
        let matchingPosts = posts.filter { post in
            guard post.isPublished else { return false }
            
            if post.title.lowercased().contains(searchTerm) ||
               post.summary.lowercased().contains(searchTerm) {
                return true
            }
            
            if let tags = post.tags {
                return tags.contains { $0.lowercased().contains(searchTerm) }
            }
            
            return false
        }.prefix(5) // Limit to 5 posts
        
        for post in matchingPosts {
            results.append(SearchResult(
                type: "post",
                title: post.title,
                description: post.summary,
                url: "/posts/\(post.slug)",
                icon: nil,
                tags: post.tags
            ))
        }
        
        // Search apps
        let apps = req.application.storage[AppsCacheKey.self] ?? []
        let matchingApps = apps.filter { app in
            guard app.isPublished else { return false }
            
            return app.name.lowercased().contains(searchTerm) ||
                   app.fullDescription.lowercased().contains(searchTerm) ||
                   app.features.contains { $0.lowercased().contains(searchTerm) }
        }.prefix(5) // Limit to 5 apps
        
        for app in matchingApps {
            results.append(SearchResult(
                type: "app",
                title: app.name,
                description: String(app.fullDescription.prefix(100)) + (app.fullDescription.count > 100 ? "..." : ""),
                url: "/apps/\(app.slug)",
                icon: app.icon,
                tags: nil
            ))
        }
        
        // Sort by relevance (title matches first)
        results.sort { lhs, rhs in
            let lhsTitleMatch = lhs.title.lowercased().contains(searchTerm)
            let rhsTitleMatch = rhs.title.lowercased().contains(searchTerm)
            
            if lhsTitleMatch && !rhsTitleMatch {
                return true
            } else if !lhsTitleMatch && rhsTitleMatch {
                return false
            }
            
            // If both match or both don't match in title, keep original order
            return false
        }
        
        return Array(results.prefix(10)) // Return maximum 10 results total
    }
    
    try app.register(collection: PostsController())
    try app.register(collection: AppsController())
    try app.register(collection: AdminController())
    try app.register(collection: AuthController())
    try app.register(collection: GistController())
}

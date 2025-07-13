import Vapor
import Leaf
import Down

extension Array {
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}

struct PostsController: RouteCollection {
    func boot(routes: any RoutesBuilder) throws {
        let posts = routes.grouped("posts")
        
        // Main routes
        posts.get(use: index)
        posts.get("tags", use: allTags)
        posts.get("search", use: search)
        
        // Tag filtering
        posts.group("tag") { tag in
            tag.get(":tag", use: indexByTag)
        }
        
        // Individual post - must be last to avoid conflicts
        posts.get(":slug", use: show)
    }
    
    
    func index(req: Request) async throws -> View {
        let posts = req.application.storage[PostsCacheKey.self] ?? []
        let publishedPosts = posts.filter { $0.isPublished }
            .sorted { $0.date > $1.date }
        
        
        struct PostsContext: Content, ViewContext {
            let title: String
            let posts: [PostMetadata]
            let gaTrackingID: String?
            let popularTags: [TagCount]
            let buildVersion: String?
        }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = PostsContext(
            title: "Blog",
            posts: publishedPosts,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion
        )
        
        return try await req.view.render("posts/index", context)
    }
    
    func indexByTag(req: Request) async throws -> View {
        guard let tag = req.parameters.get("tag") else {
            throw Abort(.badRequest, reason: "Tag parameter is required")
        }
        
        let posts = req.application.storage[PostsCacheKey.self] ?? []
        let filteredPosts = posts.filter { post in
            post.isPublished && (post.tags?.contains(tag) ?? false)
        }.sorted { $0.date > $1.date }
        
        struct TagPostsContext: Content, ViewContext {
            let title: String
            let posts: [PostMetadata]
            let currentTag: String
            let gaTrackingID: String?
            let popularTags: [TagCount]
            let buildVersion: String?
        }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = TagPostsContext(
            title: "Posts tagged with \(tag)",
            posts: filteredPosts,
            currentTag: tag,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion
        )
        
        return try await req.view.render("posts/index", context)
    }
    
    func allTags(req: Request) async throws -> View {
        let allTags = req.application.storage[TagCountsCacheKey.self] ?? []
        
        struct AllTagsContext: Content, ViewContext {
            let title: String
            let tags: [TagCount]
            let gaTrackingID: String?
            let popularTags: [TagCount]
            let buildVersion: String?
        }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = AllTagsContext(
            title: "All Tags",
            tags: allTags,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion
        )
        
        return try await req.view.render("posts/tags", context)
    }
    
    func search(req: Request) async throws -> [PostMetadata] {
        struct SearchQuery: Content {
            let q: String
        }
        
        let query = try req.query.decode(SearchQuery.self)
        let searchTerm = query.q.lowercased()
        
        guard searchTerm.count >= 2 else {
            throw Abort(.badRequest, reason: "Search query must be at least 2 characters")
        }
        
        let posts = req.application.storage[PostsCacheKey.self] ?? []
        let filteredPosts = posts.filter { post in
            guard post.isPublished else { return false }
            
            // Search in title, summary, and tags
            if post.title.lowercased().contains(searchTerm) ||
               post.summary.lowercased().contains(searchTerm) {
                return true
            }
            
            if let tags = post.tags {
                return tags.contains { $0.lowercased().contains(searchTerm) }
            }
            
            return false
        }.sorted { $0.date > $1.date }
        
        // Return JSON for AJAX requests
        return Array(filteredPosts.prefix(10)) // Limit to 10 results
    }
    
    func show(req: Request) async throws -> View {
        guard let slug = req.parameters.get("slug") else {
            throw Abort(.badRequest, reason: "Slug parameter is required")
        }
        
        let posts = req.application.storage[PostsCacheKey.self] ?? []
        let publishedPosts = posts.filter { $0.isPublished }.sorted { $0.date > $1.date }
        
        guard let currentIndex = publishedPosts.firstIndex(where: { $0.slug == slug }),
              let postMetadata = publishedPosts[safe: currentIndex] else {
            throw Abort(.notFound)
        }
        
        // Get previous and next posts
        let previousPost = currentIndex > 0 ? publishedPosts[currentIndex - 1] : nil
        let nextPost = publishedPosts[safe: currentIndex + 1]
        
        struct PostContext: Content, ViewContext {
            let title: String
            let post: PostMetadata
            let content: String
            let gaTrackingID: String?
            let popularTags: [TagCount]
            let highlightjs: Bool = true
            let buildVersion: String?
            let readingTime: Int?
            let previousPost: PostMetadata?
            let nextPost: PostMetadata?
            let siteURL: String
        }
        
        let postPath = req.application.directory.resourcesDirectory + "Posts/\(slug).md"
        
        do {
            let data = try await req.fileio.readFile(at: postPath).collect(upTo: 1024 * 1024) // 1MB max
            let fileContent = String(buffer: data)
            let htmlContent = parseMarkdownToHTML(fileContent)
            
            // Calculate reading time (assuming 200 words per minute)
            let wordCount = fileContent.split(separator: " ").count
            let readingTime = max(1, wordCount / 200)
            
            let baseContext = BaseContext.create(from: req.application)
            let siteURL = Environment.get("SITE_URL") ?? "https://klabo.world"
            
            let context = PostContext(
                title: postMetadata.title,
                post: postMetadata,
                content: htmlContent,
                gaTrackingID: baseContext.gaTrackingID,
                popularTags: baseContext.popularTags,
                buildVersion: baseContext.buildVersion,
                readingTime: readingTime,
                previousPost: previousPost,
                nextPost: nextPost,
                siteURL: siteURL
            )
            
            return try await req.view.render("posts/show", context)
        } catch {
            throw Abort(.notFound)
        }
    }
    
    private func parseMarkdownToHTML(_ markdown: String) -> String {
        let lines = markdown.split(separator: "\n", omittingEmptySubsequences: false)
        
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
        
        // Down handles code blocks correctly and adds language classes automatically
        let down = Down(markdownString: content)
        
        do {
            return try down.toHTML()
        } catch {
            // Fallback to basic parsing if Down fails
            return "<p>Error parsing markdown: \(error)</p>"
        }
    }
}
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
            let buildDate: String?
            let buildInfo: String?
        }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = PostsContext(
            title: "Blog",
            posts: publishedPosts,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion,
            buildDate: baseContext.buildDate,
            buildInfo: baseContext.buildInfo
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
            let buildDate: String?
            let buildInfo: String?
        }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = TagPostsContext(
            title: "Posts tagged with \(tag)",
            posts: filteredPosts,
            currentTag: tag,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion,
            buildDate: baseContext.buildDate,
            buildInfo: baseContext.buildInfo
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
            let buildDate: String?
            let buildInfo: String?
        }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = AllTagsContext(
            title: "All Tags",
            tags: allTags,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion,
            buildDate: baseContext.buildDate,
            buildInfo: baseContext.buildInfo
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
            let buildDate: String?
            let buildInfo: String?
            let readingTime: Int?
            let previousPost: PostMetadata?
            let nextPost: PostMetadata?
            let siteURL: String
        }
        
        // Try to fetch content from GitHub first if available
        let fileContent: String
        
        if let github = req.application.github {
            // Try GitHub first
            let gitPath = "Resources/Posts/\(slug).md"
            do {
                fileContent = try await github.getFileContent(path: gitPath)
                req.logger.info("Fetched post from GitHub: \(gitPath)")
            } catch {
                req.logger.warning("Failed to fetch post from GitHub, trying local: \(error)")
                // Fallback to local file system
                let postPath = req.application.directory.resourcesDirectory + "Posts/\(slug).md"
                do {
                    let data = try await req.fileio.readFile(at: postPath).collect(upTo: 1024 * 1024) // 1MB max
                    fileContent = String(buffer: data)
                } catch {
                    // Also check uploads directory
                    let config = req.application.storage[ConfigKey.self]!
                    let uploadsPath = config.uploadsDir + "/posts/\(slug).md"
                    do {
                        let data = try await req.fileio.readFile(at: uploadsPath).collect(upTo: 1024 * 1024)
                        fileContent = String(buffer: data)
                    } catch {
                        throw Abort(.notFound)
                    }
                }
            }
        } else {
            // No GitHub service, use local file system
            let postPath = req.application.directory.resourcesDirectory + "Posts/\(slug).md"
            do {
                let data = try await req.fileio.readFile(at: postPath).collect(upTo: 1024 * 1024) // 1MB max
                fileContent = String(buffer: data)
            } catch {
                // Also check uploads directory
                let config = req.application.storage[ConfigKey.self]!
                let uploadsPath = config.uploadsDir + "/posts/\(slug).md"
                do {
                    let data = try await req.fileio.readFile(at: uploadsPath).collect(upTo: 1024 * 1024)
                    fileContent = String(buffer: data)
                } catch {
                    throw Abort(.notFound)
                }
            }
        }
        
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
            buildDate: baseContext.buildDate,
            buildInfo: baseContext.buildInfo,
            readingTime: readingTime,
            previousPost: previousPost,
            nextPost: nextPost,
            siteURL: siteURL
        )
        
        return try await req.view.render("posts/show", context)
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
            let html = try down.toHTML(.unsafe)  // Allow raw HTML for embeds
            // Process gist embeds after markdown conversion
            return processGistEmbeds(html)
        } catch {
            // Fallback to basic parsing if Down fails
            return "<p>Error parsing markdown: \(error)</p>"
        }
    }
    
    private func processGistEmbeds(_ html: String) -> String {
        // Pattern to match gist links in the converted HTML
        // Looking for: 📋 **[link text](gist url)**
        let processed = html.replacingOccurrences(
            of: #"<p>📋\s*<strong><a href="(https://gist\.github\.com/[^/]+/[a-f0-9]+)">([^<]+)</a></strong></p>"#,
            with: """
            <div class="gist-container" data-gist-url="$1" style="margin: 2rem 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(to bottom, rgb(55, 65, 81), rgb(31, 41, 55)); padding: 0.625rem 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 0, 0, 0.2); min-height: 44px;">
                    <span style="font-weight: 600; color: #f3f4f6; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; user-select: none;">📋 $2</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button onclick="copyGistFromHeader(this)" title="Copy code" style="display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; text-decoration: none; transition: all 0.15s ease; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: #e5e7eb; backdrop-filter: blur(10px);">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                            <span>Copy</span>
                        </button>
                        <a href="$1" target="_blank" title="View on GitHub" style="display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; text-decoration: none; transition: all 0.15s ease; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: #e5e7eb; backdrop-filter: blur(10px);">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span>GitHub</span>
                        </a>
                    </div>
                </div>
                <div class="gist-content-wrapper" style="position: relative; max-height: 66vh; overflow-y: auto; overflow-x: auto; background: rgb(17, 24, 39); border-radius: 0 0 6px 6px;">
                    <div class="gist-loader" style="padding: 3rem; text-align: center; color: #6b7280; font-style: italic; background: rgb(17, 24, 39);">Loading gist...</div>
                </div>
            </div>
            """,
            options: .regularExpression
        )
        
        return processed
    }
}
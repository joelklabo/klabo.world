import Vapor
import Leaf

struct ContextsController: RouteCollection {
    func boot(routes: any RoutesBuilder) throws {
        let contexts = routes.grouped("contexts")
        
        // HTML routes
        contexts.get(use: index)
        contexts.get("search", use: search)
        contexts.get("tags", use: allTags)
        
        // Tag filtering
        contexts.group("tag") { tag in
            tag.get(":tag", use: indexByTag)
        }
        
        // Individual context - must be last to avoid conflicts
        contexts.get(":slug", use: show)
        
        // API routes
        let api = routes.grouped("api", "contexts")
        api.get(use: apiList)
        api.get("search", use: apiSearch)
        api.get(":slug", use: apiGetContext)
        api.get(":slug", "raw", use: apiGetRawMarkdown)
    }
    
    func index(req: Request) async throws -> View {
        let contexts = req.application.storage[ContextsCacheKey.self] ?? []
        let publishedContexts = contexts.filter { $0.isPublished }
            .sorted { $0.updatedDate > $1.updatedDate }
        
        struct ContextsContext: Content, ViewContext {
            let title: String
            let contexts: [ContextMetadata]
            let gaTrackingID: String?
            let popularTags: [TagCount]
            let buildVersion: String?
            let buildDate: String?
            let buildInfo: String?
        }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = ContextsContext(
            title: "AI Agent Contexts",
            contexts: publishedContexts,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion,
            buildDate: baseContext.buildDate,
            buildInfo: baseContext.buildInfo
        )
        
        return try await req.view.render("contexts/index", context)
    }
    
    func indexByTag(req: Request) async throws -> View {
        guard let tag = req.parameters.get("tag") else {
            throw Abort(.badRequest, reason: "Tag parameter is required")
        }
        
        let contexts = req.application.storage[ContextsCacheKey.self] ?? []
        let filteredContexts = contexts.filter { context in
            context.isPublished && (context.tags?.contains(tag) ?? false)
        }.sorted { $0.updatedDate > $1.updatedDate }
        
        struct TagContextsContext: Content, ViewContext {
            let title: String
            let contexts: [ContextMetadata]
            let currentTag: String
            let gaTrackingID: String?
            let popularTags: [TagCount]
            let buildVersion: String?
            let buildDate: String?
            let buildInfo: String?
        }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = TagContextsContext(
            title: "Contexts tagged with \(tag)",
            contexts: filteredContexts,
            currentTag: tag,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion,
            buildDate: baseContext.buildDate,
            buildInfo: baseContext.buildInfo
        )
        
        return try await req.view.render("contexts/index", context)
    }
    
    func allTags(req: Request) async throws -> View {
        let contexts = req.application.storage[ContextsCacheKey.self] ?? []
        
        // Build tag frequency map for contexts
        var tagCounts: [String: Int] = [:]
        for context in contexts where context.isPublished {
            if let tags = context.tags {
                for tag in tags {
                    tagCounts[tag, default: 0] += 1
                }
            }
        }
        
        let sortedTags = tagCounts.map { TagCount(tag: $0.key, count: $0.value) }
            .sorted { $0.count > $1.count }
        
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
            title: "Context Tags",
            tags: sortedTags,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion,
            buildDate: baseContext.buildDate,
            buildInfo: baseContext.buildInfo
        )
        
        return try await req.view.render("contexts/tags", context)
    }
    
    func search(req: Request) async throws -> [ContextMetadata] {
        struct SearchQuery: Content {
            let q: String
        }
        
        let query = try req.query.decode(SearchQuery.self)
        let searchTerm = query.q.lowercased()
        
        guard searchTerm.count >= 2 else {
            throw Abort(.badRequest, reason: "Search query must be at least 2 characters")
        }
        
        let contexts = req.application.storage[ContextsCacheKey.self] ?? []
        let filteredContexts = contexts.filter { context in
            guard context.isPublished else { return false }
            
            // Search in title, summary, and tags
            if context.title.lowercased().contains(searchTerm) ||
               context.summary.lowercased().contains(searchTerm) {
                return true
            }
            
            if let tags = context.tags {
                return tags.contains { $0.lowercased().contains(searchTerm) }
            }
            
            return false
        }.sorted { $0.updatedDate > $1.updatedDate }
        
        return Array(filteredContexts.prefix(10))
    }
    
    func show(req: Request) async throws -> View {
        guard let slug = req.parameters.get("slug") else {
            throw Abort(.badRequest, reason: "Slug parameter is required")
        }
        
        let contexts = req.application.storage[ContextsCacheKey.self] ?? []
        
        guard let contextMetadata = contexts.first(where: { $0.slug == slug && $0.isPublished }) else {
            throw Abort(.notFound)
        }
        
        struct ContextShowContext: Content, ViewContext {
            let title: String
            let context: ContextMetadata
            let content: String
            let rawContent: String
            let gaTrackingID: String?
            let popularTags: [TagCount]
            let buildVersion: String?
            let buildDate: String?
            let buildInfo: String?
        }
        
        // Load the full content
        let fileContent = try await loadContextContent(slug: slug, on: req)
        let htmlContent = MarkdownUtility.parseMarkdownToHTML(fileContent)
        
        // Extract raw markdown without front matter
        let rawMarkdown = extractRawMarkdown(from: fileContent)
        
        let baseContext = BaseContext.create(from: req.application)
        let context = ContextShowContext(
            title: contextMetadata.title,
            context: contextMetadata,
            content: htmlContent,
            rawContent: rawMarkdown,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion,
            buildDate: baseContext.buildDate,
            buildInfo: baseContext.buildInfo
        )
        
        return try await req.view.render("contexts/show", context)
    }
    
    // MARK: - API Endpoints
    
    func apiList(req: Request) async throws -> [ContextMetadata] {
        let contexts = req.application.storage[ContextsCacheKey.self] ?? []
        return contexts.filter { $0.isPublished }
            .sorted { $0.updatedDate > $1.updatedDate }
    }
    
    func apiSearch(req: Request) async throws -> [ContextMetadata] {
        return try await search(req: req)
    }
    
    func apiGetContext(req: Request) async throws -> Context {
        guard let slug = req.parameters.get("slug") else {
            throw Abort(.badRequest, reason: "Slug parameter is required")
        }
        
        let contexts = req.application.storage[ContextsCacheKey.self] ?? []
        
        guard let contextMetadata = contexts.first(where: { $0.slug == slug && $0.isPublished }) else {
            throw Abort(.notFound)
        }
        
        let fileContent = try await loadContextContent(slug: slug, on: req)
        let htmlContent = MarkdownUtility.parseMarkdownToHTML(fileContent)
        let rawMarkdown = extractRawMarkdown(from: fileContent)
        
        return Context(
            metadata: contextMetadata,
            content: rawMarkdown,
            htmlContent: htmlContent
        )
    }
    
    func apiGetRawMarkdown(req: Request) async throws -> Response {
        guard let slug = req.parameters.get("slug") else {
            throw Abort(.badRequest, reason: "Slug parameter is required")
        }
        
        let contexts = req.application.storage[ContextsCacheKey.self] ?? []
        
        guard contexts.contains(where: { $0.slug == slug && $0.isPublished }) else {
            throw Abort(.notFound)
        }
        
        let fileContent = try await loadContextContent(slug: slug, on: req)
        let rawMarkdown = extractRawMarkdown(from: fileContent)
        
        return Response(
            status: .ok,
            headers: [
                "Content-Type": "text/markdown; charset=utf-8",
                "Content-Disposition": "inline; filename=\"\(slug).md\""
            ],
            body: .init(string: rawMarkdown)
        )
    }
    
    // MARK: - Helper Functions
    
    private func loadContextContent(slug: String, on req: Request) async throws -> String {
        let config = req.application.storage[ConfigKey.self]!
        
        // Try GitHub first if available
        if let github = req.application.github {
            let gitPath = "Resources/Contexts/\(slug).md"
            do {
                let content = try await github.getFileContent(path: gitPath)
                req.logger.info("Fetched context from GitHub: \(gitPath)")
                return content
            } catch {
                req.logger.warning("Failed to fetch context from GitHub: \(error)")
            }
        }
        
        // Try Resources directory
        let resourcePath = req.application.directory.resourcesDirectory + "Contexts/\(slug).md"
        do {
            let data = try await req.fileio.readFile(at: resourcePath).collect(upTo: 1024 * 1024)
            return String(buffer: data)
        } catch {
            // Try uploads directory
            let uploadsPath = config.uploadsDir + "/contexts/\(slug).md"
            do {
                let data = try await req.fileio.readFile(at: uploadsPath).collect(upTo: 1024 * 1024)
                return String(buffer: data)
            } catch {
                throw Abort(.notFound)
            }
        }
    }
    
    private func extractRawMarkdown(from content: String) -> String {
        let lines = content.split(separator: "\n", omittingEmptySubsequences: false)
        
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
        return contentLines.joined(separator: "\n")
    }
}
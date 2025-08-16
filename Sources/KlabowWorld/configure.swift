import Leaf
import Vapor
import NIOCore
import NIOPosix

// configures your application
public func configure(_ app: Application) async throws {
    // Add command support
    app.commands.use(HashPasswordCommand(), as: "hash-password")
    
    // Configure max body size for file uploads
    app.routes.defaultMaxBodySize = "10mb"
    
    // Configure logging based on environment
    switch app.environment {
    case .production:
        app.logger.logLevel = .notice
    case .development:
        app.logger.logLevel = .info
    default:
        app.logger.logLevel = .debug
    }
    
    // Load configuration from environment variables
    let config = try Environment.decode(SiteConfiguration.self)
    app.storage[ConfigKey.self] = config
    
    // Initialize GitHub service if token is configured
    if config.githubToken != nil {
        do {
            app.github = try GitHubService(app: app)
            app.logger.info("GitHub service initialized")
        } catch {
            app.logger.warning("GitHub service not available: \(error)")
        }
    } else {
        app.logger.info("GitHub token not configured - posts will be saved locally only")
    }
    
    // Ensure uploads directories exist
    let fileManager = FileManager.default
    let postsDir = config.uploadsDir + "/posts"
    let appsDir = config.uploadsDir + "/apps"
    
    do {
        // Create main uploads directory first
        try fileManager.createDirectory(atPath: config.uploadsDir, withIntermediateDirectories: true, attributes: nil)
        try fileManager.createDirectory(atPath: postsDir, withIntermediateDirectories: true, attributes: nil)
        try fileManager.createDirectory(atPath: appsDir, withIntermediateDirectories: true, attributes: nil)
        app.logger.info("Created/verified uploads directories at \(config.uploadsDir)")
    } catch {
        app.logger.error("Failed to create uploads directories: \(error)")
    }
    
    // Enable file serving from Public directory
    app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))
    
    // Enable file serving from persistent uploads directory (for Azure deployment)
    // This allows uploaded files to persist across container restarts
    app.middleware.use(FileMiddleware(publicDirectory: config.uploadsDir))
    
    // Configure Leaf templating
    app.views.use(.leaf)
    
    // Initialize session storage
    app.storage[SessionStorageKey.self] = [:]
    
    // Initialize rate limiter
    app.storage[RateLimiterKey.self] = RateLimiter()
    
    // Load all post metadata on startup
    do {
        var allPosts: [PostMetadata] = []
        
        // If GitHub is configured, fetch posts from there
        if let github = app.github {
            do {
                // Fetch list of posts from GitHub
                let files = try await github.listFiles(path: "Resources/Posts")
                var githubPosts: [PostMetadata] = []
                
                for file in files where file.hasSuffix(".md") {
                    do {
                        let content = try await github.getFileContent(path: "Resources/Posts/\(file)")
                        if let metadata = parsePostMetadata(from: content, filename: file) {
                            githubPosts.append(metadata)
                        }
                    } catch {
                        app.logger.warning("Failed to load post \(file) from GitHub: \(error)")
                    }
                }
                
                allPosts = githubPosts
                app.logger.info("Loaded \(githubPosts.count) posts from GitHub")
            } catch {
                app.logger.warning("Failed to load posts from GitHub, falling back to local: \(error)")
                // Fallback to local loading
                let resourcePosts = try await loadAllPostMetadata(from: app.directory.resourcesDirectory + "Posts/", on: app)
                let uploadsPosts = try await loadAllPostMetadata(from: config.uploadsDir + "/posts/", on: app)
                allPosts = resourcePosts
                for uploadPost in uploadsPosts {
                    allPosts.removeAll { $0.slug == uploadPost.slug }
                    allPosts.append(uploadPost)
                }
            }
        } else {
            // No GitHub configured, load from local file system
            let resourcePosts = try await loadAllPostMetadata(from: app.directory.resourcesDirectory + "Posts/", on: app)
            let uploadsPosts = try await loadAllPostMetadata(from: config.uploadsDir + "/posts/", on: app)
            
            allPosts = resourcePosts
            for uploadPost in uploadsPosts {
                allPosts.removeAll { $0.slug == uploadPost.slug }
                allPosts.append(uploadPost)
            }
            app.logger.info("Loaded \(allPosts.count) posts (\(resourcePosts.count) from Resources, \(uploadsPosts.count) from uploads)")
        }
        
        app.storage[PostsCacheKey.self] = allPosts
        
        // Build tag frequency map
        var tagCounts: [String: Int] = [:]
        for post in allPosts where post.isPublished {
            if let tags = post.tags {
                for tag in tags {
                    tagCounts[tag, default: 0] += 1
                }
            }
        }
        
        // Convert to sorted array of TagCount objects
        let sortedTags = tagCounts.map { TagCount(tag: $0.key, count: $0.value) }
            .sorted { $0.count > $1.count }
        
        app.storage[TagCountsCacheKey.self] = sortedTags
        app.logger.info("Found \(sortedTags.count) unique tags")
    } catch {
        app.logger.error("Failed to load posts: \(error)")
        app.storage[PostsCacheKey.self] = []
        app.storage[TagCountsCacheKey.self] = []
    }
    
    // Load all app metadata on startup - from both Resources and uploads directory
    do {
        // Load from Resources directory (bundled apps)
        let resourceApps = try await loadAllAppMetadata(from: app.directory.resourcesDirectory + "Apps/", on: app)
        
        // Load from uploads directory (dynamically created apps)
        let uploadsApps = try await loadAllAppMetadata(from: config.uploadsDir + "/apps/", on: app)
        
        // Combine both sources, removing duplicates based on slug
        var allApps = resourceApps
        
        // Add upload apps, preferring uploaded versions over resource versions
        for uploadApp in uploadsApps {
            allApps.removeAll { $0.slug == uploadApp.slug }
            allApps.append(uploadApp)
        }
        
        app.storage[AppsCacheKey.self] = allApps
        app.logger.info("Loaded \(allApps.count) apps (\(resourceApps.count) from Resources, \(uploadsApps.count) from uploads)")
    } catch {
        app.logger.error("Failed to load apps: \(error)")
        app.storage[AppsCacheKey.self] = []
    }
    
    // Register routes
    try routes(app)
}

func loadAllPostMetadata(from directory: String, on app: Application) async throws -> [PostMetadata] {
    var posts: [PostMetadata] = []
    
    let fileManager = FileManager.default
    
    do {
        try fileManager.createDirectory(atPath: directory, withIntermediateDirectories: true)
    } catch {
        app.logger.info("Posts directory already exists or could not be created")
    }
    
    guard let files = try? fileManager.contentsOfDirectory(atPath: directory) else {
        app.logger.warning("No posts directory found at \(directory)")
        return []
    }
    
    for file in files where file.hasSuffix(".md") {
        let filePath = directory + file
        
        do {
            let content = try String(contentsOfFile: filePath, encoding: .utf8)
            
            if let metadata = parsePostMetadata(from: content, filename: file) {
                posts.append(metadata)
            }
        } catch {
            app.logger.error("Failed to load post \(file): \(error)")
        }
    }
    
    return posts
}

func parsePostMetadata(from content: String, filename: String) -> PostMetadata? {
    let lines = content.split(separator: "\n", maxSplits: 20)
    
    guard lines.first == "---" else { return nil }
    
    var frontMatter: [String: String] = [:]
    var lineIndex = 1
    
    while lineIndex < lines.count && lines[lineIndex] != "---" {
        let line = String(lines[lineIndex])
        if let colonIndex = line.firstIndex(of: ":") {
            let key = String(line[..<colonIndex]).trimmingCharacters(in: .whitespaces)
            let value = String(line[line.index(after: colonIndex)...]).trimmingCharacters(in: .whitespaces)
            frontMatter[key] = value
        }
        lineIndex += 1
    }
    
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd"
    
    guard let title = frontMatter["title"],
          let summary = frontMatter["summary"],
          let dateString = frontMatter["date"],
          let date = dateFormatter.date(from: dateString) else {
        return nil
    }
    
    let publishDateString = frontMatter["publishDate"] ?? dateString
    let publishDate = dateFormatter.date(from: publishDateString) ?? date
    
    let slug = String(filename.dropLast(3))
    
    // Parse tags - handle both array format [tag1, tag2] and comma-separated format
    var tags: [String]? = nil
    if let tagsValue = frontMatter["tags"] {
        if tagsValue.hasPrefix("[") && tagsValue.hasSuffix("]") {
            // Array format: [tag1, tag2, tag3]
            let trimmed = tagsValue.dropFirst().dropLast()
            tags = trimmed.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        } else {
            // Simple comma-separated format
            tags = tagsValue.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        }
    }
    let featuredImage = frontMatter["featuredImage"]
    
    return PostMetadata(
        title: title,
        summary: summary,
        date: date,
        slug: slug,
        publishDate: publishDate,
        tags: tags,
        featuredImage: featuredImage
    )
}

func loadAllAppMetadata(from directory: String, on app: Application) async throws -> [AppMetadata] {
    var apps: [AppMetadata] = []
    
    let fileManager = FileManager.default
    
    do {
        try fileManager.createDirectory(atPath: directory, withIntermediateDirectories: true)
    } catch {
        app.logger.info("Apps directory already exists or could not be created")
    }
    
    guard let files = try? fileManager.contentsOfDirectory(atPath: directory) else {
        app.logger.warning("No apps directory found at \(directory)")
        return []
    }
    
    for file in files where file.hasSuffix(".json") {
        let filePath = directory + file
        
        do {
            let data = try Data(contentsOf: URL(fileURLWithPath: filePath))
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let appMetadata = try decoder.decode(AppMetadata.self, from: data)
            apps.append(appMetadata)
        } catch {
            app.logger.error("Failed to load app \(file): \(error)")
        }
    }
    
    return apps
}

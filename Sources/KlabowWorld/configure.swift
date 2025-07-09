import Leaf
import Vapor
import NIOCore
import NIOPosix
import Smtp

// configures your application
public func configure(_ app: Application) async throws {
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
    
    // Configure SMTP
    app.smtp.configuration.hostname = config.smtpHost
    app.smtp.configuration.signInMethod = .credentials(
        username: config.smtpUsername,
        password: config.smtpPassword
    )
    app.smtp.configuration.secure = .ssl
    
    // Enable file serving from Public directory
    app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))
    
    // Enable file serving from persistent uploads directory (for Azure deployment)
    // This allows uploaded files to persist across container restarts
    app.middleware.use(FileMiddleware(publicDirectory: config.uploadsDir))
    
    // Configure Leaf templating
    app.views.use(.leaf)
    
    // Load all post metadata on startup
    do {
        let postMetadata = try await loadAllPostMetadata(from: app.directory.resourcesDirectory + "Posts/", on: app)
        app.storage[PostsCacheKey.self] = postMetadata
        app.logger.info("Loaded \(postMetadata.count) posts")
        
        // Build tag frequency map
        var tagCounts: [String: Int] = [:]
        for post in postMetadata where post.isPublished {
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
    
    // Load all app metadata on startup
    do {
        let appMetadata = try await loadAllAppMetadata(from: app.directory.resourcesDirectory + "Apps/", on: app)
        app.storage[AppsCacheKey.self] = appMetadata
        app.logger.info("Loaded \(appMetadata.count) apps")
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

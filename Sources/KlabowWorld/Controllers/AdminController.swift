import Vapor
import Leaf
import Foundation
import NIOCore

struct AdminController: RouteCollection {
    func boot(routes: any RoutesBuilder) throws {
        let adminRoutes = routes.grouped("admin")
            .grouped(SessionAuthMiddleware()) // Re-enabled with bypassed auth for testing
        
        adminRoutes.get(use: index)
        adminRoutes.get("compose", use: compose)
        adminRoutes.post("compose", use: createPost)
        adminRoutes.post("upload", use: uploadImage)
        
        // Apps management routes
        adminRoutes.get("apps", use: appsIndex)
        adminRoutes.get("apps", "compose", use: composeApp)
        adminRoutes.post("apps", "compose", use: createApp)
        adminRoutes.get("apps", ":slug", "edit", use: editApp)
        adminRoutes.post("apps", ":slug", "edit", use: updateApp)
        adminRoutes.post("apps", ":slug", "delete", use: deleteApp)
        
        // Posts management routes
        adminRoutes.get("posts", ":slug", "edit", use: editPost)
        adminRoutes.post("posts", ":slug", "edit", use: updatePost)
        adminRoutes.post("posts", ":slug", "delete", use: deletePost)
    }
    
    func index(req: Request) async throws -> View {
        let config = req.application.storage[ConfigKey.self]!
        let posts = req.application.storage[PostsCacheKey.self] ?? []
        
        struct AdminContext: Encodable {
            let title: String
            let posts: [PostMetadata]
            let gaTrackingID: String?
        }
        
        let context = AdminContext(
            title: "Admin Dashboard",
            posts: posts.sorted { $0.date > $1.date },
            gaTrackingID: config.gaTrackingID
        )
        
        return try await req.view.render("admin/index", context)
    }
    
    func compose(req: Request) async throws -> View {
        let config = req.application.storage[ConfigKey.self]!
        
        struct ComposeContext: Encodable {
            let title: String
            let gaTrackingID: String?
        }
        
        let context = ComposeContext(
            title: "Compose New Post",
            gaTrackingID: config.gaTrackingID
        )
        
        return try await req.view.render("admin/compose", context)
    }
    
    func createPost(req: Request) async throws -> Response {
        struct PostForm: Content {
            let title: String
            let summary: String
            let content: String
            let tags: String?
            let publishDate: String?
        }
        
        let form: PostForm
        do {
            form = try req.content.decode(PostForm.self)
        } catch {
            req.logger.error("Failed to decode post form: \(error)")
            throw Abort(.badRequest, reason: "Invalid form data: \(error.localizedDescription)")
        }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        let currentDate = dateFormatter.string(from: Date())
        let publishDate = form.publishDate ?? currentDate
        
        let slug = form.title.lowercased()
            .replacingOccurrences(of: " ", with: "-")
            .replacingOccurrences(of: "[^a-z0-9-]", with: "", options: .regularExpression)
        
        var frontMatter = """
        ---
        title: \(form.title)
        summary: \(form.summary)
        date: \(currentDate)
        publishDate: \(publishDate)
        """
        
        if let tags = form.tags, !tags.isEmpty {
            frontMatter += "\ntags: \(tags)"
        }
        
        frontMatter += "\n---\n\n"
        
        let fullContent = frontMatter + form.content
        
        // Check if GitHub service is available
        if let github = req.application.github {
            // Use GitHub API to create/update the post in the repository
            let gitPath = "Resources/Posts/\(slug).md"
            let commitMessage = "Add blog post: \(form.title)"
            
            do {
                try await github.createOrUpdateFile(
                    path: gitPath,
                    content: fullContent,
                    message: commitMessage
                )
                req.logger.info("Successfully created post via GitHub API: \(gitPath)")
            } catch {
                req.logger.error("Failed to create post via GitHub API: \(error)")
                throw Abort(.internalServerError, reason: "Failed to create post on GitHub: \(error.localizedDescription)")
            }
        } else {
            // GitHub token not configured
            if req.application.environment == .production {
                req.logger.error("GitHub token not configured in production")
                throw Abort(.serviceUnavailable, reason: "GitHub integration not configured. Please set up a GitHub personal access token to enable blog post creation. See documentation for setup instructions.")
            }
            
            // For local development only, allow filesystem writes
            guard let config = req.application.storage[ConfigKey.self] else {
                req.logger.error("Configuration not found in storage")
                throw Abort(.internalServerError, reason: "Configuration not found")
            }
            
            // For local development, write to Resources/Posts directory
            let postsDir = req.application.directory.resourcesDirectory + "Posts"
            
            // Create posts directory if it doesn't exist
            let fileManager = FileManager.default
            do {
                try fileManager.createDirectory(atPath: postsDir, withIntermediateDirectories: true, attributes: nil)
                req.logger.info("Created/verified posts directory at: \(postsDir)")
            } catch {
                req.logger.error("Failed to create posts directory at \(postsDir): \(error)")
                throw Abort(.internalServerError, reason: "Failed to create posts directory: \(error.localizedDescription)")
            }
            
            let filePath = postsDir + "/\(slug).md"
            req.logger.info("Writing post locally to: \(filePath)")
            
            let data = Data(fullContent.utf8)
            let buffer = ByteBuffer(data: data)
            
            do {
                try await req.fileio.writeFile(buffer, at: filePath)
                req.logger.info("Successfully wrote post locally to: \(filePath)")
            } catch {
                req.logger.error("Failed to write file to \(filePath): \(error)")
                throw Abort(.internalServerError, reason: "Failed to write file: \(error.localizedDescription)")
            }
        }
        
        let newPost = PostMetadata(
            title: form.title,
            summary: form.summary,
            date: Date(),
            slug: slug,
            publishDate: dateFormatter.date(from: publishDate) ?? Date(),
            tags: form.tags?.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) },
            featuredImage: nil
        )
        
        var posts = req.application.storage[PostsCacheKey.self] ?? []
        posts.append(newPost)
        req.application.storage[PostsCacheKey.self] = posts
        
        return req.redirect(to: "/admin")
    }
    
    func uploadImage(req: Request) async throws -> Response {
        struct ImageUpload: Content {
            let image: File
        }
        
        let upload = try req.content.decode(ImageUpload.self)
        
        guard upload.image.data.readableBytes > 0 else {
            throw Abort(.badRequest, reason: "No image data provided")
        }
        
        let allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
        guard let contentType = upload.image.contentType,
              allowedTypes.contains(contentType.serialize()) else {
            throw Abort(.badRequest, reason: "Invalid image type. Allowed: JPEG, PNG, GIF, WebP")
        }
        
        let fileExtension: String
        switch contentType.serialize() {
        case "image/jpeg", "image/jpg": fileExtension = "jpg"
        case "image/png": fileExtension = "png"
        case "image/gif": fileExtension = "gif"
        case "image/webp": fileExtension = "webp"
        default: fileExtension = "jpg"
        }
        
        let uniqueFilename = "\(UUID().uuidString).\(fileExtension)"
        
        let config = req.application.storage[ConfigKey.self]!
        let uploadPath = config.uploadsDir + "/\(uniqueFilename)"
        
        req.logger.info("Attempting to upload image to: \(uploadPath)")
        
        // Ensure the uploads directory exists
        let fileManager = FileManager.default
        if !fileManager.fileExists(atPath: config.uploadsDir) {
            req.logger.warning("Uploads directory doesn't exist, creating: \(config.uploadsDir)")
            try fileManager.createDirectory(atPath: config.uploadsDir, withIntermediateDirectories: true, attributes: nil)
        }
        
        try await req.fileio.writeFile(upload.image.data, at: uploadPath)
        req.logger.info("Successfully uploaded image to: \(uploadPath)")
        
        let publicURL = "/uploads/\(uniqueFilename)"
        
        struct UploadResponse: Content {
            let url: String
        }
        
        return try await UploadResponse(url: publicURL).encodeResponse(for: req)
    }
    
    func appsIndex(req: Request) async throws -> View {
        let config = req.application.storage[ConfigKey.self]!
        let apps = req.application.storage[AppsCacheKey.self] ?? []
        
        struct AppsAdminContext: Encodable {
            let title: String
            let apps: [AppMetadata]
            let gaTrackingID: String?
        }
        
        let context = AppsAdminContext(
            title: "Apps Management",
            apps: apps.sorted { $0.publishDate > $1.publishDate },
            gaTrackingID: config.gaTrackingID
        )
        
        return try await req.view.render("admin/apps/index", context)
    }
    
    func composeApp(req: Request) async throws -> View {
        let config = req.application.storage[ConfigKey.self]!
        
        struct ComposeAppContext: Encodable {
            let title: String
            let gaTrackingID: String?
        }
        
        let context = ComposeAppContext(
            title: "Add New App",
            gaTrackingID: config.gaTrackingID
        )
        
        return try await req.view.render("admin/apps/compose", context)
    }
    
    func createApp(req: Request) async throws -> Response {
        struct AppForm: Content {
            let name: String
            let fullDescription: String
            let version: String
            let publishDate: String?
            let icon: String
            let screenshots: String
            let appStoreURL: String?
            let githubURL: String?
            let features: String
        }
        
        let form = try req.content.decode(AppForm.self)
        
        let slug = form.name.lowercased()
            .replacingOccurrences(of: " ", with: "-")
            .replacingOccurrences(of: "[^a-z0-9-]", with: "", options: .regularExpression)
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        let currentDate = dateFormatter.string(from: Date())
        let publishDateString = form.publishDate ?? currentDate
        
        let publishDateObj = dateFormatter.date(from: publishDateString) ?? Date()
        
        let screenshotsList = form.screenshots.split(separator: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        
        let featuresList = form.features.split(separator: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        
        let app = AppMetadata(
            name: form.name,
            slug: slug,
            fullDescription: form.fullDescription,
            version: form.version,
            publishDate: publishDateObj,
            icon: form.icon,
            screenshots: screenshotsList,
            appStoreURL: form.appStoreURL?.isEmpty == false ? form.appStoreURL : nil,
            githubURL: form.githubURL?.isEmpty == false ? form.githubURL : nil,
            features: featuresList
        )
        
        // Save app JSON file
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        
        // Get configuration for uploads directory
        guard let config = req.application.storage[ConfigKey.self] else {
            throw Abort(.internalServerError, reason: "Configuration not found")
        }
        
        // Write to persistent uploads directory instead of read-only Resources
        let appsDir = config.uploadsDir + "/apps"
        
        // Create apps directory if it doesn't exist
        let fileManager = FileManager.default
        try fileManager.createDirectory(atPath: appsDir, withIntermediateDirectories: true, attributes: nil)
        
        let jsonData = try encoder.encode(app)
        let filePath = appsDir + "/\(slug).json"
        
        try jsonData.write(to: URL(fileURLWithPath: filePath))
        
        // Update apps cache
        var apps = req.application.storage[AppsCacheKey.self] ?? []
        apps.append(app)
        req.application.storage[AppsCacheKey.self] = apps
        
        return req.redirect(to: "/admin/apps")
    }
    
    func editApp(req: Request) async throws -> View {
        guard let slug = req.parameters.get("slug") else {
            throw Abort(.badRequest)
        }
        
        let apps = req.application.storage[AppsCacheKey.self] ?? []
        guard let app = apps.first(where: { $0.slug == slug }) else {
            throw Abort(.notFound)
        }
        
        let config = req.application.storage[ConfigKey.self]!
        
        struct EditAppContext: Encodable {
            let title: String
            let app: AppMetadata
            let gaTrackingID: String?
            let screenshotsString: String
            let featuresString: String
        }
        
        let context = EditAppContext(
            title: "Edit App: \(app.name)",
            app: app,
            gaTrackingID: config.gaTrackingID,
            screenshotsString: app.screenshots.joined(separator: "\n"),
            featuresString: app.features.joined(separator: "\n")
        )
        
        return try await req.view.render("admin/apps/edit", context)
    }
    
    func updateApp(req: Request) async throws -> Response {
        guard let slug = req.parameters.get("slug") else {
            throw Abort(.badRequest)
        }
        
        struct AppForm: Content {
            let name: String
            let fullDescription: String
            let version: String
            let publishDate: String?
            let icon: String
            let screenshots: String
            let appStoreURL: String?
            let githubURL: String?
            let features: String
        }
        
        let form = try req.content.decode(AppForm.self)
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        let currentDate = dateFormatter.string(from: Date())
        let publishDateString = form.publishDate ?? currentDate
        
        let publishDateObj = dateFormatter.date(from: publishDateString) ?? Date()
        
        let screenshotsList = form.screenshots.split(separator: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        
        let featuresList = form.features.split(separator: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        
        let updatedApp = AppMetadata(
            name: form.name,
            slug: slug, // Keep the original slug
            fullDescription: form.fullDescription,
            version: form.version,
            publishDate: publishDateObj,
            icon: form.icon,
            screenshots: screenshotsList,
            appStoreURL: form.appStoreURL?.isEmpty == false ? form.appStoreURL : nil,
            githubURL: form.githubURL?.isEmpty == false ? form.githubURL : nil,
            features: featuresList
        )
        
        // Save updated app JSON file
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        
        let jsonData = try encoder.encode(updatedApp)
        let filePath = req.application.directory.resourcesDirectory + "Apps/\(slug).json"
        
        try jsonData.write(to: URL(fileURLWithPath: filePath))
        
        // Update apps cache
        var apps = req.application.storage[AppsCacheKey.self] ?? []
        if let index = apps.firstIndex(where: { $0.slug == slug }) {
            apps[index] = updatedApp
            req.application.storage[AppsCacheKey.self] = apps
        }
        
        return req.redirect(to: "/admin/apps")
    }
    
    func deleteApp(req: Request) async throws -> Response {
        guard let slug = req.parameters.get("slug") else {
            throw Abort(.badRequest)
        }
        
        // Delete the JSON file
        let filePath = req.application.directory.resourcesDirectory + "Apps/\(slug).json"
        let fileManager = FileManager.default
        try fileManager.removeItem(atPath: filePath)
        
        // Update apps cache
        var apps = req.application.storage[AppsCacheKey.self] ?? []
        apps.removeAll { $0.slug == slug }
        req.application.storage[AppsCacheKey.self] = apps
        
        return req.redirect(to: "/admin/apps")
    }
    
    func editPost(req: Request) async throws -> View {
        guard let slug = req.parameters.get("slug") else {
            throw Abort(.badRequest)
        }
        
        let posts = req.application.storage[PostsCacheKey.self] ?? []
        guard let post = posts.first(where: { $0.slug == slug }) else {
            throw Abort(.notFound)
        }
        
        // Read the markdown file content
        let fileContent: String
        
        if let github = req.application.github {
            // Fetch from GitHub
            let gitPath = "Resources/Posts/\(slug).md"
            do {
                fileContent = try await github.getFileContent(path: gitPath)
                req.logger.info("Fetched post from GitHub: \(gitPath)")
            } catch {
                req.logger.error("Failed to fetch post from GitHub: \(error)")
                throw Abort(.notFound, reason: "Post not found on GitHub")
            }
        } else {
            // Fallback to local file system
            let postPath = req.application.directory.resourcesDirectory + "Posts/\(slug).md"
            let data = try await req.fileio.readFile(at: postPath).collect(upTo: 1024 * 1024)
            fileContent = String(buffer: data)
        }
        
        // Extract content without front matter
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
        let content = lines.dropFirst(contentStartIndex).joined(separator: "\n")
        
        let config = req.application.storage[ConfigKey.self]!
        
        struct EditPostContext: Encodable {
            let title: String
            let post: PostMetadata
            let content: String
            let gaTrackingID: String?
            let tagsString: String
            let publishDateString: String
        }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        let context = EditPostContext(
            title: "Edit Post: \(post.title)",
            post: post,
            content: content,
            gaTrackingID: config.gaTrackingID,
            tagsString: post.tags?.joined(separator: ", ") ?? "",
            publishDateString: dateFormatter.string(from: post.publishDate)
        )
        
        return try await req.view.render("admin/posts/edit", context)
    }
    
    func updatePost(req: Request) async throws -> Response {
        guard let slug = req.parameters.get("slug") else {
            throw Abort(.badRequest)
        }
        
        struct PostForm: Content {
            let title: String
            let summary: String
            let content: String
            let tags: String?
            let publishDate: String?
        }
        
        let form = try req.content.decode(PostForm.self)
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        let currentDate = dateFormatter.string(from: Date())
        let publishDate = form.publishDate ?? currentDate
        
        var frontMatter = """
        ---
        title: \(form.title)
        summary: \(form.summary)
        date: \(currentDate)
        publishDate: \(publishDate)
        """
        
        if let tags = form.tags, !tags.isEmpty {
            frontMatter += "\ntags: \(tags)"
        }
        
        frontMatter += "\n---\n\n"
        
        let fullContent = frontMatter + form.content
        
        // Check if GitHub service is available
        if let github = req.application.github {
            // Use GitHub API to update the post in the repository
            let gitPath = "Resources/Posts/\(slug).md"
            let commitMessage = "Update blog post: \(form.title)"
            
            do {
                try await github.createOrUpdateFile(
                    path: gitPath,
                    content: fullContent,
                    message: commitMessage
                )
                req.logger.info("Successfully updated post via GitHub API: \(gitPath)")
            } catch {
                req.logger.error("Failed to update post via GitHub API: \(error)")
                throw Abort(.internalServerError, reason: "Failed to update post on GitHub: \(error.localizedDescription)")
            }
        } else {
            // GitHub token not configured
            if req.application.environment == .production {
                req.logger.error("GitHub token not configured in production")
                throw Abort(.serviceUnavailable, reason: "GitHub integration not configured. Please set up a GitHub personal access token to enable blog post updates.")
            }
            
            // For local development only
            let filePath = req.application.directory.resourcesDirectory + "Posts/\(slug).md"
            
            let data = Data(fullContent.utf8)
            let buffer = ByteBuffer(data: data)
            
            try await req.fileio.writeFile(buffer, at: filePath)
            req.logger.info("Updated post locally: \(filePath)")
        }
        
        // Update the post metadata in cache
        let updatedPost = PostMetadata(
            title: form.title,
            summary: form.summary,
            date: Date(),
            slug: slug,
            publishDate: dateFormatter.date(from: publishDate) ?? Date(),
            tags: form.tags?.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) },
            featuredImage: nil
        )
        
        var posts = req.application.storage[PostsCacheKey.self] ?? []
        if let index = posts.firstIndex(where: { $0.slug == slug }) {
            posts[index] = updatedPost
            req.application.storage[PostsCacheKey.self] = posts
        }
        
        return req.redirect(to: "/admin")
    }
    
    func deletePost(req: Request) async throws -> Response {
        guard let slug = req.parameters.get("slug") else {
            throw Abort(.badRequest)
        }
        
        // Get the post title for commit message
        let posts = req.application.storage[PostsCacheKey.self] ?? []
        let postTitle = posts.first(where: { $0.slug == slug })?.title ?? slug
        
        // Delete the markdown file
        if let github = req.application.github {
            // Use GitHub API to delete the post from the repository
            let gitPath = "Resources/Posts/\(slug).md"
            let commitMessage = "Delete blog post: \(postTitle)"
            
            do {
                try await github.deleteFile(
                    path: gitPath,
                    message: commitMessage
                )
                req.logger.info("Successfully deleted post via GitHub API: \(gitPath)")
            } catch {
                req.logger.error("Failed to delete post via GitHub API: \(error)")
                throw Abort(.internalServerError, reason: "Failed to delete post on GitHub: \(error.localizedDescription)")
            }
        } else {
            // GitHub token not configured
            if req.application.environment == .production {
                req.logger.error("GitHub token not configured in production")
                throw Abort(.serviceUnavailable, reason: "GitHub integration not configured. Please set up a GitHub personal access token to enable blog post deletion.")
            }
            
            // For local development only
            let filePath = req.application.directory.resourcesDirectory + "Posts/\(slug).md"
            let fileManager = FileManager.default
            try fileManager.removeItem(atPath: filePath)
            req.logger.info("Deleted post locally: \(filePath)")
        }
        
        // Update posts cache
        var updatedPosts = posts
        updatedPosts.removeAll { $0.slug == slug }
        req.application.storage[PostsCacheKey.self] = updatedPosts
        
        return req.redirect(to: "/admin")
    }
}
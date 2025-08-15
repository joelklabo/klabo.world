import Vapor
import Foundation

struct GitHubService {
    let app: Application
    let owner: String
    let repo: String
    let token: String
    
    init(app: Application) throws {
        self.app = app
        
        // Get GitHub configuration from environment
        guard let token = Environment.get("GITHUB_TOKEN") else {
            throw Abort(.internalServerError, reason: "GITHUB_TOKEN not configured")
        }
        
        self.token = token
        self.owner = Environment.get("GITHUB_OWNER") ?? "joelklabo"
        self.repo = Environment.get("GITHUB_REPO") ?? "KlaboWorld"
    }
    
    // MARK: - File Operations
    
    /// Create or update a file in the repository
    func createOrUpdateFile(path: String, content: String, message: String) async throws {
        let url = "https://api.github.com/repos/\(owner)/\(repo)/contents/\(path)"
        
        // First, try to get the file to see if it exists (for updates we need the SHA)
        var sha: String? = nil
        do {
            sha = try await getFileSHA(path: path)
        } catch {
            // File doesn't exist, which is fine for creation
            app.logger.info("File doesn't exist, will create new: \(path)")
        }
        
        // Prepare the request body
        let body = GitHubFileContent(
            message: message,
            content: Data(content.utf8).base64EncodedString(),
            sha: sha
        )
        
        var headers = HTTPHeaders()
        headers.add(name: .authorization, value: "Bearer \(token)")
        headers.add(name: .accept, value: "application/vnd.github.v3+json")
        headers.add(name: .userAgent, value: "KlaboWorld-Blog")
        
        let response = try await app.client.put(URI(string: url), headers: headers) { req in
            try req.content.encode(body)
        }
        
        guard response.status == .ok || response.status == .created else {
            let errorBody = try? response.content.decode(GitHubError.self)
            throw Abort(.internalServerError, reason: errorBody?.message ?? "Failed to create/update file on GitHub")
        }
        
        app.logger.info("Successfully created/updated file on GitHub: \(path)")
    }
    
    /// Get the content of a file from the repository
    func getFileContent(path: String) async throws -> String {
        let url = "https://api.github.com/repos/\(owner)/\(repo)/contents/\(path)"
        
        var headers = HTTPHeaders()
        headers.add(name: .authorization, value: "Bearer \(token)")
        headers.add(name: .accept, value: "application/vnd.github.v3+json")
        headers.add(name: .userAgent, value: "KlaboWorld-Blog")
        
        let response = try await app.client.get(URI(string: url), headers: headers)
        
        guard response.status == .ok else {
            throw Abort(.notFound, reason: "File not found on GitHub")
        }
        
        let fileResponse = try response.content.decode(GitHubFileResponse.self)
        
        guard let contentData = Data(base64Encoded: fileResponse.content.replacingOccurrences(of: "\n", with: "")) else {
            throw Abort(.internalServerError, reason: "Failed to decode file content")
        }
        
        return String(data: contentData, encoding: .utf8) ?? ""
    }
    
    /// Delete a file from the repository
    func deleteFile(path: String, message: String) async throws {
        let url = "https://api.github.com/repos/\(owner)/\(repo)/contents/\(path)"
        
        // Get the file SHA (required for deletion)
        let sha = try await getFileSHA(path: path)
        
        let body = GitHubDeleteContent(
            message: message,
            sha: sha
        )
        
        var headers = HTTPHeaders()
        headers.add(name: .authorization, value: "Bearer \(token)")
        headers.add(name: .accept, value: "application/vnd.github.v3+json")
        headers.add(name: .userAgent, value: "KlaboWorld-Blog")
        
        let response = try await app.client.delete(URI(string: url), headers: headers) { req in
            try req.content.encode(body)
        }
        
        guard response.status == .ok else {
            let errorBody = try? response.content.decode(GitHubError.self)
            throw Abort(.internalServerError, reason: errorBody?.message ?? "Failed to delete file on GitHub")
        }
        
        app.logger.info("Successfully deleted file on GitHub: \(path)")
    }
    
    /// List all files in a directory
    func listFiles(path: String) async throws -> [String] {
        let url = "https://api.github.com/repos/\(owner)/\(repo)/contents/\(path)"
        
        var headers = HTTPHeaders()
        headers.add(name: .authorization, value: "Bearer \(token)")
        headers.add(name: .accept, value: "application/vnd.github.v3+json")
        headers.add(name: .userAgent, value: "KlaboWorld-Blog")
        
        let response = try await app.client.get(URI(string: url), headers: headers)
        
        guard response.status == .ok else {
            throw Abort(.notFound, reason: "Directory not found on GitHub")
        }
        
        let files = try response.content.decode([GitHubFileItem].self)
        
        return files
            .filter { $0.type == "file" && $0.name.hasSuffix(".md") }
            .map { $0.name }
    }
    
    // MARK: - Helper Methods
    
    private func getFileSHA(path: String) async throws -> String {
        let url = "https://api.github.com/repos/\(owner)/\(repo)/contents/\(path)"
        
        var headers = HTTPHeaders()
        headers.add(name: .authorization, value: "Bearer \(token)")
        headers.add(name: .accept, value: "application/vnd.github.v3+json")
        headers.add(name: .userAgent, value: "KlaboWorld-Blog")
        
        let response = try await app.client.get(URI(string: url), headers: headers)
        
        guard response.status == .ok else {
            throw Abort(.notFound, reason: "File not found on GitHub")
        }
        
        let fileResponse = try response.content.decode(GitHubFileResponse.self)
        return fileResponse.sha
    }
}

// MARK: - GitHub API Models

struct GitHubFileContent: Content {
    let message: String
    let content: String // Base64 encoded
    let sha: String? // Required for updates, nil for creation
}

struct GitHubDeleteContent: Content {
    let message: String
    let sha: String
}

struct GitHubFileResponse: Content {
    let name: String
    let path: String
    let sha: String
    let content: String // Base64 encoded
    let type: String
}

struct GitHubFileItem: Content {
    let name: String
    let path: String
    let type: String // "file" or "dir"
}

struct GitHubError: Content {
    let message: String
}

// MARK: - Storage Key

struct GitHubServiceKey: StorageKey {
    typealias Value = GitHubService
}

extension Application {
    var github: GitHubService? {
        get { storage[GitHubServiceKey.self] }
        set { storage[GitHubServiceKey.self] = newValue }
    }
}
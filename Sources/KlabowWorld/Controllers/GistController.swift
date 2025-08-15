import Vapor
import Foundation

struct GistController: RouteCollection {
    func boot(routes: any RoutesBuilder) throws {
        let gists = routes.grouped("api", "gists")
        gists.get(":username", ":gistId", use: getGist)
    }
    
    @Sendable
    func getGist(req: Request) async throws -> GistResponse {
        let username = try req.parameters.require("username", as: String.self)
        let gistId = try req.parameters.require("gistId", as: String.self)
        
        let url = "https://api.github.com/gists/\(gistId)"
        
        let response = try await req.client.get(URI(string: url)) { clientReq in
            clientReq.headers.add(name: .userAgent, value: "Vapor-KlaboWorld")
            clientReq.headers.add(name: .accept, value: "application/vnd.github.v3+json")
        }
        
        guard response.status == .ok else {
            throw Abort(.notFound, reason: "Gist not found")
        }
        
        let gistData = try response.content.decode(GitHubGist.self)
        
        // Extract the first file's content (gists can have multiple files)
        guard let firstFile = gistData.files.values.first else {
            throw Abort(.notFound, reason: "No files in gist")
        }
        
        return GistResponse(
            description: gistData.description ?? "",
            filename: firstFile.filename,
            language: firstFile.language ?? "plaintext",
            content: firstFile.content
        )
    }
}

// MARK: - Models

struct GitHubGist: Codable {
    let description: String?
    let files: [String: GistFile]
}

struct GistFile: Codable {
    let filename: String
    let language: String?
    let content: String
}

struct GistResponse: Content {
    let description: String
    let filename: String
    let language: String
    let content: String
}
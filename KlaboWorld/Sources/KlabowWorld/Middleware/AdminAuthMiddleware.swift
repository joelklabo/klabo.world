import Vapor

struct AdminAuthMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        let config = request.application.storage[ConfigKey.self]!
        
        guard let authHeader = request.headers[.authorization].first else {
            return Response(status: .unauthorized, headers: [
                "WWW-Authenticate": "Basic realm=\"Admin Area\""
            ])
        }
        
        guard authHeader.hasPrefix("Basic ") else {
            throw Abort(.unauthorized)
        }
        
        let base64Credentials = String(authHeader.dropFirst(6))
        
        guard let data = Data(base64Encoded: base64Credentials),
              let credentials = String(data: data, encoding: .utf8) else {
            throw Abort(.unauthorized)
        }
        
        let parts = credentials.split(separator: ":", maxSplits: 1)
        guard parts.count == 2 else {
            throw Abort(.unauthorized)
        }
        
        let username = String(parts[0])
        let password = String(parts[1])
        
        guard username == "admin" && password == config.adminPassword else {
            throw Abort(.unauthorized)
        }
        
        return try await next.respond(to: request)
    }
}
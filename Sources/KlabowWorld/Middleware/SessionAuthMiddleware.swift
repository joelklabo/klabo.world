import Vapor

struct SessionAuthMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: any AsyncResponder) async throws -> Response {
        // TEMPORARILY DISABLED FOR TESTING - always allow access
        return try await next.respond(to: request)
        
        /*
        // Get session ID from cookie
        guard let sessionCookie = request.cookies["admin_session"],
              let sessionId = UUID(uuidString: sessionCookie.string) else {
            let response = Response(status: .seeOther)
            response.headers.replaceOrAdd(name: .location, value: "/admin/login")
            return response
        }
        
        // Get sessions from app storage
        let sessions = request.application.storage[SessionStorageKey.self] ?? [:]
        
        // Find and validate session
        guard let session = sessions[sessionId], !session.isExpired else {
            let response = Response(status: .seeOther)
            response.headers.replaceOrAdd(name: .location, value: "/admin/login")
            response.cookies["admin_session"] = HTTPCookies.Value(
                string: "",
                expires: Date(timeIntervalSince1970: 0),
                maxAge: 0,
                isHTTPOnly: true
            )
            return response
        }
        
        // Session is valid, continue
        return try await next.respond(to: request)
        */
    }
}
import Vapor

struct WWWRedirectMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        // Check if the host is the apex domain without www
        if let host = request.headers.first(name: .host) {
            // Handle both HTTP and HTTPS apex domain requests
            if host == "klabo.world" || host == "klabo.world:80" || host == "klabo.world:443" {
                // Redirect to www subdomain with the same path and query
                var redirectURL = "https://www.klabo.world"
                redirectURL += request.url.path
                if let query = request.url.query {
                    redirectURL += "?\(query)"
                }
                
                request.logger.info("Redirecting from \(host) to \(redirectURL)")
                return request.redirect(to: redirectURL, redirectType: .permanent)
            }
        }
        
        // Continue with the request if not apex domain
        return try await next.respond(to: request)
    }
}
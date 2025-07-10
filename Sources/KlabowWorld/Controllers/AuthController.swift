import Vapor

struct AuthController: RouteCollection {
    func boot(routes: any RoutesBuilder) throws {
        let auth = routes.grouped("admin")
        auth.get("login", use: showLogin)
        auth.post("login", use: login)
        auth.post("logout", use: logout)
        
        // Password change endpoint (requires authentication)
        let protected = auth.grouped(SessionAuthMiddleware())
        protected.get("change-password", use: showChangePassword)
        protected.post("change-password", use: changePassword)
    }
    
    func showLogin(req: Request) async throws -> View {
        let context = LoginContext(
            error: req.query["error"],
            csrfToken: generateCSRFToken()
        )
        return try await req.view.render("admin/login", context)
    }
    
    func login(req: Request) async throws -> Response {
        let loginData = try req.content.decode(LoginRequest.self)
        let config = req.application.storage[ConfigKey.self]!
        let rateLimiter = req.application.storage[RateLimiterKey.self] ?? RateLimiter()
        
        // Get client IP
        let clientIP = req.headers["X-Forwarded-For"].first ?? 
                      req.headers["X-Real-IP"].first ?? 
                      req.remoteAddress?.ipAddress ?? "unknown"
        
        // Check rate limiting
        let (allowed, waitTime) = rateLimiter.shouldAllowAttempt(for: clientIP)
        guard allowed else {
            throw Abort(.tooManyRequests, reason: "Too many login attempts. Please wait \(Int(waitTime ?? 60)) seconds.")
        }
        
        // For now, we'll skip CSRF validation since we're not using sessions yet
        // In production, you'd want to implement proper CSRF protection
        
        // Verify credentials
        guard loginData.username == "admin" else {
            rateLimiter.recordFailedAttempt(for: clientIP)
            return req.redirect(to: "/admin/login?error=Invalid+credentials")
        }
        
        // Verify password with BCrypt
        let hasher = try req.application.password.verify(loginData.password, created: config.adminPassword)
        guard hasher else {
            rateLimiter.recordFailedAttempt(for: clientIP)
            return req.redirect(to: "/admin/login?error=Invalid+credentials")
        }
        
        // Success - clear rate limiting
        rateLimiter.recordSuccessfulAttempt(for: clientIP)
        
        // Create session
        let session = AdminSession(rememberMe: loginData.rememberMe ?? false)
        var sessions = req.application.storage[SessionStorageKey.self] ?? [:]
        sessions[session.id] = session
        req.application.storage[SessionStorageKey.self] = sessions
        
        // Create response with session cookie
        let response = Response(status: .seeOther)
        response.headers.replaceOrAdd(name: .location, value: "/admin")
        response.cookies["admin_session"] = HTTPCookies.Value(
            string: session.id.uuidString,
            expires: session.expiresAt,
            maxAge: nil,
            domain: nil,
            path: "/",
            isSecure: req.application.environment == .production,
            isHTTPOnly: true,
            sameSite: .lax
        )
        
        return response
    }
    
    func logout(req: Request) async throws -> Response {
        // Get session ID from cookie
        if let sessionCookie = req.cookies["admin_session"],
           let sessionId = UUID(uuidString: sessionCookie.string) {
            // Remove session from storage
            var sessions = req.application.storage[SessionStorageKey.self] ?? [:]
            sessions.removeValue(forKey: sessionId)
            req.application.storage[SessionStorageKey.self] = sessions
        }
        
        // Clear cookie
        let response = Response(status: .seeOther)
        response.headers.replaceOrAdd(name: .location, value: "/")
        response.cookies["admin_session"] = HTTPCookies.Value(
            string: "",
            expires: Date(timeIntervalSince1970: 0),
            maxAge: 0,
            isHTTPOnly: true
        )
        
        return response
    }
    
    func showChangePassword(req: Request) async throws -> View {
        let context = ChangePasswordContext(
            csrfToken: generateCSRFToken(),
            error: req.query["error"],
            success: req.query["success"]
        )
        return try await req.view.render("admin/change-password", context)
    }
    
    func changePassword(req: Request) async throws -> Response {
        let changeData = try req.content.decode(ChangePasswordRequest.self)
        let config = req.application.storage[ConfigKey.self]!
        
        // For now, we'll skip CSRF validation since we're not using sessions yet
        // In production, you'd want to implement proper CSRF protection
        
        // Verify current password
        let hasher = try req.application.password.verify(changeData.currentPassword, created: config.adminPassword)
        guard hasher else {
            return req.redirect(to: "/admin/change-password?error=Current+password+is+incorrect")
        }
        
        // Validate new password
        guard changeData.newPassword.count >= 8 else {
            return req.redirect(to: "/admin/change-password?error=Password+must+be+at+least+8+characters")
        }
        
        guard changeData.newPassword == changeData.confirmPassword else {
            return req.redirect(to: "/admin/change-password?error=Passwords+do+not+match")
        }
        
        // Hash new password
        let newHash = try req.application.password.hash(changeData.newPassword)
        
        // Update configuration
        // Note: In production, you'll need to update the environment variable
        // This is just updating the in-memory config for demonstration
        print("⚠️  New password hash: \(newHash)")
        print("⚠️  Update your ADMIN_PASSWORD environment variable with this hash")
        print("⚠️  Then restart the application for the change to take effect")
        
        return req.redirect(to: "/admin/change-password?success=Password+update+initiated.+See+server+logs.")
    }
    
    private func generateCSRFToken() -> String {
        return UUID().uuidString
    }
}

// Request/Response models
struct LoginRequest: Content {
    let username: String
    let password: String
    let rememberMe: Bool?
    let csrfToken: String
}

struct ChangePasswordRequest: Content {
    let currentPassword: String
    let newPassword: String
    let confirmPassword: String
    let csrfToken: String
}

// View contexts
struct LoginContext: Encodable {
    let error: String?
    let csrfToken: String
}

struct ChangePasswordContext: Encodable {
    let csrfToken: String
    let error: String?
    let success: String?
}
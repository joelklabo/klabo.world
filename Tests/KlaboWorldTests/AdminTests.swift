@testable import KlaboWorld
import VaporTesting
import Testing

@Suite("Admin Tests")
struct AdminTests {
    
    @Test("Test admin routes require authentication")
    func testAdminAuthRequired() async throws {
        try await withApp(configure: configure) { app in
            app.storage[ConfigKey.self] = SiteConfiguration(
                adminPassword: "test-password",
                uploadsDir: "./test",
                gaTrackingID: nil,
                buildVersion: "test-build",
                buildDate: "test-date",
                githubToken: nil,
                githubOwner: nil,
                githubRepo: nil
            )
            
            // Test accessing admin without session cookie
            try await app.testing().test(.GET, "admin", afterResponse: { res async in
                #expect(res.status == .seeOther)
                #expect(res.headers["Location"].first == "/admin/login")
            })
        }
    }
    
    @Test("Test admin access with valid credentials")
    func testAdminAccessWithAuth() async throws {
        try await withApp(configure: configure) { app in
            // Hash the test password
            let hashedPassword = try app.password.hash("test-password")
            
            app.storage[ConfigKey.self] = SiteConfiguration(
                adminPassword: hashedPassword,
                uploadsDir: "./test",
                gaTrackingID: nil,
                buildVersion: "test-build",
                buildDate: "test-date",
                githubToken: nil,
                githubOwner: nil,
                githubRepo: nil
            )
            app.storage[PostsCacheKey.self] = []
            
            // First, login to get session cookie
            let loginBody = "username=admin&password=test-password&csrfToken=test"
            var sessionCookie: String? = nil
            
            try await app.testing().test(.POST, "admin/login", headers: [
                "Content-Type": "application/x-www-form-urlencoded"
            ], body: ByteBuffer(string: loginBody), afterResponse: { res async in
                #expect(res.status == .seeOther)
                #expect(res.headers["Location"].first == "/admin")
                // Extract session cookie
                if let setCookie = res.headers["Set-Cookie"].first {
                    let parts = setCookie.split(separator: ";").first?.split(separator: "=")
                    if parts?.first == "admin_session" {
                        sessionCookie = String(parts![1])
                    }
                }
                #expect(sessionCookie != nil)
            })
            
            // Now access admin with session cookie
            try await app.testing().test(.GET, "admin", headers: [
                "Cookie": "admin_session=\(sessionCookie!)"
            ], afterResponse: { res async in
                #expect(res.status == .ok)
                #expect(res.body.string.contains("Admin Dashboard"))
            })
        }
    }
    
    @Test("Test admin access with invalid credentials")
    func testAdminAccessWithInvalidAuth() async throws {
        try await withApp(configure: configure) { app in
            // Hash the test password
            let hashedPassword = try app.password.hash("test-password")
            
            app.storage[ConfigKey.self] = SiteConfiguration(
                adminPassword: hashedPassword,
                uploadsDir: "./test",
                gaTrackingID: nil,
                buildVersion: "test-build",
                buildDate: "test-date",
                githubToken: nil,
                githubOwner: nil,
                githubRepo: nil
            )
            
            // Try to login with wrong password
            let loginBody = "username=admin&password=wrong-password&csrfToken=test"
            
            try await app.testing().test(.POST, "admin/login", headers: [
                "Content-Type": "application/x-www-form-urlencoded"
            ], body: ByteBuffer(string: loginBody), afterResponse: { res async in
                #expect(res.status == .seeOther)
                #expect(res.headers["Location"].first == "/admin/login?error=Invalid+credentials")
            })
        }
    }
    
    @Test("Test image upload validation")
    func testImageUploadValidation() async throws {
        try await withApp(configure: configure) { app in
            // Hash the test password
            let hashedPassword = try app.password.hash("test-password")
            
            app.storage[ConfigKey.self] = SiteConfiguration(
                adminPassword: hashedPassword,
                uploadsDir: "./test",
                gaTrackingID: nil,
                buildVersion: "test-build",
                buildDate: "test-date",
                githubToken: nil,
                githubOwner: nil,
                githubRepo: nil
            )
            app.storage[PostsCacheKey.self] = []
            
            // First, login to get session cookie
            let loginBody = "username=admin&password=test-password&csrfToken=test"
            var sessionCookie: String? = nil
            
            try await app.testing().test(.POST, "admin/login", headers: [
                "Content-Type": "application/x-www-form-urlencoded"
            ], body: ByteBuffer(string: loginBody), afterResponse: { res async in
                if let setCookie = res.headers["Set-Cookie"].first {
                    let parts = setCookie.split(separator: ";").first?.split(separator: "=")
                    if parts?.first == "admin_session" {
                        sessionCookie = String(parts![1])
                    }
                }
            })
            
            // Test upload without image
            try await app.testing().test(.POST, "admin/upload", headers: [
                "Cookie": "admin_session=\(sessionCookie!)",
                "Content-Type": "multipart/form-data; boundary=test"
            ], body: ByteBuffer(string: "--test\r\nContent-Disposition: form-data; name=\"image\"\r\n\r\n\r\n--test--"), afterResponse: { res async in
                #expect(res.status == .badRequest)
            })
        }
    }
}
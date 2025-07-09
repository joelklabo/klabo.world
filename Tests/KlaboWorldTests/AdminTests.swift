@testable import KlaboWorld
import VaporTesting
import Testing

@Suite("Admin Tests")
struct AdminTests {
    
    @Test("Test admin routes require authentication")
    func testAdminAuthRequired() async throws {
        try await withApp(configure: configure) { app in
            app.storage[ConfigKey.self] = SiteConfiguration(
                smtpHost: "test",
                smtpUsername: "test",
                smtpPassword: "test",
                adminPassword: "test-password",
                uploadsDir: "./test",
                gaTrackingID: nil
            )
            
            try await app.testing().test(.GET, "admin", afterResponse: { res async in
                #expect(res.status == .unauthorized)
                #expect(res.headers["WWW-Authenticate"].first == "Basic realm=\"Admin Area\"")
            })
        }
    }
    
    @Test("Test admin access with valid credentials")
    func testAdminAccessWithAuth() async throws {
        try await withApp(configure: configure) { app in
            app.storage[ConfigKey.self] = SiteConfiguration(
                smtpHost: "test",
                smtpUsername: "test",
                smtpPassword: "test",
                adminPassword: "test-password",
                uploadsDir: "./test",
                gaTrackingID: nil
            )
            app.storage[PostsCacheKey.self] = []
            
            let basicAuth = "admin:test-password".data(using: .utf8)!.base64EncodedString()
            
            try await app.testing().test(.GET, "admin", headers: [
                "Authorization": "Basic \(basicAuth)"
            ], afterResponse: { res async in
                #expect(res.status == .ok)
                #expect(res.body.string.contains("Admin Dashboard"))
            })
        }
    }
    
    @Test("Test admin access with invalid credentials")
    func testAdminAccessWithInvalidAuth() async throws {
        try await withApp(configure: configure) { app in
            app.storage[ConfigKey.self] = SiteConfiguration(
                smtpHost: "test",
                smtpUsername: "test",
                smtpPassword: "test",
                adminPassword: "test-password",
                uploadsDir: "./test",
                gaTrackingID: nil
            )
            
            let basicAuth = "admin:wrong-password".data(using: .utf8)!.base64EncodedString()
            
            try await app.testing().test(.GET, "admin", headers: [
                "Authorization": "Basic \(basicAuth)"
            ], afterResponse: { res async in
                #expect(res.status == .unauthorized)
            })
        }
    }
    
    @Test("Test image upload validation")
    func testImageUploadValidation() async throws {
        try await withApp(configure: configure) { app in
            app.storage[ConfigKey.self] = SiteConfiguration(
                smtpHost: "test",
                smtpUsername: "test",
                smtpPassword: "test",
                adminPassword: "test-password",
                uploadsDir: "./test",
                gaTrackingID: nil
            )
            
            let basicAuth = "admin:test-password".data(using: .utf8)!.base64EncodedString()
            
            // Test upload without image
            try await app.testing().test(.POST, "admin/upload", headers: [
                "Authorization": "Basic \(basicAuth)",
                "Content-Type": "multipart/form-data; boundary=test"
            ], body: ByteBuffer(string: "--test\r\nContent-Disposition: form-data; name=\"image\"\r\n\r\n\r\n--test--"), afterResponse: { res async in
                #expect(res.status == .badRequest)
            })
        }
    }
}
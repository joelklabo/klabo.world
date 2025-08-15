@testable import KlaboWorld
import VaporTesting
import Testing

@Suite("App Tests")
struct KlaboWorldTests {
    
    @Test("Test home page")
    func testHomePage() async throws {
        try await withApp(configure: configure) { app in
            app.storage[ConfigKey.self] = SiteConfiguration(
                adminPassword: "test",
                uploadsDir: "./test",
                gaTrackingID: "UA-TEST-123",
                buildVersion: "test-build",
                buildDate: "test-date",
                githubToken: nil,
                githubOwner: nil,
                githubRepo: nil
            )
            
            try await app.testing().test(.GET, "/", afterResponse: { res async in
                #expect(res.status == .ok)
                #expect(res.headers.contentType == .html)
                let body = res.body.string
                #expect(body.contains("Welcome to klabo.world"))
                #expect(body.contains("UA-TEST-123"))
            })
        }
    }
    
    @Test("Test home page without Google Analytics")
    func testHomePageWithoutGA() async throws {
        try await withApp(configure: configure) { app in
            app.storage[ConfigKey.self] = SiteConfiguration(
                adminPassword: "test",
                uploadsDir: "./test",
                gaTrackingID: nil,
                buildVersion: "test-build",
                buildDate: "test-date",
                githubToken: nil,
                githubOwner: nil,
                githubRepo: nil
            )
            
            try await app.testing().test(.GET, "/", afterResponse: { res async in
                #expect(res.status == .ok)
                let body = res.body.string
                #expect(!body.contains("googletagmanager"))
            })
        }
    }
    
    @Test("Test static file serving")
    func testStaticFileServing() async throws {
        try await withApp(configure: configure) { app in
            app.storage[ConfigKey.self] = SiteConfiguration(
                adminPassword: "test",
                uploadsDir: "./test",
                gaTrackingID: nil,
                buildVersion: "test-build",
                buildDate: "test-date",
                githubToken: nil,
                githubOwner: nil,
                githubRepo: nil
            )
            
            try await app.testing().test(.GET, "/css/style.css", afterResponse: { res async in
                #expect(res.status == .ok)
                #expect(res.headers.contentType == .css)
            })
        }
    }
}

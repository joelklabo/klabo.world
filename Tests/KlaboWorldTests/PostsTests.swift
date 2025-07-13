@testable import KlaboWorld
import VaporTesting
import Testing
import Foundation

@Suite("Posts Tests")
struct PostsTests {
    
    @Test("Test posts index returns ok")
    func testPostsIndex() async throws {
        try await withApp(configure: configure) { app in
            // Set up test environment
            app.storage[ConfigKey.self] = SiteConfiguration(
                adminPassword: "test",
                uploadsDir: "./test",
                gaTrackingID: nil,
                buildVersion: "test-build"
            )
            app.storage[PostsCacheKey.self] = []
            
            try await app.testing().test(.GET, "posts", afterResponse: { res async in
                #expect(res.status == .ok)
                #expect(res.headers.contentType == .html)
            })
        }
    }
    
    @Test("Test post metadata parsing")
    func testPostMetadataParsing() throws {
        let content = """
        ---
        title: Test Post
        summary: This is a test post
        date: 2025-01-01
        publishDate: 2025-01-01
        tags: test, swift
        ---
        
        # Content here
        """
        
        let metadata = parsePostMetadata(from: content, filename: "test-post.md")
        
        #expect(metadata != nil)
        #expect(metadata?.title == "Test Post")
        #expect(metadata?.summary == "This is a test post")
        #expect(metadata?.slug == "test-post")
        #expect(metadata?.tags?.count == 2)
        #expect(metadata?.tags?.contains("test") == true)
        #expect(metadata?.tags?.contains("swift") == true)
    }
    
    @Test("Test post with missing metadata returns nil")
    func testInvalidPostMetadata() throws {
        let content = """
        # Just content without front matter
        """
        
        let metadata = parsePostMetadata(from: content, filename: "test.md")
        #expect(metadata == nil)
    }
    
    @Test("Test posts filtering by publish date")
    func testPublishDateFiltering() async throws {
        try await withApp(configure: configure) { app in
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            
            let pastDate = dateFormatter.date(from: "2020-01-01")!
            let futureDate = dateFormatter.date(from: "2030-01-01")!
            
            let posts = [
                PostMetadata(
                    title: "Published Post",
                    summary: "This is published",
                    date: pastDate,
                    slug: "published",
                    publishDate: pastDate,
                    tags: nil
                ),
                PostMetadata(
                    title: "Scheduled Post",
                    summary: "This is scheduled",
                    date: Date(),
                    slug: "scheduled",
                    publishDate: futureDate,
                    tags: nil
                )
            ]
            
            app.storage[ConfigKey.self] = SiteConfiguration(
                adminPassword: "test",
                uploadsDir: "./test",
                gaTrackingID: nil,
                buildVersion: "test-build"
            )
            app.storage[PostsCacheKey.self] = posts
            
            try await app.testing().test(.GET, "posts", afterResponse: { res async in
                #expect(res.status == .ok)
                let body = res.body.string
                #expect(body.contains("Published Post"))
                #expect(!body.contains("Scheduled Post"))
            })
        }
    }
}
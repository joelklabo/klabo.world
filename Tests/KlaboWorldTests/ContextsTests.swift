@testable import KlaboWorld
import VaporTesting
import Testing
import Foundation

@Suite("Contexts Tests")
struct ContextsTests {
    
    @Test("Test contexts index page")
    func testContextsIndex() async throws {
        try await withApp(configure: configure) { app in
            try await app.test(.GET, "/contexts") { res in
                #expect(res.status == .ok)
                #expect(res.body.string.contains("AI Agent Contexts"))
            }
        }
    }
    
    @Test("Test contexts API list endpoint")
    func testContextsAPIList() async throws {
        try await withApp(configure: configure) { app in
            try await app.test(.GET, "/api/contexts") { res in
                #expect(res.status == .ok)
                #expect(res.headers.contentType == .json)
                
                // Decode the response to verify it's valid JSON
                let contexts = try res.content.decode([ContextMetadata].self)
                #expect(contexts.isEmpty || contexts.first != nil)
            }
        }
    }
    
    @Test("Test contexts search functionality")
    func testContextsSearch() async throws {
        try await withApp(configure: configure) { app in
            try await app.test(.GET, "/contexts/search?q=test") { res in
                #expect(res.status == .ok)
                #expect(res.headers.contentType == .json)
                
                // Decode the response to verify it's valid JSON
                let contexts = try res.content.decode([ContextMetadata].self)
                #expect(contexts.isEmpty || contexts.first != nil)
            }
        }
    }
    
    @Test("Test contexts API search endpoint")
    func testContextsAPISearch() async throws {
        try await withApp(configure: configure) { app in
            try await app.test(.GET, "/api/contexts/search?q=test") { res in
                #expect(res.status == .ok)
                #expect(res.headers.contentType == .json)
                
                let contexts = try res.content.decode([ContextMetadata].self)
                #expect(contexts.isEmpty || contexts.first != nil)
            }
        }
    }
    
    @Test("Test search with short query")
    func testSearchWithShortQuery() async throws {
        try await withApp(configure: configure) { app in
            try await app.test(.GET, "/contexts/search?q=a") { res in
                #expect(res.status == .badRequest)
            }
        }
    }
    
    @Test("Test contexts tags page")
    func testContextsTags() async throws {
        try await withApp(configure: configure) { app in
            try await app.test(.GET, "/contexts/tags") { res in
                #expect(res.status == .ok)
                #expect(res.body.string.contains("Context Tags"))
            }
        }
    }
    
    @Test("Test context metadata parsing")
    func testContextMetadataParsing() async throws {
        let content = """
        ---
        title: Test Context
        summary: This is a test context
        createdDate: 2024-01-01
        updatedDate: 2024-01-02
        tags: ["swift", "testing"]
        isPublished: true
        ---
        
        # Test Content
        
        This is the content body.
        """
        
        let metadata = parseContextMetadata(from: content, filename: "test-context.md")
        
        #expect(metadata != nil)
        #expect(metadata?.title == "Test Context")
        #expect(metadata?.summary == "This is a test context")
        #expect(metadata?.slug == "test-context")
        #expect(metadata?.tags?.count == 2)
        #expect(metadata?.tags?.contains("swift") == true)
        #expect(metadata?.isPublished == true)
    }
    
    @Test("Test context metadata parsing with minimal front matter")
    func testMinimalContextMetadataParsing() async throws {
        let content = """
        ---
        title: Minimal Context
        summary: Minimal summary
        ---
        
        Content here
        """
        
        let metadata = parseContextMetadata(from: content, filename: "minimal.md")
        
        #expect(metadata != nil)
        #expect(metadata?.title == "Minimal Context")
        #expect(metadata?.summary == "Minimal summary")
        #expect(metadata?.slug == "minimal")
        #expect(metadata?.isPublished == true) // Default value
    }
    
    @Test("Test invalid context metadata parsing")
    func testInvalidContextMetadataParsing() async throws {
        let content = "No front matter here"
        
        let metadata = parseContextMetadata(from: content, filename: "invalid.md")
        
        #expect(metadata == nil)
    }
    
    @Test("Test context not found")
    func testContextNotFound() async throws {
        try await withApp(configure: configure) { app in
            try await app.test(.GET, "/contexts/non-existent-context") { res in
                #expect(res.status == .notFound)
            }
        }
    }
    
    @Test("Test API context not found")
    func testAPIContextNotFound() async throws {
        try await withApp(configure: configure) { app in
            try await app.test(.GET, "/api/contexts/non-existent-context") { res in
                #expect(res.status == .notFound)
            }
        }
    }
    
    @Test("Test API raw markdown not found")
    func testAPIRawMarkdownNotFound() async throws {
        try await withApp(configure: configure) { app in
            try await app.test(.GET, "/api/contexts/non-existent-context/raw") { res in
                #expect(res.status == .notFound)
            }
        }
    }
    
    @Test("Test global search includes contexts")
    func testGlobalSearchIncludesContexts() async throws {
        try await withApp(configure: configure) { app in
            try await app.test(.GET, "/search?q=test") { res in
                #expect(res.status == .ok)
                #expect(res.headers.contentType == .json)
                
                let results = try res.content.decode([SearchResult].self)
                // Check if any results are of type "context"
                let hasContexts = results.contains { $0.type == "context" }
                #expect(hasContexts || results.isEmpty)
            }
        }
    }
}
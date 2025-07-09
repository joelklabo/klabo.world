import Vapor

struct SearchResult: Content {
    let type: String // "post" or "app"
    let title: String
    let description: String
    let url: String
    let icon: String? // For apps
    let tags: [String]? // For posts
}
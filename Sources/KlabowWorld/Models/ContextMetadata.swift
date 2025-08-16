import Vapor
import Foundation

struct ContextMetadata: Content {
    let title: String
    let summary: String
    let tags: [String]?
    let slug: String
    let createdDate: Date
    let updatedDate: Date
    let isPublished: Bool
    
    enum CodingKeys: String, CodingKey {
        case title, summary, tags, slug, createdDate, updatedDate, isPublished
    }
    
    init(title: String, summary: String, tags: [String]? = nil, slug: String, createdDate: Date, updatedDate: Date, isPublished: Bool = true) {
        self.title = title
        self.summary = summary
        self.tags = tags
        self.slug = slug
        self.createdDate = createdDate
        self.updatedDate = updatedDate
        self.isPublished = isPublished
    }
    
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.title = try container.decode(String.self, forKey: .title)
        self.summary = try container.decode(String.self, forKey: .summary)
        self.tags = try container.decodeIfPresent([String].self, forKey: .tags)
        self.slug = try container.decode(String.self, forKey: .slug)
        self.createdDate = try container.decode(Date.self, forKey: .createdDate)
        self.updatedDate = try container.decode(Date.self, forKey: .updatedDate)
        self.isPublished = try container.decodeIfPresent(Bool.self, forKey: .isPublished) ?? true
    }
    
    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(title, forKey: .title)
        try container.encode(summary, forKey: .summary)
        try container.encode(tags, forKey: .tags)
        try container.encode(slug, forKey: .slug)
        try container.encode(createdDate, forKey: .createdDate)
        try container.encode(updatedDate, forKey: .updatedDate)
        try container.encode(isPublished, forKey: .isPublished)
    }
}

struct ContextsCacheKey: StorageKey {
    typealias Value = [ContextMetadata]
}

struct Context: Content {
    let metadata: ContextMetadata
    let content: String
    let htmlContent: String
}
import Vapor
import Foundation

struct PostMetadata: Content {
    let title: String
    let summary: String
    let date: Date
    let slug: String
    let publishDate: Date
    let tags: [String]?
    let featuredImage: String?
    
    var isPublished: Bool {
        publishDate <= Date()
    }
    
    enum CodingKeys: String, CodingKey {
        case title, summary, date, slug, publishDate, tags, featuredImage, isPublished
    }
    
    init(title: String, summary: String, date: Date, slug: String, publishDate: Date, tags: [String]? = nil, featuredImage: String? = nil) {
        self.title = title
        self.summary = summary
        self.date = date
        self.slug = slug
        self.publishDate = publishDate
        self.tags = tags
        self.featuredImage = featuredImage
    }
    
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.title = try container.decode(String.self, forKey: .title)
        self.summary = try container.decode(String.self, forKey: .summary)
        self.date = try container.decode(Date.self, forKey: .date)
        self.slug = try container.decode(String.self, forKey: .slug)
        self.publishDate = try container.decode(Date.self, forKey: .publishDate)
        self.tags = try container.decodeIfPresent([String].self, forKey: .tags)
        self.featuredImage = try container.decodeIfPresent(String.self, forKey: .featuredImage)
    }
    
    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(title, forKey: .title)
        try container.encode(summary, forKey: .summary)
        try container.encode(date, forKey: .date)
        try container.encode(slug, forKey: .slug)
        try container.encode(publishDate, forKey: .publishDate)
        try container.encode(tags, forKey: .tags)
        try container.encode(featuredImage, forKey: .featuredImage)
        try container.encode(isPublished, forKey: .isPublished)
    }
}

struct PostsCacheKey: StorageKey {
    typealias Value = [PostMetadata]
}

struct Post: Content {
    let metadata: PostMetadata
    let content: String
    let htmlContent: String
}

struct TagCount: Codable, Content {
    let tag: String
    let count: Int
}

struct TagCountsCacheKey: StorageKey {
    typealias Value = [TagCount]
}
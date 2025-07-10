import Vapor
import Foundation

struct AppMetadata: Content {
    let name: String
    let slug: String
    let fullDescription: String
    let version: String
    let publishDate: Date
    let icon: String
    let screenshots: [String]
    let appStoreURL: String?
    let githubURL: String?
    let features: [String]
    
    var isPublished: Bool {
        publishDate <= Date()
    }
    
    var primaryURL: String? {
        appStoreURL ?? githubURL
    }
    
    enum CodingKeys: String, CodingKey {
        case name, slug, fullDescription, version, publishDate
        case icon, screenshots, appStoreURL, githubURL
        case features, isPublished
    }
    
    init(name: String, slug: String, fullDescription: String,
         version: String, publishDate: Date, icon: String,
         screenshots: [String], appStoreURL: String? = nil,
         githubURL: String? = nil, features: [String]) {
        self.name = name
        self.slug = slug
        self.fullDescription = fullDescription
        self.version = version
        self.publishDate = publishDate
        self.icon = icon
        self.screenshots = screenshots
        self.appStoreURL = appStoreURL
        self.githubURL = githubURL
        self.features = features
    }
    
    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.name = try container.decode(String.self, forKey: .name)
        self.slug = try container.decode(String.self, forKey: .slug)
        self.fullDescription = try container.decode(String.self, forKey: .fullDescription)
        self.version = try container.decode(String.self, forKey: .version)
        self.publishDate = try container.decode(Date.self, forKey: .publishDate)
        self.icon = try container.decode(String.self, forKey: .icon)
        self.screenshots = try container.decode([String].self, forKey: .screenshots)
        self.appStoreURL = try container.decodeIfPresent(String.self, forKey: .appStoreURL)
        self.githubURL = try container.decodeIfPresent(String.self, forKey: .githubURL)
        self.features = try container.decode([String].self, forKey: .features)
    }
    
    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(name, forKey: .name)
        try container.encode(slug, forKey: .slug)
        try container.encode(fullDescription, forKey: .fullDescription)
        try container.encode(version, forKey: .version)
        try container.encode(publishDate, forKey: .publishDate)
        try container.encode(icon, forKey: .icon)
        try container.encode(screenshots, forKey: .screenshots)
        try container.encode(appStoreURL, forKey: .appStoreURL)
        try container.encode(githubURL, forKey: .githubURL)
        try container.encode(features, forKey: .features)
        try container.encode(isPublished, forKey: .isPublished)
    }
}

struct AppsCacheKey: StorageKey {
    typealias Value = [AppMetadata]
}
import Vapor

protocol ViewContext: Content {
    var gaTrackingID: String? { get }
    var popularTags: [TagCount] { get }
    var buildVersion: String? { get }
}

struct BaseContext {
    let gaTrackingID: String?
    let popularTags: [TagCount]
    let buildVersion: String?
    
    static func create(from app: Application) -> BaseContext {
        let config = app.storage[ConfigKey.self]!
        let allTags = app.storage[TagCountsCacheKey.self] ?? []
        let popularTags = Array(allTags.prefix(6))
        
        return BaseContext(
            gaTrackingID: config.gaTrackingID, 
            popularTags: popularTags,
            buildVersion: config.buildVersion
        )
    }
}
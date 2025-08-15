import Vapor

protocol ViewContext: Content {
    var gaTrackingID: String? { get }
    var popularTags: [TagCount] { get }
    var buildVersion: String? { get }
    var buildDate: String? { get }
    var buildInfo: String? { get }
}

struct BaseContext {
    let gaTrackingID: String?
    let popularTags: [TagCount]
    let buildVersion: String?
    let buildDate: String?
    
    var buildInfo: String? {
        guard let version = buildVersion else { return nil }
        
        // Get last 8 characters of the commit hash
        let shortHash = String(version.suffix(8))
        
        // Format the date if available
        if let dateString = buildDate {
            // Parse ISO date and format it nicely
            let formatter = ISO8601DateFormatter()
            if let date = formatter.date(from: dateString) {
                let displayFormatter = DateFormatter()
                displayFormatter.dateStyle = .medium
                displayFormatter.timeStyle = .short
                return "\(shortHash) (\(displayFormatter.string(from: date)))"
            }
            // If we can't parse it, just use the raw date
            return "\(shortHash) (\(dateString))"
        }
        
        return shortHash
    }
    
    static func create(from app: Application) -> BaseContext {
        let config = app.storage[ConfigKey.self]!
        let allTags = app.storage[TagCountsCacheKey.self] ?? []
        let popularTags = Array(allTags.prefix(6))
        
        return BaseContext(
            gaTrackingID: config.gaTrackingID, 
            popularTags: popularTags,
            buildVersion: config.buildVersion,
            buildDate: config.buildDate
        )
    }
}
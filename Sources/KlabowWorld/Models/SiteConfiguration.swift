import Vapor
import Foundation

struct SiteConfiguration: Codable {
    let adminPassword: String
    let uploadsDir: String
    let gaTrackingID: String?
    let buildVersion: String?
    let buildDate: String?
    let githubToken: String?
    let githubOwner: String?
    let githubRepo: String?
}

struct ConfigKey: StorageKey {
    typealias Value = SiteConfiguration
}

extension Environment {
    static func decode<T: Decodable>(_ type: T.Type) throws -> T {
        let data = try JSONSerialization.data(withJSONObject: [
            "adminPassword": get("ADMIN_PASSWORD") ?? "",
            "uploadsDir": get("UPLOADS_DIR") ?? "./Public/uploads",
            "gaTrackingID": get("GA_TRACKING_ID"),
            "buildVersion": get("BUILD_VERSION"),
            "buildDate": get("BUILD_DATE"),
            "githubToken": get("GITHUB_TOKEN"),
            "githubOwner": get("GITHUB_OWNER") ?? "joelklabo",
            "githubRepo": get("GITHUB_REPO") ?? "KlaboWorld"
        ])
        return try JSONDecoder().decode(T.self, from: data)
    }
}
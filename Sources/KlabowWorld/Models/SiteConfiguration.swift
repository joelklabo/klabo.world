import Vapor
import Foundation

struct SiteConfiguration: Codable {
    let smtpHost: String
    let smtpUsername: String
    let smtpPassword: String
    let adminPassword: String
    let uploadsDir: String
    let gaTrackingID: String?
    let buildVersion: String?
}

struct ConfigKey: StorageKey {
    typealias Value = SiteConfiguration
}

extension Environment {
    static func decode<T: Decodable>(_ type: T.Type) throws -> T {
        let data = try JSONSerialization.data(withJSONObject: [
            "smtpHost": get("SMTP_HOST") ?? "",
            "smtpUsername": get("SMTP_USERNAME") ?? "",
            "smtpPassword": get("SMTP_PASSWORD") ?? "",
            "adminPassword": get("ADMIN_PASSWORD") ?? "",
            "uploadsDir": get("UPLOADS_DIR") ?? "./Public/uploads",
            "gaTrackingID": get("GA_TRACKING_ID"),
            "buildVersion": get("BUILD_VERSION")
        ])
        return try JSONDecoder().decode(T.self, from: data)
    }
}
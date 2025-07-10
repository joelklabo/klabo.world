import Vapor
import Leaf

struct AppsController: RouteCollection {
    func boot(routes: any RoutesBuilder) throws {
        let apps = routes.grouped("apps")
        
        // Main routes
        apps.get(use: index)
        
        // Individual app - must be last to avoid conflicts
        apps.get(":slug", use: show)
    }
    
    func index(req: Request) async throws -> View {
        let apps = req.application.storage[AppsCacheKey.self] ?? []
        let publishedApps = apps.filter { $0.isPublished }
            .sorted { $0.publishDate > $1.publishDate }
        
        struct AppsContext: Content, ViewContext {
            let title: String
            let apps: [AppMetadata]
            let gaTrackingID: String?
            let popularTags: [TagCount]
            let buildVersion: String?
        }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = AppsContext(
            title: "Apps",
            apps: publishedApps,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion
        )
        
        return try await req.view.render("apps/index", context)
    }
    
    func show(req: Request) async throws -> View {
        guard let slug = req.parameters.get("slug") else {
            throw Abort(.badRequest, reason: "Slug parameter is required")
        }
        
        let apps = req.application.storage[AppsCacheKey.self] ?? []
        
        guard let app = apps.first(where: { $0.slug == slug && $0.isPublished }) else {
            throw Abort(.notFound)
        }
        
        struct AppContext: Content, ViewContext {
            let title: String
            let app: AppMetadata
            let gaTrackingID: String?
            let popularTags: [TagCount]
            let buildVersion: String?
        }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = AppContext(
            title: app.name,
            app: app,
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion
        )
        
        return try await req.view.render("apps/show", context)
    }
}
import Vapor
import Leaf
import Smtp

struct ContactController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        routes.get("contact", use: showForm)
        routes.post("contact", use: sendEmail)
    }
    
    func showForm(req: Request) async throws -> View {
        struct ContactContext: Content, ViewContext {
            let title: String
            let gaTrackingID: String?
            let popularTags: [TagCount]
            let buildVersion: String?
        }
        
        let baseContext = BaseContext.create(from: req.application)
        let context = ContactContext(
            title: "Contact",
            gaTrackingID: baseContext.gaTrackingID,
            popularTags: baseContext.popularTags,
            buildVersion: baseContext.buildVersion
        )
        
        return try await req.view.render("contact", context)
    }
    
    func sendEmail(req: Request) async throws -> Response {
        struct ContactForm: Content {
            let name: String
            let email: String
            let subject: String
            let message: String
        }
        
        let form = try req.content.decode(ContactForm.self)
        
        let email = try Email(
            from: EmailAddress(address: "no-reply@klabow.world", name: "klabow.world"),
            to: [
                EmailAddress(address: "contact@klabow.world", name: "Joel Klabo")
            ],
            subject: "Contact Form: \(form.subject)",
            body: """
            New contact form submission:
            
            Name: \(form.name)
            Email: \(form.email)
            Subject: \(form.subject)
            
            Message:
            \(form.message)
            
            ---
            Reply to: \(form.email)
            """
        )
        
        do {
            try await req.smtp.send(email)
            
            return req.redirect(to: "/contact?success=true")
        } catch {
            req.logger.error("Failed to send email: \(error)")
            return req.redirect(to: "/contact?error=true")
        }
    }
}
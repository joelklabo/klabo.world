import Vapor

struct HashPasswordCommand: Command {
    struct Signature: CommandSignature {
        // No arguments - we'll always prompt for the password
    }
    
    var help: String {
        "Generates a BCrypt hash of a password for use with ADMIN_PASSWORD environment variable"
    }
    
    func run(using context: CommandContext, signature: Signature) throws {
        // Prompt for password
        context.console.print("Enter password to hash: ", newLine: false)
        guard let input = readLine() else {
            context.console.error("Failed to read password")
            return
        }
        let password = input
        
        // Validate password
        guard password.count >= 8 else {
            context.console.error("Password must be at least 8 characters long")
            return
        }
        
        // Generate hash
        let hash = try context.application.password.hash(password)
        
        // Display result
        context.console.print()
        context.console.success("Password hashed successfully!")
        context.console.print()
        context.console.print("=================================================")
        context.console.print("HASHED PASSWORD:")
        context.console.print()
        context.console.warning(hash)
        context.console.print()
        context.console.print("=================================================")
        context.console.print()
        context.console.print("To use this password:")
        context.console.print("1. Set your ADMIN_PASSWORD environment variable to the hash above")
        context.console.print("2. Restart your application")
        context.console.print()
        context.console.print("Example (in terminal):")
        context.console.print("export ADMIN_PASSWORD=\"\(hash)\"")
        context.console.print()
        context.console.print("Example (in .env file):")
        context.console.print("ADMIN_PASSWORD=\"\(hash)\"")
        context.console.print()
    }
}
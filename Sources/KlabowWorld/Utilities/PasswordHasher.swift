import Vapor

struct PasswordHasher {
    static func hashPassword(_ password: String, on app: Application) throws -> String {
        return try app.password.hash(password)
    }
    
    static func printHashCommand() {
        print("""
        
        ========================================
        PASSWORD HASHING UTILITY
        ========================================
        
        To generate a hashed password for your admin account:
        
        1. Run this command in your project directory:
           swift run KlaboWorld hash-password
        
        2. Enter your desired password when prompted
        
        3. Copy the generated hash and set it as your ADMIN_PASSWORD environment variable
        
        4. Restart your application
        
        ========================================
        
        """)
    }
}
import Vapor
import Foundation

struct AdminSession: Content {
    let id: UUID
    let createdAt: Date
    let expiresAt: Date
    let rememberMe: Bool
    
    init(rememberMe: Bool = false) {
        self.id = UUID()
        self.createdAt = Date()
        // Regular session: 2 hours, Remember me: 30 days
        let duration: TimeInterval = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 2
        self.expiresAt = Date().addingTimeInterval(duration)
        self.rememberMe = rememberMe
    }
    
    var isExpired: Bool {
        Date() > expiresAt
    }
}

struct LoginAttempt {
    let ip: String
    let attempts: Int
    let lastAttempt: Date
    let nextAllowedAttempt: Date
}

final class RateLimiter: @unchecked Sendable {
    private var attempts: [String: LoginAttempt] = [:]
    private let lock = NSLock()
    
    func shouldAllowAttempt(for ip: String) -> (allowed: Bool, waitTime: TimeInterval?) {
        lock.lock()
        defer { lock.unlock() }
        
        // Clean up old attempts
        let cutoff = Date().addingTimeInterval(-3600) // 1 hour
        attempts = attempts.filter { $0.value.lastAttempt > cutoff }
        
        guard let attempt = attempts[ip] else {
            return (true, nil)
        }
        
        if Date() < attempt.nextAllowedAttempt {
            let waitTime = attempt.nextAllowedAttempt.timeIntervalSince(Date())
            return (false, waitTime)
        }
        
        return (true, nil)
    }
    
    func recordFailedAttempt(for ip: String) {
        lock.lock()
        defer { lock.unlock() }
        
        let existing = attempts[ip]
        let attemptCount = (existing?.attempts ?? 0) + 1
        
        // Progressive delay: 1s, 2s, 4s, 8s, 16s, 32s, then cap at 60s
        let delay = min(pow(2.0, Double(attemptCount - 1)), 60.0)
        let nextAllowed = Date().addingTimeInterval(delay)
        
        attempts[ip] = LoginAttempt(
            ip: ip,
            attempts: attemptCount,
            lastAttempt: Date(),
            nextAllowedAttempt: nextAllowed
        )
    }
    
    func recordSuccessfulAttempt(for ip: String) {
        lock.lock()
        defer { lock.unlock() }
        
        attempts.removeValue(forKey: ip)
    }
}

// Storage keys
struct SessionStorageKey: StorageKey {
    typealias Value = [UUID: AdminSession]
}

struct RateLimiterKey: StorageKey {
    typealias Value = RateLimiter
}
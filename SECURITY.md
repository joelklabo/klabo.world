# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

### Contact

- **Email**: security@klabo.world
- **GitHub**: Create a private security advisory

### What to Include

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** assessment
4. **Suggested fix** (if you have one)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

## Security Measures

### Environment Variables

- All sensitive data is stored in environment variables
- `.env` files are excluded from version control
- Use `.env.example` as a template
- Never commit API keys, passwords, or secrets

### Authentication

- Admin authentication via NextAuth.js
- Role-based access control (ADMIN/USER)
- Session-based authentication
- Secure password requirements in production

### File Uploads

- File type validation (images only)
- File size limits (5MB max)
- Secure filename generation
- Proper file storage isolation

### Database Security

- Prisma ORM prevents SQL injection
- Input validation on all endpoints
- Parameterized queries only
- Regular security updates

### API Security

- Authentication required for write operations
- CORS configuration
- Rate limiting (recommended for production)
- Input sanitization

## Security Headers

Recommended security headers for production:

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## Dependencies

- Regular dependency updates via Dependabot
- Security vulnerability scanning in CI
- Only trusted and maintained packages
- Regular audit of dependencies

## Production Checklist

Before deploying to production:

- [ ] Change default admin credentials
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Use HTTPS only
- [ ] Configure security headers
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular database backups
- [ ] SSL certificate configuration
- [ ] Environment variable security review

## Acknowledgments

We appreciate responsible disclosure of security vulnerabilities. Contributors who report valid security issues will be acknowledged (with permission) in our security hall of fame.
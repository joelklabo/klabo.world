# klabo.world

A modern personal blog built with Next.js 14, featuring a WYSIWYG editor, admin dashboard, and dynamic content management. Deployed on Azure with support for both klabo.blog and klabo.world domains.

## ✨ Features

- 🖊️ **WYSIWYG Editor** - Rich text editing with Tiptap
- 🎨 **Colorful Design** - Primary color scheme with animations
- 📱 **Responsive** - Mobile-first design with Tailwind CSS
- 🔐 **Admin Dashboard** - Secure content management
- 🖼️ **Image Upload** - Drag & drop image support
- 📅 **Post Scheduling** - Schedule posts for future publication
- 🌐 **Dynamic Pages** - Custom pages with executable code
- 🔗 **GitHub Integration** - Display recent repository activity
- ⚡ **Fast Performance** - Built with Next.js 14 App Router
- 🚀 **Azure Ready** - Optimized for Azure deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 22.10.0 (use `.nvmrc` for version management)
- npm or yarn
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/klabo.world.git
   cd klabo.world
   ```

2. **Install dependencies**
   ```bash
   make install
   # or
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Initialize database**
   ```bash
   make db-setup
   # or
   npm run db:migrate && npm run db:seed
   ```

5. **Start development server**
   ```bash
   make dev
   # or
   npm run dev
   ```

6. **Visit your blog**
   - Blog: http://localhost:3000
   - Admin: http://localhost:3000/admin/signin
   - Credentials: `admin@example.com` / `admin123`

## 📋 Available Commands

All commands are available via both Makefile and npm scripts:

```bash
# Development
make dev              # Start development server
make dev-sqlite       # Start with SQLite setup
make install          # Install dependencies

# Database
make db-setup         # Initialize database
make db-migrate       # Run migrations
make db-seed          # Seed with sample data
make db-reset         # Reset database
make backup           # Backup database

# Testing & Building
make test             # Run all tests
make build            # Build for production
make clean            # Clean build artifacts

# Deployment
make deploy           # Deploy to Azure
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

- **Database**: SQLite for development, PostgreSQL for production
- **Storage**: Local filesystem or Azure Blob Storage
- **GitHub**: Personal access token for repository integration
- **Social Links**: Twitter, GitHub, LinkedIn profiles
- **Site Settings**: Name, description, URLs

### Admin Access

Default admin credentials for development:
- Email: `admin@example.com`
- Password: `admin123`

**Important**: Change these credentials for production!

## 🌐 Deployment

### Azure Setup

1. **Create Azure Resources**
   - App Service Plan
   - App Service
   - Azure Database for PostgreSQL
   - Storage Account (Blob Storage)

2. **Configure GitHub Secrets**
   ```
   AZURE_CREDENTIALS         # Service principal JSON
   AZURE_APP_NAME           # App Service name
   DATABASE_URL             # PostgreSQL connection string
   NEXTAUTH_SECRET          # Production secret
   # ... other environment variables
   ```

3. **Deploy**
   ```bash
   git push origin main  # Triggers automatic deployment
   ```

### Custom Domains

Configure both domains in Azure App Service:
- klabo.blog (primary)
- klabo.world (redirect or mirror)

## 🏗️ Project Structure

```
├── app/                     # Next.js App Router
│   ├── (public)/           # Public routes
│   ├── admin/              # Admin dashboard
│   └── api/                # API endpoints
├── components/             # React components
├── lib/                    # Utilities and configs
├── prisma/                 # Database schema
├── scripts/                # Utility scripts
└── uploads/                # Local file storage
```

## 🔒 Security

- Environment variables are excluded from version control
- Admin authentication with NextAuth.js
- Role-based access control
- File upload validation and limits
- SQL injection protection with Prisma
- CSRF protection built into Next.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) - Comprehensive technical documentation
- [API Documentation](./docs/api.md) - API endpoints and usage
- [Deployment Guide](./docs/deployment.md) - Detailed deployment instructions

## 🐛 Issues

Found a bug? Have a feature request? Please check the [issues page](https://github.com/yourusername/klabo.world/issues).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Prisma](https://prisma.io/) - Database ORM
- [Tiptap](https://tiptap.dev/) - Rich text editor
- [NextAuth.js](https://next-auth.js.org/) - Authentication

---

Built with ❤️ using modern web technologies
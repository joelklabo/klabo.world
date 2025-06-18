# CLAUDE.md - Personal Blog Project

This document contains essential information for Claude to understand and work with this personal blog project.

## Project Overview

A modern personal blog built with Next.js 14, featuring a WYSIWYG editor, admin dashboard, and dynamic content management. The blog supports both klabo.blog and klabo.world domains and can be deployed to Azure.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom primary colors
- **Database**: SQLite (local) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Editor**: Tiptap (rich text editor)
- **Storage**: Local filesystem / Azure Blob Storage
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Project Structure

```
blog/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes
│   │   ├── page.tsx              # Homepage
│   │   ├── posts/                # Blog posts
│   │   │   ├── page.tsx          # All posts listing
│   │   │   └── [slug]/page.tsx   # Individual post
│   │   └── [page]/page.tsx       # Dynamic pages
│   ├── admin/                    # Admin routes
│   │   ├── signin/page.tsx       # Admin login
│   │   ├── dashboard/page.tsx    # Admin dashboard
│   │   ├── posts/                # Post management
│   │   └── pages/                # Page management
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth endpoint
│   │   ├── posts/                # Posts CRUD
│   │   ├── pages/                # Pages CRUD
│   │   ├── github/repos/         # GitHub integration
│   │   ├── upload/               # Image upload
│   │   └── uploads/[filename]/   # Static file serving
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── Editor/
│   │   └── TiptapEditor.tsx      # WYSIWYG editor
│   ├── GitHub/
│   │   └── GitHubRepos.tsx       # GitHub repos display
│   ├── Layout/
│   │   ├── Header.tsx            # Site header
│   │   └── Footer.tsx            # Site footer
│   └── Providers/
│       └── SessionProvider.tsx   # NextAuth provider
├── lib/                          # Utilities
│   ├── db.ts                     # Prisma client
│   ├── github.ts                 # GitHub API integration
│   ├── storage/                  # Storage abstraction
│   │   ├── index.ts              # Main export
│   │   ├── local.ts              # Local filesystem
│   │   ├── azure.ts              # Azure Blob Storage
│   │   └── types.ts              # TypeScript types
│   └── utils/
│       ├── cn.ts                 # Class name utility
│       └── slug.ts               # Slug generation
├── prisma/
│   └── schema.prisma             # Database schema
├── scripts/
│   ├── seed.ts                   # Database seeding
│   └── backup.sh                 # Database backup
├── types/
│   └── next-auth.d.ts            # NextAuth type extensions
├── uploads/                      # Local image storage
├── backups/                      # Database backups
├── .env.local                    # Environment variables
├── Makefile                      # Development commands
└── package.json                  # Dependencies
```

## Database Schema

**Key Models**:
- `User`: Admin users with role-based access
- `Post`: Blog posts with slug, content, published status
- `Page`: Dynamic pages with custom content/code
- `Image`: Uploaded images with metadata
- `Tag`: Post categorization
- `SocialLink`: Social media links
- `GitHubCache`: Cached GitHub API responses

## Environment Variables

```bash
# Database
DATABASE_URL=file:./dev.db  # SQLite for local
# DATABASE_URL=postgresql://... # PostgreSQL for production

# Storage
STORAGE_TYPE=local  # or 'azure' for production
STORAGE_PATH=./uploads
# AZURE_STORAGE_CONNECTION_STRING=...
# AZURE_STORAGE_CONTAINER=blog-images

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production

# GitHub Integration
GITHUB_TOKEN=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
GITHUB_USERNAME=joelklabo

# Site Configuration (Public)
NEXT_PUBLIC_SITE_NAME=klabo.world
NEXT_PUBLIC_SITE_DESCRIPTION=stuff I like
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Social Links (Public)
NEXT_PUBLIC_TWITTER_HANDLE=@joelklabo
NEXT_PUBLIC_GITHUB_PROFILE=https://github.com/joelklabo
NEXT_PUBLIC_LINKEDIN_PROFILE=https://linkedin.com/in/joelklabo
```

## Available Commands

### Development
```bash
# Install dependencies
npm install
# or
make install

# Start development server
npm run dev
# or
make dev-sqlite

# Run with container (requires Apple container)
make dev-container
```

### Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
# or
make db-migrate

# Seed database
npx tsx scripts/seed.ts
# or
make db-seed

# Reset database
make db-reset

# Backup database
make backup

# Open Prisma Studio
npm run db:studio
```

### Testing & Building
```bash
# Run tests
make test

# Build for production
npm run build
# or
make build

# Start production server
npm start
```

## Admin Access

**Default Credentials**:
- Email: `admin@example.com`
- Password: `admin123`

**Admin URLs**:
- Login: `/admin/signin`
- Dashboard: `/admin/dashboard`
- Create Post: `/admin/posts/new`
- Manage Posts: `/admin/posts`
- Manage Pages: `/admin/pages`

## Storage Configuration

**Local Development**: Files stored in `./uploads/`
**Production**: Azure Blob Storage with connection string

The storage layer automatically switches based on `STORAGE_TYPE` environment variable.

## Design System

**Primary Colors**:
- Blue: `rgb(59, 130, 246)` - Primary actions, links
- Red: `rgb(239, 68, 68)` - Secondary elements
- Yellow: `rgb(250, 204, 21)` - Accents
- Green: `rgb(34, 197, 94)` - Success states

**Key Features**:
- Globe emoji logo (🌍)
- Gradient backgrounds
- Hover animations with scale transforms
- Consistent border radius (rounded-xl)
- Primary color hover states on navigation

## API Endpoints

- `GET /api/posts` - List posts (query: ?published=true)
- `POST /api/posts` - Create post (requires auth)
- `GET /api/pages` - List pages (query: ?visible=true)
- `POST /api/pages` - Create page (requires auth)
- `GET /api/github/repos` - GitHub repositories
- `POST /api/upload` - Image upload (requires auth)
- `GET /api/uploads/[filename]` - Serve uploaded images

## Deployment Notes

**Azure Setup**:
1. Create App Service
2. Configure PostgreSQL database
3. Set up Blob Storage
4. Configure custom domains (klabo.blog, klabo.world)
5. Set environment variables in Azure

**Required Azure Resources**:
- App Service Plan
- App Service
- Azure Database for PostgreSQL
- Storage Account (Blob Storage)
- Custom Domain SSL certificates

## Development Tips

**Starting Fresh**:
1. `make install` - Install dependencies
2. `make db-setup` - Initialize database
3. `npm run dev` - Start development server

**Adding Content**:
1. Visit `/admin/signin`
2. Login with demo credentials
3. Create posts and pages through admin interface

**GitHub Integration**:
- Requires valid GitHub personal access token
- Caches responses for 15 minutes
- Fallback to empty array if API fails

**File Uploads**:
- Max file size: 5MB
- Supported formats: JPEG, PNG, GIF, WebP
- Automatic filename generation
- Alt text from original filename

## Common Issues

**Container Issues**: Use local development mode with SQLite if Apple container isn't available
**Port Conflicts**: Development server runs on port 3000
**Database Connections**: Ensure `.env` file is present for Prisma
**GitHub API Limits**: Rate limited without token, requires valid token for full functionality

## Repository Information

**Repository**: https://github.com/joelklabo/klabo.world
**Primary Domain**: klabo.blog
**Secondary Domain**: klabo.world
**License**: MIT

### GitHub Configuration

**Branch Protection**:
- Main branch protected
- Require PR reviews
- Require status checks (CI)
- No force pushes

**Required Secrets**:
```
AZURE_CREDENTIALS          # Service principal JSON
AZURE_APP_NAME             # App Service name  
DATABASE_URL               # Production PostgreSQL
NEXTAUTH_SECRET            # Production auth secret
NEXT_PUBLIC_SITE_NAME      # klabo.world
NEXT_PUBLIC_SITE_DESCRIPTION # stuff I like
NEXT_PUBLIC_SITE_URL       # https://klabo.blog
NEXT_PUBLIC_TWITTER_HANDLE # @joelklabo
NEXT_PUBLIC_GITHUB_PROFILE # https://github.com/joelklabo
NEXT_PUBLIC_LINKEDIN_PROFILE # https://linkedin.com/in/joelklabo
```

**Workflows**:
- `.github/workflows/ci.yml` - Tests and builds on PR/push
- `.github/workflows/deploy.yml` - Deploys to Azure on main push
- `.github/copilot-instructions.md` - Symlink to this file

### CI/CD Pipeline

**Local Development**:
```bash
make install && make db-setup && make dev
```

**CI Pipeline (Matches Local)**:
```bash
make install          # Same as local
make db-setup        # Same SQLite setup
make test            # Same test suite
make build           # Same build process
```

**Deployment Pipeline**:
```bash
npm install
npx prisma generate
npm run build        # With production env vars
# Deploy to Azure App Service
npx prisma migrate deploy  # Production migrations
```

## Future Enhancements

- Blog post comments system
- SEO metadata optimization
- RSS feed generation
- Analytics integration
- Email newsletter signup
- Search functionality
- Tag-based filtering
- Multi-author support
- Newsletter integration
- Advanced analytics dashboard
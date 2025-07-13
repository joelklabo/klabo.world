# klabo.world - Vapor 4 Personal Website Project

## Site Owner
**Owner Name**: Joel Klabo  
Always use "Joel Klabo" when displaying the site owner's name (e.g., in footer copyright, email sender names, etc.).

## Project Overview
Building a personal website with blog functionality using Vapor 4 (Swift web framework), Docker, and deploying to Azure App Service with GitHub Actions CI/CD.

## Key Architecture Decisions

### Technology Stack
- **Framework**: Vapor 4 (Swift)
- **Templating**: Leaf (Vapor's templating engine)
- **Styling**: Tailwind CSS (via CDN)
- **Content**: Markdown files for blog posts
- **Email**: SMTP integration via Mikroservices/Smtp package
- **Development**: Docker with optimized macOS configuration
- **Deployment**: Azure App Service (Linux container)
- **CI/CD**: GitHub Actions
- **Testing**: Swift Testing framework (not XCTest)

## CLI and Cloud Tools
- Can use `az` (Azure CLI) for Azure cloud management and deployment
- Can use `gh` (GitHub CLI) for GitHub repository and workflow interactions

## Critical Implementation Details
- Instead of asking for information about rendered HTML, always use curl to get it yourself. Use Playwright to get screenshots

## Azure Deployment Notes
- Running this on Azure, remember to set environment variables specific to Azure deployment

## Testing
- Can use Playwright to test things for this site
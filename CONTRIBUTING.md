# Contributing to klabo.world

Thank you for your interest in contributing to this personal blog project! This document provides guidelines for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 22.10.0 (check `.nvmrc`)
- npm or yarn
- Git
- Basic knowledge of React, Next.js, and TypeScript

### Setup Development Environment

1. **Fork the repository**
   ```bash
   git fork https://github.com/joelklabo/klabo.world.git
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/klabo.world.git
   cd klabo.world
   ```

3. **Install dependencies**
   ```bash
   make install
   ```

4. **Setup environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

5. **Initialize database**
   ```bash
   make db-setup
   ```

6. **Start development**
   ```bash
   make dev
   ```

## 📝 Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Code formatting is handled automatically
- **Tailwind CSS**: Use Tailwind for styling
- **Components**: Keep components small and focused

### Git Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clear, concise commit messages
   - Keep commits atomic and focused
   - Test your changes locally

3. **Run checks**
   ```bash
   make test        # Run tests
   npm run lint     # Check linting
   make build       # Verify build
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks

**Examples:**
```
feat(editor): add image upload functionality
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
```

## 🧪 Testing

### Running Tests

```bash
make test           # Run all tests
make test-watch     # Run tests in watch mode
npm run test:unit   # Unit tests only
npm run test:e2e    # E2E tests only
```

### Writing Tests

- Write tests for new features
- Update tests when modifying existing code
- Aim for good test coverage
- Use meaningful test descriptions

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details** (OS, Node version, etc.)
5. **Screenshots** if applicable
6. **Error messages** or logs

Use the bug report template in GitHub issues.

## 💡 Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the feature** and its use case
3. **Explain the benefit** to users
4. **Consider implementation** complexity
5. **Provide mockups** if applicable

Use the feature request template in GitHub issues.

## 📋 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated if needed
- [ ] Self-review completed
- [ ] Related issues referenced

### PR Requirements

1. **Clear title** describing the change
2. **Detailed description** of what was changed and why
3. **Screenshots** for UI changes
4. **Testing instructions** for reviewers
5. **Breaking changes** clearly marked

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** by reviewers
4. **Approval** before merge
5. **Squash and merge** preferred

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── (public)/          # Public routes
│   ├── admin/             # Admin dashboard
│   └── api/               # API endpoints
├── components/            # React components
│   ├── Editor/           # WYSIWYG editor
│   ├── GitHub/           # GitHub integration
│   └── Layout/           # Layout components
├── lib/                   # Utilities
│   ├── storage/          # File storage abstraction
│   └── utils/            # Helper functions
├── prisma/               # Database schema
└── scripts/              # Utility scripts
```

## 🎨 Design System

### Colors

Primary colors used throughout the application:
- **Blue**: `rgb(59, 130, 246)` - Primary actions
- **Red**: `rgb(239, 68, 68)` - Secondary elements  
- **Yellow**: `rgb(250, 204, 21)` - Accents
- **Green**: `rgb(34, 197, 94)` - Success states

### Components

- Use existing components when possible
- Follow established patterns
- Maintain responsive design
- Include hover states and animations

## 📚 Documentation

### Code Documentation

- Use TypeScript types for API documentation
- Add JSDoc comments for complex functions
- Include examples in documentation
- Keep CLAUDE.md updated for technical details

### User Documentation

- Update README.md for user-facing changes
- Include setup instructions
- Provide troubleshooting guides
- Add screenshots for UI changes

## 🔒 Security

### Guidelines

- Never commit secrets or API keys
- Validate all user inputs
- Use proper authentication checks
- Follow security best practices
- Report security issues privately

### Environment Variables

- Add new variables to `.env.example`
- Document their purpose
- Use secure defaults
- Validate required variables

## 🤝 Community

### Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Maintain a welcoming environment

### Getting Help

- Check existing documentation first
- Search issues for similar problems
- Ask questions in discussions
- Provide context when asking for help

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors are recognized in:
- GitHub contributor graphs
- Release notes for significant contributions
- Special thanks in documentation

Thank you for contributing to klabo.world! 🎉
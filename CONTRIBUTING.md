# Contributing to African Property Trust

Thank you for your interest in contributing to African Property Trust! We welcome contributions from developers of all skill levels.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git
- PostgreSQL (for local development)
- Python 3.x (for data generation scripts)

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/yourusername/rest-express.git
   cd rest-express
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Database Setup**

   ```bash
   npm run db:setup
   npm run db:migrate
   npm run db:seed:dev
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

## 📋 Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(auth): add two-factor authentication
fix(api): resolve property search pagination issue
docs(readme): update installation instructions
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:integration
npm run test:e2e
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

- **Unit Tests**: Place in `__tests__` folders next to source files
- **Integration Tests**: Place in `tests/integration/`
- **E2E Tests**: Place in `tests/e2e/`

### Test Requirements

- All new features must include tests
- Bug fixes should include regression tests
- Maintain or improve test coverage
- Tests should be descriptive and focused

## 🎨 Code Style

### Formatting

We use Prettier and ESLint for code formatting:

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper type annotations
- Avoid `any` type unless absolutely necessary

### React Guidelines

- Use functional components with hooks
- Follow React best practices
- Use proper prop types
- Implement proper error boundaries

## 🗃️ Database Changes

### Migrations

When making database changes:

1. **Create Migration**

   ```bash
   npm run db:generate
   ```

2. **Test Migration**

   ```bash
   npm run migrate:dry-run
   ```

3. **Apply Migration**
   ```bash
   npm run migrate
   ```

### Schema Changes

- Always create migrations for schema changes
- Test migrations on sample data
- Document breaking changes
- Consider backward compatibility

## 📝 Documentation

### Code Documentation

- Use JSDoc comments for functions and classes
- Document complex algorithms and business logic
- Keep comments up-to-date with code changes

### API Documentation

- Document all API endpoints
- Include request/response examples
- Document error responses
- Update OpenAPI specifications

## 🔍 Pull Request Process

### Before Submitting

1. **Code Quality**

   ```bash
   npm run lint
   npm run format:check
   npm run check
   ```

2. **Tests**

   ```bash
   npm test
   npm run test:coverage
   ```

3. **Build**
   ```bash
   npm run build
   ```

### PR Requirements

- [ ] Clear, descriptive title
- [ ] Detailed description of changes
- [ ] Link to related issues
- [ ] Tests pass
- [ ] Code is formatted
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Reproduce the bug
3. Test on latest version

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce the behavior

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**

- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Node.js version: [e.g. 18.0.0]
- App version: [e.g. 1.0.0]
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives you've considered**
Alternative solutions considered

**Additional context**
Any other context or screenshots
```

## 🏗️ Architecture Guidelines

### File Organization

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── services/           # API services
└── styles/             # Global styles

server/
├── routes/             # API routes
├── middleware/         # Express middleware
├── services/           # Business logic
├── models/             # Database models
├── utils/              # Server utilities
└── types/              # Server type definitions
```

### Best Practices

- **Single Responsibility**: Each function/component should have one purpose
- **DRY Principle**: Don't repeat yourself
- **SOLID Principles**: Follow SOLID design principles
- **Error Handling**: Implement proper error handling
- **Security**: Follow security best practices
- **Performance**: Consider performance implications

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

### Communication

- Use clear, professional language
- Be patient with questions
- Provide helpful feedback
- Share knowledge and resources

## 📞 Getting Help

- **Documentation**: Check the [docs](./docs) folder
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (if available)

## 🎉 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to African Property Trust! 🚀

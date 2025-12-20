# Contributing to FlowCraft

Thank you for your interest in contributing to FlowCraft! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Chrome browser (for testing)

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/flow-craft.git
   cd flow-craft
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run tests to ensure everything works:
   ```bash
   npm test
   ```

## Development Workflow

### Test-Driven Development (TDD)

FlowCraft follows strict TDD practices:

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make it pass
3. **Refactor**: Improve code while keeping tests green

**Example workflow:**

```bash
# 1. Create a test file
touch src/components/MyComponent/__tests__/MyComponent.test.tsx

# 2. Write failing tests
# 3. Run tests (they should fail)
npm run test:watch

# 4. Implement the component
# 5. Tests should pass

# 6. Refactor if needed
```

### Code Quality Standards

#### TypeScript

- **No `any` types** - Always use proper types
- **Strict mode enabled** - Follow strict TypeScript rules
- **Explicit return types** - Functions should have return type annotations

```typescript
// ❌ Bad
function getData(id: any) {
  return fetch(`/api/${id}`);
}

// ✅ Good
function getData(id: string): Promise<Response> {
  return fetch(`/api/${id}`);
}
```

#### React Components

- Use functional components with hooks
- Add proper TypeScript types for props
- Include JSDoc comments for complex components

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * Button component with variant support
 */
export const Button: React.FC<ButtonProps> = ({ variant, onClick, children }) => {
  // Implementation
};
```

#### Testing

- Minimum 80% code coverage required
- Test both happy paths and error cases
- Use descriptive test names

```typescript
describe('RuleEngine', () => {
  describe('matchesUrl', () => {
    it('should match exact URL patterns', () => {
      // Test implementation
    });

    it('should not match different URLs with exact pattern', () => {
      // Test implementation
    });
  });
});
```

### Running the Extension Locally

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Load in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist` folder
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Lint
npm run lint
```

## Pull Request Process

### Before Submitting

1. ✅ All tests pass
2. ✅ Code coverage meets 80% threshold
3. ✅ No TypeScript errors
4. ✅ No linting errors
5. ✅ Code is formatted (run `npm run format`)

### PR Guidelines

1. **Branch naming**: Use descriptive names
   - `feature/add-url-redirection`
   - `fix/header-modification-bug`
   - `docs/update-readme`

2. **Commit messages**: Follow conventional commits
   ```
   feat: add URL redirection support
   fix: resolve header case-sensitivity issue
   docs: update contributing guide
   test: add tests for rule engine
   ```

3. **PR description**: Include
   - What changes were made
   - Why they were needed
   - How to test them
   - Screenshots (for UI changes)

4. **Keep PRs focused**: One feature/fix per PR

### Example PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests pass
- [ ] Code coverage ≥ 80%
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Documentation updated
```

## Architecture Guidelines

### Project Structure

```
src/
├── background/       # Service worker logic
├── popup/           # Extension popup UI
├── options/         # Settings page
├── components/      # Reusable UI components
├── storage/         # Chrome storage abstraction
└── shared/          # Shared utilities
    ├── types/      # TypeScript definitions
    ├── utils/      # Helper functions
    ├── constants/  # Constants
    └── hooks/      # Custom React hooks
```

### Component Structure

Each component should have:

```
ComponentName/
├── ComponentName.tsx          # Component implementation
├── index.ts                   # Exports
└── __tests__/
    └── ComponentName.test.tsx # Tests
```

### State Management

- Use **Zustand** for global state
- Keep state minimal and normalized
- Prefer local state when possible

### Styling

- Use **Tailwind CSS** utility classes
- Follow the design system colors (defined in tailwind.config.js)
- Support both light and dark themes
- Ensure accessibility (WCAG 2.1 AA)

## Feature Development

### Adding a New Rule Type

1. Update types in `src/shared/types/index.ts`
2. Add rule engine logic in `src/background/ruleEngine.ts`
3. Create UI components for configuration
4. Add tests for all new functionality
5. Update documentation

### Adding a New UI Component

1. Create component directory in `src/components/`
2. Write tests first (TDD)
3. Implement component
4. Add to component library exports
5. Document props with TypeScript and JSDoc

## Performance Guidelines

- Bundle size < 500KB
- Popup loads in < 100ms
- Rule evaluation < 5ms per request
- No memory leaks

## Security Guidelines

- Never expose API keys or secrets
- Validate all user input
- Sanitize HTML/URLs before injection
- Follow Chrome Extension security best practices
- No external network requests (privacy-first)

## Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Update architecture docs if structure changes
- Include code examples where helpful

## Questions?

- Open a [Discussion](https://github.com/imerljak/flow-craft/discussions) for general questions
- Create an [Issue](https://github.com/imerljak/flow-craft/issues) for bugs or feature requests

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to FlowCraft! 🚀**

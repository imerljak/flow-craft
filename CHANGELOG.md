# Changelog

All notable changes to FlowCraft will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Response Mocking Feature** ✅
  - MAIN world script injection bypassing CSP
  - fetch() and XMLHttpRequest interception
  - Message passing architecture between MAIN world, content scripts, and background
  - Support for custom status codes, headers, body, and delays
  - E2E tests for mock response functionality
- **Script Injection Feature** ✅
  - User script injection via Chrome scripting API
  - Automatic injection on page navigation
  - Support for JavaScript code execution
- **Query Parameter Modification** ✅
  - URL query parameter manipulation using declarativeNetRequest
  - Add, modify, remove query parameters
- Comprehensive Playwright E2E test suite (32 tests)
  - Basic popup functionality tests
  - Rule management tests (create, edit, delete, toggle)
  - Form validation tests
  - Data persistence tests
  - Mock response functional tests
  - Local file mocking tests
- GitHub Actions CI/CD pipeline
  - Automated type checking
  - Code linting
  - Unit test execution with coverage enforcement (≥75%)
  - E2E test execution
  - Build validation
  - Quality gate enforcement
- Security workflows
  - Automated dependency audits
  - CodeQL security analysis
  - License compliance checking
  - Dependency review for PRs
- Release workflow
  - Automated release builds
  - GitHub release creation
  - Checksum generation
  - Chrome Web Store preparation (placeholder)
- Code of Conduct (Contributor Covenant v3.0)
- Security Policy (SECURITY.md)
- Contribution guidelines (CONTRIBUTING.md)
- Pull request template with comprehensive checklist
- Issue templates for bug reports and feature requests
- Changelog for tracking project history

### Changed
- Migrated from @crxjs/vite-plugin to vite-plugin-web-extension
- Migrated from Jest to Vitest for better ESM support
- Migrated to Tailwind CSS v4 with @theme directive
- Updated ESLint to v9 flat config (eslint.config.mjs)
- Updated Playwright configuration for Chrome extension testing
- Improved test utilities for extension testing
- Fixed CSP blocking issue with MAIN world script injection
- Updated coverage thresholds and exclusions for E2E-tested code

### Fixed
- CSP blocking inline script execution (now using chrome.scripting.executeScript)
- Race conditions in MAIN world interceptor initialization
- Mock response feature now fully functional
- All 57 unit tests passing
- All 32 E2E tests passing

## [1.0.0] - Previous Work

### Added
- Complete Chrome extension foundation
  - Manifest V3 configuration
  - TypeScript strict mode setup
  - React 18 with Tailwind CSS
  - Zustand state management
- Storage layer with Chrome storage API integration
  - CRUD operations for rules, settings, and groups
  - 16 comprehensive unit tests
- Rule engine for URL pattern matching
  - Support for exact, wildcard, and regex patterns
  - 15 comprehensive unit tests
- Request interceptor using declarativeNetRequest API
  - Converts FlowCraft rules to Chrome format
  - Dynamic rule updates
  - 13 comprehensive unit tests
- UI component library
  - Button, Input, Toggle, Modal components
  - Dark mode support
  - Accessibility features
- RuleEditor component
  - Form validation (URL, regex patterns)
  - Conditional fields based on rule type
  - HeaderEditor sub-component for header modifications
- Complete popup UI with CRUD functionality
  - Create, read, update, delete rules
  - Enable/disable toggle
  - Delete confirmation dialog
  - Loading states
  - Active rule counter
- Comprehensive manual testing guide (TESTING_GUIDE.md)
  - 10-phase test plan
  - 100+ test scenarios
  - Bug reporting template
  - Test results template
- Manual build documentation (MANUAL_BUILD.md)
  - Workaround for vite-plugin-crx issues
  - Chrome extension loading instructions

### Features by Rule Type
- **Header Modification**
  - Add custom headers
  - Modify existing headers
  - Remove headers
- **URL Redirection**
  - Redirect requests to different URLs
- **Request Blocking**
  - Block requests by pattern

### Developer Experience
- TDD methodology with Jest
- TypeScript strict mode (no `any` types)
- ESLint with React hooks plugin
- Prettier code formatting
- Husky pre-commit hooks
- Comprehensive test coverage (≥80%)

### Privacy & Security
- 100% local processing
- No external requests
- No telemetry or analytics
- No data collection
- All data stored in chrome.storage.local

---

## Release Notes Format

### Added
New features and capabilities

### Changed
Changes to existing functionality

### Deprecated
Features that will be removed in future releases

### Removed
Features that have been removed

### Fixed
Bug fixes

### Security
Security-related changes

---

## Upcoming Features (Planned)

- Request/response viewer/logger
- Rule templates library
- Rule import/export UI
- Performance optimizations
- Chrome Web Store deployment
- Enhanced documentation
- Video tutorials
- Example rule configurations

---

[Unreleased]: https://github.com/imerljak/flow-craft/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/imerljak/flow-craft/releases/tag/v1.0.0

# Changelog

All notable changes to FlowCraft will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-12-24

**Initial beta release**

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
- **Header Modification** ✅
  - Add, modify, or remove request/response headers
  - Support for multiple headers per rule
- **URL Redirection** ✅
  - Redirect requests to different URLs
  - Pattern-based matching (exact, wildcard, regex)
- **Request Blocking** ✅
  - Block unwanted requests by pattern
- Comprehensive Playwright E2E test suite (51 tests, 100% passing) ✅
  - Basic popup functionality tests
  - Rule management tests (create, edit, delete, toggle)
  - Form validation tests
  - Data persistence tests
  - New features tests (query params, script injection, response mocking)
  - Local file mocking tests
  - URL pattern matching tests (wildcard, regex, exact)
- Comprehensive unit test suite (215 tests)
  - Storage layer tests
  - Rule engine tests
  - Request interceptor tests
  - Component tests
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
- Build instructions (BUILD.md)
- Comprehensive testing guide (TESTING_GUIDE.md)
- Pull request template with comprehensive checklist
- Issue templates for bug reports and feature requests

### Changed
- Migrated from @crxjs/vite-plugin to vite-plugin-web-extension
- Migrated from Jest to Vitest for better ESM support
- Migrated to Tailwind CSS v4 with @theme directive
- Updated ESLint to v9 flat config (eslint.config.mjs)
- Updated Playwright configuration for Chrome extension testing
- Improved test utilities for extension testing
- Updated coverage thresholds and exclusions for E2E-tested code

### Fixed
- CSP blocking inline script execution (now using chrome.scripting.executeScript)
- Race conditions in MAIN world interceptor initialization
- Mock response feature now fully functional

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

## Roadmap to 1.0.0

Before marking the extension as production-ready (1.0.0), we plan to add:

- **Request/Response Viewer** - Inspect intercepted requests and responses
- **Rule Templates Library** - Pre-built rules for common scenarios
- **Rule Import/Export** - Share rules between installations
- **Performance Optimizations** - Optimize for large rule sets
- **Enhanced Documentation** - More examples and use cases
- **Chrome Web Store Publication** - Official store listing

---

[Unreleased]: https://github.com/imerljak/flow-craft/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/imerljak/flow-craft/releases/tag/v0.1.0

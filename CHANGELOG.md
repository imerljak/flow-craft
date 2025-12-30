# Changelog

All notable changes to FlowCraft will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0](https://github.com/imerljak/flow-craft/compare/v0.1.1...v0.2.0) (2025-12-30)


### Features

* Implement 1.0.0 roadmap features and performance optimizations ([1a9dc88](https://github.com/imerljak/flow-craft/commit/1a9dc886ddcaa13adeecf030cb68feb53e666da1))


### Bug Fixes

* Add conflicts-badge test-id and update conflict detection tests ([b2ee5ce](https://github.com/imerljak/flow-craft/commit/b2ee5ce19aa538b551718f86f6965d1b09e7fdaf))
* Add test-ids to components and fix E2E test selectors ([62991aa](https://github.com/imerljak/flow-craft/commit/62991aa220ede470a82493555c548e0892bd5ad2))
* Comprehensive E2E test selector and timing fixes ([b034f69](https://github.com/imerljak/flow-craft/commit/b034f6926ec927e6d8f1c4a0292373706d56e3d1))
* Correct rule types and selectors in E2E tests ([ea71479](https://github.com/imerljak/flow-craft/commit/ea71479c332b4ad1ac415adf08b5b4e07877263b))
* Read version dynamically from manifest instead of hardcoding ([51a39b8](https://github.com/imerljak/flow-craft/commit/51a39b848679e071e54c8d14f5bc87337b319bc8))

## [0.1.1](https://github.com/imerljak/flow-craft/compare/v0.1.0...v0.1.1) (2025-12-24)


### Bug Fixes

* convert relative URLs to absolute for exact pattern matching ([86bc344](https://github.com/imerljak/flow-craft/commit/86bc344cc61554d909f8ff58d451d431a1f18223))
* resolve strict mode violation in rule deletion E2E test ([fb3a555](https://github.com/imerljak/flow-craft/commit/fb3a555ae0205deb5b78a2ad999037b65edfb6ea))
* update release workflow to use workflow_run trigger ([2b7bfcd](https://github.com/imerljak/flow-craft/commit/2b7bfcd0180b2a7df0b79a5704953cc205931e4d))

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

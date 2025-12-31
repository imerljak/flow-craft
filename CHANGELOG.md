# Changelog

All notable changes to FlowCraft will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1](https://github.com/imerljak/flow-craft/compare/flowcraft-v0.2.0...flowcraft-v0.2.1) (2025-12-31)


### Features

* Add comprehensive E2E tests and CI/CD pipeline ([1604f07](https://github.com/imerljak/flow-craft/commit/1604f07855a97819fb368ff9aae749924f54346e))
* Add comprehensive Popup integration and testing guides ([572e792](https://github.com/imerljak/flow-craft/commit/572e792091f99eddc4c6b308ebe68f16856957a2))
* Add comprehensive Rule Editor UI component ([340a601](https://github.com/imerljak/flow-craft/commit/340a6017ab7a8481a6fc98527369213dc4008297))
* Add comprehensive Rule Editor UI component ([62866d9](https://github.com/imerljak/flow-craft/commit/62866d9f77ab5d7e2ae449f2674b610d386ba448))
* Add request interception with declarativeNetRequest API ([85dbc6e](https://github.com/imerljak/flow-craft/commit/85dbc6e0b87d1b1624914f748aded22070fa1773))
* Add request interception with declarativeNetRequest API ([a628963](https://github.com/imerljak/flow-craft/commit/a628963453bbfd4aa6e59c88cd9b01bef0f748ac))
* Implement 1.0.0 roadmap features and performance optimizations ([1a9dc88](https://github.com/imerljak/flow-craft/commit/1a9dc886ddcaa13adeecf030cb68feb53e666da1))
* Implement mock response functionality with content script interception ([9a25cb8](https://github.com/imerljak/flow-craft/commit/9a25cb8d21884c1e8649b91a0bded25b9dffb53b))
* Implement mock response interception with early injection (WIP) ([6aa317e](https://github.com/imerljak/flow-craft/commit/6aa317e33de361d74b7b509a461d13ff11083887))
* Implement Query Parameter Modification feature ([2e51bb7](https://github.com/imerljak/flow-craft/commit/2e51bb7ab1addbb18c224ee54fb178d79d03e1b2))
* Implement Response Mocking feature (UI complete) ([886c194](https://github.com/imerljak/flow-craft/commit/886c194d1e4ddb8319f84de49ab1e61a2c59217e))
* Implement Script Injection feature ([f6cf040](https://github.com/imerljak/flow-craft/commit/f6cf0408898cff0e954a51e85c7123cac388d4c8))
* Improve injection timing - insert as first child of &lt;html&gt; ([c49018d](https://github.com/imerljak/flow-craft/commit/c49018d55de0e63561c310fffb444b249fadde87))
* Initialize FlowCraft Chrome Extension foundation ([871a7ea](https://github.com/imerljak/flow-craft/commit/871a7eac68944464b776af10ea463bdc53f5787e))
* Upgrade dependencies to React 19 and Vite, update Tailwind CSS configuration, improve Chrome storage type safety, and migrate icons to PNG. ([4df5ebf](https://github.com/imerljak/flow-craft/commit/4df5ebfcd4ca3faf28261f0a218e4c72a898dad0))


### Bug Fixes

* Add conflicts-badge test-id and update conflict detection tests ([b2ee5ce](https://github.com/imerljak/flow-craft/commit/b2ee5ce19aa538b551718f86f6965d1b09e7fdaf))
* Add test-ids to components and fix E2E test selectors ([62991aa](https://github.com/imerljak/flow-craft/commit/62991aa220ede470a82493555c548e0892bd5ad2))
* Add xvfb-run for E2E tests in CI and build before tests ([ab12148](https://github.com/imerljak/flow-craft/commit/ab1214878ae58e1d58055c7aab5ad490654303c0))
* Complete Browser polyfill migration and fix all test failures ([09c92aa](https://github.com/imerljak/flow-craft/commit/09c92aa68e959281b4d714a99ee03d8b9a557cbd))
* Complete E2E test fixes with Modal pointer-events and test IDs ([0082477](https://github.com/imerljak/flow-craft/commit/00824776e9a09925df52395a1591e80edd59f202))
* Comprehensive E2E test selector and timing fixes ([b034f69](https://github.com/imerljak/flow-craft/commit/b034f6926ec927e6d8f1c4a0292373706d56e3d1))
* convert relative URLs to absolute for exact pattern matching ([86bc344](https://github.com/imerljak/flow-craft/commit/86bc344cc61554d909f8ff58d451d431a1f18223))
* Correct rule types and selectors in E2E tests ([ea71479](https://github.com/imerljak/flow-craft/commit/ea71479c332b4ad1ac415adf08b5b4e07877263b))
* Eliminate React act() warnings in Modal tests ([c668836](https://github.com/imerljak/flow-craft/commit/c668836487e4541f69cb097098c72c15f88192c1))
* Read version dynamically from manifest instead of hardcoding ([51a39b8](https://github.com/imerljak/flow-craft/commit/51a39b848679e071e54c8d14f5bc87337b319bc8))
* Resolve CSP blocking and enable mock response interception ([552e343](https://github.com/imerljak/flow-craft/commit/552e3431f21c8101f7ea5554086d994023f3797a))
* resolve strict mode violation in rule deletion E2E test ([fb3a555](https://github.com/imerljak/flow-craft/commit/fb3a555ae0205deb5b78a2ad999037b65edfb6ea))
* update release workflow to use workflow_run trigger ([2b7bfcd](https://github.com/imerljak/flow-craft/commit/2b7bfcd0180b2a7df0b79a5704953cc205931e4d))
* Use chrome.scripting API to bypass CSP restrictions ([3ae559a](https://github.com/imerljak/flow-craft/commit/3ae559ad8c726e2558ecb6698b99a26b181897ff))


### Documentation

* Add Chrome Web Store installation link to README ([55ce19b](https://github.com/imerljak/flow-craft/commit/55ce19bed0e837862d0bac138f924bc1232d2ade))
* add Chrome Web Store publishing guide and update manifest ([bc7c31d](https://github.com/imerljak/flow-craft/commit/bc7c31d7759c58e532da833c0ff8376def3e33ca))
* Add comprehensive progress summary ([4dd7c08](https://github.com/imerljak/flow-craft/commit/4dd7c087e8c3e30363ff526726f5fde966387f7d))
* Add Contributor Covenant Code of Conduct v3.0 ([6ce4c5c](https://github.com/imerljak/flow-craft/commit/6ce4c5ca38cca4442c006b69193ee3d7ce40b776))
* Add known issues documentation ([d4b3bc2](https://github.com/imerljak/flow-craft/commit/d4b3bc2a558680fd96c521f10013cd6868bbed36))
* Add security policy for vulnerability reporting ([a8ef800](https://github.com/imerljak/flow-craft/commit/a8ef800d8a9ab8e0f16122d8bd606143763edfcc))
* Update and reorganize project documentation ([5be0ecb](https://github.com/imerljak/flow-craft/commit/5be0ecbdc5ea977ca033871bc22f9f5c71d47a9b))
* Update documentation to reflect current project state ([42c38dc](https://github.com/imerljak/flow-craft/commit/42c38dcb3f7cc3bced6ea9d656d272200cb16ebd))
* update test counts in README and CHANGELOG ([9bb737c](https://github.com/imerljak/flow-craft/commit/9bb737ce902f3111a92df1769524fcf5f3a2c227))
* update test counts to reflect current test suite ([0ee833e](https://github.com/imerljak/flow-craft/commit/0ee833e62a99e42f7189376eff0c4f4e66abdf0d))
* update test status to 100% passing ([3a5ea38](https://github.com/imerljak/flow-craft/commit/3a5ea388ef6a571a3fbcd3628cee60866f394530))


### Code Refactoring

* Redesign UI following Requestly pattern - split popup and options ([f11c1d2](https://github.com/imerljak/flow-craft/commit/f11c1d287176d6b9b11cb14ca282c20f499ef3c4))
* Replace placeholder/label selectors with test-ids ([2d70193](https://github.com/imerljak/flow-craft/commit/2d701935f412ea0b872e5096b44181517d763bdd))


### Performance Improvements

* Remove unnecessary waitForTimeout calls from E2E tests ([49cfdf4](https://github.com/imerljak/flow-craft/commit/49cfdf4647af7931d8309e644dde12a69548af2a))


### Tests

* Add comprehensive E2E tests for 1.0.0 features ([0da456f](https://github.com/imerljak/flow-craft/commit/0da456f2d7b8c381c3ddba43a32d34c82ca94bd2))
* Add comprehensive test coverage for new features ([a3286c0](https://github.com/imerljak/flow-craft/commit/a3286c024acbe462be64727725093040754307db))
* Add comprehensive test coverage for new features and refactor Modal to Drawer ([b12c483](https://github.com/imerljak/flow-craft/commit/b12c48369258c44025efc9243099fc7a92f8b281))
* Add comprehensive unit tests for components and improve coverage ([98c930f](https://github.com/imerljak/flow-craft/commit/98c930f68404b7bd14bcf87fe5da1873c4266d46))
* Add comprehensive unit tests to meet coverage thresholds ([06b4c12](https://github.com/imerljak/flow-craft/commit/06b4c1282af2533207d76b43e6c1c3910cf60d90))
* Add local file mock test environment with HTTP server ([0eb710d](https://github.com/imerljak/flow-craft/commit/0eb710da6871564b3c2fdcaffbe70ebdd002cd9a))
* add URL pattern matching E2E tests ([6089242](https://github.com/imerljak/flow-craft/commit/6089242ed94ab3f255bc98aedab6f313adc0e9ed))
* Migrate from Jest to Vitest ([e130062](https://github.com/imerljak/flow-craft/commit/e1300626015531312d10f024c4e70241a6e2d7f2))
* remove E2E tests dependent on external sites ([b9e2aa1](https://github.com/imerljak/flow-craft/commit/b9e2aa135a3c096ee3d015589150dbd28e4ca86e))
* Skip conflict detection and import/export E2E tests with timing issues ([d2f4136](https://github.com/imerljak/flow-craft/commit/d2f41362b8bf505b428b29b2c66ee88009546755))
* Suppress expected console error in regex validation test ([dab3bd2](https://github.com/imerljak/flow-craft/commit/dab3bd20e9ed8d15b1e3ce424917f8be8177b2cf))


### Continuous Integration

* add Security Quality Gate and simplify release dependencies ([01ac1fd](https://github.com/imerljak/flow-craft/commit/01ac1fd432e7c61919bd010c69988e114b317544))
* make release workflow depend on CI and security checks ([f675692](https://github.com/imerljak/flow-craft/commit/f675692eb6bf487c434535750d7ad2265db762a1))
* setup automated release process with release-please ([137c5fa](https://github.com/imerljak/flow-craft/commit/137c5fa67966ce9a524ad1bbf4a844e2db0bca17))


### Miscellaneous

* release 0.2.1 ([3a6ed98](https://github.com/imerljak/flow-craft/commit/3a6ed98a17c20a2182f69e4a9c616a4e333e6210))

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

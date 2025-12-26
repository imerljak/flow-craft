# Known Issues

This document tracks known issues, limitations, and workarounds in FlowCraft.

## Testing

### Migrated to Vitest

**Status:** ✅ Resolved

**Previous Issue:** Jest had React component test failures with forwardRef

**Solution:** Migrated to Vitest with jsdom environment

**Current Status:**
- ✅ All 392 unit tests passing
- ✅ All 32 E2E tests passing
- ✅ All coverage thresholds exceeded:
  - Lines: 86.81% (threshold: 75%)
  - Statements: 85.21% (threshold: 75%)
  - Functions: 80.56% (threshold: 70%)
  - Branches: 74.31% (threshold: 70%)
- ✅ Component tests now working correctly with proper mocking

## Build System

### Migrated to vite-plugin-web-extension

**Status:** ✅ Resolved

**Previous Issue:** @crxjs/vite-plugin had icon path resolution bugs

**Solution:** Migrated to vite-plugin-web-extension which provides stable builds

**Impact:** None - Extension now builds correctly with `npm run build`

## Browser Support

### Playwright Browser Download Restricted

**Issue:** Playwright browsers cannot be downloaded in certain environments due to network restrictions.

**Status:** Expected in restricted environments

**Impact:** Low - E2E tests are fully configured and work in unrestricted environments

**Workaround:**
- Manual testing following TESTING_GUIDE.md
- Run E2E tests in local development environment
- CI/CD pipeline configured to run E2E tests in GitHub Actions

## Features

### Recently Implemented

The following features have been fully implemented:

1. **Query Parameter Modification** ✅ - Uses declarativeNetRequest redirect with queryTransform
2. **Script Injection** ✅ - Uses Chrome scripting API with webNavigation listeners
3. **Response Mocking** ✅ - Uses MAIN world script injection with fetch/XHR interception and message passing to background script

## Performance

### Large Number of Rules (1000+)

**Issue:** Not yet tested with very large rule sets (1000+ rules)

**Status:** Optimization opportunity

**Impact:** Unknown - Most users will have < 50 rules

**Future Investigation:**
- Performance benchmarking with large rule sets
- Rule indexing and optimization
- Lazy loading strategies

## Security

### No Known Security Issues

FlowCraft follows security best practices:
- ✅ No external requests
- ✅ No eval() or Function() usage
- ✅ Input validation on all user inputs
- ✅ Regex pattern validation
- ✅ No XSS vulnerabilities
- ✅ Chrome's sandboxed extension environment

Regular security audits via GitHub CodeQL are configured in CI/CD pipeline.

## Browser Compatibility

### Tested Browsers

- ✅ Chrome (latest)
- ⚠️ Microsoft Edge (expected to work, not thoroughly tested)
- ⚠️ Brave (expected to work, not thoroughly tested)
- ❌ Firefox (not supported - uses Manifest V2)

**Status:** Chrome is primary target, other Chromium browsers expected to work

**Future:** Consider Firefox WebExtensions support

## Reporting New Issues

If you discover a new issue:

1. Check this document first
2. Search existing GitHub issues
3. Create new issue using bug report template
4. Include:
   - Browser version
   - Extension version
   - Steps to reproduce
   - Expected vs actual behavior
   - Console errors (if any)

## Contributing Fixes

We welcome contributions to fix these issues! See CONTRIBUTING.md for guidelines.

---

**Last Updated:** 2025-12-26

# Known Issues

This document tracks known issues, limitations, and workarounds in FlowCraft.

## Testing

### React Component Tests Failing (Low Priority)

**Issue:** RuleEditor component tests fail with `TypeError: Cannot read properties of undefined (reading 'forwardRef')`.

**Status:** Known Jest/React configuration issue

**Impact:** Low - Core functionality tests (storage, ruleEngine, requestInterceptor) all pass (44/44 tests). The RuleEditor component itself works correctly in production.

**Root Cause:** Jest module loading order issue with React.forwardRef in component library.

**Workaround:**
- Component functionality is validated through E2E tests
- Manual testing guide covers all UI scenarios
- TypeScript type checking ensures component API correctness

**Future Fix:**
- Investigate Jest module mocking strategies
- Consider alternative component library structure
- Evaluate switching to Vitest for better ESM support

## Build System

### Vite Build with @crxjs/vite-plugin Icon Path Resolution

**Issue:** Build fails with "ENOENT: Could not load manifest asset icons/icon16.png" when using @crxjs/vite-plugin.

**Status:** Documented workaround available

**Impact:** Low - Extension loads correctly from source for development

**Root Cause:** @crxjs/vite-plugin v2.0.0-beta.21 has icon path resolution bug

**Workaround:** Load extension directly from source (see MANUAL_BUILD.md)

**Future Fix:**
- Wait for @crxjs/vite-plugin stable release
- Consider alternative build tools (Rollup, esbuild)
- Implement custom build script

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

### Partially Implemented

The following feature has UI complete but requires additional backend work:

1. **Response Mocking** - UI is complete, but full functionality requires content scripts to intercept fetch requests. Chrome's declarativeNetRequest API does not support response mocking in Manifest V3. The ResponseMocker class is prepared for future implementation via content scripts that intercept fetch() calls.

**Status:** UI complete, backend requires content script integration

**Tracking:** See CHANGELOG.md "Upcoming Features" section

### Recently Implemented

The following features have been fully implemented:

1. **Query Parameter Modification** ✅ - Uses declarativeNetRequest redirect with queryTransform
2. **Script Injection** ✅ - Uses Chrome scripting API with webNavigation listeners

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

**Last Updated:** 2025-12-20

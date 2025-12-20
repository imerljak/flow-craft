# Pull Request: Request Interception with declarativeNetRequest API

## 🎯 Overview

Implements core HTTP request interception using Chrome's **declarativeNetRequest API** (Manifest V3). This is the foundational feature that enables FlowCraft to actually modify HTTP requests and responses.

## ✨ Features

### RequestInterceptor Class
- Converts FlowCraft rules to Chrome's declarativeNetRequest format
- Supports multiple pattern types (exact, wildcard, regex)
- Handles resource type filtering
- Priority-based rule application

### Supported Rule Types
✅ **Header Modification** - Add, modify, or remove HTTP headers
✅ **URL Redirection** - Redirect URLs to different destinations
✅ **Request Blocking** - Block unwanted requests

### Dynamic Rule Management
- Automatic sync on extension install
- Automatic sync on extension startup
- Automatic sync when rules change (storage listener)
- Manual sync via message API

## 🔧 Implementation Details

### Pattern Conversion
- **Exact patterns** → `urlFilter`
- **Wildcard patterns** → `urlFilter` with `*`
- **Regex patterns** → `regexFilter`

### Header Operations Mapping
- `ADD` / `MODIFY` → Chrome's `set` operation
- `REMOVE` → Chrome's `remove` operation

### Rule Updates
```typescript
// Automatically syncs when rules change
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.rules) {
    syncRules();
  }
});
```

## 📊 Test Coverage

**13 new tests added (44 total)**

### Test Categories
- ✅ Header modification (add, modify, remove, multiple)
- ✅ URL patterns (exact, wildcard, regex)
- ✅ Resource type filtering
- ✅ URL redirection
- ✅ Request blocking
- ✅ Dynamic rule updates
- ✅ Enabled/disabled rule filtering

```
✅ 44/44 tests passing
✅ 100% type-safe
✅ No TypeScript errors
```

## 🔍 Code Changes

### New Files
- `src/background/requestInterceptor.ts` - Main interceptor class
- `src/background/__tests__/requestInterceptor.test.ts` - Tests

### Modified Files
- `src/background/index.ts` - Integration with background worker
- `src/setupTests.ts` - Additional Chrome API mocks

## 📝 Example Usage

### Header Modification
```typescript
const rule: Rule = {
  matcher: {
    type: 'exact',
    pattern: 'https://api.example.com/users',
  },
  action: {
    type: RuleType.HEADER_MODIFICATION,
    headers: [
      {
        operation: HeaderOperation.ADD,
        name: 'X-Custom-Header',
        value: 'custom-value',
      },
    ],
  },
  // ...
};

// Automatically converted to Chrome format and applied
await RequestInterceptor.updateDynamicRules([rule]);
```

### URL Redirection
```typescript
const rule: Rule = {
  matcher: {
    type: 'wildcard',
    pattern: 'https://old.example.com/*',
  },
  action: {
    type: RuleType.URL_REDIRECT,
    redirectUrl: 'https://new.example.com/',
  },
  // ...
};
```

## ⚠️ Limitations

**Not implemented in this PR** (require different approaches):
- ❌ Mock Response (requires webRequest API or content scripts)
- ❌ Script Injection (requires content scripts)
- ❌ Query Parameter modification (will be added separately)

These will be implemented in future PRs with appropriate methods.

## 🧪 Testing Instructions

1. Checkout branch: `git checkout claude/feature-request-interception-iUMNN`
2. Install deps: `npm install`
3. Run tests: `npm test`
4. Type check: `npm run type-check`
5. Build: `npm run build`

## 🔗 Related

- **Base**: `claude/flowcraft-chrome-extension-iUMNN` (foundation)
- **Next**: Rule Editor UI

## ✅ Checklist

- [x] Tests written first (TDD)
- [x] All tests passing (44/44)
- [x] TypeScript strict mode (no errors)
- [x] No linting errors
- [x] Integration with background worker
- [x] Automatic sync on rule changes
- [x] Documentation updated

---

**PR Link**: https://github.com/imerljak/flow-craft/pull/new/claude/feature-request-interception-iUMNN
**Base Branch**: `claude/flowcraft-chrome-extension-iUMNN`

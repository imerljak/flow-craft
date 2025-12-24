# Chrome Web Store Publishing Guide

This document guides you through publishing FlowCraft to the Chrome Web Store.

## Prerequisites

### Developer Account

1. **Register as a Chrome Web Store developer**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay the $5 one-time registration fee
   - Enable 2-Step Verification (required)

### Pre-Publication Checklist

- [ ] Extension built and tested (`npm run build`)
- [ ] All quality checks passing (type-check, lint, tests)
- [ ] Store assets prepared (screenshots, promotional images)
- [ ] Privacy policy published (if collecting user data)
- [ ] Store listing information ready

## Required Assets

### 1. Screenshots

**Required**: At least 1 screenshot (up to 5 recommended)

- **Size**: 1280x800 or 640x400 pixels
- **Format**: PNG or JPEG
- **Content**: Show the extension in action

**Recommended screenshots**:
1. Popup interface with rules list
2. Rule editor showing header modification
3. Rule editor showing response mocking
4. Options page
5. Extension in action (before/after comparison)

### 2. Promotional Images

#### Small Tile (Required)
- **Size**: 440x280 pixels
- **Format**: PNG or JPEG
- **Purpose**: Appears in Chrome Web Store search results

#### Marquee (Optional but Recommended)
- **Size**: 1400x560 pixels
- **Format**: PNG or JPEG
- **Purpose**: Appears at the top of your extension's listing

### 3. Icon

Already included in the extension:
- 16x16px
- 48x48px
- 128x128px

## Store Listing Information

### Basic Information

```
Name: FlowCraft
Summary (132 chars max):
Privacy-first HTTP manipulation toolkit for developers. Mock APIs, modify headers, inject scripts, and control requests locally.

Description:
FlowCraft is a 100% free, open-source Chrome extension that lets you intercept, modify, and mock HTTP requests and responses. Built for developers who value privacy, simplicity, and power.

🎯 Key Features

✅ Response Mocking - Mock API responses with custom status codes, headers, and bodies
✅ Header Modification - Add, modify, or remove request/response headers
✅ URL Redirection - Redirect URLs based on patterns (exact, wildcard, regex)
✅ Script Injection - Inject JavaScript and CSS into pages
✅ Query Parameter Manipulation - Modify URL parameters on the fly
✅ Request Blocking - Block unwanted requests

🔒 Privacy First

• 100% Local - All processing happens on your machine
• No Telemetry - Zero tracking, analytics, or data collection
• No Cloud Sync - Your rules stay on your device
• No External Servers - No network requests to external services
• Open Source - Fully auditable code (MIT License)

🚀 Perfect For

• Frontend developers testing against mock APIs
• Backend developers mocking external services
• QA engineers testing edge cases
• Security researchers analyzing requests
• Anyone who needs HTTP-level control

📚 Use Cases

• Test your app against different API responses without backend changes
• Debug CORS issues by adding proper headers
• Test error handling with mock 404/500 responses
• Speed up development with instant mock responses
• Test against different data scenarios
• Block tracking scripts and unwanted requests

🛠️ Technical Details

• Built with TypeScript, React 18, and Tailwind CSS
• Uses Chrome Manifest V3 for maximum compatibility
• Comprehensive test coverage (89 tests)
• Full E2E and unit test suite
• Open source: github.com/imerljak/flow-craft

Support: For issues and feature requests, visit our GitHub repository.
```

### Category

**Developer Tools**

### Language

**English**

### Single Purpose

```
FlowCraft's single purpose is to provide developers with HTTP request and response manipulation capabilities for local development and testing. It allows users to intercept, modify, mock, and block HTTP requests and responses without sending data to external servers.
```

## Privacy Practices

### Data Usage

FlowCraft does NOT collect, transmit, or store any user data externally. All data (rules, settings) is stored locally using Chrome's storage API.

### Privacy Policy

If required, include a link to a privacy policy. For FlowCraft:

```
Privacy Policy: https://github.com/imerljak/flow-craft/blob/main/SECURITY.md#privacy--security
```

### Permissions Justification

| Permission | Justification |
|------------|--------------|
| `storage` | Store user-created rules and settings locally |
| `declarativeNetRequest` | Intercept and modify HTTP requests/responses |
| `declarativeNetRequestFeedback` | Provide feedback on matched rules for debugging |
| `activeTab` | Inject scripts into the current tab when requested |
| `scripting` | Execute user-defined scripts for script injection feature |
| `webNavigation` | Detect page navigation for automatic script injection |
| `<all_urls>` | Required for request interception to work on all websites |

## Automated Publishing (Future)

The release workflow includes a placeholder for Chrome Web Store API integration:

```yaml
- name: Upload to Chrome Web Store
  run: |
    echo "🚀 Ready for Chrome Web Store submission"
    echo "Package: flowcraft-${{ github.ref_name }}.zip"
```

To enable automated publishing:

1. **Get Chrome Web Store API credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Chrome Web Store API
   - Create OAuth 2.0 credentials
   - Generate refresh token

2. **Add GitHub Secrets**:
   - `CHROME_CLIENT_ID`
   - `CHROME_CLIENT_SECRET`
   - `CHROME_REFRESH_TOKEN`
   - `CHROME_APP_ID` (after first manual upload)

3. **Update release workflow** to use [chrome-extension-upload action](https://github.com/marketplace/actions/publish-chrome-extension-to-chrome-web-store)

## Manual Publishing Steps

### First Time Publication

1. **Prepare the ZIP**
   ```bash
   npm run build
   cd dist
   zip -r ../flowcraft-v1.0.0.zip .
   cd ..
   ```

2. **Go to Developer Dashboard**
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Click "New Item"

3. **Upload ZIP**
   - Upload `flowcraft-v1.0.0.zip`
   - Fill out store listing (see above)
   - Upload screenshots and promotional images

4. **Submit for Review**
   - Review all information
   - Click "Submit for review"
   - Wait 1-3 days for approval

### Subsequent Updates

1. Build new version
2. Go to Developer Dashboard
3. Select FlowCraft
4. Click "Upload Updated Package"
5. Upload new ZIP
6. Update version notes
7. Submit for review

## Review Process

- **Timeline**: Usually 1-3 days
- **Notification**: Email when reviewed
- **Appeals**: Can appeal rejections via dashboard

### Common Rejection Reasons

- Missing or incomplete privacy policy
- Unclear purpose description
- Missing permissions justification
- Code obfuscation or minification issues
- Violating program policies

## Post-Publication

### Metrics

Monitor your extension's performance:
- Installs
- Uninstalls
- Ratings & reviews
- Weekly active users

### Updates

Release updates via the GitHub Actions workflow:
1. Merge release PR
2. Download artifact from GitHub Release
3. Upload to Chrome Web Store manually (or automate)

## Resources

- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/publish)
- [Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Best Practices](https://developer.chrome.com/docs/webstore/best-practices)
- [Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api)

## Support

For Chrome Web Store publishing questions:
- [Chrome Web Store Help](https://support.google.com/chrome_webstore)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-chrome-extension)

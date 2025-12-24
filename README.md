# FlowCraft

**Privacy-first HTTP manipulation toolkit for developers**

FlowCraft is a 100% free, open-source Chrome extension that lets you intercept, modify, and mock HTTP requests and responses. Built for developers who value privacy, simplicity, and power.

## 🎯 Key Features

- ✅ **Header Modification** - Add, modify, or remove request/response headers
- ✅ **URL Redirection** - Redirect URLs based on patterns (exact, wildcard, regex)
- ✅ **Response Mocking** - Mock API responses with custom status codes and bodies
- ✅ **Script Injection** - Inject JavaScript and CSS into pages
- ✅ **Query Parameter Manipulation** - Modify URL parameters on the fly
- ✅ **Request Blocking** - Block unwanted requests

## 🔒 Privacy First

- **100% Local** - All processing happens on your machine
- **No Telemetry** - Zero tracking, analytics, or data collection
- **No Cloud Sync** - Your rules stay on your device
- **No External Servers** - No network requests to external services
- **Open Source** - Fully auditable code (MIT License)

## 🚀 Quick Start

### Installation (Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/imerljak/flow-craft.git
   cd flow-craft
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development

```bash
# Start development server with hot reload
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

## 📖 Usage

### Creating a Rule

1. Click the FlowCraft icon in your browser toolbar
2. Click "Create Rule"
3. Configure your rule:
   - **Name**: Give your rule a descriptive name
   - **URL Pattern**: Define which URLs to match
   - **Action**: Choose what to do (modify headers, redirect, mock, etc.)
4. Save and enable the rule

### Example: Add CORS Headers

```typescript
{
  "name": "Enable CORS for localhost",
  "matcher": {
    "type": "wildcard",
    "pattern": "https://api.example.com/*"
  },
  "action": {
    "type": "header_modification",
    "headers": [
      {
        "operation": "add",
        "name": "Access-Control-Allow-Origin",
        "value": "*"
      }
    ]
  }
}
```

### Example: Mock API Response

```typescript
{
  "name": "Mock user API",
  "matcher": {
    "type": "exact",
    "pattern": "https://api.example.com/user"
  },
  "action": {
    "type": "mock_response",
    "mockResponse": {
      "statusCode": 200,
      "headers": {
        "Content-Type": "application/json"
      },
      "body": "{\"id\": 1, \"name\": \"Test User\"}"
    }
  }
}
```

## 🏗️ Architecture

FlowCraft follows a modular architecture:

```
src/
├── background/       # Service worker (request interception)
├── popup/           # Extension popup UI
├── options/         # Settings page
├── components/      # Reusable UI components
├── storage/         # Chrome storage abstraction
├── shared/          # Shared types and utilities
│   ├── types/      # TypeScript type definitions
│   ├── utils/      # Utility functions
│   ├── constants/  # Constants and configuration
│   └── hooks/      # React hooks
└── styles/         # Global styles
```

## 🧪 Testing

FlowCraft follows Test-Driven Development (TDD) principles:

- **Unit Tests**: Vitest + React Testing Library (57 tests)
- **E2E Tests**: Playwright (32 tests)
- **Coverage**: Minimum 75% code coverage required (currently >83%)

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Implement your changes
5. Ensure all tests pass (`npm run test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📋 Roadmap

### Current Version: 0.1.0 (Beta)

**Core Features Complete:**
- ✅ Core rule engine
- ✅ Header modification
- ✅ Storage layer
- ✅ URL redirection
- ✅ Response mocking
- ✅ Script injection
- ✅ Query parameter modification
- ✅ Request blocking

### Toward 1.0.0 (Stable Release)
- Request/response viewer/logger
- Rule templates library
- Import/export rules UI
- Rule conflict detection UI
- Performance optimization
- Chrome Web Store publication
- Enhanced documentation and examples

### Future Enhancements (Post-1.0.0)
- AI-assisted rule suggestions
- Pattern detection and auto-generation
- WebSocket interception
- GraphQL tools
- Request collection/history

## 🛠️ Technology Stack

- **Language**: TypeScript (strict mode)
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Testing**: Jest, React Testing Library, Playwright
- **Build Tool**: Vite
- **Extension**: Chrome Manifest V3

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

Built with ❤️ for the developer community.

Special thanks to all contributors and the open-source community.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/imerljak/flow-craft/issues)
- **Discussions**: [GitHub Discussions](https://github.com/imerljak/flow-craft/discussions)

---

**Made with privacy in mind. Your data stays yours. Forever free. Forever open.**

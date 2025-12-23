# Build Instructions

FlowCraft uses `vite-plugin-web-extension` for building Chrome extensions with Manifest V3.

## Development Build

For development with hot reload:

```bash
npm run dev
```

This will:
- Start Vite dev server
- Watch for file changes
- Auto-reload extension on changes
- Output to `dist/` directory

## Production Build

For production-ready build:

```bash
# Run type checking first
npm run type-check

# Build the extension
npm run build
```

This will:
- Type check all TypeScript files
- Bundle and optimize all code
- Generate production build in `dist/` directory
- Create manifest.json with all required assets

## Load Extension in Chrome

### Development Mode

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist/` folder from your project
5. The extension should load successfully

**Note**: During development (`npm run dev`), the extension will automatically reload when you make changes.

### Production Testing

1. Run `npm run build` to create production build
2. Follow the same steps as development mode
3. Load the `dist/` folder

## Build Output

The build creates the following structure in `dist/`:

```
dist/
├── manifest.json          # Extension manifest
├── index.html            # Popup HTML
├── options.html          # Options page HTML
├── assets/               # Bundled JS/CSS
│   ├── index-*.js
│   ├── options-*.js
│   └── *.css
├── background/           # Background service worker
│   └── index.js
├── content/              # Content scripts
│   ├── main-world-injector.js
│   └── interceptor-bridge.js
└── icons/                # Extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Troubleshooting

### Build Fails

If the build fails:
1. Clear node_modules: `rm -rf node_modules package-lock.json`
2. Reinstall: `npm install`
3. Try building again: `npm run build`

### Extension Won't Load

If Chrome won't load the extension:
1. Check that `dist/manifest.json` exists
2. Verify all paths in manifest.json are correct
3. Check Chrome console for error messages
4. Try reloading: Click reload button on extension card

### Hot Reload Not Working

If changes aren't auto-reloading during development:
1. Stop dev server (Ctrl+C)
2. Clear dist folder: `rm -rf dist`
3. Restart: `npm run dev`
4. Reload extension in Chrome

## Testing the Extension

See `TESTING_GUIDE.md` for comprehensive manual testing instructions.

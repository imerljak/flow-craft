# Manual Build Instructions

Due to an issue with the `@crxjs/vite-plugin` and icon path resolution, here's how to manually build the extension:

## Quick Build (Recommended for Testing)

1. **Type check first**:
   ```bash
   npm run type-check
   ```

2. **Build without crxjs** (manually):
   ```bash
   # Build TypeScript
   npx tsc

   # The extension files are in src/ and already work
   # Just load src/ directly in Chrome for development
   ```

## Load in Chrome (Development Mode)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `/home/user/flow-craft` directory (project root)
5. The extension should load with manifest from `public/manifest.json`

**Note**: Chrome will use the source files directly from `src/` directories.

## Alternative: Manual Dist Build

If you need a production build:

1. Create dist directory structure:
   ```bash
   mkdir -p dist
   cp public/manifest.json dist/
   cp index.html dist/
   cp options.html dist/
   ```

2. Build TypeScript to dist:
   ```bash
   npx tsc --outDir dist
   ```

3. Copy static assets:
   ```bash
   cp -r public/icons dist/ 2>/dev/null || true
   cp -r src/styles dist/styles
   ```

4. Load `dist/` folder in Chrome

## Known Issue

The `@crxjs/vite-plugin` has a bug where it looks for icons even when not specified in manifest.
This is tracked for fix in a future update.

## Workaround Applied

For development, we're loading the extension directly from source without bundling.
This works perfectly for testing all features.

## Testing the Extension

See `TESTING_GUIDE.md` for comprehensive manual testing instructions.

# Release Process

This document describes how to create a new release of FlowCraft.

## Overview

We use [Release Please](https://github.com/googleapis/release-please) to automate releases via GitHub Actions. Release Please creates release PRs automatically based on conventional commits, and publishes releases when those PRs are merged.

## How It Works

1. **Make commits** using [Conventional Commits](https://www.conventionalcommits.org/) format
2. **Push to main** - Release Please automatically creates/updates a release PR
3. **Review the release PR** - Check the version bump and changelog
4. **Merge the PR** - This triggers the release workflow that:
   - Creates a GitHub release
   - Builds the extension
   - Uploads the ZIP artifact
   - Generates checksums

## Conventional Commits

Release Please determines version bumps based on commit messages:

### Version Bumps

- `feat:` → **Minor** version bump (0.X.0)
- `fix:` → **Patch** version bump (0.0.X)
- `feat!:` or `BREAKING CHANGE:` → **Major** version bump (X.0.0)

### Changelog Sections

- `feat:` → Features
- `fix:` → Bug Fixes
- `docs:` → Documentation
- `refactor:` → Code Refactoring
- `perf:` → Performance Improvements
- `test:` → Tests
- `build:` → Build System
- `ci:` → Continuous Integration
- `chore:` → Not included in changelog
- `style:` → Not included in changelog

### Examples

```bash
# Feature (minor bump)
git commit -m "feat: add request throttling support"

# Bug fix (patch bump)
git commit -m "fix: resolve CSP header injection issue"

# Breaking change (major bump)
git commit -m "feat!: redesign rule configuration API"
# or
git commit -m "feat: redesign rule API

BREAKING CHANGE: Rule configuration format has changed"

# Multiple types in one commit
git commit -m "feat: add dark mode toggle

- feat: add theme switcher component
- fix: resolve theme persistence bug
- docs: update theme customization guide"
```

## Release Steps

### 1. Make Changes with Conventional Commits

```bash
# Work on your feature/fix
git checkout -b feature/my-feature

# Make commits using conventional commit format
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"

# Push to remote
git push origin feature/my-feature
```

### 2. Merge to Main

```bash
# Create PR and get it reviewed
# Once approved, merge to main
git checkout main
git pull
```

### 3. Release Please Creates/Updates Release PR

After pushing to main, Release Please automatically:
- Analyzes commits since last release
- Determines version bump
- Creates or updates a "chore: release X.Y.Z" PR
- Updates CHANGELOG.md
- Bumps version in package.json and manifest.json

### 4. Review the Release PR

Check the automatically created release PR:
- [ ] Version bump is correct
- [ ] CHANGELOG.md includes all changes
- [ ] No unexpected changes
- [ ] All CI checks passing

### 5. Merge the Release PR

When ready to release:
1. Approve the release PR
2. Merge it to main
3. Release Please will:
   - Create a git tag (e.g., `v1.0.0`)
   - Create a GitHub Release
   - Build the extension
   - Upload `flowcraft-v1.0.0.zip`
   - Generate and upload `checksums.txt`

### 6. Verify the Release

1. Check https://github.com/imerljak/flow-craft/releases
2. Download the ZIP and verify it works
3. Check SHA256 checksums match

## Manual Release (Emergency Only)

If you need to manually trigger a release (not recommended):

### Option 1: Bootstrap Initial Release

For the very first release (v1.0.0):

```bash
# Ensure CHANGELOG.md has a [1.0.0] section
# Ensure package.json and manifest.json have version: "1.0.0"

# Create tag manually
git tag -a v1.0.0 -m "chore: release v1.0.0"

# Push tag to trigger release workflow
git push origin v1.0.0
```

### Option 2: Force Release PR Creation

```bash
# Create empty commit to trigger Release Please
git commit --allow-empty -m "chore: trigger release"
git push origin main
```

## Configuration Files

### `.release-please-manifest.json`
Tracks the current version for Release Please.

### `release-please-config.json`
Configures Release Please behavior:
- Release type (node)
- Extra files to version (manifest.json)
- Changelog sections

### `.github/workflows/release-please.yml`
GitHub Actions workflow that:
- Runs on every push to main
- Creates/updates release PR
- Builds and publishes on PR merge

## Troubleshooting

### Release PR Not Created

**Cause**: No conventional commits since last release

**Fix**: Ensure commits follow conventional commit format:
```bash
git commit -m "feat: add new feature"
```

### Wrong Version Bump

**Cause**: Incorrect commit message type

**Fix**:
- For major version: Use `feat!:` or `BREAKING CHANGE:`
- For minor version: Use `feat:`
- For patch version: Use `fix:`

### Release PR Has Wrong Changes

**Cause**: CHANGELOG.md or version files were manually edited

**Fix**: Let Release Please manage these files. If needed, close the PR and:
```bash
# Reset to clean state
git checkout main
git pull

# Make a new conventional commit
git commit --allow-empty -m "chore: trigger new release PR"
git push origin main
```

### Build Fails on Release

**Cause**: Quality checks failing (type-check, lint, tests)

**Fix**:
1. Fix the issues locally
2. Push fixes to main
3. Release PR will update automatically
4. Merge when all checks pass

### Need to Skip CI on Commit

Add `[skip ci]` to commit message:
```bash
git commit -m "docs: update README [skip ci]"
```

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes, incompatible API changes
- **MINOR** (0.X.0): New features, backwards-compatible
- **PATCH** (0.0.X): Bug fixes, backwards-compatible

## Best Practices

1. **Always use conventional commits** - This ensures proper version bumping
2. **One feature per commit** - Makes changelogs clearer
3. **Review release PRs carefully** - They auto-update as you push to main
4. **Don't manually edit version files** - Let Release Please handle it
5. **Test before merging release PR** - All artifacts are built on merge

## Benefits of Release Please

- ✅ Automated version bumping
- ✅ Automated changelog generation
- ✅ Consistent release process
- ✅ Clear history via release PRs
- ✅ No manual version file edits
- ✅ Integrates with GitHub Actions
- ✅ Supports multiple packages (monorepos)

## Additional Resources

- [Release Please Documentation](https://github.com/googleapis/release-please)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

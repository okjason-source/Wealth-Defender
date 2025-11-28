# GitHub Setup Guide

This guide will help you set up your Wealth Defender project on GitHub.

## Initial Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `wealth-defender` (or your preferred name)
3. **Don't** initialize with README, .gitignore, or license (we already have these)
4. Copy the repository URL

### 2. Initialize Git (if not already done)

```bash
# Initialize git repository
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Wealth Defender game"

# Add remote repository (replace with your URL)
git remote add origin https://github.com/yourusername/wealth-defender.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Update Repository URLs

Update these files with your actual repository URL:

**package.json:**
```json
"repository": {
  "type": "git",
  "url": "https://github.com/yourusername/wealth-defender.git"
}
```

**vite.config.ts:**
```typescript
base: process.env.NODE_ENV === 'production' ? '/wealth-defender/' : '/',
```
*(Change `/wealth-defender/` to match your repository name)*

**README.md:**
- Update the clone URL in the Quick Start section
- Update any other references to the repository

## GitHub Pages Deployment

### Option 1: Automatic Deployment (Recommended)

The project includes a GitHub Actions workflow that automatically deploys on push to `main`:

1. Go to your repository Settings → Pages
2. Under "Source", select "GitHub Actions"
3. The workflow will automatically deploy when you push to `main`

### Option 2: Manual Deployment

1. Build the project: `npm run build`
2. Go to repository Settings → Pages
3. Under "Source", select "Deploy from a branch"
4. Select `main` branch and `/dist` folder
5. Click Save

### Option 3: Using gh-pages Branch

```bash
# Build the project
npm run build

# Create and switch to gh-pages branch
git checkout --orphan gh-pages
git rm -rf .

# Copy dist contents to root
cp -r dist/* .

# Commit and push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

Then in repository Settings → Pages, select `gh-pages` branch.

## Repository Settings

### Enable GitHub Pages

1. Go to Settings → Pages
2. Choose your deployment method (see above)
3. Your game will be available at: `https://yourusername.github.io/wealth-defender/`

### Add Topics/Tags

Add relevant topics to your repository:
- `game`
- `arcade`
- `typescript`
- `pixel-art`
- `retro`
- `canvas`
- `shooter`

### Add Description

Add a clear description: "Classic arcade shoot 'em up game with 8-bit pixel art graphics"

## Next Steps

1. ✅ Update repository URLs in files
2. ✅ Push code to GitHub
3. ✅ Enable GitHub Pages
4. ✅ Test the deployed game
5. ✅ Share your game!

## Troubleshooting

### Build fails on GitHub Actions

- Check that `vite.config.ts` has the correct `base` path
- Ensure all dependencies are in `package.json`
- Check GitHub Actions logs for specific errors

### Game doesn't load on GitHub Pages

- Verify the `base` path in `vite.config.ts` matches your repository name
- Check browser console for 404 errors
- Ensure all assets are being built correctly

### Assets not loading

- Make sure the `base` path includes trailing slash: `/wealth-defender/`
- Check that paths in code use relative paths, not absolute

## Custom Domain (Optional)

If you have a custom domain:

1. Update `vite.config.ts`:
```typescript
base: '/', // Use root path for custom domain
```

2. Add `CNAME` file in `public/` folder with your domain
3. Configure DNS settings as per GitHub Pages instructions


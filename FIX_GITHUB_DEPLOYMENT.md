# 🔧 Fix GitHub Deployment Issues

## The Problem
You have multiple issues:
1. **Branch confusion**: You have both `main` and `master` branches, but use `master` for production
2. **gh-pages conflicts**: The gh-pages branch is being used for GitHub Pages deployment
3. **Deployment overwrites**: When you run `npm run deploy`, it deploys to gh-pages, not your production site
4. **Missing homepage**: Your package.json doesn't have a `homepage` field for gh-pages

## The Solution

### Step 1: Understand Your Current Setup
- **master branch**: Your production code (for Render deployment)
- **main branch**: GitHub's default branch (not actively used)
- **gh-pages branch**: GitHub Pages deployment (static site hosting)

### Step 2: Fix the Deployment Configuration

#### Option A: If you want to use GitHub Pages (Free hosting)
Add this to your `package.json`:
```json
{
  "homepage": "https://FRBCAPL.github.io/NEWAPP",
  ...rest of your package.json
}
```

Then deploy with:
```bash
npm run build
npm run deploy
```

Your app will be available at: https://FRBCAPL.github.io/NEWAPP

#### Option B: If you DON'T want GitHub Pages (Recommended)
Remove the gh-pages deployment entirely:

1. Delete the gh-pages branch:
```bash
git push origin --delete gh-pages
```

2. Update package.json to remove the deploy script:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
  // Remove the "deploy" line
}
```

3. Uninstall gh-pages:
```bash
npm uninstall gh-pages
```

### Step 3: Set Up Proper Production Workflow

1. **For Render Deployment** (Recommended):
   - Always push to `master` branch
   - Render will automatically deploy from master
   - No need for gh-pages at all

2. **Update vite.config.js**:
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/', // Remove the conditional base path
});
```

### Step 4: Clean Up Your Branches

```bash
# Make main point to master (GitHub default)
git checkout master
git push origin master:main -f

# Set master as default on GitHub
# Go to: https://github.com/FRBCAPL/NEWAPP/settings
# Under "Default branch", change from "main" to "master"

# Delete the old main branch locally and remotely
git branch -d main
git push origin --delete main
```

### Step 5: Create a Simple Deployment Script

Create `deploy-to-render.sh`:
```bash
#!/bin/bash
echo "Deploying to Render via master branch..."

# Ensure we're on master
git checkout master

# Pull latest changes
git pull origin master

# Push to master (triggers Render deployment)
git push origin master

echo "✅ Pushed to master. Check Render dashboard for deployment status."
```

## Prevention Tips

1. **Never use `npm run deploy`** - This is for GitHub Pages only
2. **Always push to master** for production: `git push origin master`
3. **Use feature branches** for development
4. **Ignore gh-pages** - It's only for static site hosting, not your full app

## Quick Command Reference

```bash
# For development
git checkout -b feature/my-new-feature
# ... make changes ...
git add .
git commit -m "Add new feature"
git push origin feature/my-new-feature

# For production deployment
git checkout master
git merge feature/my-new-feature
git push origin master
# Render auto-deploys from master
```

## Your Corrected Workflow

1. Develop on feature branches
2. Merge to master when ready
3. Push master to GitHub
4. Render automatically deploys from master
5. Ignore gh-pages completely (or delete it)
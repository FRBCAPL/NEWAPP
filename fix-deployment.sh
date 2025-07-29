#!/bin/bash

echo "🔧 Fixing GitHub Deployment Configuration"
echo "========================================"
echo

# Function to confirm actions
confirm() {
    read -p "$1 (y/N): " response
    if [[ "$response" != "y" ]]; then
        echo "Skipped."
        return 1
    fi
    return 0
}

echo "Current branch setup:"
git branch -a | grep -E "(master|main|gh-pages)"
echo

echo "Step 1: Remove gh-pages deployment"
echo "-----------------------------------"
if confirm "Do you want to remove gh-pages deployment?"; then
    # Remove deploy script from package.json
    echo "Updating package.json..."
    sed -i '/"deploy": "gh-pages -d dist"/d' package.json
    
    # Update vite.config.js
    echo "Updating vite.config.js..."
    cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Simple base path for Render deployment
});
EOF
    
    # Uninstall gh-pages
    echo "Uninstalling gh-pages package..."
    npm uninstall gh-pages
    
    # Delete remote gh-pages branch
    if confirm "Delete gh-pages branch from GitHub?"; then
        git push origin --delete gh-pages 2>/dev/null || echo "gh-pages branch may already be deleted"
    fi
fi

echo
echo "Step 2: Clean up branch structure"
echo "---------------------------------"
echo "You currently have both 'main' and 'master' branches."
echo "Render uses 'master' for deployment."
echo

if confirm "Make 'master' the default branch?"; then
    # Ensure we're on master
    git checkout master
    
    # Push master to main to sync them
    git push origin master:main -f
    
    echo
    echo "⚠️  IMPORTANT: You need to manually change the default branch on GitHub:"
    echo "1. Go to: https://github.com/FRBCAPL/NEWAPP/settings"
    echo "2. Under 'Default branch', change from 'main' to 'master'"
    echo "3. Come back here and press Enter to continue"
    read -p "Press Enter after changing the default branch on GitHub..."
    
    # Delete local main branch
    git branch -D main 2>/dev/null || echo "Local main branch doesn't exist"
    
    # Delete remote main branch
    if confirm "Delete 'main' branch from GitHub?"; then
        git push origin --delete main 2>/dev/null || echo "Cannot delete main branch (might still be default)"
    fi
fi

echo
echo "Step 3: Create deployment helper"
echo "--------------------------------"
cat > deploy-to-render.sh << 'EOF'
#!/bin/bash
# Simple deployment script for Render

echo "📦 Deploying to Render..."

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  You have uncommitted changes!"
    git status --short
    read -p "Do you want to commit them first? (y/N): " commit_changes
    if [[ "$commit_changes" == "y" ]]; then
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
    else
        echo "Please commit or stash your changes before deploying."
        exit 1
    fi
fi

# Ensure we're on master
current_branch=$(git branch --show-current)
if [[ "$current_branch" != "master" ]]; then
    echo "Switching to master branch..."
    git checkout master
fi

# Pull latest changes
echo "Pulling latest changes..."
git pull origin master

# Push to trigger Render deployment
echo "Pushing to master (triggers Render deployment)..."
git push origin master

echo "✅ Pushed to master!"
echo "🚀 Check your Render dashboard for deployment status:"
echo "   https://dashboard.render.com/"
EOF

chmod +x deploy-to-render.sh

echo
echo "✅ Deployment configuration fixed!"
echo
echo "Summary of changes:"
echo "- Removed gh-pages deployment configuration"
echo "- Updated vite.config.js for standard deployment"
echo "- Created deploy-to-render.sh helper script"
echo
echo "🎯 How to deploy from now on:"
echo "1. Make your changes and commit them"
echo "2. Run: ./deploy-to-render.sh"
echo "3. Render will automatically deploy from master branch"
echo
echo "📝 Remember:"
echo "- NEVER use 'npm run deploy' (that was for gh-pages)"
echo "- Always push to 'master' branch for production"
echo "- Use feature branches for development"
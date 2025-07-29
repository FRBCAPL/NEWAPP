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
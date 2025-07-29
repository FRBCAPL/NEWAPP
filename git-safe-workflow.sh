#!/bin/bash

# Git Safe Workflow Script
# This script helps you safely work with Git to avoid losing changes

echo "=== Git Safe Workflow Helper ==="
echo

# Function to check for uncommitted changes
check_uncommitted() {
    if [[ -n $(git status --porcelain) ]]; then
        echo "⚠️  You have uncommitted changes!"
        echo "Please commit or stash them before proceeding."
        git status --short
        return 1
    fi
    return 0
}

# Function to backup current branch
backup_branch() {
    current_branch=$(git branch --show-current)
    backup_name="${current_branch}-backup-$(date +%Y%m%d-%H%M%S)"
    echo "Creating backup branch: $backup_name"
    git checkout -b "$backup_name"
    git checkout "$current_branch"
    echo "✅ Backup created: $backup_name"
}

# Function to safely pull from remote
safe_pull() {
    echo "Performing safe pull..."
    
    # Check for uncommitted changes
    if ! check_uncommitted; then
        echo "❌ Cannot pull with uncommitted changes"
        return 1
    fi
    
    # Create backup
    backup_branch
    
    # Pull with rebase to avoid merge commits
    echo "Pulling latest changes..."
    git pull --rebase origin $(git branch --show-current)
    
    echo "✅ Pull completed safely"
}

# Function to push changes
safe_push() {
    echo "Performing safe push..."
    
    # Check current branch
    current_branch=$(git branch --show-current)
    echo "Current branch: $current_branch"
    
    # Confirm before pushing to master
    if [[ "$current_branch" == "master" ]]; then
        echo "⚠️  You're about to push to master branch!"
        read -p "Are you sure? (y/N): " confirm
        if [[ "$confirm" != "y" ]]; then
            echo "Push cancelled"
            return 1
        fi
    fi
    
    # Push to remote
    git push origin "$current_branch"
    echo "✅ Push completed"
}

# Function to create a feature branch
create_feature_branch() {
    read -p "Enter feature branch name: " branch_name
    git checkout -b "$branch_name"
    echo "✅ Created and switched to branch: $branch_name"
}

# Main menu
echo "What would you like to do?"
echo "1) Check status"
echo "2) Safe pull (with backup)"
echo "3) Safe push"
echo "4) Create feature branch"
echo "5) List all branches"
echo "6) Show recent commits"
echo

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        git status
        ;;
    2)
        safe_pull
        ;;
    3)
        safe_push
        ;;
    4)
        create_feature_branch
        ;;
    5)
        echo "Local branches:"
        git branch
        echo
        echo "Remote branches:"
        git branch -r
        ;;
    6)
        git log --oneline -10
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
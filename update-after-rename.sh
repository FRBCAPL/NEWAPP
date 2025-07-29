#!/bin/bash

# Script to update URLs after renaming Render service

echo "This script will help you update URLs after renaming your Render service"
echo

read -p "Enter your OLD Render URL (e.g., newapp-1-ic1v): " old_name
read -p "Enter your NEW Render URL (e.g., my-awesome-app): " new_name

echo
echo "This will replace:"
echo "  https://${old_name}.onrender.com"
echo "With:"
echo "  https://${new_name}.onrender.com"
echo

read -p "Continue? (y/N): " confirm
if [[ "$confirm" != "y" ]]; then
    echo "Cancelled"
    exit 1
fi

# Update files
find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | while read file; do
    if grep -q "${old_name}.onrender.com" "$file"; then
        echo "Updating $file"
        sed -i "s/${old_name}.onrender.com/${new_name}.onrender.com/g" "$file"
    fi
done

echo
echo "✅ Done! Don't forget to:"
echo "1. Update VITE_API_BASE_URL in Render environment variables"
echo "2. Commit and push these changes"
echo "3. Update any external services using the old URL"
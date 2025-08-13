import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting deployment...');

// Step 1: Build the project
console.log('📦 Building project...');
execSync('npm run build', { stdio: 'inherit' });

// Step 2: Deploy to gh-pages
console.log('🌐 Deploying to GitHub Pages...');
execSync('npx gh-pages -d dist', { stdio: 'inherit' });

// Step 3: Switch back to main branch
console.log('🔄 Switching back to main branch...');
execSync('git checkout main', { stdio: 'inherit' });

console.log('✅ Deployment complete!');
console.log('📝 Your source code is safe on the main branch');
console.log('🌐 Your website is updated on GitHub Pages'); 
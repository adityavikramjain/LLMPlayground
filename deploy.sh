#!/bin/bash

# LLM Playground Deployment Script
# This script builds the React app and copies it to the adityavj.com site

echo "🚀 Starting LLM Playground deployment..."

# Set paths
PLAYGROUND_DIR="/Users/adityavikramhain/Documents/GitHub/LLMPlayground"
SITE_DIR="/Users/adityavikramhain/Documents/GitHub/adityavj"
TARGET_DIR="$SITE_DIR/llm-playground"

# Step 1: Navigate to playground directory
echo "📂 Navigating to LLM Playground directory..."
cd "$PLAYGROUND_DIR" || exit 1

# Step 2: Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Step 3: Build the app
echo "🔨 Building the React app..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Step 4: Create target directory if it doesn't exist
echo "📁 Preparing target directory..."
mkdir -p "$TARGET_DIR"

# Step 5: Copy built files to site directory
echo "📋 Copying built files to site..."
cp -r dist/* "$TARGET_DIR/"

# Step 6: Create a .htaccess file for proper routing (if needed)
echo "⚙️  Creating .htaccess for SPA routing..."
cat > "$TARGET_DIR/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /llm-playground/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /llm-playground/index.html [L]
</IfModule>
EOF

echo "✅ Build complete! Files are in: $TARGET_DIR"
echo ""
echo "Next steps:"
echo "1. Test locally by opening: $TARGET_DIR/index.html"
echo "2. Commit and push using GitHub Desktop"
echo "3. Deploy to Hostinger"
echo ""
echo "📊 Deployment Summary:"
echo "   Source: $PLAYGROUND_DIR/dist"
echo "   Target: $TARGET_DIR"
echo "   Files copied: $(find $TARGET_DIR -type f | wc -l)"

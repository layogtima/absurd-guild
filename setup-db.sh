#!/bin/bash

# Absurd Guild Database Setup Script
# This script creates the Cloudflare D1 database and KV namespace

echo "🚀 Setting up Absurd Guild infrastructure..."

# Create D1 database
echo "📊 Creating D1 database..."
DB_OUTPUT=$(wrangler d1 create absurd-guild-db 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
    echo "$DB_OUTPUT"

    # Extract database ID from output
    DB_ID=$(echo "$DB_OUTPUT" | grep -o '\[\[.*\]\]' | sed 's/\[\[//g; s/\]\]//g' | cut -d'.' -f2)
    echo "📝 Database ID: $DB_ID"
else
    echo "❌ Failed to create database"
    echo "$DB_OUTPUT"
    exit 1
fi

# Create KV namespace for sessions
echo "🔐 Creating KV namespace for sessions..."
KV_OUTPUT=$(wrangler kv namespace create "sessions" 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ KV namespace created successfully"
    echo "$KV_OUTPUT"

    # Extract namespace ID
    KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    echo "📝 KV Namespace ID: $KV_ID"
else
    echo "❌ Failed to create KV namespace"
    echo "$KV_OUTPUT"
    exit 1
fi

# Create preview KV namespace
echo "🔐 Creating KV namespace for sessions (preview)..."
KV_PREVIEW_OUTPUT=$(wrangler kv namespace create "sessions" --preview 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Preview KV namespace created successfully"
    echo "$KV_PREVIEW_OUTPUT"

    # Extract preview namespace ID
    KV_PREVIEW_ID=$(echo "$KV_PREVIEW_OUTPUT" | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)
    echo "📝 Preview KV Namespace ID: $KV_PREVIEW_ID"
else
    echo "❌ Failed to create preview KV namespace"
    echo "$KV_PREVIEW_OUTPUT"
    exit 1
fi

# Update wrangler.jsonc with the actual IDs
echo "📝 Updating wrangler.jsonc with actual IDs..."

# Backup original file
cp wrangler.jsonc wrangler.jsonc.backup

# Replace placeholder IDs with actual IDs
sed -i.tmp "s/placeholder-for-real-db-id/$DB_ID/g" wrangler.jsonc
sed -i.tmp "s/placeholder-for-sessions-kv/$KV_ID/g" wrangler.jsonc
sed -i.tmp "s/placeholder-for-sessions-preview/$KV_PREVIEW_ID/g" wrangler.jsonc

# Remove temporary file
rm wrangler.jsonc.tmp

echo "✅ Updated wrangler.jsonc with actual IDs"

# Execute schema.sql to set up tables
echo "🏗️  Setting up database schema..."
wrangler d1 execute absurd-guild-db --file=./schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully"
else
    echo "❌ Failed to create database schema"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Visit http://localhost:5173 to see your app"
echo "3. Test the magic link authentication by going to /auth/login"
echo ""
echo "📋 Your infrastructure:"
echo "  - D1 Database ID: $DB_ID"
echo "  - KV Namespace ID: $KV_ID"
echo "  - Preview KV ID: $KV_PREVIEW_ID"
echo ""
echo "💡 Tip: Check wrangler.jsonc to see the updated configuration"
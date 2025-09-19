#!/bin/bash

# Absurd Guild Migration Script
# Applies database migrations in the correct order

echo "🗄️  Applying Absurd Guild database migrations..."

# Function to apply migration with error checking
apply_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file" .sql)

    echo "📊 Applying $migration_name..."

    if wrangler d1 execute absurd-guild-db --file="$migration_file"; then
        echo "✅ $migration_name applied successfully"
    else
        echo "❌ Failed to apply $migration_name"
        echo "🛑 Migration stopped. Please check the error above."
        exit 1
    fi
}

# Check if migrations directory exists
if [ ! -d "db/migrations" ]; then
    echo "❌ Migrations directory not found. Run this script from the project root."
    exit 1
fi

# Apply migrations in order
echo "🚀 Starting migration process..."

apply_migration "db/migrations/0001_initial_schema.sql"
apply_migration "db/migrations/0002_maker_profiles.sql"
apply_migration "db/migrations/0003_enhanced_campaigns.sql"
apply_migration "db/migrations/0004_add_cascade_constraints.sql"

echo ""
echo "🎉 All migrations applied successfully!"
echo ""
echo "📋 Database status:"
echo "  - Base tables: ✅ Created"
echo "  - Maker profiles: ✅ Added"
echo "  - Enhanced campaigns: ✅ Added"
echo "  - CASCADE constraints: ✅ Added"
echo ""
echo "💡 Next steps:"
echo "  1. Run 'npm run dev' to start development"
echo "  2. Test authentication at /auth/login"
echo "  3. Set up maker profiles at /profile/setup"
echo ""

# Show table count
echo "🔍 Verifying database:"
wrangler d1 execute absurd-guild-db --command="SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
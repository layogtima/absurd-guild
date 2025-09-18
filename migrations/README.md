# Database Migrations

This directory contains SQL migration files for the Absurd Guild database.

## Migration Files

- `0001_initial_schema.sql` - Base database schema with authentication and core functionality
- `0002_maker_profiles.sql` - Maker profile system with flexible profile links
- `0003_enhanced_campaigns.sql` - Enhanced campaign and product features

## Manual Migration Commands

### Apply All Migrations

```bash
# Apply initial schema
wrangler d1 execute absurd-guild-db --file=./migrations/0001_initial_schema.sql

# Apply maker profiles
wrangler d1 execute absurd-guild-db --file=./migrations/0002_maker_profiles.sql

# Apply enhanced campaigns
wrangler d1 execute absurd-guild-db --file=./migrations/0003_enhanced_campaigns.sql
```

### Apply Single Migration

```bash
# Replace XXX with migration number (001, 002, etc.)
wrangler d1 execute absurd-guild-db --file=./migrations/XXX_migration_name.sql
```

### Check Database Status

```bash
# List all tables
wrangler d1 execute absurd-guild-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check table schema
wrangler d1 execute absurd-guild-db --command="PRAGMA table_info(users);"
```

### Rollback (Manual)

Since D1 doesn't have built-in rollback, you'll need to manually reverse changes:

```bash
# Example: Remove columns added in migration 002
wrangler d1 execute absurd-guild-db --command="ALTER TABLE users DROP COLUMN is_maker;"
```

## Migration Order

Always apply migrations in order:
1. 001_initial_schema.sql (base tables)
2. 002_maker_profiles.sql (maker features)
3. 003_enhanced_campaigns.sql (campaign enhancements)

## Development vs Production

### Development
```bash
wrangler d1 execute absurd-guild-db --file=./migrations/XXX_migration.sql
```

### Production
```bash
wrangler d1 execute absurd-guild-db --file=./migrations/XXX_migration.sql --env=production
```

## Best Practices

1. **Never modify existing migration files** - always create new ones
2. **Test migrations locally first** before applying to production
3. **Backup your database** before running migrations (if possible)
4. **Apply migrations in sequence** - don't skip numbers
5. **Check migration results** using the status commands above

## Creating New Migrations

1. Create new file with next sequential number: `004_feature_name.sql`
2. Add migration commands (ALTER TABLE, CREATE TABLE, etc.)
3. Test locally first
4. Update this README with the new migration
5. Apply to production

## Example Migration Template

```sql
-- Migration XXX: Description of what this migration does
-- Date: YYYY-MM-DD

-- Add your SQL commands here
ALTER TABLE table_name ADD COLUMN new_column TEXT;

-- Add indexes if needed
CREATE INDEX idx_table_column ON table_name(new_column);

-- Insert default data if needed
INSERT INTO table_name (column) VALUES ('default_value');
```
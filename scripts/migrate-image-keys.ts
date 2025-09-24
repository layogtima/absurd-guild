#!/usr/bin/env tsx
/**
 * Data migration script to extract R2 keys from existing image URLs
 * and populate the new *_key columns in the database.
 *
 * This script should be run after deploying the schema migration
 * that adds the key columns.
 */

import { extractKeyFromUrl } from '../app/lib/images.server';

interface MigrationRow {
  id: number;
  url: string | null;
  table: string;
  url_column: string;
  key_column: string;
}

/**
 * Extract keys from existing URLs and update database
 */
async function migrateImageKeys(db: D1Database) {
  console.log('🚀 Starting image key migration...');

  // Define tables and columns to migrate
  const migrations: Array<{
    table: string;
    url_column: string;
    key_column: string;
    id_column: string;
  }> = [
    {
      table: 'users',
      url_column: 'avatar_url',
      key_column: 'avatar_key',
      id_column: 'id',
    },
    {
      table: 'products',
      url_column: 'image_url',
      key_column: 'image_key',
      id_column: 'id',
    },
    {
      table: 'campaigns',
      url_column: 'hero_image_url',
      key_column: 'hero_image_key',
      id_column: 'id',
    },
    {
      table: 'campaign_assets',
      url_column: 'file_url',
      key_column: 'file_key',
      id_column: 'id',
    },
  ];

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const migration of migrations) {
    console.log(`\n📋 Processing ${migration.table}.${migration.url_column}...`);

    try {
      // Get all rows with URLs but no keys
      const rows = await db
        .prepare(
          `SELECT ${migration.id_column} as id, ${migration.url_column} as url
           FROM ${migration.table}
           WHERE ${migration.url_column} IS NOT NULL
           AND ${migration.key_column} IS NULL`
        )
        .all();

      console.log(`   Found ${rows.results.length} rows to process`);

      let processed = 0;
      let updated = 0;
      let errors = 0;

      for (const row of rows.results as Array<{ id: number; url: string | null }>) {
        processed++;
        totalProcessed++;

        if (!row.url) {
          console.log(`   ⚠️  Row ${row.id}: URL is null, skipping`);
          continue;
        }

        // Extract key from URL
        const key = extractKeyFromUrl(row.url);

        if (!key) {
          console.log(`   ❌ Row ${row.id}: Could not extract key from URL: ${row.url}`);
          errors++;
          totalErrors++;
          continue;
        }

        try {
          // Update the key column
          const result = await db
            .prepare(
              `UPDATE ${migration.table}
               SET ${migration.key_column} = ?
               WHERE ${migration.id_column} = ?`
            )
            .bind(key, row.id)
            .run();

          if (result.meta.rows_written > 0) {
            updated++;
            totalUpdated++;
            console.log(`   ✅ Row ${row.id}: Updated with key: ${key}`);
          } else {
            console.log(`   ⚠️  Row ${row.id}: Update had no effect`);
            errors++;
            totalErrors++;
          }
        } catch (updateError) {
          console.error(`   ❌ Row ${row.id}: Update failed:`, updateError);
          errors++;
          totalErrors++;
        }
      }

      console.log(`   📊 ${migration.table} summary: ${processed} processed, ${updated} updated, ${errors} errors`);

    } catch (error) {
      console.error(`❌ Failed to process ${migration.table}:`, error);
      totalErrors++;
    }
  }

  console.log(`\n🎉 Migration completed!`);
  console.log(`📊 Total summary:`);
  console.log(`   • ${totalProcessed} rows processed`);
  console.log(`   • ${totalUpdated} rows updated`);
  console.log(`   • ${totalErrors} errors`);

  if (totalErrors > 0) {
    console.log(`\n⚠️  Some rows had errors. Review the logs above.`);
    return false;
  }

  console.log(`\n✨ All done! Keys have been extracted and saved.`);
  return true;
}

/**
 * Verify migration results
 */
async function verifyMigration(db: D1Database) {
  console.log('\n🔍 Verifying migration results...');

  const tables = [
    { table: 'users', url_col: 'avatar_url', key_col: 'avatar_key' },
    { table: 'products', url_col: 'image_url', key_col: 'image_key' },
    { table: 'campaigns', url_col: 'hero_image_url', key_col: 'hero_image_key' },
    { table: 'campaign_assets', url_col: 'file_url', key_col: 'file_key' },
  ];

  for (const { table, url_col, key_col } of tables) {
    const stats = await db
      .prepare(
        `SELECT
           COUNT(*) as total,
           COUNT(${url_col}) as with_url,
           COUNT(${key_col}) as with_key,
           COUNT(CASE WHEN ${url_col} IS NOT NULL AND ${key_col} IS NULL THEN 1 END) as url_no_key
         FROM ${table}`
      )
      .first() as any;

    console.log(`📋 ${table}:`);
    console.log(`   • Total rows: ${stats.total}`);
    console.log(`   • With URL: ${stats.with_url}`);
    console.log(`   • With key: ${stats.with_key}`);
    console.log(`   • URL but no key: ${stats.url_no_key}`);

    if (stats.url_no_key > 0) {
      console.log(`   ⚠️  ${stats.url_no_key} rows still have URL but no key`);
    }
  }
}

/**
 * Main function - to be called from a Cloudflare Worker or script
 */
export async function runImageKeyMigration(db: D1Database, verify: boolean = true) {
  try {
    const success = await migrateImageKeys(db);

    if (verify) {
      await verifyMigration(db);
    }

    return success;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

// If running directly (not imported)
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  console.log('⚠️  This script needs to be run in a Cloudflare Worker environment with D1 access.');
  console.log('📖 Import and call runImageKeyMigration(db) from your worker or migration script.');
}
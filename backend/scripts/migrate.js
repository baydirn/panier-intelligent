/**
 * Database Migration Runner
 * Executes SQL migration files in order
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, closePool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

async function runMigrations() {
  console.log('[Migrations] Starting database migrations...\n');

  try {
    // Get all migration files
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Ensure migrations run in order

    if (sqlFiles.length === 0) {
      console.log('[Migrations] No migration files found');
      return;
    }

    console.log(`[Migrations] Found ${sqlFiles.length} migration file(s):`);
    sqlFiles.forEach(f => console.log(`  - ${f}`));
    console.log('');

    // Run each migration
    for (const file of sqlFiles) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      console.log(`[Migrations] Running: ${file}...`);

      try {
        const sql = await fs.readFile(filePath, 'utf-8');
        await pool.query(sql);
        console.log(`[Migrations] ✅ Success: ${file}\n`);
      } catch (error) {
        console.error(`[Migrations] ❌ Error in ${file}:`, error.message);
        throw error;
      }
    }

    console.log('[Migrations] All migrations completed successfully! 🎉\n');

  } catch (error) {
    console.error('[Migrations] Fatal error:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run migrations
runMigrations();

import fs from 'fs';
import path from 'path';
import { databaseManager } from './connection';

/**
 * Migration Runner
 * Runs SQL migration files in order
 */

interface MigrationFile {
  filename: string;
  version: number;
  fullPath: string;
}

interface MigrationRecord {
  id: number;
  filename: string;
  applied_at: Date;
}

class MigrationRunner {
  private migrationsDir: string;

  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  /**
   * Initialize migrations table
   */
  private async initMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await databaseManager.query(createTableSQL);
    console.log('✅ Migrations table initialized');
  }

  /**
   * Get list of migration files
   */
  private getMigrationFiles(): MigrationFile[] {
    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .map(filename => {
        const match = filename.match(/^(\d+)_/);
        const version = match ? parseInt(match[1]) : 0;
        return {
          filename,
          version,
          fullPath: path.join(this.migrationsDir, filename)
        };
      })
      .sort((a, b) => a.version - b.version);

    return files;
  }

  /**
   * Get applied migrations from database
   */
  private async getAppliedMigrations(): Promise<Set<string>> {
    try {
      const result = await databaseManager.query<MigrationRecord>(
        'SELECT filename FROM schema_migrations ORDER BY id'
      );
      return new Set(result.rows.map(r => r.filename));
    } catch (error) {
      console.error('❌ Error getting applied migrations:', error);
      return new Set();
    }
  }

  /**
   * Apply a single migration
   */
  private async applyMigration(migration: MigrationFile): Promise<boolean> {
    console.log(`\n🔄 Applying migration: ${migration.filename}`);
    
    try {
      // Read SQL file
      const sql = fs.readFileSync(migration.fullPath, 'utf8');
      
      // Execute in transaction
      await databaseManager.transaction(async (client) => {
        // Execute migration SQL
        await client.query(sql);
        
        // Record migration
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [migration.filename]
        );
      });
      
      console.log(`✅ Migration applied successfully: ${migration.filename}`);
      return true;
    } catch (error) {
      console.error(`❌ Error applying migration ${migration.filename}:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    console.log('\n🚀 Starting migration process...\n');
    
    try {
      // Initialize connection
      await databaseManager.initialize();
      console.log('✅ Database connection established');

      // Initialize migrations table
      await this.initMigrationsTable();

      // Get migration files
      const migrationFiles = this.getMigrationFiles();
      console.log(`📁 Found ${migrationFiles.length} migration files`);

      if (migrationFiles.length === 0) {
        console.log('⚠️  No migration files found');
        return;
      }

      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      console.log(`✅ ${appliedMigrations.size} migrations already applied`);

      // Find pending migrations
      const pendingMigrations = migrationFiles.filter(
        m => !appliedMigrations.has(m.filename)
      );

      if (pendingMigrations.length === 0) {
        console.log('\n✨ All migrations are up to date!');
        return;
      }

      console.log(`\n📋 ${pendingMigrations.length} pending migrations:`);
      pendingMigrations.forEach(m => {
        console.log(`   - ${m.filename}`);
      });

      // Apply pending migrations
      let successCount = 0;
      for (const migration of pendingMigrations) {
        const success = await this.applyMigration(migration);
        if (success) {
          successCount++;
        } else {
          console.error(`\n❌ Migration failed: ${migration.filename}`);
          console.error('   Stopping migration process');
          break;
        }
      }

      console.log(`\n✨ Migration process completed!`);
      console.log(`   Applied: ${successCount}/${pendingMigrations.length} migrations`);

    } catch (error) {
      console.error('\n❌ Migration process failed:', error);
      throw error;
    } finally {
      // Don't close connection here - let the caller handle it
    }
  }

  /**
   * Show migration status
   */
  async showStatus(): Promise<void> {
    console.log('\n📊 Migration Status\n');
    
    try {
      await databaseManager.initialize();
      await this.initMigrationsTable();

      const migrationFiles = this.getMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations();

      console.log('Applied Migrations:');
      console.log('==================');
      
      const applied = await databaseManager.query<MigrationRecord>(
        'SELECT filename, applied_at FROM schema_migrations ORDER BY id'
      );
      
      if (applied.rows.length === 0) {
        console.log('  (none)');
      } else {
        applied.rows.forEach(m => {
          console.log(`  ✅ ${m.filename} (${m.applied_at.toISOString()})`);
        });
      }

      const pending = migrationFiles.filter(m => !appliedMigrations.has(m.filename));
      
      console.log('\nPending Migrations:');
      console.log('==================');
      if (pending.length === 0) {
        console.log('  (none - all up to date!)');
      } else {
        pending.forEach(m => {
          console.log(`  ⏳ ${m.filename}`);
        });
      }

      console.log('\nSummary:');
      console.log('========');
      console.log(`  Total migrations: ${migrationFiles.length}`);
      console.log(`  Applied: ${appliedMigrations.size}`);
      console.log(`  Pending: ${pending.length}`);
      
    } catch (error) {
      console.error('❌ Error showing status:', error);
      throw error;
    }
  }

  /**
   * Rollback last migration (use with caution!)
   */
  async rollback(): Promise<void> {
    console.log('\n⚠️  Rolling back last migration...\n');
    console.log('⚠️  WARNING: This is a destructive operation!');
    console.log('⚠️  Make sure you have a backup before proceeding.\n');
    
    try {
      await databaseManager.initialize();

      // Get last migration
      const result = await databaseManager.query<MigrationRecord>(
        'SELECT filename FROM schema_migrations ORDER BY id DESC LIMIT 1'
      );

      if (result.rows.length === 0) {
        console.log('❌ No migrations to rollback');
        return;
      }

      const lastMigration = result.rows[0];
      console.log(`📋 Last migration: ${lastMigration.filename}`);
      console.log('\n⚠️  Note: Rollback SQL must be created manually');
      console.log('⚠️  This command only removes the migration record');
      
      // Remove from migrations table
      await databaseManager.query(
        'DELETE FROM schema_migrations WHERE filename = $1',
        [lastMigration.filename]
      );

      console.log(`\n✅ Migration record removed: ${lastMigration.filename}`);
      console.log('⚠️  Remember to manually undo the database changes!');
      
    } catch (error) {
      console.error('❌ Error during rollback:', error);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2] || 'run';
  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'run':
        await runner.runMigrations();
        break;
      
      case 'status':
        await runner.showStatus();
        break;
      
      case 'rollback':
        await runner.rollback();
        break;
      
      default:
        console.log('Usage: npm run migrate [command]');
        console.log('');
        console.log('Commands:');
        console.log('  run      - Run pending migrations (default)');
        console.log('  status   - Show migration status');
        console.log('  rollback - Rollback last migration (use with caution!)');
        process.exit(1);
    }

    await databaseManager.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration error:', error);
    await databaseManager.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { MigrationRunner };
export default MigrationRunner;


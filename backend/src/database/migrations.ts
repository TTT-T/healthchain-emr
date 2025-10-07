import { databaseManager } from './connection';
import { DatabaseSchema } from './index';

/**
 * Database Migration System
 */
export class MigrationManager {
  private static instance: MigrationManager;

  private constructor() {}

  public static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  /**
   * Initialize migration system
   */
  public async initialize(): Promise<void> {
    try {
      // Create migrations table if not exists
      await this.createMigrationsTable();
      
      // Run pending migrations
      await this.runPendingMigrations();
    } catch (error) {
      console.error('❌ Error initializing migration system:', error);
      throw error;
    }
  }

  /**
   * Create migrations table
   */
  private async createMigrationsTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT
      );
    `;

    await databaseManager.query(createTableQuery);
  }

  /**
   * Run pending migrations
   */
  private async runPendingMigrations(): Promise<void> {
    const migrations = [
      {
        name: '001_core_tables',
        description: 'Create complete database schema with all tables and columns',
        up: async () => {
          await this.runSqlMigration('001_core_tables.sql');
        }
      }
    ];

    for (const migration of migrations) {
      await this.runMigration(migration);
    }
  }

  /**
   * Run a single migration
   */
  private async runMigration(migration: any): Promise<void> {
    try {
      // Check if migration already exists
      const existingMigration = await databaseManager.query(
        'SELECT * FROM migrations WHERE migration_name = $1',
        [migration.name]
      );

      if (existingMigration.rows.length > 0) {
        console.log(`⚠️ Migration ${migration.name} already executed - Skipping...`);
        return;
      }

      console.log(`🔄 Running migration: ${migration.name}`);
      const startTime = Date.now();

      // Execute migration
      await migration.up();

      const executionTime = Date.now() - startTime;

      // Record migration
      await databaseManager.query(
        'INSERT INTO migrations (migration_name, execution_time_ms, success) VALUES ($1, $2, $3)',
        [migration.name, executionTime, true]
      );

      console.log(`✅ Migration ${migration.name} completed successfully (${executionTime}ms)`);
    } catch (error) {
      console.error(`❌ Migration ${migration.name} failed:`, error);
      
      // Record failed migration
      await databaseManager.query(
        'INSERT INTO migrations (migration_name, success, error_message) VALUES ($1, $2, $3)',
        [migration.name, false, error.message]
      );
      
      throw error;
    }
  }

  /**
   * Run SQL migration from file
   */
  private async runSqlMigration(filename: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    
    const migrationPath = path.join(__dirname, 'migrations', filename);
    
    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️ Migration file not found: ${filename} - Skipping...`);
      return;
    }

    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the entire SQL file at once
    await databaseManager.query(sqlContent);
  }

  /**
   * Get migration status
   */
  public async getMigrationStatus(): Promise<any> {
    try {
      const result = await databaseManager.query(
        'SELECT migration_name, executed_at, success, error_message FROM migrations ORDER BY executed_at'
      );
      
      return {
        total: result.rows.length,
        executed: result.rows.filter(row => row.success).length,
        failed: result.rows.filter(row => !row.success).length,
        migrations: result.rows
      };
    } catch (error) {
      console.error('❌ Error getting migration status:', error);
      throw error;
    }
  }

  /**
   * Reset all migrations
   */
  public async resetMigrations(): Promise<void> {
    try {
      console.log('🔄 Force Resetting Database...');
      
      // Get all tables
      const tablesResult = await databaseManager.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name != 'migrations'
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      console.log(`📋 Found ${tables.length} tables to drop:`, tables);
      
      // Drop all tables
      for (const table of tables) {
        await databaseManager.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      }
      
      // Drop migrations table
      await databaseManager.query('DROP TABLE IF EXISTS migrations CASCADE');
      
      // Reset sequences
      await databaseManager.query(`
        DO $$ 
        DECLARE 
            r RECORD;
        BEGIN
            FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') 
            LOOP
                EXECUTE 'DROP SEQUENCE IF EXISTS ' || r.sequence_name || ' CASCADE';
            END LOOP;
        END $$;
      `);
      
      // Drop functions
      await databaseManager.query(`
        DO $$ 
        DECLARE 
            r RECORD;
        BEGIN
            FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public') 
            LOOP
                EXECUTE 'DROP FUNCTION IF EXISTS ' || r.routine_name || ' CASCADE';
            END LOOP;
        END $$;
      `);
      
      // Drop triggers
      await databaseManager.query(`
        DO $$ 
        DECLARE 
            r RECORD;
        BEGIN
            FOR r IN (SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public') 
            LOOP
                EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' CASCADE';
            END LOOP;
        END $$;
      `);
      
      // Drop views
      await databaseManager.query(`
        DO $$ 
        DECLARE 
            r RECORD;
        BEGIN
            FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') 
            LOOP
                EXECUTE 'DROP VIEW IF EXISTS ' || r.table_name || ' CASCADE';
            END LOOP;
        END $$;
      `);
      
      console.log('✅ Database reset completed');
      
      // Re-run migrations
      await this.initialize();
      
    } catch (error) {
      console.error('❌ Error resetting migrations:', error);
      throw error;
    }
  }
}

export const migrationManager = MigrationManager.getInstance();

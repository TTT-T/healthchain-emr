#!/usr/bin/env ts-node

import { databaseManager } from '../database/connection';
import { migrationManager } from '../database/migrations';

/**
 * Reset Database Script
 * This script will:
 * 1. Drop all tables (except system tables)
 * 2. Reset migrations table
 * 3. Run all migrations from scratch
 */

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  
  try {
    // Initialize database connection
    await databaseManager.initialize();
    console.log('✅ Connected to database');

    // Get all table names (excluding system tables)
    const tablesResult = await databaseManager.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT IN ('migrations')
      ORDER BY tablename;
    `);

    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`📋 Found ${tables.length} tables to drop:`, tables);

    if (tables.length > 0) {
      // Drop all tables with CASCADE to handle dependencies
      const dropQuery = `DROP TABLE IF EXISTS ${tables.map(table => `"${table}"`).join(', ')} CASCADE;`;
      await databaseManager.query(dropQuery);
      console.log('✅ Dropped all tables');
    }

    // Drop migrations table
    await databaseManager.query('DROP TABLE IF EXISTS migrations CASCADE;');
    console.log('✅ Dropped migrations table');

    // Reset sequences
    await databaseManager.query(`
      DO $$ 
      DECLARE 
          r RECORD;
      BEGIN
          FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') 
          LOOP
              EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
          END LOOP;
      END $$;
    `);
    console.log('✅ Reset all sequences');

    // Drop all functions
    await databaseManager.query(`
      DO $$ 
      DECLARE 
          r RECORD;
      BEGIN
          FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') 
          LOOP
              EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.routine_name) || ' CASCADE';
          END LOOP;
      END $$;
    `);
    console.log('✅ Dropped all functions');

    // Drop all triggers
    await databaseManager.query(`
      DO $$ 
      DECLARE 
          r RECORD;
      BEGIN
          FOR r IN (SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public') 
          LOOP
              EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON ' || quote_ident(r.event_object_table);
          END LOOP;
      END $$;
    `);
    console.log('✅ Dropped all triggers');

    // Drop all views
    await databaseManager.query(`
      DO $$ 
      DECLARE 
          r RECORD;
      BEGIN
          FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') 
          LOOP
              EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.table_name) || ' CASCADE';
          END LOOP;
      END $$;
    `);
    console.log('✅ Dropped all views');

    console.log('🔄 Running migrations...');
    
    // Initialize migration system (this will create migrations table and run all migrations)
    await migrationManager.initialize();
    
    console.log('✅ All migrations completed successfully');

    // Verify essential tables exist
    const essentialTables = ['users', 'patients', 'appointments', 'notifications', 'medical_records', 'ai_insights'];
    
    for (const tableName of essentialTables) {
      const result = await databaseManager.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${tableName}' exists`);
      } else {
        console.log(`❌ Table '${tableName}' is missing`);
      }
    }

    // Get migration status
    const status = await migrationManager.getMigrationStatus();
    console.log(`📊 Migration Status: ${status.executed}/${status.total} executed, ${status.failed} failed`);

    if (status.failed > 0) {
      console.log('❌ Some migrations failed:');
      status.migrations
        .filter(m => !m.success)
        .forEach(m => {
          console.log(`  - ${m.name}: ${m.error_message}`);
        });
    }

    console.log('🎉 Database reset completed successfully!');

  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await databaseManager.close();
  }
}

// Run the script
if (require.main === module) {
  resetDatabase().catch(console.error);
}

export { resetDatabase };

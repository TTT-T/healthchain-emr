#!/usr/bin/env ts-node

/**
 * Auto Migration Script
 * This script ensures all database migrations are run before starting the application
 * Usage: npm run auto-migrate
 */

import { databaseInitializer } from '../database/init';
import { migrationManager } from '../database/migrations';
import config from '../config/config';

class AutoMigrator {
  private static instance: AutoMigrator;

  private constructor() {}

  public static getInstance(): AutoMigrator {
    if (!AutoMigrator.instance) {
      AutoMigrator.instance = new AutoMigrator();
    }
    return AutoMigrator.instance;
  }

  /**
   * Initialize database with retry logic
   */
  private async initializeDatabaseWithRetry(): Promise<void> {
    const maxRetries = parseInt(process.env.MIGRATION_RETRY_COUNT || '3');
    const retryDelay = parseInt(process.env.MIGRATION_RETRY_DELAY || '5000');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}: Connecting to database...`);
        await databaseInitializer.initialize();
        console.log('✅ Database connection successful');
        return;
      } catch (error) {
        console.log(`❌ Database connection failed (attempt ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
        }
        
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Run auto migration
   */
  public async run(): Promise<void> {
    console.log('🚀 Starting Auto Migration Process...');
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🗄️ Database: ${config.database.host}:${config.database.port}/${config.database.database}`);

    try {
      // Step 1: Initialize database with retry logic
      console.log('\n📋 Step 1: Initializing Database Connection...');
      await this.initializeDatabaseWithRetry();
      console.log('✅ Database connection established');

      // Step 2: Check migration status
      console.log('\n📋 Step 2: Checking Migration Status...');
      const migrationStatus = await migrationManager.getMigrationStatus();
      console.log(`📊 Migration Status:`);
      console.log(`   - Total: ${migrationStatus.total}`);
      console.log(`   - Executed: ${migrationStatus.executed}`);
      console.log(`   - Failed: ${migrationStatus.failed}`);

      // Step 3: Show failed migrations
      if (migrationStatus.failed > 0) {
        console.log('\n⚠️ Failed Migrations:');
        migrationStatus.migrations
          .filter(m => !m.success)
          .forEach(m => {
            console.log(`   - ${m.name}: ${m.error_message}`);
          });
      }

      // Step 4: Verify system
      console.log('\n📋 Step 3: Verifying System...');
      const systemStatus = await databaseInitializer.getSystemStatus();
      console.log(`📊 System Status:`);
      console.log(`   - Database Connected: ${systemStatus.database.connected}`);
      console.log(`   - Tables Count: ${systemStatus.tables.length}`);
      console.log(`   - Users: ${systemStatus.counts.users}`);
      console.log(`   - Patients: ${systemStatus.counts.patients}`);
      console.log(`   - Departments: ${systemStatus.counts.departments}`);

      // Step 5: Health check
      console.log('\n📋 Step 4: Running Health Check...');
      const healthStatus = await databaseInitializer.healthCheck();
      console.log(`📊 Health Status: ${healthStatus.status.toUpperCase()}`);
      console.log(`   - Database: ${healthStatus.database ? '✅' : '❌'}`);
      console.log(`   - Migrations: ${healthStatus.migrations ? '✅' : '❌'}`);

      if (healthStatus.status === 'healthy') {
        console.log('\n🎉 Auto Migration Completed Successfully!');
        console.log('✅ All migrations are up to date');
        console.log('✅ Database is ready for use');
        process.exit(0);
      } else {
        console.log('\n❌ Auto Migration Failed!');
        console.log('❌ System is not healthy');
        process.exit(1);
      }

    } catch (error) {
      console.error('\n💥 Auto Migration Failed:', error);
      console.error('❌ Please check your database configuration and try again');
      process.exit(1);
    }
  }

  /**
   * Force reset and re-run all migrations
   */
  public async forceReset(): Promise<void> {
    if (config.nodeEnv === 'production') {
      throw new Error('Force reset is not allowed in production environment');
    }

    console.log('🔄 Force Resetting Database...');
    
    try {
      await databaseInitializer.resetDatabase();
      console.log('✅ Database reset completed');
      
      // Re-run migrations
      await this.run();
    } catch (error) {
      console.error('❌ Force reset failed:', error);
      throw error;
    }
  }

  /**
   * Check migration status only
   */
  public async checkStatus(): Promise<void> {
    try {
      await databaseInitializer.initialize();
      const migrationStatus = await migrationManager.getMigrationStatus();
      const systemStatus = await databaseInitializer.getSystemStatus();
      
      console.log('\n📊 Migration Status Report:');
      console.log('='.repeat(50));
      console.log(`Total Migrations: ${migrationStatus.total}`);
      console.log(`Executed: ${migrationStatus.executed}`);
      console.log(`Failed: ${migrationStatus.failed}`);
      console.log(`Pending: ${migrationStatus.pending}`);
      
      if (migrationStatus.migrations.length > 0) {
        console.log('\n📋 Migration Details:');
        migrationStatus.migrations.forEach(migration => {
          const status = migration.success ? '✅' : '❌';
          const time = migration.execution_time_ms ? `${migration.execution_time_ms}ms` : 'N/A';
          console.log(`   ${status} ${migration.name} (${time})`);
          if (!migration.success && migration.error_message) {
            console.log(`      Error: ${migration.error_message}`);
          }
        });
      }
      
      console.log('\n📊 System Status:');
      console.log(`Database Connected: ${systemStatus.database.connected ? '✅' : '❌'}`);
      console.log(`Tables: ${systemStatus.tables.length}`);
      console.log(`Users: ${systemStatus.counts.users}`);
      console.log(`Patients: ${systemStatus.counts.patients}`);
      console.log(`Departments: ${systemStatus.counts.departments}`);
      
    } catch (error) {
      console.error('❌ Status check failed:', error);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';
  
  const migrator = AutoMigrator.getInstance();
  
  switch (command) {
    case 'run':
      await migrator.run();
      break;
    case 'reset':
      await migrator.forceReset();
      break;
    case 'status':
      await migrator.checkStatus();
      break;
    default:
      console.log('Usage: npm run auto-migrate [command]');
      console.log('Commands:');
      console.log('  run     - Run auto migration (default)');
      console.log('  reset   - Force reset and re-run all migrations');
      console.log('  status  - Check migration status only');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export default AutoMigrator;

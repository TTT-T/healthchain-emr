#!/usr/bin/env ts-node

/**
 * Migration Runner Script
 * This script runs database migrations with proper error handling
 * Usage: npm run migrate
 */

import { databaseInitializer } from '../database/init';
import { migrationManager } from '../database/migrations';
import config from '../config/config';

class MigrationRunner {
  private static instance: MigrationRunner;

  private constructor() {}

  public static getInstance(): MigrationRunner {
    if (!MigrationRunner.instance) {
      MigrationRunner.instance = new MigrationRunner();
    }
    return MigrationRunner.instance;
  }

  /**
   * Run migrations with retry logic
   */
  public async run(): Promise<void> {
    console.log('🚀 Starting Database Migration...');
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🗄️ Database: ${config.database.host}:${config.database.port}/${config.database.database}`);

    try {
      // Step 1: Initialize database with retry logic
      console.log('\n📋 Step 1: Initializing Database Connection...');
      await this.initializeDatabaseWithRetry();
      console.log('✅ Database connection established');

      // Step 2: Run migrations
      console.log('\n📋 Step 2: Running Migrations...');
      await migrationManager.initialize();
      console.log('✅ Migrations completed successfully');

      // Step 3: Check migration status
      console.log('\n📋 Step 3: Checking Migration Status...');
      const migrationStatus = await migrationManager.getMigrationStatus();
      console.log(`📊 Migration Status:`);
      console.log(`   - Total: ${migrationStatus.total}`);
      console.log(`   - Executed: ${migrationStatus.executed}`);
      console.log(`   - Failed: ${migrationStatus.failed}`);

      if (migrationStatus.failed > 0) {
        console.log('\n⚠️ Failed Migrations:');
        migrationStatus.migrations
          .filter(m => !m.success)
          .forEach(m => {
            console.log(`   - ${m.name}: ${m.error_message}`);
          });
        throw new Error('Some migrations failed');
      }

      console.log('\n🎉 All migrations completed successfully!');

    } catch (error) {
      console.error('\n💥 Migration Failed:', error);
      console.error('❌ Please check the error above and try again');
      process.exit(1);
    }
  }

  /**
   * Initialize database with retry logic
   */
  private async initializeDatabaseWithRetry(): Promise<void> {
    const maxRetries = parseInt(process.env.MIGRATION_RETRY_COUNT || '5');
    const retryDelay = parseInt(process.env.MIGRATION_RETRY_DELAY || '3000');
    
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
}

// Main execution
async function main() {
  const migrationRunner = MigrationRunner.getInstance();
  await migrationRunner.run();
}

// Handle command line arguments
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
}

export default MigrationRunner;

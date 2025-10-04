#!/usr/bin/env ts-node

/**
 * Startup Script
 * This script ensures the application starts with a healthy database
 * Usage: npm run start:with-migrations
 */

import { databaseInitializer } from '../database/init';
import { migrationManager } from '../database/migrations';
import DatabaseHealthChecker from './database-health-check';
import config from '../config/config';

class StartupManager {
  private static instance: StartupManager;

  private constructor() {}

  public static getInstance(): StartupManager {
    if (!StartupManager.instance) {
      StartupManager.instance = new StartupManager();
    }
    return StartupManager.instance;
  }

  /**
   * Initialize application with database health check
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Starting EMR Application...');
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🗄️ Database: ${config.database.host}:${config.database.port}/${config.database.database}`);

    try {
      // Step 1: Wait for database to be ready
      console.log('\n📋 Step 1: Waiting for Database...');
      await this.waitForDatabase();
      console.log('✅ Database is ready');

      // Step 2: Run health check
      console.log('\n📋 Step 2: Running Database Health Check...');
      const healthChecker = DatabaseHealthChecker.getInstance();
      const healthResult = await healthChecker.runHealthCheck();

      // Step 3: Auto-fix if needed
      if (healthResult.status === 'unhealthy') {
        console.log('\n📋 Step 3: Auto-Fixing Database Issues...');
        await healthChecker.autoFix();
      } else {
        console.log('\n📋 Step 3: Database is healthy - skipping auto-fix');
      }

      // Step 4: Final verification
      console.log('\n📋 Step 4: Final Verification...');
      const finalHealthResult = await healthChecker.runHealthCheck();

      if (finalHealthResult.status === 'healthy') {
        console.log('\n🎉 Application Ready!');
        console.log('✅ Database is healthy and ready for use');
        console.log('✅ All migrations are up to date');
        console.log('✅ Application can start safely');
      } else {
        console.log('\n⚠️ Application Ready with Warnings');
        console.log('⚠️ Some issues remain but application can start');
        console.log('⚠️ Consider running manual fixes if needed');
      }

      // Step 5: Start the application
      console.log('\n📋 Step 5: Starting Application...');
      await this.startApplication();

    } catch (error) {
      console.error('\n💥 Startup Failed:', error);
      console.error('❌ Application cannot start safely');
      process.exit(1);
    }
  }

  /**
   * Wait for database to be ready
   */
  private async waitForDatabase(): Promise<void> {
    const maxRetries = parseInt(process.env.MIGRATION_RETRY_COUNT || '30');
    const retryDelay = parseInt(process.env.MIGRATION_RETRY_DELAY || '2000');

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
   * Start the application
   */
  private async startApplication(): Promise<void> {
    try {
      // Import and start the application
      const Application = await import('../app');
      const app = new Application.default();
      await app.start();
    } catch (error) {
      console.error('❌ Failed to start application:', error);
      throw error;
    }
  }

  /**
   * Quick start (skip health check)
   */
  public async quickStart(): Promise<void> {
    console.log('🚀 Quick Starting EMR Application...');
    
    try {
      // Just run migrations and start
      await databaseInitializer.initialize();
      await this.startApplication();
    } catch (error) {
      console.error('❌ Quick start failed:', error);
      throw error;
    }
  }

  /**
   * Development start (with detailed logging)
   */
  public async devStart(): Promise<void> {
    console.log('🚀 Development Starting EMR Application...');
    
    try {
      // Run full initialization with detailed logging
      await this.initialize();
    } catch (error) {
      console.error('❌ Development start failed:', error);
      throw error;
    }
  }

  /**
   * Production start (with minimal logging)
   */
  public async prodStart(): Promise<void> {
    console.log('🚀 Production Starting EMR Application...');
    
    try {
      // Run migrations and start with minimal logging
      await databaseInitializer.initialize();
      await this.startApplication();
    } catch (error) {
      console.error('❌ Production start failed:', error);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'dev';
  
  const startup = StartupManager.getInstance();
  
  switch (command) {
    case 'dev':
      await startup.devStart();
      break;
    case 'prod':
      await startup.prodStart();
      break;
    case 'quick':
      await startup.quickStart();
      break;
    case 'init':
      await startup.initialize();
      break;
    default:
      console.log('Usage: npm run start:with-migrations [command]');
      console.log('Commands:');
      console.log('  dev   - Development start with full health check (default)');
      console.log('  prod  - Production start with minimal logging');
      console.log('  quick - Quick start (skip health check)');
      console.log('  init  - Initialize only (no app start)');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Startup failed:', error);
    process.exit(1);
  });
}

export default StartupManager;

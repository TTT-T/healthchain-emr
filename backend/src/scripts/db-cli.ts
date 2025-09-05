#!/usr/bin/env node

import { Command } from 'commander';
import { databaseInitializer } from '../database/init';
import { databaseManager } from '../database/connection';
import { migrationManager } from '../database/migrations';
import config from '../config/index';

const program = new Command();

program
  .name('db-cli')
  .description('Database management CLI for HealthChain EMR System')
  .version('1.0.0');

// Initialize database
program
  .command('init')
  .description('Initialize database system')
  .option('-f, --force', 'Force reinitialize even if already initialized')
  .action(async (options) => {
    try {
      console.log('🚀 Initializing database system...');
      await databaseInitializer.initialize();
      console.log('✅ Database initialization completed successfully!');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    }
  });

// Reset database
program
  .command('reset')
  .description('Reset database (development only)')
  .option('-f, --force', 'Force reset without confirmation')
  .action(async (options) => {
    if (config.server.nodeEnv === 'production') {
      console.error('❌ Database reset is not allowed in production environment');
      process.exit(1);
    }

    if (!options.force) {
      console.log('⚠️ This will completely reset the database and all data will be lost!');
      console.log('Use --force flag to confirm this action.');
      process.exit(1);
    }

    try {
      console.log('🔄 Resetting database...');
      await databaseInitializer.resetDatabase();
      console.log('✅ Database reset completed successfully!');
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show database system status')
  .action(async () => {
    try {
      const status = await databaseInitializer.getSystemStatus();
      
      console.log('\n📊 Database System Status');
      console.log('========================');
      
      console.log('\n🔌 Database Connection:');
      console.log(`  Status: ${status.database.connected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`  Name: ${status.database.info.name}`);
      console.log(`  Version: ${status.database.info.version}`);
      console.log(`  Size: ${status.database.info.size}`);
      console.log(`  Connections: ${status.database.info.connections}`);
      console.log(`  Uptime: ${status.database.info.uptime}`);
      
      console.log('\n🔄 Migrations:');
      console.log(`  Total: ${status.migrations.total}`);
      console.log(`  Executed: ${status.migrations.executed}`);
      console.log(`  Failed: ${status.migrations.failed}`);
      
      console.log('\n📋 Tables:');
      status.tables.forEach(table => {
        console.log(`  - ${table}`);
      });
      
      console.log('\n📊 Data Counts:');
      console.log(`  Users: ${status.counts.users}`);
      console.log(`  Patients: ${status.counts.patients}`);
      console.log(`  Departments: ${status.counts.departments}`);
      
    } catch (error) {
      console.error('❌ Error getting system status:', error);
      process.exit(1);
    }
  });

// Health check
program
  .command('health')
  .description('Perform database health check')
  .action(async () => {
    try {
      const health = await databaseInitializer.healthCheck();
      
      console.log('\n🏥 Database Health Check');
      console.log('========================');
      console.log(`Status: ${health.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy'}`);
      console.log(`Database: ${health.database ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`Migrations: ${health.migrations ? '✅ OK' : '❌ Failed'}`);
      console.log(`Timestamp: ${health.timestamp}`);
      console.log(`Response Time: ${health.uptime}ms`);
      
      if (health.status === 'unhealthy') {
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    }
  });

// Migration status
program
  .command('migrations')
  .description('Show migration status')
  .action(async () => {
    try {
      const status = await migrationManager.getMigrationStatus();
      
      console.log('\n🔄 Migration Status');
      console.log('==================');
      console.log(`Total Migrations: ${status.total}`);
      console.log(`Executed: ${status.executed}`);
      console.log(`Failed: ${status.failed}`);
      
      if (status.migrations.length > 0) {
        console.log('\n📋 Migration History:');
        status.migrations.forEach(migration => {
          const statusIcon = migration.success ? '✅' : '❌';
          const time = migration.execution_time_ms ? `${migration.execution_time_ms}ms` : 'N/A';
          console.log(`  ${statusIcon} ${migration.name} (${time})`);
          if (!migration.success && migration.error_message) {
            console.log(`      Error: ${migration.error_message}`);
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Error getting migration status:', error);
      process.exit(1);
    }
  });

// Run migrations
program
  .command('migrate')
  .description('Run all pending migrations')
  .action(async () => {
    try {
      console.log('🔄 Running migrations...');
      await migrationManager.runMigrations();
      console.log('✅ Migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  });

// Run specific migration up
program
  .command('migrate:up <migration-name>')
  .description('Run specific migration up')
  .action(async (migrationName) => {
    try {
      console.log(`🔄 Running migration up: ${migrationName}`);
      await migrationManager.runMigrationUp(migrationName);
      console.log('✅ Migration up completed successfully!');
    } catch (error) {
      console.error('❌ Migration up failed:', error);
      process.exit(1);
    }
  });

// Run specific migration down
program
  .command('migrate:down <migration-name>')
  .description('Run specific migration down')
  .action(async (migrationName) => {
    try {
      console.log(`🔄 Running migration down: ${migrationName}`);
      await migrationManager.runMigrationDown(migrationName);
      console.log('✅ Migration down completed successfully!');
    } catch (error) {
      console.error('❌ Migration down failed:', error);
      process.exit(1);
    }
  });

// Create database
program
  .command('create-db')
  .description('Create database if not exists')
  .action(async () => {
    try {
      console.log('📦 Creating database...');
      await databaseManager.createDatabaseIfNotExists();
      console.log('✅ Database creation completed!');
    } catch (error) {
      console.error('❌ Database creation failed:', error);
      process.exit(1);
    }
  });

// Create user
program
  .command('create-user')
  .description('Create database user if not exists')
  .action(async () => {
    try {
      console.log('👤 Creating database user...');
      await databaseManager.createDatabaseUserIfNotExists();
      console.log('✅ Database user creation completed!');
    } catch (error) {
      console.error('❌ Database user creation failed:', error);
      process.exit(1);
    }
  });

// Test connection
program
  .command('test')
  .description('Test database connection')
  .action(async () => {
    try {
      console.log('🔍 Testing database connection...');
      await databaseManager.testConnection();
      console.log('✅ Database connection test successful!');
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      process.exit(1);
    }
  });

// Configuration info
program
  .command('config')
  .description('Show database configuration')
  .action(() => {
    console.log('\n⚙️ Database Configuration');
    console.log('=========================');
    console.log(`Host: ${config.database.host}`);
    console.log(`Port: ${config.database.port}`);
    console.log(`Database: ${config.database.database}`);
    console.log(`Username: ${config.database.username}`);
    console.log(`Password: ${'*'.repeat(config.database.password.length)}`);
    console.log(`SSL: ${config.database.ssl}`);
    console.log(`Max Connections: ${config.database.maxConnections}`);
    console.log(`Auto Create Database: ${config.database.autoCreateDatabase}`);
    console.log(`Auto Create User: ${config.database.autoCreateUser}`);
    console.log(`Environment: ${config.server.nodeEnv}`);
  });

// Seed data
program
  .command('seed')
  .description('Seed database with sample data')
  .action(async () => {
    try {
      console.log('🌱 Seeding database with sample data...');
      
      // Import and run seed script
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      await execAsync('npm run seed');
      
      console.log('✅ Database seeding completed!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

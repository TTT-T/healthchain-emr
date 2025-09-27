#!/usr/bin/env node

import { databaseManager } from '../database/connection';
import AdminSetup from './setupAdmin';

/**
 * Database Seeding Script
 */
class DatabaseSeeder {
  private static instance: DatabaseSeeder;

  private constructor() {}

  public static getInstance(): DatabaseSeeder {
    if (!DatabaseSeeder.instance) {
      DatabaseSeeder.instance = new DatabaseSeeder();
    }
    return DatabaseSeeder.instance;
  }

  /**
   * Seed database with admin user setup
   */
  public async seed(): Promise<void> {
    try {
      // Initialize database connection
      await databaseManager.initialize();

      // Check if admin exists
      const existingAdmin = await databaseManager.query(
        'SELECT id FROM users WHERE role = $1 LIMIT 1',
        ['admin']
      );

      if (existingAdmin.rows.length === 0) {
        console.log('🔧 No admin user found. Starting admin setup...\n');
        const adminSetup = new AdminSetup();
        await adminSetup.setupAdmin();
      } else {
        console.log('✅ Admin user already exists in the system.');
      }
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }
}

// Run seeding if called directly
if (require.main === module) {
  const seeder = DatabaseSeeder.getInstance();
  seeder.seed()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database seeding failed:', error);
      process.exit(1);
    });
}

export default DatabaseSeeder;
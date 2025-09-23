import { databaseManager } from './connection';
import { migrationManager } from './migrations';
import config from '../config/config';

/**
 * Database Initialization System
 */
export class DatabaseInitializer {
  private static instance: DatabaseInitializer;

  private constructor() {}

  public static getInstance(): DatabaseInitializer {
    if (!DatabaseInitializer.instance) {
      DatabaseInitializer.instance = new DatabaseInitializer();
    }
    return DatabaseInitializer.instance;
  }

  /**
   * Initialize database system
   */
  public async initialize(): Promise<void> {
    try {
      // Step 1: Initialize database connection
      await databaseManager.initialize();

      // Step 2: Create user if needed
      if (config.database.autoCreateUser) {
        await databaseManager.createDatabaseUserIfNotExists();
      }

      // Step 3: Run migrations
      await migrationManager.initialize();

      // Step 4: Verify system
      await this.verifySystem();
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Verify database system
   */
  private async verifySystem(): Promise<void> {
    try {
      // Get database info
      const dbInfo = await databaseManager.getDatabaseInfo();
      // Get migration status
      const migrationStatus = await migrationManager.getMigrationStatus();
      //  basic queries
      await this.BasicQueries();
    } catch (error) {
      console.error('❌ Database system verification failed:', error);
      throw error;
    }
  }

  /**
   *  basic database queries
   */
  private async BasicQueries(): Promise<void> {
    try {
      //  1: Check if tables exist
      const tablesResult = await databaseManager.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);

      const tableNames = tablesResult.rows.map(row => row.table_name);
      //  2: Check if users table has data
      const usersCount = await databaseManager.query('SELECT COUNT(*) as count FROM users');
      //  3: Check if patients table exists
      const patientsCount = await databaseManager.query('SELECT COUNT(*) as count FROM patients');
      //  4: Check if departments table has data
      const departmentsCount = await databaseManager.query('SELECT COUNT(*) as count FROM departments');
    } catch (error) {
      console.error('❌ Basic query  failed:', error);
      throw error;
    }
  }

  /**
   * Reset database (for development only)
   */
  public async resetDatabase(): Promise<void> {
    if (config.nodeEnv === 'production') {
      throw new Error('Database reset is not allowed in production environment');
    }

    try {
      // Reset database
      await databaseManager.resetDatabase();
      
      // Reinitialize
      await this.initialize();
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  public async getSystemStatus(): Promise<{
    database: {
      connected: boolean;
      info: any;
    };
    migrations: any;
    tables: string[];
    counts: {
      users: number;
      patients: number;
      departments: number;
    };
  }> {
    try {
      const dbInfo = await databaseManager.getDatabaseInfo();
      const migrationStatus = await migrationManager.getMigrationStatus();
      
      const tablesResult = await databaseManager.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      const tableNames = tablesResult.rows.map(row => row.table_name);
      
      const [usersCount, patientsCount, departmentsCount] = await Promise.all([
        databaseManager.query('SELECT COUNT(*) as count FROM users'),
        databaseManager.query('SELECT COUNT(*) as count FROM patients'),
        databaseManager.query('SELECT COUNT(*) as count FROM departments')
      ]);

      return {
        database: {
          connected: databaseManager.isDatabaseConnected(),
          info: dbInfo
        },
        migrations: migrationStatus,
        tables: tableNames,
        counts: {
          users: parseInt(usersCount.rows[0].count),
          patients: parseInt(patientsCount.rows[0].count),
          departments: parseInt(departmentsCount.rows[0].count)
        }
      };
      
    } catch (error) {
      console.error('❌ Error getting system status:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: boolean;
    migrations: boolean;
    timestamp: string;
    uptime: number;
  }> {
    try {
      const startTime = Date.now();
      
      //  database connection
      await databaseManager.query('SELECT 1');
      const database = true;
      
      //  migrations
      const migrationStatus = await migrationManager.getMigrationStatus();
      const migrations = migrationStatus.failed === 0;
      
      const status = database && migrations ? 'healthy' : 'unhealthy';
      
      return {
        status,
        database,
        migrations,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        status: 'unhealthy',
        database: false,
        migrations: false,
        timestamp: new Date().toISOString(),
        uptime: 0
      };
    }
  }
}

// Export singleton instance
export const databaseInitializer = DatabaseInitializer.getInstance();
export default DatabaseInitializer;

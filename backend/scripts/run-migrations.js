const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345'
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT
      )
    `);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../src/database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📋 Found ${migrationFiles.length} migration files`);
    
    for (const file of migrationFiles) {
      const migrationName = file.replace('.sql', '');
      
      // Check if migration already executed
      const result = await client.query(
        'SELECT id FROM migrations WHERE migration_name = $1',
        [migrationName]
      );
      
      if (result.rows.length > 0) {
        console.log(`⏭️  Migration ${migrationName} already executed, skipping`);
        continue;
      }
      
      console.log(`🔄 Executing migration: ${migrationName}`);
      const startTime = Date.now();
      
      try {
        // Read and execute migration file
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        await client.query(migrationSQL);
        
        const executionTime = Date.now() - startTime;
        
        // Record successful migration
        await client.query(
          'INSERT INTO migrations (migration_name, execution_time_ms, success) VALUES ($1, $2, $3)',
          [migrationName, executionTime, true]
        );
        
        console.log(`✅ Migration ${migrationName} completed in ${executionTime}ms`);
        
      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        // Record failed migration
        await client.query(
          'INSERT INTO migrations (migration_name, execution_time_ms, success, error_message) VALUES ($1, $2, $3, $4)',
          [migrationName, executionTime, false, error.message]
        );
        
        console.error(`❌ Migration ${migrationName} failed:`, error.message);
        throw error;
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations();

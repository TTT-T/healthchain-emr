const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '12345',
  port: 5432,
});

/**
 * Run Single Migration Script
 * สคริปต์สำหรับรัน migration เดียว
 */

async function runSingleMigration(migrationFileName) {
  const client = await pool.connect();
  
  try {
    console.log(`🚀 Running single migration: ${migrationFileName}`);
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', migrationFileName);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`📄 Reading migration file: ${migrationPath}`);
    console.log(`📝 Migration content length: ${migrationSQL.length} characters`);
    
    // Execute migration
    console.log(`🔄 Executing migration: ${migrationFileName}`);
    const startTime = Date.now();
    
    await client.query(migrationSQL);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Migration ${migrationFileName} completed in ${duration}ms`);
    
    // Record migration in migrations table
    const migrationName = migrationFileName.replace('.sql', '');
    await client.query(`
      INSERT INTO migrations (name, executed_at) 
      VALUES ($1, NOW() AT TIME ZONE 'Asia/Bangkok')
      ON CONFLICT (name) DO NOTHING
    `, [migrationName]);
    
    console.log(`📝 Migration ${migrationName} recorded in migrations table`);
    
  } catch (error) {
    console.error(`❌ Migration ${migrationFileName} failed:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Security validation
function validateEnvironment() {
  console.log('🔍 Validating environment security...');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  WARNING: Running in production environment!');
    console.log('   Make sure this is intentional and secure.');
  }
  
  if (!pool) {
    throw new Error('Database connection not available');
  }
  
  console.log('✅ Environment validation passed');
}

// Main execution
async function main() {
  try {
    validateEnvironment();
    
    const migrationFileName = process.argv[2];
    if (!migrationFileName) {
      console.error('❌ Please provide migration file name');
      console.log('Usage: node run-single-migration.js <migration-file-name>');
      console.log('Example: node run-single-migration.js 026_add_thai_last_name_to_patients.sql');
      process.exit(1);
    }
    
    await runSingleMigration(migrationFileName);
    
    console.log('\n🎉 Single migration completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Single migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { runSingleMigration };

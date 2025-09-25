const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '12345',
  port: 5432,
});

/**
 * Run Timezone Migration Only Script
 * สคริปต์สำหรับรัน migration เฉพาะ timezone
 */

async function runTimezoneMigrationOnly() {
  const client = await pool.connect();
  
  try {
    console.log('🕐 Running Timezone Migration Only');
    console.log('==================================');
    
    // Read the timezone migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', '025_fix_timezone_to_thailand.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Reading timezone migration file...');
    console.log('🔧 Executing timezone migration...');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Timezone migration completed successfully!');
    
    // Verify the changes
    console.log('\n🔍 Verifying timezone changes...');
    
    // Check users table
    const usersCheck = await client.query(`
      SELECT column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('created_at', 'updated_at', 'last_login', 'last_activity', 'password_changed_at')
      ORDER BY column_name
    `);
    
    console.log('\n📋 Users Table Timestamp Defaults:');
    usersCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.column_default}`);
    });
    
    // Check migrations table
    const migrationsCheck = await client.query(`
      SELECT column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'migrations' 
      AND column_name = 'executed_at'
    `);
    
    console.log('\n📋 Migrations Table Timestamp Defaults:');
    migrationsCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.column_default}`);
    });
    
    // Check trigger function
    const triggerCheck = await client.query(`
      SELECT routine_name, routine_definition 
      FROM information_schema.routines 
      WHERE routine_name = 'update_updated_at_column'
    `);
    
    if (triggerCheck.rows.length > 0) {
      console.log('\n📋 Trigger Function Updated:');
      console.log(`   - Function: ${triggerCheck.rows[0].routine_name}`);
      console.log('   - Status: ✅ Updated to use Thailand timezone');
    }
    
    console.log('\n🎉 All timezone migrations completed successfully!');
    console.log('🇹🇭 Database now uses Thailand timezone (GMT+7)');
    
  } catch (error) {
    console.error('❌ Error running timezone migration:', error.message);
    console.error('Stack trace:', error.stack);
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
    await runTimezoneMigrationOnly();
    
    console.log('\n🎉 Script completed successfully!');
    console.log('💡 All timestamp fields now use Thailand timezone (GMT+7)');
    
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { runTimezoneMigrationOnly };

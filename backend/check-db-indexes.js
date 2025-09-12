const { Pool } = require('pg');
require('dotenv').config();

async function checkIndexes() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'healthchain',
    user: 'postgres',
    password: '12345'
  });

  try {
    console.log('🔍 Checking database indexes...');
    
    // Check if the index exists
    const result = await pool.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE indexname = 'unique_users_national_id' 
      AND tablename = 'users'
    `);
    
    console.log('📊 Index check result:', result.rows);
    
    // Check all indexes on users table
    const allIndexes = await pool.query(`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes 
      WHERE tablename = 'users'
      ORDER BY indexname
    `);
    
    console.log('📋 All indexes on users table:');
    allIndexes.rows.forEach(row => {
      console.log(`  - ${row.indexname}: ${row.indexdef}`);
    });
    
    // Check migration status
    const migrations = await pool.query(`
      SELECT migration_name, success, error_message
      FROM migrations 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log('📝 Recent migrations:');
    migrations.rows.forEach(row => {
      console.log(`  - ${row.migration_name}: ${row.success ? '✅' : '❌'} ${row.error_message || ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkIndexes();

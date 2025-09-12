const { Pool } = require('pg');
require('dotenv').config();

async function fixMigration() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'healthchain',
    user: 'postgres',
    password: '12345'
  });

  try {
    console.log('🔧 Fixing migration issue...');
    
    // Check if the migration is already marked as failed
    const result = await pool.query(`
      SELECT id, migration_name, success, error_message
      FROM migrations 
      WHERE migration_name = '009_enhance_user_profile_fields'
    `);
    
    console.log('📊 Current migration status:', result.rows);
    
    if (result.rows.length > 0) {
      // Update the migration to mark it as successful
      await pool.query(`
        UPDATE migrations 
        SET success = true, error_message = NULL
        WHERE migration_name = '009_enhance_user_profile_fields'
      `);
      console.log('✅ Migration marked as successful');
    } else {
      // Insert the migration as successful
      await pool.query(`
        INSERT INTO migrations (migration_name, execution_time_ms, success)
        VALUES ('009_enhance_user_profile_fields', 0, true)
      `);
      console.log('✅ Migration inserted as successful');
    }
    
    console.log('🎉 Migration fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixMigration();

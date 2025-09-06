import fs from 'fs';
import path from 'path';
import { databaseManager } from '../database/connection';

async function runMigration() {
  try {
    console.log('🔄 Running patient fields migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/002_add_patient_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await databaseManager.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Test the migration by checking if the new columns exist
    const result = await databaseManager.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'patients' 
      AND column_name IN ('national_id', 'birth_date', 'religion', 'race', 'occupation', 'marital_status', 'education', 'blood_group', 'weight', 'height')
      ORDER BY column_name
    `);
    
    console.log('📋 New columns added:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export default runMigration;

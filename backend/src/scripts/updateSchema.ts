import { db } from '../database/index.js';

async function updateSchema() {
  console.log('🔄 Updating database schema...');
  
  try {
    // Drop existing constraint
    await db.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
    console.log('✅ Dropped existing role constraint');
    
    // Add new constraint with patient role
    await db.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
        'admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'staff',
        'consent_admin', 'compliance_officer', 'data_protection_officer', 'legal_advisor',
        'patient_guardian', 'legal_representative', 'medical_attorney',
        'external_user', 'external_admin', 'patient'
      ))
    `);
    console.log('✅ Added new role constraint with patient role');
    
    console.log('✅ Database schema updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating schema:', error);
  }
  
  process.exit(0);
}

updateSchema();

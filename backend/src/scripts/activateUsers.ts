import { db } from '../database/index.js';

async function activateDefaultUsers() {
  try {
    console.log('🔧 Activating default users...');
    
    // Update admin user to be active
    const adminResult = await db.query(
      'UPDATE users SET is_active = TRUE WHERE username = $1',
      ['admin']
    );
    console.log(`✅ Admin user activated (rows affected: ${adminResult.rowCount})`);
    
    // Update doctor user to be active  
    const doctorResult = await db.query(
      'UPDATE users SET is_active = TRUE WHERE username = $1',
      ['doctor']
    );
    console.log(`✅ Doctor user activated (rows affected: ${doctorResult.rowCount})`);
    
    // Update patient user to be active
    const patientResult = await db.query(
      'UPDATE users SET is_active = TRUE WHERE username = $1',
      ['patient']
    );
    console.log(`✅ Patient user activated (rows affected: ${patientResult.rowCount})`);
    
    // Check all users status
    const users = await db.query(
      'SELECT username, role, is_active, is_verified FROM users'
    );
    
    console.log('\n📋 All users status:');
    console.table(users.rows);
    
    console.log('\n✅ All default users have been activated successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error activating users:', error);
    process.exit(1);
  }
}

activateDefaultUsers();

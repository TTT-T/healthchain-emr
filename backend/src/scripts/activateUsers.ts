import { databaseManager } from '../database/connection';

async function activateDefaultUsers() {
  try {
    // Update admin user to be active
    const adminResult = await databaseManager.query(
      'UPDATE users SET is_active = TRUE WHERE username = $1',
      ['admin']
    );
    // Update doctor user to be active  
    const doctorResult = await databaseManager.query(
      'UPDATE users SET is_active = TRUE WHERE username = $1',
      ['doctor']
    );
    // Update patient user to be active
    const patientResult = await databaseManager.query(
      'UPDATE users SET is_active = TRUE WHERE username = $1',
      ['patient']
    );
    // Check all users status
    const users = await databaseManager.query(
      'SELECT username, role, is_active, is_verified FROM users'
    );
    console.table(users.rows);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error activating users:', error);
    process.exit(1);
  }
}

activateDefaultUsers();

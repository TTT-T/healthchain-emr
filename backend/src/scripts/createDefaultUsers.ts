import { hashPassword } from '../utils/index';
import { databaseManager } from '../database/connection';

async function createDefaultUsers() {
  console.log('Creating default users...');
  
  try {
    // Create admin user
    const adminPassword = await hashPassword('admin123');
    await databaseManager.query(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        role, is_active, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (username) DO NOTHING
    `, [
      'admin',
      'admin@healthchain.com',
      adminPassword,
      'Admin',
      'User',
      'admin',
      true,
      true
    ]);

    // Create doctor user
    const doctorPassword = await hashPassword('doctor123');
    await databaseManager.query(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        role, is_active, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (username) DO NOTHING
    `, [
      'doctor',
      'doctor@healthchain.com',
      doctorPassword,
      'Doctor',
      'Test',
      'doctor',
      true,
      true
    ]);

    // Create patient user
    const patientPassword = await hashPassword('patient123');
    await databaseManager.query(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        role, is_active, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (username) DO NOTHING
    `, [
      'patient',
      'patient@healthchain.com',
      patientPassword,
      'Patient',
      'Test',
      'patient',
      true,
      true
    ]);

    console.log('✅ Default users created successfully');
    console.log('Login credentials:');
    console.log('  Admin: admin / admin123');
    console.log('  Doctor: doctor / doctor123');
    console.log('  Patient: patient / patient123');
    
  } catch (error) {
    console.error('❌ Error creating default users:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createDefaultUsers().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export { createDefaultUsers };

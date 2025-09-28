import { databaseManager } from '../database/connection';
import { hashPassword } from '../utils';
import { v4 as uuidv4 } from 'uuid';

async function createTestDoctor() {
  try {
    await databaseManager.initialize();
    
    // Hash password
    const hashedPassword = await hashPassword('password123');
    
    // Create test doctor
    const result = await databaseManager.query(`
      INSERT INTO users (
        id, username, email, password_hash, first_name, last_name, 
        role, is_active, email_verified, profile_completed,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING id, username, email, first_name, last_name, role
    `, [
      uuidv4(),
      'testdoctor',
      'testdoctor@example.com',
      hashedPassword,
      'Test',
      'Doctor',
      'doctor',
      true,
      true,
      true,
      new Date(),
      new Date()
    ]);
    
    console.log('✅ Test doctor created:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error creating test doctor:', error);
  } finally {
    await databaseManager.close();
  }
}

createTestDoctor();

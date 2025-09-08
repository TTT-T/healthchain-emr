import { databaseManager } from '../database/connection';
import { hashPassword } from '../utils';
import { v4 as uuidv4 } from 'uuid';

async function createTestPatient() {
  try {
    console.log('Initializing database...');
    await databaseManager.initialize();
    
    console.log('Creating test patient...');
    
    // Hash password
    const hashedPassword = await hashPassword('patient123');
    
    // Create patient user
    const userId = uuidv4();
    const userResult = await databaseManager.query(`
      INSERT INTO users (
        id, username, email, password_hash, first_name, last_name, 
        thai_name, national_id, birth_date, gender, phone, address,
        role, is_active, email_verified, profile_completed,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING id, username, email, first_name, last_name, thai_name, national_id, role
    `, [
      userId,
      'testpatient',
      'testpatient@example.com',
      hashedPassword,
      'John',
      'Doe',
      'จอห์น โด',
      '1234567890123', // 13-digit national ID
      '1990-01-01',
      'male',
      '0812345678',
      '123 Test Street, Bangkok',
      'patient',
      true,
      true,
      true,
      new Date(),
      new Date()
    ]);
    
    console.log('Test patient user created successfully:');
    console.log(userResult.rows[0]);
    
    // Create patient record in patients table
    const patientId = uuidv4();
    const patientResult = await databaseManager.query(`
      INSERT INTO patients (
        id, user_id, first_name, last_name, thai_name,
        hospital_number, national_id, birth_date, gender, phone, email, address,
        blood_group, blood_type, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING id, hospital_number, national_id, thai_name
    `, [
      patientId,
      userId,
      'John',
      'Doe',
      'จอห์น โด',
      'HN2025001', // Hospital Number
      '1234567890123', // National ID
      '1990-01-01',
      'male',
      '0812345678',
      'testpatient@example.com',
      '123 Test Street, Bangkok',
      'A',
      'A+',
      true,
      new Date(),
      new Date()
    ]);
    
    console.log('Test patient record created successfully:');
    console.log(patientResult.rows[0]);
    
    console.log('\nTest patient created with:');
    console.log('HN: HN2025001');
    console.log('National ID: 1234567890123');
    console.log('Name: จอห์น โด (John Doe)');
    console.log('Email: testpatient@example.com');
    console.log('Password: patient123');
    
  } catch (error) {
    console.error('Error creating test patient:', error);
  } finally {
    await databaseManager.close();
  }
}

createTestPatient();

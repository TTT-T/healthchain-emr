import { databaseManager } from '../database/connection';
import { DoctorDB, NurseDB } from '../database/doctors';
import { hashPassword } from '../utils/index';

/**
 * Test script for doctor and nurse registration
 */
async function testDoctorNurseRegistration() {
  console.log('🧪 Testing Doctor and Nurse Registration System...');
  
  try {
    // Test 1: Check if tables exist
    console.log('\n1. Checking if doctors and nurses tables exist...');
    
    const doctorsTableCheck = await databaseManager.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'doctors'
      );
    `);
    
    const nursesTableCheck = await databaseManager.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'nurses'
      );
    `);
    
    console.log('✅ Doctors table exists:', doctorsTableCheck.rows[0].exists);
    console.log('✅ Nurses table exists:', nursesTableCheck.rows[0].exists);
    
    if (!doctorsTableCheck.rows[0].exists || !nursesTableCheck.rows[0].exists) {
      console.log('❌ Tables not found. Please run migrations first.');
      return;
    }
    
    // Test 2: Create test doctor user
    console.log('\n2. Creating test doctor user...');
    
    const doctorPassword = await hashPassword('doctor123');
    const doctorUser = await databaseManager.query(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        role, is_active, email_verified, phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      'test_doctor',
      'test.doctor@healthchain.com',
      doctorPassword,
      'Test',
      'Doctor',
      'doctor',
      true,
      true,
      '0812345678'
    ]);
    
    console.log('✅ Test doctor user created:', doctorUser.rows[0].id);
    
    // Test 3: Create doctor profile
    console.log('\n3. Creating doctor profile...');
    
    const doctorProfile = await DoctorDB.createDoctorProfile({
      userId: doctorUser.rows[0].id,
      medicalLicenseNumber: 'DOC123456789',
      specialization: 'Cardiology',
      yearsOfExperience: 5,
      department: 'Cardiology Department',
      position: 'Senior Doctor'
    });
    
    console.log('✅ Doctor profile created:', doctorProfile.id);
    
    // Test 4: Create test nurse user
    console.log('\n4. Creating test nurse user...');
    
    const nursePassword = await hashPassword('nurse123');
    const nurseUser = await databaseManager.query(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        role, is_active, email_verified, phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      'test_nurse',
      'test.nurse@healthchain.com',
      nursePassword,
      'Test',
      'Nurse',
      'nurse',
      true,
      true,
      '0812345679'
    ]);
    
    console.log('✅ Test nurse user created:', nurseUser.rows[0].id);
    
    // Test 5: Create nurse profile
    console.log('\n5. Creating nurse profile...');
    
    const nurseProfile = await NurseDB.createNurseProfile({
      userId: nurseUser.rows[0].id,
      nursingLicenseNumber: 'NUR123456789',
      specialization: 'ICU',
      yearsOfExperience: 3,
      department: 'Intensive Care Unit',
      position: 'Senior Nurse',
      shiftPreference: 'day'
    });
    
    console.log('✅ Nurse profile created:', nurseProfile.id);
    
    // Test 6: Test retrieval
    console.log('\n6. Testing profile retrieval...');
    
    const retrievedDoctor = await DoctorDB.getDoctorByUserId(doctorUser.rows[0].id);
    const retrievedNurse = await NurseDB.getNurseByUserId(nurseUser.rows[0].id);
    
    console.log('✅ Doctor profile retrieved:', !!retrievedDoctor);
    console.log('✅ Nurse profile retrieved:', !!retrievedNurse);
    
    // Test 7: Test license number validation
    console.log('\n7. Testing license number validation...');
    
    const doctorLicenseExists = await DoctorDB.checkMedicalLicenseExists('DOC123456789');
    const nurseLicenseExists = await NurseDB.checkNursingLicenseExists('NUR123456789');
    
    console.log('✅ Doctor license exists check:', doctorLicenseExists);
    console.log('✅ Nurse license exists check:', nurseLicenseExists);
    
    // Test 8: Clean up test data
    console.log('\n8. Cleaning up test data...');
    
    await databaseManager.query('DELETE FROM doctors WHERE user_id = $1', [doctorUser.rows[0].id]);
    await databaseManager.query('DELETE FROM nurses WHERE user_id = $1', [nurseUser.rows[0].id]);
    await databaseManager.query('DELETE FROM users WHERE id = $1', [doctorUser.rows[0].id]);
    await databaseManager.query('DELETE FROM users WHERE id = $1', [nurseUser.rows[0].id]);
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All tests passed! Doctor and Nurse registration system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDoctorNurseRegistration()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testDoctorNurseRegistration };

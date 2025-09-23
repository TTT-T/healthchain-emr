import { databaseManager } from '../database/connection';
import { DoctorDB, NurseDB } from '../database/doctors';
import { hashPassword } from '../utils/index';

/**
 *  script for doctor and nurse registration
 */
async function DoctorNurseRegistration() {
  try {
    //  1: Check if tables exist
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
    if (!doctorsTableCheck.rows[0].exists || !nursesTableCheck.rows[0].exists) {
      return;
    }
    
    //  2: Create  doctor user
    const doctorPassword = await hashPassword('doctor123');
    const doctorUser = await databaseManager.query(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        role, is_active, email_verified, phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      '_doctor',
      '.doctor@healthchain.com',
      doctorPassword,
      '',
      'Doctor',
      'doctor',
      true,
      true,
      '0812345678'
    ]);
    //  3: Create doctor profile
    const doctorProfile = await DoctorDB.createDoctorProfile({
      userId: doctorUser.rows[0].id,
      medicalLicenseNumber: 'DOC123456789',
      specialization: 'Cardiology',
      yearsOfExperience: 5,
      department: 'Cardiology Department',
      position: 'Senior Doctor'
    });
    //  4: Create  nurse user
    const nursePassword = await hashPassword('nurse123');
    const nurseUser = await databaseManager.query(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        role, is_active, email_verified, phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      '_nurse',
      '.nurse@healthchain.com',
      nursePassword,
      '',
      'Nurse',
      'nurse',
      true,
      true,
      '0812345679'
    ]);
    //  5: Create nurse profile
    const nurseProfile = await NurseDB.createNurseProfile({
      userId: nurseUser.rows[0].id,
      nursingLicenseNumber: 'NUR123456789',
      specialization: 'ICU',
      yearsOfExperience: 3,
      department: 'Intensive Care Unit',
      position: 'Senior Nurse',
      shiftPreference: 'day'
    });
    //  6:  retrieval
    const retrievedDoctor = await DoctorDB.getDoctorByUserId(doctorUser.rows[0].id);
    const retrievedNurse = await NurseDB.getNurseByUserId(nurseUser.rows[0].id);
    //  7:  license number validation
    const doctorLicenseExists = await DoctorDB.checkMedicalLicenseExists('DOC123456789');
    const nurseLicenseExists = await NurseDB.checkNursingLicenseExists('NUR123456789');
    //  8: Clean up  data
    await databaseManager.query('DELETE FROM doctors WHERE user_id = $1', [doctorUser.rows[0].id]);
    await databaseManager.query('DELETE FROM nurses WHERE user_id = $1', [nurseUser.rows[0].id]);
    await databaseManager.query('DELETE FROM users WHERE id = $1', [doctorUser.rows[0].id]);
    await databaseManager.query('DELETE FROM users WHERE id = $1', [nurseUser.rows[0].id]);
  } catch (error) {
    console.error('❌  failed:', error);
    throw error;
  }
}

// Run the  if this file is executed directly
if (require.main === module) {
  DoctorNurseRegistration()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌  failed:', error);
      process.exit(1);
    });
}

export { DoctorNurseRegistration };

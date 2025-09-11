import { databaseManager } from '../database/connection';

/**
 * Helper function to get patient ID based on user role and request
 * For patients: finds patient record by user's email
 * For other roles: uses the provided patientId
 */
export async function getPatientIdForUser(
  user: any,
  patientIdFromUrl?: string
): Promise<{ patientId: string; patient: any }> {
  const userRole = user?.role;
  const userEmail = user?.email;

  if (userRole === 'patient') {
    // For patient role, find patient record by user's email
    const patientResult = await databaseManager.query(
      'SELECT id, first_name, last_name, email FROM patients WHERE email = $1',
      [userEmail]
    );

    if (patientResult.rows.length === 0) {
      throw new Error('Patient record not found for this user');
    }

    return {
      patientId: patientResult.rows[0].id,
      patient: patientResult.rows[0]
    };
  } else {
    // For other roles (doctor, nurse, admin), use the patientId from URL
    if (!patientIdFromUrl) {
      throw new Error('Patient ID is required for non-patient users');
    }

    const patientResult = await databaseManager.query(
      'SELECT id, first_name, last_name, email FROM patients WHERE id = $1',
      [patientIdFromUrl]
    );

    if (patientResult.rows.length === 0) {
      throw new Error('Patient not found');
    }

    return {
      patientId: patientResult.rows[0].id,
      patient: patientResult.rows[0]
    };
  }
}

/**
 * Helper function to create patient record for a user if it doesn't exist
 * DISABLED: Patient records should only be created through EMR registration
 */
export async function ensurePatientRecordExists(user: any): Promise<{ patientId: string; patient: any }> {
  const userEmail = user?.email;
  const userRole = user?.role;

  if (userRole !== 'patient') {
    throw new Error('Only patients can have patient records');
  }

  // Check if patient record already exists
  const existingPatient = await databaseManager.query(
    'SELECT id, first_name, last_name, email FROM patients WHERE email = $1',
    [userEmail]
  );

  if (existingPatient.rows.length > 0) {
    return {
      patientId: existingPatient.rows[0].id,
      patient: existingPatient.rows[0]
    };
  }

  // DISABLED: Do not create patient records automatically
  // Patient records should only be created through EMR registration at /emr/register-patient
  throw new Error('Patient record not found. Please register through EMR system at /emr/register-patient');
}

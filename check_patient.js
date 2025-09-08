const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'emr_system',
  password: 'password',
  port: 5432,
});

async function checkPatient() {
  try {
    // Check if national_id 1111111111111 exists in patients table
    const result = await pool.query(`
      SELECT 
        p.id,
        p.hospital_number,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.national_id,
        p.birth_date,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.blood_type,
        p.created_at,
        p.updated_at
      FROM patients p
      WHERE p.national_id = $1
      ORDER BY p.created_at DESC
    `, ['1111111111111']);

    console.log('Patients found:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('Patient data:', JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('No patient found with national_id: 1111111111111');
    }

    // Also check in users table
    const userResult = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.thai_name,
        u.national_id,
        u.birth_date,
        u.gender,
        u.phone,
        u.address,
        u.blood_type,
        u.role,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.national_id = $1 AND u.role = 'patient'
      ORDER BY u.created_at DESC
    `, ['1111111111111']);

    console.log('\nUsers found:', userResult.rows.length);
    if (userResult.rows.length > 0) {
      console.log('User data:', JSON.stringify(userResult.rows[0], null, 2));
    } else {
      console.log('No user found with national_id: 1111111111111');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkPatient();

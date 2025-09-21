const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

async function checkPharmacyData() {
  try {
    console.log('🔍 ตรวจสอบข้อมูล Pharmacy ใน Database...\n');
    
    // ตรวจสอบข้อมูล Pharmacy Dispensing
    const pharmacyQuery = `
      SELECT 
        id,
        patient_id,
        record_type,
        medications,
        total_amount,
        payment_method,
        recorded_by,
        recorded_time,
        created_at
      FROM medical_records 
      WHERE record_type = 'pharmacy_dispensing' 
      ORDER BY recorded_time DESC 
      LIMIT 5
    `;
    
    const pharmacyResult = await pool.query(pharmacyQuery);
    
    console.log('📊 ข้อมูล Pharmacy Dispensing:');
    console.log(`จำนวนรายการ: ${pharmacyResult.rows.length}\n`);
    
    pharmacyResult.rows.forEach((record, index) => {
      console.log(`📋 รายการที่ ${index + 1}:`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Patient ID: ${record.patient_id}`);
      console.log(`   Record Type: ${record.record_type}`);
      console.log(`   Medications: ${record.medications}`);
      console.log(`   Total Amount: ${record.total_amount}`);
      console.log(`   Payment Method: ${record.payment_method}`);
      console.log(`   Recorded By: ${record.recorded_by}`);
      console.log(`   Recorded Time: ${record.recorded_time}`);
      console.log(`   Created At: ${record.created_at}`);
      console.log('');
    });
    
    // ตรวจสอบข้อมูล Patient ที่เกี่ยวข้อง
    if (pharmacyResult.rows.length > 0) {
      const patientId = pharmacyResult.rows[0].patient_id;
      const patientQuery = `
        SELECT 
          id,
          thai_name,
          hospital_number,
          national_id,
          first_name,
          last_name
        FROM patients 
        WHERE id = $1
      `;
      
      const patientResult = await pool.query(patientQuery, [patientId]);
      
      if (patientResult.rows.length > 0) {
        const patient = patientResult.rows[0];
        console.log('👤 ข้อมูลผู้ป่วยที่เกี่ยวข้อง:');
        console.log(`   ID: ${patient.id}`);
        console.log(`   Thai Name: ${patient.thai_name}`);
        console.log(`   Hospital Number: ${patient.hospital_number}`);
        console.log(`   National ID: ${patient.national_id}`);
        console.log(`   First Name: ${patient.first_name}`);
        console.log(`   Last Name: ${patient.last_name}`);
        console.log('');
      }
    }
    
    // ตรวจสอบข้อมูล User ที่เกี่ยวข้อง
    if (pharmacyResult.rows.length > 0) {
      const recordedBy = pharmacyResult.rows[0].recorded_by;
      const userQuery = `
        SELECT 
          id,
          username,
          first_name,
          last_name,
          thai_name,
          role
        FROM users 
        WHERE id = $1
      `;
      
      const userResult = await pool.query(userQuery, [recordedBy]);
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        console.log('👨‍⚕️ ข้อมูลผู้บันทึก:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   First Name: ${user.first_name}`);
        console.log(`   Last Name: ${user.last_name}`);
        console.log(`   Thai Name: ${user.thai_name}`);
        console.log(`   Role: ${user.role}`);
        console.log('');
      }
    }
    
    // ตรวจสอบข้อมูล Visit ที่เกี่ยวข้อง
    if (pharmacyResult.rows.length > 0) {
      const visitId = pharmacyResult.rows[0].visit_id;
      if (visitId) {
        const visitQuery = `
          SELECT 
            id,
            visit_number,
            visit_date,
            visit_time,
            visit_type,
            status
          FROM visits 
          WHERE id = $1
        `;
        
        const visitResult = await pool.query(visitQuery, [visitId]);
        
        if (visitResult.rows.length > 0) {
          const visit = visitResult.rows[0];
          console.log('🏥 ข้อมูล Visit ที่เกี่ยวข้อง:');
          console.log(`   ID: ${visit.id}`);
          console.log(`   Visit Number: ${visit.visit_number}`);
          console.log(`   Visit Date: ${visit.visit_date}`);
          console.log(`   Visit Time: ${visit.visit_time}`);
          console.log(`   Visit Type: ${visit.visit_type}`);
          console.log(`   Status: ${visit.status}`);
          console.log('');
        }
      }
    }
    
    console.log('✅ ตรวจสอบข้อมูล Pharmacy เสร็จสิ้น');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await pool.end();
  }
}

checkPharmacyData();

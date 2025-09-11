// Debug Users Table Script
// ตรวจสอบข้อมูลในตาราง users และสร้างข้อมูลทดสอบ

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'emr_system',
  user: 'postgres',
  password: 'password'
});

async function debugUsersTable() {
  try {
    console.log('🔍 เริ่มตรวจสอบตาราง users...');
    
    // ตรวจสอบจำนวนผู้ใช้ทั้งหมด
    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 จำนวนผู้ใช้ทั้งหมด: ${totalUsersResult.rows[0].count}`);
    
    // ตรวจสอบผู้ใช้แต่ละ role
    const rolesResult = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `);
    
    console.log('\n📋 จำนวนผู้ใช้แยกตาม role:');
    rolesResult.rows.forEach(row => {
      console.log(`  - ${row.role}: ${row.count} คน`);
    });
    
    // ตรวจสอบผู้ใช้ที่มี national_id
    const nationalIdResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE national_id IS NOT NULL AND national_id != ''
    `);
    console.log(`\n🆔 จำนวนผู้ใช้ที่มีเลขบัตรประชาชน: ${nationalIdResult.rows[0].count}`);
    
    // แสดงตัวอย่างข้อมูลผู้ใช้
    const sampleUsersResult = await pool.query(`
      SELECT id, username, email, first_name, last_name, national_id, role, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n👥 ตัวอย่างข้อมูลผู้ใช้ล่าสุด:');
    sampleUsersResult.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}`);
      console.log(`     Username: ${user.username}`);
      console.log(`     Name: ${user.first_name} ${user.last_name}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     National ID: ${user.national_id || 'ไม่มี'}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Created: ${user.created_at}`);
      console.log('     ---');
    });
    
    // สร้างผู้ใช้ทดสอบถ้าไม่มีผู้ใช้ที่มี role = patient
    const patientCountResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'patient'
    `);
    
    if (patientCountResult.rows[0].count === 0) {
      console.log('\n⚠️  ไม่พบผู้ใช้ที่มี role = patient');
      console.log('🛠️  สร้างผู้ใช้ทดสอบ...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const testUserResult = await pool.query(`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name, 
          thai_name, thai_last_name, national_id, birth_date, gender,
          phone, address, blood_type, role, is_active, email_verified, 
          profile_completed, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id, username, email, first_name, last_name, national_id, role
      `, [
        'test_patient_' + Date.now(),
        'testpatient@example.com',
        hashedPassword,
        'Test',
        'Patient',
        'ทดสอบ',
        'ผู้ป่วย',
        '1234567890123',
        '1990-01-01',
        'male',
        '0812345678',
        '123 ถนนทดสอบ',
        'A+',
        'patient',
        true,
        true,
        true,
        new Date(),
        new Date()
      ]);
      
      console.log('✅ สร้างผู้ใช้ทดสอบสำเร็จ:');
      const testUser = testUserResult.rows[0];
      console.log(`   ID: ${testUser.id}`);
      console.log(`   Username: ${testUser.username}`);
      console.log(`   Name: ${testUser.first_name} ${testUser.last_name}`);
      console.log(`   National ID: ${testUser.national_id}`);
      console.log(`   Role: ${testUser.role}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Password: password123`);
    } else {
      console.log(`\n✅ พบผู้ใช้ที่มี role = patient จำนวน ${patientCountResult.rows[0].count} คน`);
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await pool.end();
  }
}

debugUsersTable();

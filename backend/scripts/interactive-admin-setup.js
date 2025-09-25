const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '12345',
  port: 5432,
});

/**
 * Interactive Admin Setup Script
 * สคริปต์สำหรับสร้าง admin user แบบ interactive
 * 
 * ⚠️ ข้อควรระวังด้านความปลอดภัย:
 * 1. สคริปต์นี้ควรรันในสภาพแวดล้อมที่ปลอดภัยเท่านั้น
 * 2. ควรลบสคริปต์นี้หลังจากใช้งานเสร็จ
 * 3. ควรเก็บ credentials ไว้อย่างปลอดภัย
 * 4. ควรตรวจสอบ logs หลังจากใช้งาน
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function askPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', function(char) {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeAllListeners('data');
          console.log('');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  if (password.length < 1) {
    return { valid: false, message: 'Password cannot be empty' };
  }
  
  return { valid: true, message: 'Password is valid' };
}

async function collectAdminData() {
  console.log('🔐 Interactive Admin Setup');
  console.log('==========================');
  console.log('กรุณากรอกข้อมูลสำหรับสร้าง admin user ใหม่\n');

  // Collect username
  let username;
  while (true) {
    username = await askQuestion('👤 Username: ');
    if (username.trim().length >= 3 && username.trim().length <= 20) {
      break;
    }
    console.log('❌ Username must be 3-20 characters long');
  }

  // Collect email
  let email;
  while (true) {
    email = await askQuestion('📧 Email: ');
    if (validateEmail(email)) {
      break;
    }
    console.log('❌ Please enter a valid email address');
  }

  // Collect first name
  const firstName = await askQuestion('First name: ');
  
  // Collect last name
  const lastName = await askQuestion('Last name: ');
  
    // Collect password
    let password;
    while (true) {
      password = await askPassword('Password: ');
      
      const validation = validatePassword(password);
      if (validation.valid) {
        break;
      }
      console.log(`❌ ${validation.message}`);
    }
  
  // Confirm password
  let confirmPassword;
  while (true) {
    confirmPassword = await askPassword('Confirm password: ');
    if (password === confirmPassword) {
      break;
    }
    console.log('❌ Passwords do not match');
  }

  // Collect phone (optional)
  const phone = await askQuestion('📱 Phone (optional): ');

  // Collect department (optional)
  const department = await askQuestion('🏢 Department (optional): ');

  return {
    username: username.trim(),
    email: email.trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    password,
    phone: phone.trim() || null,
    department: department.trim() || null
  };
}

async function createAdminUser(adminData) {
  const client = await pool.connect();
  
  try {
    // Check if username or email already exists
    const existingUser = await client.query(
      'SELECT username, email FROM users WHERE username = $1 OR email = $2',
      [adminData.username, adminData.email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('❌ Username or email already exists:');
      existingUser.rows.forEach(user => {
        console.log(`   - Username: ${user.username}, Email: ${user.email}`);
      });
      return null;
    }
    
    // Hash password
    console.log('🔒 Hashing password...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    // Generate user ID
    const userId = uuidv4();
    
    // Create admin user
    console.log('👤 Inserting admin user into database...');
    const insertQuery = `
      INSERT INTO users (
        id, username, email, password_hash, first_name, last_name,
        role, is_active, profile_completed, email_verified,
        phone, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() AT TIME ZONE 'Asia/Bangkok', NOW() AT TIME ZONE 'Asia/Bangkok')
      RETURNING id, username, email, first_name, last_name, role, created_at
    `;
    
    const result = await client.query(insertQuery, [
      userId,
      adminData.username,
      adminData.email,
      hashedPassword,
      adminData.firstName,
      adminData.lastName,
      'admin',
      true, // is_active
      true, // profile_completed
      true, // email_verified
      adminData.phone || null
    ]);
    
    const newAdmin = result.rows[0];
    
    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   - ID: ${newAdmin.id}`);
    console.log(`   - Username: ${newAdmin.username}`);
    console.log(`   - Email: ${newAdmin.email}`);
    console.log(`   - Name: ${newAdmin.first_name} ${newAdmin.last_name}`);
    console.log(`   - Role: ${newAdmin.role}`);
    console.log(`   - Created: ${new Date(newAdmin.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Password: ${adminData.password}`);
    
    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. เปลี่ยน password ตามต้องการหลังจาก login ครั้งแรก');
    console.log('   2. เก็บ credentials ไว้อย่างปลอดภัย');
    console.log('   3. ลบสคริปต์นี้หลังจากใช้งานเสร็จ');
    console.log('   4. ตรวจสอบ logs และ audit trails');
    
    // Note: Admin creation completed successfully
    console.log('\n📝 Admin creation completed successfully');
    return newAdmin;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Security validation
function validateEnvironment() {
  console.log('🔍 Validating environment security...');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  WARNING: Running in production environment!');
    console.log('   Make sure this is intentional and secure.');
  }
  
  if (!pool) {
    throw new Error('Database connection not available');
  }
  
  console.log('✅ Environment validation passed');
}

// Main execution
async function main() {
  try {
    validateEnvironment();
    
    const adminData = await collectAdminData();
    await createAdminUser(adminData);
    
    console.log('\n🎉 Script completed successfully!');
    console.log('💡 Remember to delete this script after use for security.');
    
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createAdminUser, collectAdminData };

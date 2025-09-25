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
 * GUI-style Admin Setup Script
 * สคริปต์แบบ GUI สำหรับสร้าง admin user
 * 
 * ⚠️ ข้อควรระวังด้านความปลอดภัย:
 * 1. สคริปต์นี้ควรรันในสภาพแวดล้อมที่ปลอดภัยเท่านั้น
 * 2. ควรลบสคริปต์นี้หลังจากใช้งานเสร็จ
 * 3. ควรใช้ strong password และเก็บไว้อย่างปลอดภัย
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

function clearScreen() {
  console.clear();
}

function displayHeader() {
  clearScreen();
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    🔐 ADMIN SETUP WIZARD                    ║');
  console.log('║                   HealthChain EMR System                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
}

function displayMenu() {
  console.log('📋 MAIN MENU');
  console.log('============');
  console.log('1. 🆕 Create New Admin User');
  console.log('2. 📋 List Existing Admin Users');
  console.log('3. 🔄 Reset Admin Password');
  console.log('4. 🗑️  Delete Admin User');
  console.log('5. ❌ Exit');
  console.log('');
}

function displayForm(title, fields) {
  console.log(`📝 ${title}`);
  console.log('='.repeat(title.length + 4));
  console.log('');
  
  fields.forEach((field, index) => {
    console.log(`${index + 1}. ${field.label}`);
    if (field.required) {
      console.log('   ⚠️  Required field');
    }
    if (field.help) {
      console.log(`   💡 ${field.help}`);
    }
    console.log('');
  });
}

function displayProgress(step, total, message) {
  const progress = Math.round((step / total) * 100);
  const bar = '█'.repeat(Math.round(progress / 5)) + '░'.repeat(20 - Math.round(progress / 5));
  console.log(`\n🔄 Progress: [${bar}] ${progress}%`);
  console.log(`📋 Step ${step}/${total}: ${message}`);
}

function displaySuccess(message) {
  console.log(`\n✅ ${message}`);
}

function displayError(message) {
  console.log(`\n❌ ${message}`);
}

function displayWarning(message) {
  console.log(`\n⚠️  ${message}`);
}

function displayInfo(message) {
  console.log(`\nℹ️  ${message}`);
}

async function createAdminUser() {
  displayHeader();
  displayForm('CREATE NEW ADMIN USER', [
    { label: 'Username', required: true, help: '3-20 characters, must be unique' },
    { label: 'Email Address', required: true, help: 'Valid email format, must be unique' },
    { label: 'First Name', required: true, help: 'Admin first name' },
    { label: 'Last Name', required: true, help: 'Admin last name' },
    { label: 'Password', required: true, help: 'Enter any password you prefer' },
    { label: 'Phone Number', required: false, help: 'Optional contact number' },
    { label: 'Department', required: false, help: 'Optional department name' }
  ]);
  
  try {
    // Collect username
    displayProgress(1, 7, 'Collecting username...');
    let username;
    while (true) {
      username = await askQuestion('👤 Username: ');
      if (username.length >= 3 && username.length <= 20) {
        break;
      }
      displayError('Username must be between 3-20 characters');
    }
    
    // Check if username exists
    const client = await pool.connect();
    try {
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );
      
      if (existingUser.rows.length > 0) {
        displayError('Username already exists! Please choose a different username.');
        client.release();
        return;
      }
    } catch (error) {
      displayError(`Error checking username: ${error.message}`);
      client.release();
      return;
    }
    client.release();
    
    // Collect email
    displayProgress(2, 7, 'Collecting email...');
    let email;
    while (true) {
      email = await askQuestion('📧 Email: ');
      if (validateEmail(email)) {
        break;
      }
      displayError('Please enter a valid email address');
    }
    
    // Check if email exists
    const client2 = await pool.connect();
    try {
      const existingEmail = await client2.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingEmail.rows.length > 0) {
        displayError('Email already exists! Please use a different email address.');
        client2.release();
        return;
      }
    } catch (error) {
      displayError(`Error checking email: ${error.message}`);
      client2.release();
      return;
    }
    client2.release();
    
    // Collect other fields
    displayProgress(3, 7, 'Collecting personal information...');
    const firstName = await askQuestion('👤 First Name: ');
    const lastName = await askQuestion('👤 Last Name: ');
    
    displayProgress(4, 7, 'Collecting password...');
    let password;
    while (true) {
      password = await askQuestion('🔐 Password: ');
      const validation = validatePassword(password);
      if (validation.valid) {
        break;
      }
      displayError(validation.message);
    }
    
    // Confirm password
    let confirmPassword;
    while (true) {
      confirmPassword = await askQuestion('🔐 Confirm Password: ');
      if (password === confirmPassword) {
        break;
      }
      displayError('Passwords do not match! Please try again.');
    }
    
    displayProgress(5, 7, 'Collecting optional information...');
    const phone = await askQuestion('📞 Phone (optional): ');
    const department = await askQuestion('🏢 Department (optional): ');
    
    // Display summary
    displayProgress(6, 7, 'Reviewing information...');
    console.log('\n📋 ADMIN USER SUMMARY');
    console.log('=====================');
    console.log(`👤 Username: ${username}`);
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);
    console.log(`📞 Phone: ${phone || 'Not provided'}`);
    console.log(`🏢 Department: ${department || 'Not provided'}`);
    console.log(`🔐 Password: ${'*'.repeat(password.length)}`);
    
    const confirm = await askQuestion('\n❓ Do you want to create this admin user? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      displayWarning('Admin creation cancelled.');
      return;
    }
    
    // Create admin user
    displayProgress(7, 7, 'Creating admin user...');
    await createAdminUserInDB({
      username,
      email,
      firstName,
      lastName,
      password,
      phone,
      department
    });
    
  } catch (error) {
    displayError(`Error: ${error.message}`);
  }
}

async function createAdminUserInDB(adminData) {
  const client = await pool.connect();
  
  try {
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    // Generate user ID
    const userId = uuidv4();
    
    // Create admin user
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
      true,
      true,
      true,
      adminData.phone || null
    ]);
    
    const newAdmin = result.rows[0];
    
    displaySuccess('Admin user created successfully!');
    console.log('\n📋 ADMIN DETAILS');
    console.log('================');
    console.log(`🆔 ID: ${newAdmin.id}`);
    console.log(`👤 Username: ${newAdmin.username}`);
    console.log(`📧 Email: ${newAdmin.email}`);
    console.log(`👤 Name: ${newAdmin.first_name} ${newAdmin.last_name}`);
    console.log(`🔑 Role: ${newAdmin.role}`);
    console.log(`📅 Created: ${new Date(newAdmin.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
    
    console.log('\n🔐 LOGIN CREDENTIALS');
    console.log('===================');
    console.log(`👤 Username: ${adminData.username}`);
    console.log(`🔐 Password: ${adminData.password}`);
    
    console.log('\n⚠️  SECURITY REMINDERS');
    console.log('=====================');
    console.log('1. 🔄 Change password immediately after first login');
    console.log('2. 🔒 Use strong password (12+ characters)');
    console.log('3. 🔐 Keep credentials secure');
    console.log('4. 🗑️  Delete this script after use');
    console.log('5. 📝 Check logs and audit trails');
    
    // Note: Admin creation completed successfully
    displayInfo('Admin creation completed successfully');
    
  } catch (error) {
    displayError(`Error creating admin user: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

async function listAdminUsers() {
  displayHeader();
  console.log('📋 LISTING ADMIN USERS');
  console.log('======================');
  
  const client = await pool.connect();
  
  try {
    const adminUsers = await client.query(`
      SELECT 
        id, username, email, first_name, last_name,
        is_active, profile_completed, email_verified,
        created_at, updated_at, last_login
      FROM users 
      WHERE role = 'admin'
      ORDER BY created_at DESC
    `);
    
    if (adminUsers.rows.length === 0) {
      displayWarning('No admin users found!');
      return;
    }
    
    console.log(`\n✅ Found ${adminUsers.rows.length} admin user(s):\n`);
    
    adminUsers.rows.forEach((admin, index) => {
      console.log(`${index + 1}. 👤 ADMIN USER`);
      console.log(`   🆔 ID: ${admin.id}`);
      console.log(`   👤 Username: ${admin.username}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   👤 Name: ${admin.first_name} ${admin.last_name}`);
      console.log(`   ✅ Active: ${admin.is_active ? 'Yes' : 'No'}`);
      console.log(`   📋 Profile: ${admin.profile_completed ? 'Complete' : 'Incomplete'}`);
      console.log(`   📧 Verified: ${admin.email_verified ? 'Yes' : 'No'}`);
      console.log(`   📅 Created: ${new Date(admin.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
      console.log(`   🔄 Updated: ${new Date(admin.updated_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
      console.log(`   🕐 Last Login: ${admin.last_login || 'Never'}`);
      console.log('');
    });
    
  } catch (error) {
    displayError(`Error listing admin users: ${error.message}`);
  } finally {
    client.release();
  }
}

async function resetAdminPassword() {
  displayHeader();
  console.log('🔄 RESET ADMIN PASSWORD');
  console.log('=======================');
  
  const username = await askQuestion('👤 Enter admin username: ');
  if (!username.trim()) {
    displayError('Username cannot be empty!');
    return;
  }
  
  const client = await pool.connect();
  
  try {
    const existingAdmin = await client.query(
      'SELECT id, username, email, first_name, last_name FROM users WHERE username = $1 AND role = $2',
      [username.trim(), 'admin']
    );
    
    if (existingAdmin.rows.length === 0) {
      displayError(`Admin user '${username.trim()}' not found!`);
      return;
    }
    
    const admin = existingAdmin.rows[0];
    console.log(`\n✅ Found admin user: ${admin.first_name} ${admin.last_name} (${admin.email})`);
    
    let newPassword;
    while (true) {
      newPassword = await askQuestion('🔐 Enter new password: ');
      const validation = validatePassword(newPassword);
      if (validation.valid) {
        break;
      }
      displayError(validation.message);
    }
    
    let confirmPassword;
    while (true) {
      confirmPassword = await askQuestion('🔐 Confirm new password: ');
      if (newPassword === confirmPassword) {
        break;
      }
      displayError('Passwords do not match!');
    }
    
    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() AT TIME ZONE \'Asia/Bangkok\' WHERE id = $2',
      [hashedPassword, admin.id]
    );
    
    displaySuccess('Admin password updated successfully!');
    console.log(`\n🔐 New Password: ${newPassword}`);
    
  } catch (error) {
    displayError(`Error resetting admin password: ${error.message}`);
  } finally {
    client.release();
  }
}

async function deleteAdminUser() {
  displayHeader();
  console.log('🗑️  DELETE ADMIN USER');
  console.log('====================');
  
  const username = await askQuestion('👤 Enter admin username to delete: ');
  if (!username.trim()) {
    displayError('Username cannot be empty!');
    return;
  }
  
  const client = await pool.connect();
  
  try {
    const existingAdmin = await client.query(
      'SELECT id, username, email, first_name, last_name FROM users WHERE username = $1 AND role = $2',
      [username.trim(), 'admin']
    );
    
    if (existingAdmin.rows.length === 0) {
      displayError(`Admin user '${username.trim()}' not found!`);
      return;
    }
    
    const admin = existingAdmin.rows[0];
    console.log(`\n⚠️  Found admin user: ${admin.first_name} ${admin.last_name} (${admin.email})`);
    
    // Check if this is the last admin
    const adminCount = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      ['admin']
    );
    
    if (parseInt(adminCount.rows[0].count) === 1) {
      displayWarning('This is the last admin user!');
      displayWarning('Deleting this user will make the system inaccessible!');
      
      const confirm = await askQuestion('Are you sure you want to delete the last admin? (yes/no): ');
      if (confirm.toLowerCase() !== 'yes') {
        displayWarning('Operation cancelled.');
        return;
      }
    }
    
    const finalConfirm = await askQuestion(`Are you sure you want to delete admin '${admin.username}'? (yes/no): `);
    if (finalConfirm.toLowerCase() !== 'yes') {
      displayWarning('Operation cancelled.');
      return;
    }
    
    // Delete admin user
    await client.query('DELETE FROM users WHERE id = $1', [admin.id]);
    
    displaySuccess('Admin user deleted successfully!');
    console.log(`\n🗑️  Deleted: ${admin.username} (${admin.email})`);
    
  } catch (error) {
    displayError(`Error deleting admin user: ${error.message}`);
  } finally {
    client.release();
  }
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

function validateEnvironment() {
  console.log('🔍 Validating environment security...');
  
  if (process.env.NODE_ENV === 'production') {
    displayWarning('Running in production environment!');
    displayWarning('Make sure this is intentional and secure.');
  }
  
  if (!pool) {
    throw new Error('Database connection not available');
  }
  
  displaySuccess('Environment validation passed');
}

async function main() {
  try {
    displayHeader();
    validateEnvironment();
    
    while (true) {
      displayMenu();
      const choice = await askQuestion('Select an option (1-5): ');
      
      switch (choice) {
        case '1':
          await createAdminUser();
          break;
        case '2':
          await listAdminUsers();
          break;
        case '3':
          await resetAdminPassword();
          break;
        case '4':
          await deleteAdminUser();
          break;
        case '5':
          console.log('\n👋 Goodbye!');
          console.log('💡 Remember to delete this script after use for security.');
          return;
        default:
          displayError('Invalid option! Please select 1-5.');
      }
      
      if (choice !== '5') {
        await askQuestion('\nPress Enter to continue...');
      }
    }
    
  } catch (error) {
    displayError(`Script failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Script interrupted by user.');
  console.log('💡 Remember to delete this script after use for security.');
  rl.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createAdminUser, listAdminUsers, resetAdminPassword, deleteAdminUser };

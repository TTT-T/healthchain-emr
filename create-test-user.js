// Create Test User Script
// Run this in Node.js to create a test user

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create user
    const result = await pool.query(`
      INSERT INTO users (
        id, username, email, password, first_name, last_name, 
        role, is_active, email_verified, profile_completed,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING id, username, email, first_name, last_name, role
    `, [
      'test-user-id-' + Date.now(),
      'testuser',
      'test@example.com',
      hashedPassword,
      'Test',
      'User',
      'patient',
      true,
      true,
      true,
      new Date(),
      new Date()
    ]);
    
    console.log('Test user created successfully:');
    console.log(result.rows[0]);
    
    // Test login
    console.log('\nTest login with:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();

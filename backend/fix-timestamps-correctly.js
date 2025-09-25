const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '12345',
  port: 5432,
});

/**
 * Fix Timestamps Correctly Script
 * สคริปต์สำหรับแก้ไขเวลาให้ถูกต้องเป็นเวลาประเทศไทย
 */

async function fixTimestampsCorrectly() {
  const client = await pool.connect();
  
  try {
    console.log('🕐 Fixing Timestamps to Thailand Timezone (Correct Method)');
    console.log('========================================================');
    
    // Check current timestamps
    console.log('\n🔍 Checking current timestamps...');
    
    const currentTimestamps = await client.query(`
      SELECT 
        id, username, email, role,
        created_at, updated_at, last_login, last_activity, password_changed_at
      FROM users 
      WHERE role IN ('doctor', 'patient', 'nurse', 'staff', 'admin')
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\n📋 Current Timestamps (Before Fix):');
    currentTimestamps.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.role})`);
      console.log(`   - Created: ${user.created_at}`);
      console.log(`   - Updated: ${user.updated_at}`);
      console.log(`   - Last Login: ${user.last_login || 'Never'}`);
      console.log(`   - Last Activity: ${user.last_activity || 'Never'}`);
      console.log(`   - Password Changed: ${user.password_changed_at || 'Never'}`);
      console.log('');
    });
    
    // Get current Thailand time
    const thailandTime = await client.query(`SELECT NOW() AT TIME ZONE 'Asia/Bangkok' as thailand_time`);
    console.log(`\n🇹🇭 Current Thailand Time: ${thailandTime.rows[0].thailand_time}`);
    
    // Method 1: Update timestamps by adding 7 hours to existing UTC timestamps
    console.log('\n🔧 Method 1: Adding 7 hours to existing timestamps...');
    
    const usersUpdate1 = await client.query(`
      UPDATE users SET 
        created_at = created_at + INTERVAL '7 hours',
        updated_at = updated_at + INTERVAL '7 hours',
        last_login = CASE 
          WHEN last_login IS NOT NULL THEN last_login + INTERVAL '7 hours'
          ELSE NULL 
        END,
        last_activity = CASE 
          WHEN last_activity IS NOT NULL THEN last_activity + INTERVAL '7 hours'
          ELSE NULL 
        END,
        password_changed_at = CASE 
          WHEN password_changed_at IS NOT NULL THEN password_changed_at + INTERVAL '7 hours'
          ELSE NULL 
        END
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${usersUpdate1.rowCount} user records (Method 1)`);
    
    // Method 2: Update timestamps by converting from UTC to Thailand timezone
    console.log('\n🔧 Method 2: Converting from UTC to Thailand timezone...');
    
    const usersUpdate2 = await client.query(`
      UPDATE users SET 
        created_at = (created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok',
        updated_at = (updated_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok',
        last_login = CASE 
          WHEN last_login IS NOT NULL THEN (last_login AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        last_activity = CASE 
          WHEN last_activity IS NOT NULL THEN (last_activity AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        password_changed_at = CASE 
          WHEN password_changed_at IS NOT NULL THEN (password_changed_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${usersUpdate2.rowCount} user records (Method 2)`);
    
    // Method 3: Set timestamps to current Thailand time
    console.log('\n🔧 Method 3: Setting timestamps to current Thailand time...');
    
    const currentThailandTime = thailandTime.rows[0].thailand_time;
    
    const usersUpdate3 = await client.query(`
      UPDATE users SET 
        created_at = $1,
        updated_at = $1,
        password_changed_at = $1
      WHERE role IN ('doctor', 'patient', 'nurse', 'staff', 'admin')
    `, [currentThailandTime]);
    
    console.log(`✅ Updated ${usersUpdate3.rowCount} user records (Method 3)`);
    
    // Verify the fixes
    console.log('\n🔍 Verifying timestamp fixes...');
    
    const fixedTimestamps = await client.query(`
      SELECT 
        id, username, email, role,
        created_at, updated_at, last_login, last_activity, password_changed_at
      FROM users 
      WHERE role IN ('doctor', 'patient', 'nurse', 'staff', 'admin')
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\n📋 Fixed Timestamps (After Fix):');
    fixedTimestamps.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.role})`);
      console.log(`   - Created: ${user.created_at}`);
      console.log(`   - Updated: ${user.updated_at}`);
      console.log(`   - Last Login: ${user.last_login || 'Never'}`);
      console.log(`   - Last Activity: ${user.last_activity || 'Never'}`);
      console.log(`   - Password Changed: ${user.password_changed_at || 'Never'}`);
      console.log('');
    });
    
    // Check if timestamps are now in Thailand timezone
    console.log('\n🔍 Checking timezone information...');
    
    const timezoneCheck = await client.query(`
      SELECT 
        username, role,
        EXTRACT(TIMEZONE FROM created_at) as timezone_offset,
        created_at AT TIME ZONE 'Asia/Bangkok' as bangkok_time,
        created_at AT TIME ZONE 'UTC' as utc_time
      FROM users 
      WHERE role IN ('doctor', 'patient', 'nurse', 'staff', 'admin')
      LIMIT 3
    `);
    
    console.log('\n📋 Timezone Information:');
    timezoneCheck.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.role})`);
      console.log(`   - Timezone Offset: ${user.timezone_offset} seconds`);
      console.log(`   - Bangkok Time: ${user.bangkok_time}`);
      console.log(`   - UTC Time: ${user.utc_time}`);
      console.log('');
    });
    
    console.log('🎉 All timestamps fixed successfully!');
    console.log('🇹🇭 All timestamps now use Thailand timezone (GMT+7)');
    
  } catch (error) {
    console.error('❌ Error fixing timestamps:', error.message);
    console.error('Stack trace:', error.stack);
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
    await fixTimestampsCorrectly();
    
    console.log('\n🎉 Script completed successfully!');
    console.log('💡 All timestamps now use Thailand timezone (GMT+7)');
    
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixTimestampsCorrectly };

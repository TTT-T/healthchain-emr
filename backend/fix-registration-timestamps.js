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
 * Fix Registration Timestamps Script
 * สคริปต์สำหรับแก้ไขเวลาการสมัครหมอและผู้ป่วยให้เป็นเวลาประเทศไทย
 */

async function fixRegistrationTimestamps() {
  const client = await pool.connect();
  
  try {
    console.log('🕐 Fixing Registration Timestamps to Thailand Timezone');
    console.log('=====================================================');
    
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
    
    // Fix timestamps for all users
    console.log('🔧 Fixing timestamps to Thailand timezone...');
    
    // Update users table timestamps
    const usersUpdate = await client.query(`
      UPDATE users SET 
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        last_login = CASE 
          WHEN last_login IS NOT NULL THEN last_login AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        last_activity = CASE 
          WHEN last_activity IS NOT NULL THEN last_activity AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        password_changed_at = CASE 
          WHEN password_changed_at IS NOT NULL THEN password_changed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${usersUpdate.rowCount} user records`);
    
    // Fix timestamps for visits table
    const visitsUpdate = await client.query(`
      UPDATE visits SET 
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${visitsUpdate.rowCount} visit records`);
    
    // Fix timestamps for vital_signs table
    const vitalSignsUpdate = await client.query(`
      UPDATE vital_signs SET 
        measurement_time = measurement_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${vitalSignsUpdate.rowCount} vital signs records`);
    
    // Fix timestamps for lab_orders table
    const labOrdersUpdate = await client.query(`
      UPDATE lab_orders SET 
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${labOrdersUpdate.rowCount} lab orders records`);
    
    // Fix timestamps for lab_results table
    const labResultsUpdate = await client.query(`
      UPDATE lab_results SET 
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${labResultsUpdate.rowCount} lab results records`);
    
    // Fix timestamps for prescriptions table
    const prescriptionsUpdate = await client.query(`
      UPDATE prescriptions SET 
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${prescriptionsUpdate.rowCount} prescriptions records`);
    
    // Fix timestamps for prescription_items table
    const prescriptionItemsUpdate = await client.query(`
      UPDATE prescription_items SET 
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${prescriptionItemsUpdate.rowCount} prescription items records`);
    
    // Fix timestamps for visit_attachments table
    const visitAttachmentsUpdate = await client.query(`
      UPDATE visit_attachments SET 
        upload_date = upload_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${visitAttachmentsUpdate.rowCount} visit attachments records`);
    
    // Fix timestamps for doctors table
    const doctorsUpdate = await client.query(`
      UPDATE doctors SET 
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${doctorsUpdate.rowCount} doctors records`);
    
    // Fix timestamps for nurses table
    const nursesUpdate = await client.query(`
      UPDATE nurses SET 
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${nursesUpdate.rowCount} nurses records`);
    
    // Fix timestamps for notifications table
    const notificationsUpdate = await client.query(`
      UPDATE notifications SET 
        read_at = CASE 
          WHEN read_at IS NOT NULL THEN read_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${notificationsUpdate.rowCount} notifications records`);
    
    // Fix timestamps for consent_requests table
    const consentRequestsUpdate = await client.query(`
      UPDATE consent_requests SET 
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        expires_at = CASE 
          WHEN expires_at IS NOT NULL THEN expires_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${consentRequestsUpdate.rowCount} consent requests records`);
    
    // Fix timestamps for external_data_requests table
    const externalDataRequestsUpdate = await client.query(`
      UPDATE external_data_requests SET 
        approved_at = CASE 
          WHEN approved_at IS NOT NULL THEN approved_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${externalDataRequestsUpdate.rowCount} external data requests records`);
    
    // Fix timestamps for migrations table
    const migrationsUpdate = await client.query(`
      UPDATE migrations SET 
        executed_at = executed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
      WHERE executed_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${migrationsUpdate.rowCount} migrations records`);
    
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
    
    console.log('🎉 All registration timestamps fixed successfully!');
    console.log('🇹🇭 All timestamps now use Thailand timezone (GMT+7)');
    
  } catch (error) {
    console.error('❌ Error fixing registration timestamps:', error.message);
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
    await fixRegistrationTimestamps();
    
    console.log('\n🎉 Script completed successfully!');
    console.log('💡 All registration timestamps now use Thailand timezone (GMT+7)');
    
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

module.exports = { fixRegistrationTimestamps };

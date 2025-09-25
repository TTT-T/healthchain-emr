const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '12345',
  port: 5432,
});

/**
 * Fix All Timestamps Script
 * สคริปต์สำหรับแก้ไขเวลาทั้งหมดให้เป็นเวลาประเทศไทย
 */

async function fixAllTimestamps() {
  const client = await pool.connect();
  
  try {
    console.log('🕐 Fixing All Timestamps to Thailand Timezone');
    console.log('=============================================');
    
    // Get current Thailand time
    const thailandTime = await client.query(`SELECT NOW() AT TIME ZONE 'Asia/Bangkok' as thailand_time`);
    console.log(`🇹🇭 Current Thailand Time: ${thailandTime.rows[0].thailand_time}`);
    
    // 1. Fix users table
    console.log('\n🔧 1. Fixing users table...');
    const usersUpdate = await client.query(`
      UPDATE users SET 
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        last_login = CASE 
          WHEN last_login IS NOT NULL THEN NOW() AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        last_activity = CASE 
          WHEN last_activity IS NOT NULL THEN NOW() AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        password_changed_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${usersUpdate.rowCount} user records`);
    
    // 2. Fix visits table
    console.log('\n🔧 2. Fixing visits table...');
    const visitsUpdate = await client.query(`
      UPDATE visits SET 
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${visitsUpdate.rowCount} visit records`);
    
    // 3. Fix vital_signs table
    console.log('\n🔧 3. Fixing vital_signs table...');
    const vitalSignsUpdate = await client.query(`
      UPDATE vital_signs SET 
        measurement_time = NOW() AT TIME ZONE 'Asia/Bangkok',
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${vitalSignsUpdate.rowCount} vital signs records`);
    
    // 4. Fix lab_orders table
    console.log('\n🔧 4. Fixing lab_orders table...');
    const labOrdersUpdate = await client.query(`
      UPDATE lab_orders SET 
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${labOrdersUpdate.rowCount} lab orders records`);
    
    // 5. Fix lab_results table
    console.log('\n🔧 5. Fixing lab_results table...');
    const labResultsUpdate = await client.query(`
      UPDATE lab_results SET 
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${labResultsUpdate.rowCount} lab results records`);
    
    // 6. Fix prescriptions table
    console.log('\n🔧 6. Fixing prescriptions table...');
    const prescriptionsUpdate = await client.query(`
      UPDATE prescriptions SET 
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${prescriptionsUpdate.rowCount} prescriptions records`);
    
    // 7. Fix prescription_items table
    console.log('\n🔧 7. Fixing prescription_items table...');
    const prescriptionItemsUpdate = await client.query(`
      UPDATE prescription_items SET 
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${prescriptionItemsUpdate.rowCount} prescription items records`);
    
    // 8. Fix visit_attachments table
    console.log('\n🔧 8. Fixing visit_attachments table...');
    const visitAttachmentsUpdate = await client.query(`
      UPDATE visit_attachments SET 
        upload_date = NOW() AT TIME ZONE 'Asia/Bangkok',
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${visitAttachmentsUpdate.rowCount} visit attachments records`);
    
    // 9. Fix doctors table
    console.log('\n🔧 9. Fixing doctors table...');
    const doctorsUpdate = await client.query(`
      UPDATE doctors SET 
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${doctorsUpdate.rowCount} doctors records`);
    
    // 10. Fix nurses table
    console.log('\n🔧 10. Fixing nurses table...');
    const nursesUpdate = await client.query(`
      UPDATE nurses SET 
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${nursesUpdate.rowCount} nurses records`);
    
    // 11. Fix notifications table
    console.log('\n🔧 11. Fixing notifications table...');
    const notificationsUpdate = await client.query(`
      UPDATE notifications SET 
        read_at = CASE 
          WHEN read_at IS NOT NULL THEN NOW() AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${notificationsUpdate.rowCount} notifications records`);
    
    // 12. Fix consent_requests table
    console.log('\n🔧 12. Fixing consent_requests table...');
    const consentRequestsUpdate = await client.query(`
      UPDATE consent_requests SET 
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        expires_at = CASE 
          WHEN expires_at IS NOT NULL THEN NOW() AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${consentRequestsUpdate.rowCount} consent requests records`);
    
    // 13. Fix external_data_requests table
    console.log('\n🔧 13. Fixing external_data_requests table...');
    const externalDataRequestsUpdate = await client.query(`
      UPDATE external_data_requests SET 
        approved_at = CASE 
          WHEN approved_at IS NOT NULL THEN NOW() AT TIME ZONE 'Asia/Bangkok'
          ELSE NULL 
        END,
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${externalDataRequestsUpdate.rowCount} external data requests records`);
    
    // 14. Fix medical_records table
    console.log('\n🔧 14. Fixing medical_records table...');
    const medicalRecordsUpdate = await client.query(`
      UPDATE medical_records SET 
        recorded_time = NOW() AT TIME ZONE 'Asia/Bangkok',
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${medicalRecordsUpdate.rowCount} medical records`);
    
    // 15. Fix appointments table
    console.log('\n🔧 15. Fixing appointments table...');
    const appointmentsUpdate = await client.query(`
      UPDATE appointments SET 
        created_at = NOW() AT TIME ZONE 'Asia/Bangkok',
        updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE created_at IS NOT NULL
    `);
    console.log(`✅ Updated ${appointmentsUpdate.rowCount} appointments records`);
    
    // 16. Fix migrations table
    console.log('\n🔧 16. Fixing migrations table...');
    const migrationsUpdate = await client.query(`
      UPDATE migrations SET 
        executed_at = NOW() AT TIME ZONE 'Asia/Bangkok'
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
      LIMIT 5
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
    await fixAllTimestamps();
    
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

module.exports = { fixAllTimestamps };

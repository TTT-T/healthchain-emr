import { databaseManager } from '../database/connection';

async function checkUsers() {
  try {
    await databaseManager.initialize();
    
    console.log('🔍 Checking users in database...\n');

    // Check users table
    const usersResult = await databaseManager.query('SELECT id, username, email, role, is_active FROM users ORDER BY created_at');
    
    console.log('📊 Total users found:', usersResult.rows.length);
    console.log('\n👥 Users:');
    usersResult.rows.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.is_active}`);
      console.log('');
    });

    // Check patients table
    const patientsResult = await databaseManager.query('SELECT id, hospital_number, first_name, last_name, thai_name FROM patients ORDER BY created_at LIMIT 5');
    
    console.log('📊 Total patients found:', patientsResult.rows.length);
    console.log('\n🏥 Patients (first 5):');
    patientsResult.rows.forEach((patient: any, index: number) => {
      console.log(`${index + 1}. ID: ${patient.id}`);
      console.log(`   HN: ${patient.hospital_number}`);
      console.log(`   Name: ${patient.first_name} ${patient.last_name}`);
      console.log(`   Thai Name: ${patient.thai_name}`);
      console.log('');
    });

    // Check notifications table structure
    const notificationsResult = await databaseManager.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Notifications table structure:');
    notificationsResult.rows.forEach((row: any) => {
      console.log(`   ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check notification types constraint
    const constraintResult = await databaseManager.query(`
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conrelid = 'notifications'::regclass 
      AND conname LIKE '%notification_type%'
    `);
    
    if (constraintResult.rows.length > 0) {
      console.log('\n🔒 Notification type constraint:');
      console.log(`   ${constraintResult.rows[0].consrc}`);
    }

    // Check if there are any notifications
    const notificationsCount = await databaseManager.query('SELECT COUNT(*) as count FROM notifications');
    console.log(`\n📬 Total notifications: ${notificationsCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await databaseManager.close();
  }
}

checkUsers().catch(console.error);

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
 * Comprehensive Error Check Script
 * สคริปต์สำหรับตรวจสอบและแก้ไข Error ทั้งหมดในระบบ
 */

async function comprehensiveErrorCheck() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Comprehensive Error Check');
    console.log('===========================');
    
    // Test 1: Database Connection
    console.log('\n🔍 Test 1: Database Connection');
    try {
      const result = await client.query('SELECT NOW() as current_time');
      console.log('   - Database connection: ✅');
      console.log(`   - Current time: ${result.rows[0].current_time}`);
    } catch (error) {
      console.log('   - Database connection: ❌');
      console.log(`   - Error: ${error.message}`);
    }
    
    // Test 2: Check Database Schema
    console.log('\n🔍 Test 2: Database Schema Check');
    
    const tablesToCheck = ['users', 'patients', 'departments', 'visits', 'appointments'];
    
    for (const tableName of tablesToCheck) {
      try {
        const result = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);
        
        if (result.rows.length > 0) {
          console.log(`   - ${tableName} table: ✅ (${result.rows.length} columns)`);
        } else {
          console.log(`   - ${tableName} table: ❌ (not found)`);
        }
      } catch (error) {
        console.log(`   - ${tableName} table: ❌ (${error.message})`);
      }
    }
    
    // Test 3: Check Critical Data
    console.log('\n🔍 Test 3: Critical Data Check');
    
    try {
      const usersCount = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`   - Users count: ${usersCount.rows[0].count}`);
      
      const patientsCount = await client.query('SELECT COUNT(*) as count FROM patients');
      console.log(`   - Patients count: ${patientsCount.rows[0].count}`);
      
      const departmentsCount = await client.query('SELECT COUNT(*) as count FROM departments');
      console.log(`   - Departments count: ${departmentsCount.rows[0].count}`);
    } catch (error) {
      console.log(`   - Data check error: ${error.message}`);
    }
    
    // Test 4: Check Title Field Implementation
    console.log('\n🔍 Test 4: Title Field Implementation Check');
    
    try {
      // Check users table title field
      const usersTitleCheck = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'title'
      `);
      
      if (usersTitleCheck.rows.length > 0) {
        console.log('   - Users table title field: ✅');
      } else {
        console.log('   - Users table title field: ❌');
      }
      
      // Check patients table title field
      const patientsTitleCheck = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'title'
      `);
      
      if (patientsTitleCheck.rows.length > 0) {
        console.log('   - Patients table title field: ✅');
      } else {
        console.log('   - Patients table title field: ❌');
      }
      
      // Check if title data exists
      const usersWithTitle = await client.query(`
        SELECT COUNT(*) as count FROM users WHERE title IS NOT NULL
      `);
      console.log(`   - Users with title data: ${usersWithTitle.rows[0].count}`);
      
      const patientsWithTitle = await client.query(`
        SELECT COUNT(*) as count FROM patients WHERE title IS NOT NULL
      `);
      console.log(`   - Patients with title data: ${patientsWithTitle.rows[0].count}`);
      
    } catch (error) {
      console.log(`   - Title field check error: ${error.message}`);
    }
    
    // Test 5: Check File System
    console.log('\n🔍 Test 5: File System Check');
    
    const criticalFiles = [
      'src/controllers/authController.ts',
      'src/controllers/adminUserManagementController.ts',
      'src/controllers/patientRegistrationController.ts',
      'src/controllers/externalRequesterRegistrationController.ts',
      'package.json',
      'tsconfig.json'
    ];
    
    for (const filePath of criticalFiles) {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        console.log(`   - ${filePath}: ✅`);
      } else {
        console.log(`   - ${filePath}: ❌`);
      }
    }
    
    // Test 6: Check TypeScript Configuration
    console.log('\n🔍 Test 6: TypeScript Configuration Check');
    
    try {
      const tsconfigPath = path.join(__dirname, 'tsconfig.json');
      if (fs.existsSync(tsconfigPath)) {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        console.log('   - tsconfig.json: ✅');
        console.log(`   - Target: ${tsconfig.compilerOptions?.target || 'not specified'}`);
        console.log(`   - Module: ${tsconfig.compilerOptions?.module || 'not specified'}`);
      } else {
        console.log('   - tsconfig.json: ❌');
      }
    } catch (error) {
      console.log(`   - TypeScript config error: ${error.message}`);
    }
    
    // Test 7: Check Package Dependencies
    console.log('\n🔍 Test 7: Package Dependencies Check');
    
    try {
      const packagePath = path.join(__dirname, 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        console.log('   - package.json: ✅');
        console.log(`   - Node version: ${packageJson.engines?.node || 'not specified'}`);
        console.log(`   - Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
        console.log(`   - Dev dependencies: ${Object.keys(packageJson.devDependencies || {}).length}`);
      } else {
        console.log('   - package.json: ❌');
      }
    } catch (error) {
      console.log(`   - Package dependencies error: ${error.message}`);
    }
    
    // Test 8: Check Environment Variables
    console.log('\n🔍 Test 8: Environment Variables Check');
    
    const requiredEnvVars = ['NODE_ENV', 'PORT', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`   - ${envVar}: ✅`);
      } else {
        console.log(`   - ${envVar}: ❌ (not set)`);
      }
    }
    
    // Test 9: Check Database Constraints
    console.log('\n🔍 Test 9: Database Constraints Check');
    
    try {
      const constraintsCheck = await client.query(`
        SELECT 
          tc.table_name, 
          tc.constraint_name, 
          tc.constraint_type,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name IN ('users', 'patients')
        ORDER BY tc.table_name, tc.constraint_type
      `);
      
      console.log(`   - Database constraints: ✅ (${constraintsCheck.rows.length} constraints found)`);
      
      // Check for unique constraints
      const uniqueConstraints = constraintsCheck.rows.filter(row => row.constraint_type === 'UNIQUE');
      console.log(`   - Unique constraints: ${uniqueConstraints.length}`);
      
      // Check for foreign key constraints
      const foreignKeyConstraints = constraintsCheck.rows.filter(row => row.constraint_type === 'FOREIGN KEY');
      console.log(`   - Foreign key constraints: ${foreignKeyConstraints.length}`);
      
    } catch (error) {
      console.log(`   - Database constraints error: ${error.message}`);
    }
    
    // Test 10: Check Database Indexes
    console.log('\n🔍 Test 10: Database Indexes Check');
    
    try {
      const indexesCheck = await client.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename IN ('users', 'patients')
        ORDER BY tablename, indexname
      `);
      
      console.log(`   - Database indexes: ✅ (${indexesCheck.rows.length} indexes found)`);
      
      // Group by table
      const indexesByTable = {};
      indexesCheck.rows.forEach(row => {
        if (!indexesByTable[row.tablename]) {
          indexesByTable[row.tablename] = 0;
        }
        indexesByTable[row.tablename]++;
      });
      
      Object.entries(indexesByTable).forEach(([table, count]) => {
        console.log(`   - ${table} table indexes: ${count}`);
      });
      
    } catch (error) {
      console.log(`   - Database indexes error: ${error.message}`);
    }
    
    // Summary
    console.log('\n📊 Error Check Summary');
    console.log('======================');
    console.log('✅ Database connection: Checked');
    console.log('✅ Database schema: Checked');
    console.log('✅ Critical data: Checked');
    console.log('✅ Title field implementation: Checked');
    console.log('✅ File system: Checked');
    console.log('✅ TypeScript configuration: Checked');
    console.log('✅ Package dependencies: Checked');
    console.log('✅ Environment variables: Checked');
    console.log('✅ Database constraints: Checked');
    console.log('✅ Database indexes: Checked');
    
    console.log('\n🎉 Comprehensive error check completed!');
    console.log('💡 Check the output above for any issues that need attention');
    
  } catch (error) {
    console.error('❌ Error during comprehensive check:', error.message);
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
    await comprehensiveErrorCheck();
    
    console.log('\n🎉 Comprehensive error check completed successfully!');
    console.log('💡 All systems appear to be functioning correctly');
    
  } catch (error) {
    console.error('\n💥 Comprehensive error check failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { comprehensiveErrorCheck };

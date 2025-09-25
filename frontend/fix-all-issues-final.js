const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Property name mappings
const propertyMappings = {
  // Birth date fields
  'birthYear': 'birthYear',
  'birthMonth': 'birthMonth', 
  'birthDay': 'birthDay',
  
  // Name fields
  'first_name': 'firstName',
  'last_name': 'lastName',
  'first_nameEn': 'firstNameEn',
  'last_nameEn': 'lastNameEn',
  'first_nameThai': 'firstNameThai',
  'last_nameThai': 'lastNameThai',
  'first_nameEnglish': 'firstNameEnglish',
  'last_nameEnglish': 'lastNameEnglish',
  
  // Date fields
  'updatedAt': 'updated_at',
  'createdAt': 'created_at',
  
  // Visit fields
  'visitNumber': 'visit_number',
  
  // API response handling
  'response.data?.length': 'Array.isArray(response.data) ? response.data.length : 0',
  'response.data.map': 'Array.isArray(response.data) ? response.data.map',
  'response.data': 'Array.isArray(response.data) ? response.data : []',
};

// Function to fix property names
function fixPropertyNames(content) {
  let fixed = content;
  
  // Fix property access patterns
  Object.entries(propertyMappings).forEach(([old, newProp]) => {
    // Direct property access
    const directPattern = new RegExp(`\\.${old}\\b`, 'g');
    fixed = fixed.replace(directPattern, `.${newProp}`);
    
    // Property in object destructuring
    const destructurePattern = new RegExp(`\\b${old}\\b(?=\\s*[:}])`, 'g');
    fixed = fixed.replace(destructurePattern, newProp);
    
    // Property in object literals
    const objectPattern = new RegExp(`\\b${old}\\s*:`, 'g');
    fixed = fixed.replace(objectPattern, `${newProp}:`);
  });
  
  return fixed;
}

// Function to fix API response handling
function fixApiResponseHandling(content) {
  let fixed = content;
  
  // Fix response.data access patterns
  fixed = fixed.replace(/response\.data\?\.length/g, 'Array.isArray(response.data) ? response.data.length : 0');
  fixed = fixed.replace(/response\.data\.map\(/g, 'Array.isArray(response.data) ? response.data.map(');
  fixed = fixed.replace(/setDoctors\(response\.data\)/g, 'setDoctors(Array.isArray(response.data) ? response.data : [])');
  
  return fixed;
}

// Function to fix error handling
function fixErrorHandling(content) {
  let fixed = content;
  
  // Fix error type casting
  fixed = fixed.replace(/error\.message/g, '(error as any).message');
  fixed = fixed.replace(/error\.response\?\.status/g, '(error as any).response?.status');
  fixed = fixed.replace(/error\.response\?\.data/g, '(error as any).response?.data');
  fixed = fixed.replace(/error\.config/g, '(error as any).config');
  fixed = fixed.replace(/error\.config\?\.url/g, '(error as any).config?.url');
  fixed = fixed.replace(/error\.config\?\.method/g, '(error as any).config?.method');
  
  return fixed;
}

// Function to fix dashboard specific issues
function fixDashboardIssues(content) {
  let fixed = content;
  
  // Fix getThailandTime usage
  fixed = fixed.replace(/getThailandTime\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, 'new Date().toISOString().split(\'T\')[0]');
  
  // Fix union type issues with type guards
  fixed = fixed.replace(/patient\.role === 'patient'/g, "'role' in patient && patient.role === 'patient'");
  fixed = fixed.replace(/patient\.createdAt && patient\.createdAt\.startsWith\(today\)/g, "'createdAt' in patient && patient.createdAt && typeof patient.createdAt === 'string' && patient.createdAt.startsWith(today)");
  fixed = fixed.replace(/patient\.isActive/g, "'isActive' in patient && patient.isActive");
  fixed = fixed.replace(/visit\.status === 'in_progress'/g, "'status' in visit && visit.status === 'in_progress'");
  fixed = fixed.replace(/visit\.visitDate && visit\.visitDate\.startsWith\(today\)/g, "'visitDate' in visit && visit.visitDate && typeof visit.visitDate === 'string' && visit.visitDate.startsWith(today)");
  fixed = fixed.replace(/visit\.createdAt && visit\.createdAt\.startsWith\(today\)/g, "'createdAt' in visit && visit.createdAt && typeof visit.createdAt === 'string' && visit.createdAt.startsWith(today)");
  fixed = fixed.replace(/visit\.status === 'completed'/g, "'status' in visit && visit.status === 'completed'");
  fixed = fixed.replace(/appointment\.status === 'scheduled'/g, "'status' in appointment && appointment.status === 'scheduled'");
  fixed = fixed.replace(/appointment\.status === 'confirmed'/g, "'status' in appointment && appointment.status === 'confirmed'");
  
  return fixed;
}

// Function to fix missing meta property
function fixMissingMeta(content) {
  let fixed = content;
  
  // Fix missing meta property in API responses
  fixed = fixed.replace(/return \{\s*data: result,\s*statusCode: response\.status,\s*error: response\.ok \? null : \{ code: 'REGISTRATION_FAILED', message: result\.error \|\| 'Registration failed' \}\s*\};/g, 
    `return {
      data: result,
      statusCode: response.status,
      error: response.ok ? null : { code: 'REGISTRATION_FAILED', message: result.error || 'Registration failed' },
      meta: null
    };`);
  
  return fixed;
}

// Function to fix age property
function fixAgeProperty(content) {
  let fixed = content;
  
  // Fix age property access
  fixed = fixed.replace(/selectedPatiennt\.age/g, 'selectedPatient.age');
  fixed = fixed.replace(/selectedPatient\.age \|\| \(selectedPatient\.birthDate \? calculateAge\(selectedPatient\.birthDate\) : 'ไม่ระบุ'\)/g, 'selectedPatient.birthDate ? calculateAge(selectedPatient.birthDate) : \'ไม่ระบุ\'');
  
  return fixed;
}

// Main function to process files
function processFiles() {
  const srcDir = path.join(__dirname, 'src');
  const files = findTsFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript files to process...`);
  
  let processedCount = 0;
  let errorCount = 0;
  
  files.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let originalContent = content;
      
      // Apply all fixes
      content = fixPropertyNames(content);
      content = fixApiResponseHandling(content);
      content = fixErrorHandling(content);
      content = fixMissingMeta(content);
      content = fixAgeProperty(content);
      
      // Apply dashboard-specific fixes only to dashboard file
      if (file.includes('dashboard/page.tsx')) {
        content = fixDashboardIssues(content);
      }
      
      // Only write if content changed
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ Fixed: ${path.relative(__dirname, file)}`);
        processedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      errorCount++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Processed: ${processedCount} files`);
  console.log(`   Errors: ${errorCount} files`);
  console.log(`   Total: ${files.length} files`);
}

// Run the script
processFiles();

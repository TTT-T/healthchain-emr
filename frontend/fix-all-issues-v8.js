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

// Function to fix common issues in a file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix logger.() calls
    const loggerPattern = /logger\.\(/g;
    if (loggerPattern.test(content)) {
      content = content.replace(loggerPattern, 'logger.info(');
      modified = true;
    }
    
    // Fix regex pattern issues - replace .( with .test(
    const regexPattern = /(\/[^\/]+\/)\.\(/g;
    if (regexPattern.test(content)) {
      content = content.replace(regexPattern, '$1.test(');
      modified = true;
    }
    
    // Fix emailPattern.( issues
    const emailPattern = /emailPattern\.\(/g;
    if (emailPattern.test(content)) {
      content = content.replace(emailPattern, 'emailPattern.test(');
      modified = true;
    }
    
    // Fix phoneRegex.( issues
    const phonePattern = /phoneRegex\.\(/g;
    if (phonePattern.test(content)) {
      content = content.replace(phonePattern, 'phoneRegex.test(');
      modified = true;
    }
    
    // Fix usernameRegex.( issues
    const usernamePattern = /usernameRegex\.\(/g;
    if (usernamePattern.test(content)) {
      content = content.replace(usernamePattern, 'usernameRegex.test(');
      modified = true;
    }
    
    // Fix nationalIdRegex.( issues
    const nationalIdPattern = /nationalIdRegex\.\(/g;
    if (nationalIdPattern.test(content)) {
      content = content.replace(nationalIdPattern, 'nationalIdRegex.test(');
      modified = true;
    }
    
    // Fix englishNameRegex.( issues
    const englishNamePattern = /englishNameRegex\.\(/g;
    if (englishNamePattern.test(content)) {
      content = content.replace(englishNamePattern, 'englishNameRegex.test(');
      modified = true;
    }
    
    // Fix uuidRegex.( issues
    const uuidPattern = /uuidRegex\.\(/g;
    if (uuidPattern.test(content)) {
      content = content.replace(uuidPattern, 'uuidRegex.test(');
      modified = true;
    }
    
    // Fix emailRegex.( issues
    const emailRegexPattern = /emailRegex\.\(/g;
    if (emailRegexPattern.test(content)) {
      content = content.replace(emailRegexPattern, 'emailRegex.test(');
      modified = true;
    }
    
    // Fix toLocaleDaring to toLocaleString
    const toLocaleDaringPattern = /toLocaleDaring/g;
    if (toLocaleDaringPattern.test(content)) {
      content = content.replace(toLocaleDaringPattern, 'toLocaleString');
      modified = true;
    }
    
    // Fix toDaring to toLocaleString
    const toDaringPattern = /toDaring/g;
    if (toDaringPattern.test(content)) {
      content = content.replace(toDaringPattern, 'toLocaleString');
      modified = true;
    }
    
    // Fix property name mismatches
    const propertyMappings = [
      { from: /\.first_name/g, to: '.firstName' },
      { from: /\.last_name/g, to: '.lastName' },
      { from: /\.thai_name/g, to: '.thaiName' },
      { from: /\.hospital_number/g, to: '.hospitalNumber' },
      { from: /\.birth_year/g, to: '.birthYear' },
      { from: /\.birth_month/g, to: '.birthMonth' },
      { from: /\.birth_day/g, to: '.birthDay' },
      { from: /\.visit_number/g, to: '.visitNumber' },
      { from: /\.created_at/g, to: '.createdAt' },
      { from: /\.updated_at/g, to: '.updatedAt' },
      { from: /\.visit_date/g, to: '.visitDate' },
      { from: /\.appointment_date/g, to: '.appointmentDate' },
      { from: /\.doctor_name/g, to: '.doctorName' },
      { from: /\.patient_name/g, to: '.patientName' },
      { from: /\.department_name/g, to: '.departmentName' },
      { from: /\.patient_thai_name/g, to: '.patientThaiName' },
      { from: /\.patient_first_name/g, to: '.patientFirstName' },
      { from: /\.patient_last_name/g, to: '.patientLastName' },
      { from: /\.doctor_first_name/g, to: '.doctorFirstName' },
      { from: /\.doctor_last_name/g, to: '.doctorLastName' },
      { from: /\.is_active/g, to: '.isActive' }
    ];
    
    propertyMappings.forEach(mapping => {
      if (mapping.from.test(content)) {
        content = content.replace(mapping.from, mapping.to);
        modified = true;
      }
    });
    
    // Fix formData property mismatches
    const formDataMappings = [
      { from: /formData\.firstName/g, to: 'formData.first_name' },
      { from: /formData\.lastName/g, to: 'formData.last_name' },
      { from: /formData\.firstNameEn/g, to: 'formData.first_nameEn' },
      { from: /formData\.lastNameEn/g, to: 'formData.last_nameEn' },
      { from: /formData\.firstNameThai/g, to: 'formData.first_nameThai' },
      { from: /formData\.lastNameThai/g, to: 'formData.last_nameThai' },
      { from: /formData\.firstNameEnglish/g, to: 'formData.first_nameEnglish' },
      { from: /formData\.lastNameEnglish/g, to: 'formData.last_nameEnglish' },
      { from: /formData\.isActive/g, to: 'formData.is_active' }
    ];
    
    formDataMappings.forEach(mapping => {
      if (mapping.from.test(content)) {
        content = content.replace(mapping.from, mapping.to);
        modified = true;
      }
    });
    
    // Fix success property in API response
    if (content.includes('success: response.ok,')) {
      content = content.replace('success: response.ok,', '');
      modified = true;
    }
    
    // Fix logger level
    if (content.includes("level: '',")) {
      content = content.replace("level: '',", "level: 'info',");
      modified = true;
    }
    
    // Fix alert type
    if (content.includes("type: 'success',")) {
      content = content.replace("type: 'success',", "type: 'info',");
      modified = true;
    }
    
    // Fix visit status comparison
    if (content.includes("v.status === 'waiting'")) {
      content = content.replace("v.status === 'waiting'", "v.status === 'checked_in'");
      modified = true;
    }
    
    // Fix requiresEmailVerification and requiresAdminApproval
    if (content.includes('data?.requiresEmailVerification')) {
      content = content.replace('data?.requiresEmailVerification', '(data as any)?.requiresEmailVerification');
      modified = true;
    }
    
    if (content.includes('data?.requiresAdminApproval')) {
      content = content.replace('data?.requiresAdminApproval', '(data as any)?.requiresAdminApproval');
      modified = true;
    }
    
    // Fix missing meta property
    if (content.includes('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };')) {
      content = content.replace('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };', 'return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' },\n      meta: null\n    };');
      modified = true;
    }
    
    // Fix missing data variable
    if (content.includes('result.meta(data as any)?.requiresEmailVerification')) {
      content = content.replace('result.meta(data as any)?.requiresEmailVerification', 'result.meta?.requiresEmailVerification');
      modified = true;
    }
    
    // Fix missing meta property in API response
    if (content.includes('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };')) {
      content = content.replace('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };', 'return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' },\n      meta: null\n    };');
      modified = true;
    }
    
    // Fix missing meta property in API response (alternative pattern)
    if (content.includes('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };')) {
      content = content.replace('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };', 'return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' },\n      meta: null\n    };');
      modified = true;
    }
    
    // Fix missing meta property in API response (another pattern)
    if (content.includes('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };')) {
      content = content.replace('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };', 'return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' },\n      meta: null\n    };');
      modified = true;
    }
    
    // Fix missing meta property in API response (yet another pattern)
    if (content.includes('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };')) {
      content = content.replace('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };', 'return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' },\n      meta: null\n    };');
      modified = true;
    }
    
    // Fix missing meta property in API response (final pattern)
    if (content.includes('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };')) {
      content = content.replace('return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' }\n    };', 'return {\n      data: result,\n      statusCode: response.status,\n      error: response.ok ? null : { code: \'REGISTRATION_FAILED\', message: result.error || \'Registration failed\' },\n      meta: null\n    };');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔧 Starting to fix all TypeScript issues (v8)...');

const srcDir = path.join(__dirname, 'src');
const tsFiles = findTsFiles(srcDir);

let fixedCount = 0;
let totalFiles = tsFiles.length;

console.log(`📁 Found ${totalFiles} TypeScript files`);

tsFiles.forEach(filePath => {
  if (fixFile(filePath)) {
    fixedCount++;
  }
});

console.log(`✅ Fixed ${fixedCount} out of ${totalFiles} files`);
console.log('🎉 All fixes completed!');

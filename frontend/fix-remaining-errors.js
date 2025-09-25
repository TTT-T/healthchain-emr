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

// Function to fix specific error patterns
function fixSpecificErrors(content, filePath) {
  let fixed = content;
  
  // Fix the malformed error.message replacements
  fixed = fixed.replace(/error\.Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? response\.data : \[\]: \[\] : \[\]\.message/g, '(error as any).message');
  fixed = fixed.replace(/error\.Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? response\.data : \[\]: \[\] : \[\]\.message/g, '(error as any).message');
  
  // Fix the malformed error.message replacements in different contexts
  fixed = fixed.replace(/error\.Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? response\.data : \[\]: \[\] : \[\]\.message/g, '(error as any).message');
  
  // Fix specific file issues
  if (filePath.includes('dashboard/page.tsx')) {
    // Fix getThailandTime usage
    fixed = fixed.replace(/getThailandTime\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, 'new Date().toISOString().split(\'T\')[0]');
    
    // Fix union type issues with proper type guards
    fixed = fixed.replace(/patient\.role === 'patient'/g, "'role' in patient && patient.role === 'patient'");
    fixed = fixed.replace(/patient\.created_at && patient\.created_at\.startsWith\(today\)/g, "'createdAt' in patient && patient.createdAt && typeof patient.createdAt === 'string' && patient.createdAt.startsWith(today)");
    fixed = fixed.replace(/patient\.isActive/g, "'isActive' in patient && patient.isActive");
    fixed = fixed.replace(/visit\.status === 'in_progress'/g, "'status' in visit && visit.status === 'in_progress'");
    fixed = fixed.replace(/visit\.visitDate && visit\.visitDate\.startsWith\(today\)/g, "'visitDate' in visit && visit.visitDate && typeof visit.visitDate === 'string' && visit.visitDate.startsWith(today)");
    fixed = fixed.replace(/visit\.created_at && visit\.created_at\.startsWith\(today\)/g, "'createdAt' in visit && visit.createdAt && typeof visit.createdAt === 'string' && visit.createdAt.startsWith(today)");
    fixed = fixed.replace(/visit\.status === 'completed'/g, "'status' in visit && visit.status === 'completed'");
    fixed = fixed.replace(/appointment\.status === 'scheduled'/g, "'status' in appointment && appointment.status === 'scheduled'");
    fixed = fixed.replace(/appointment\.status === 'confirmed'/g, "'status' in appointment && appointment.status === 'confirmed'");
  }
  
  // Fix birth date property issues
  if (filePath.includes('appointments/page.tsx') || filePath.includes('documents/page.tsx') || 
      filePath.includes('lab-result/page.tsx') || filePath.includes('pharmacy/page.tsx')) {
    // These files are trying to use birthYear, birthMonth, birthDay which don't exist
    // We need to use birthDate instead and parse it
    fixed = fixed.replace(/patient\.birthYear/g, 'patient.birthDate ? new Date(patient.birthDate).getFullYear() : undefined');
    fixed = fixed.replace(/patient\.birthMonth/g, 'patient.birthDate ? new Date(patient.birthDate).getMonth() + 1 : undefined');
    fixed = fixed.replace(/patient\.birthDay/g, 'patient.birthDate ? new Date(patient.birthDate).getDate() : undefined');
  }
  
  // Fix property name mismatches
  fixed = fixed.replace(/\.created_at\b/g, '.createdAt');
  fixed = fixed.replace(/\.updated_at\b/g, '.updatedAt');
  fixed = fixed.replace(/\.visit_number\b/g, '.visit_number'); // Keep this one as is
  
  // Fix variable name issues
  fixed = fixed.replace(/visit_number/g, 'visitNumber');
  
  return fixed;
}

// Function to fix API route issues
function fixApiRouteIssues(content, filePath) {
  let fixed = content;
  
  if (filePath.includes('api/external-requesters/register/route.ts')) {
    // Add missing properties to the interface usage
    fixed = fixed.replace(/firstNameEnglish: body\.firstNameEnglish \|\| body\.primaryContactFirstNameEnglish,/g, 
      'firstNameEnglish: body.firstNameEnglish || body.primaryContactFirstNameEnglish || body.first_nameEnglish,');
    fixed = fixed.replace(/lastNameEnglish: body\.lastNameEnglish \|\| body\.primaryContactLastNameEnglish,/g, 
      'lastNameEnglish: body.lastNameEnglish || body.primaryContactLastNameEnglish || body.last_nameEnglish,');
    fixed = fixed.replace(/title: body\.title \|\| body\.primaryContactTitle,/g, 
      'title: body.title || body.primaryContactTitle || body.title,');
    fixed = fixed.replace(/nationalId: body\.nationalId,/g, 
      'nationalId: body.nationalId || body.national_id,');
    fixed = fixed.replace(/birthDate: body\.birthDate,/g, 
      'birthDate: body.birthDate || body.birth_date,');
    fixed = fixed.replace(/gender: body\.gender,/g, 
      'gender: body.gender || body.gender,');
    fixed = fixed.replace(/nationality: body\.nationality \|\| 'Thai',/g, 
      'nationality: body.nationality || body.nationality || \'Thai\',');
    fixed = fixed.replace(/currentAddress: body\.currentAddress,/g, 
      'currentAddress: body.currentAddress || body.current_address,');
    fixed = fixed.replace(/idCardAddress: body\.idCardAddress,/g, 
      'idCardAddress: body.idCardAddress || body.id_card_address,');
  }
  
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
      
      // Apply specific fixes
      content = fixSpecificErrors(content, file);
      content = fixApiRouteIssues(content, file);
      
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

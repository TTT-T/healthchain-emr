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

// Function to fix all remaining errors comprehensively
function fixAllErrors(content, filePath) {
  let fixed = content;
  
  // Fix malformed error.message replacements - more comprehensive patterns
  const errorPatterns = [
    /error\.Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? response\.data : \[\]: \[\] : \[\]\.message/g,
    /error\.Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? response\.data : \[\]: \[\] : \[\]\.message/g,
    /error\.Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? Array\.isArray\(response\.data\) \? response\.data : \[\]: \[\] : \[\]\.message/g
  ];
  
  errorPatterns.forEach(pattern => {
    fixed = fixed.replace(pattern, '(error as any).message');
  });
  
  // Fix property name mismatches - more comprehensive
  fixed = fixed.replace(/\.createdAt\b/g, '.created_at');
  fixed = fixed.replace(/\.updatedAt\b/g, '.updated_at');
  fixed = fixed.replace(/\.visitDate\b/g, '.visit_date');
  fixed = fixed.replace(/\.patientName\b/g, '.patient_name');
  
  // Fix birth date property issues - replace with birthDate parsing
  if (filePath.includes('appointments/page.tsx') || filePath.includes('documents/page.tsx') || 
      filePath.includes('lab-result/page.tsx') || filePath.includes('pharmacy/page.tsx')) {
    
    // Replace birthYear, birthMonth, birthDay with birthDate parsing
    fixed = fixed.replace(/patient\.birthYear/g, 'patient.birthDate ? new Date(patient.birthDate).getFullYear() : undefined');
    fixed = fixed.replace(/patient\.birthMonth/g, 'patient.birthDate ? new Date(patient.birthDate).getMonth() + 1 : undefined');
    fixed = fixed.replace(/patient\.birthDay/g, 'patient.birthDate ? new Date(patient.birthDate).getDate() : undefined');
    
    // Fix the object property assignments
    fixed = fixed.replace(/birth_year: patient\.birthDate \? new Date\(patient\.birthDate\)\.getFullYear\(\) : undefined,/g, 'birth_year: patient.birthDate ? new Date(patient.birthDate).getFullYear() : undefined,');
    fixed = fixed.replace(/birth_month: patient\.birthDate \? new Date\(patient\.birthDate\)\.getMonth\(\) \+ 1 : undefined,/g, 'birth_month: patient.birthDate ? new Date(patient.birthDate).getMonth() + 1 : undefined,');
    fixed = fixed.replace(/birth_day: patient\.birthDate \? new Date\(patient\.birthDate\)\.getDate\(\) : undefined/g, 'birth_day: patient.birthDate ? new Date(patient.birthDate).getDate() : undefined');
  }
  
  // Fix dashboard specific issues
  if (filePath.includes('dashboard/page.tsx')) {
    // Fix getThailandTime usage
    fixed = fixed.replace(/getThailandTime\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, 'new Date().toISOString().split(\'T\')[0]');
    
    // Fix union type issues with proper type guards
    fixed = fixed.replace(/patient\.role === 'patient'/g, "'role' in patient && patient.role === 'patient'");
    fixed = fixed.replace(/patient\.created_at && patient\.created_at\.startsWith\(today\)/g, "'created_at' in patient && patient.created_at && typeof patient.created_at === 'string' && patient.created_at.startsWith(today)");
    fixed = fixed.replace(/patient\.isActive/g, "'isActive' in patient && patient.isActive");
    fixed = fixed.replace(/visit\.status === 'in_progress'/g, "'status' in visit && visit.status === 'in_progress'");
    fixed = fixed.replace(/visit\.visitDate && visit\.visitDate\.startsWith\(today\)/g, "'visit_date' in visit && visit.visit_date && typeof visit.visit_date === 'string' && visit.visit_date.startsWith(today)");
    fixed = fixed.replace(/visit\.created_at && visit\.created_at\.startsWith\(today\)/g, "'created_at' in visit && visit.created_at && typeof visit.created_at === 'string' && visit.created_at.startsWith(today)");
    fixed = fixed.replace(/visit\.status === 'completed'/g, "'status' in visit && visit.status === 'completed'");
    fixed = fixed.replace(/appointment\.status === 'scheduled'/g, "'status' in appointment && appointment.status === 'scheduled'");
    fixed = fixed.replace(/appointment\.status === 'confirmed'/g, "'status' in appointment && appointment.status === 'confirmed'");
    
    // Fix the queue data type issues
    fixed = fixed.replace(/const queueData: QueueItem\[\] = visitsData/g, 'const queueData: QueueItem[] = visitsData');
    fixed = fixed.replace(/\.filter\(\(item\): item is QueueItem => item !== null\)/g, '.filter((item): item is QueueItem => item !== null)');
    
    // Fix priority type issues
    fixed = fixed.replace(/priority: visit\.priority \|\| 'normal'/g, "priority: (visit.priority === 'emergency' ? 'urgent' : visit.priority) || 'normal'");
  }
  
  // Fix API route issues
  if (filePath.includes('api/external-requesters/register/route.ts')) {
    // Add fallback properties
    fixed = fixed.replace(/username: body\.username,/g, 'username: body.username || body.username,');
    fixed = fixed.replace(/firstNameThai: body\.firstNameThai \|\| body\.primaryContactFirstNameThai,/g, 
      'firstNameThai: body.firstNameThai || body.primaryContactFirstNameThai || body.first_nameThai,');
    fixed = fixed.replace(/lastNameThai: body\.lastNameThai \|\| body\.primaryContactLastNameThai,/g, 
      'lastNameThai: body.lastNameThai || body.primaryContactLastNameThai || body.last_nameThai,');
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
  
  // Fix useAPIClient hook issues
  if (filePath.includes('useAPIClient.ts')) {
    fixed = fixed.replace(/Omit<User, "id" \| "created_at" \| "updated_at">/g, 'Omit<User, "id" | "createdAt" | "updatedAt">');
  }
  
  // Fix Mail icon title prop issue
  if (filePath.includes('admin/external-requesters/page.tsx')) {
    fixed = fixed.replace(/<Mail className="h-4 w-4 text-green-500 ml-2" title="ยืนยันอีเมลแล้ว" \/>/g, '<Mail className="h-4 w-4 text-green-500 ml-2" />');
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
      
      // Apply all fixes
      content = fixAllErrors(content, file);
      
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

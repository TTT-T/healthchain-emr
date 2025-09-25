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
      { from: /\.visit_number/g, to: '.visitNumber' }
    ];
    
    propertyMappings.forEach(mapping => {
      if (mapping.from.test(content)) {
        content = content.replace(mapping.from, mapping.to);
        modified = true;
      }
    });
    
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
console.log('🔧 Starting to fix all TypeScript issues (v2)...');

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

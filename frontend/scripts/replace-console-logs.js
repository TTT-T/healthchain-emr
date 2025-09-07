#!/usr/bin/env node

/**
 * Script to replace console.log statements with logger calls
 * Run this during production build to clean up console statements
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to process
const patterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
  '!src/**/*.test.ts',
  '!src/**/*.test.tsx',
  '!src/**/*.spec.ts',
  '!src/**/*.spec.tsx',
  '!src/__tests__/**',
  '!src/**/tests/**'
];

// Console replacements
const replacements = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.debug('
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info('
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn('
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error('
  }
];

// Import statement to add
const loggerImport = "import { logger } from '@/lib/logger';";

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if any console statements exist
    const hasConsole = /console\.(log|info|warn|error)\(/g.test(content);
    
    if (hasConsole) {
      // Add logger import if not present
      if (!content.includes("from '@/lib/logger'") && !content.includes('logger')) {
        // Find the position after the last import
        const importRegex = /^import .+;$/gm;
        const imports = content.match(importRegex);
        if (imports) {
          const lastImport = imports[imports.length - 1];
          const lastImportIndex = content.lastIndexOf(lastImport);
          const insertPosition = lastImportIndex + lastImport.length;
          content = content.slice(0, insertPosition) + '\n' + loggerImport + content.slice(insertPosition);
          modified = true;
        }
      }
      
      // Apply replacements
      replacements.forEach(({ pattern, replacement }) => {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Processed: ${filePath}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🧹 Replacing console statements with logger calls...\n');
  
  let totalFiles = 0;
  let processedFiles = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    files.forEach(file => {
      totalFiles++;
      if (processFile(file)) {
        processedFiles++;
      }
    });
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files modified: ${processedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - processedFiles}`);
  
  if (processedFiles > 0) {
    console.log('\n✨ Console statements have been replaced with logger calls!');
    console.log('   Logger is automatically disabled in production builds.');
  } else {
    console.log('\n✅ No console statements found to replace.');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, main };

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Bundle Analysis Configuration
const ANALYSIS_CONFIG = {
  outputDir: 'bundle-analysis',
  thresholds: {
    maxBundleSize: 500000, // 500KB
    maxChunkSize: 250000,  // 250KB
    maxAssetSize: 100000,  // 100KB
    maxGzipSize: 100000    // 100KB gzipped
  }
};

// Results storage
const bundleResults = {
  timestamp: new Date().toISOString(),
  buildInfo: {},
  bundles: [],
  chunks: [],
  assets: [],
  recommendations: []
};

console.log('🚀 Starting Bundle Size Analysis...');
console.log('');

async function analyzeBundleSize() {
  try {
    // Build the application
    console.log('🔨 Building application...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed');
    console.log('');

    // Analyze .next directory
    const nextDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextDir)) {
      console.log('📊 Analyzing Next.js build...');
      analyzeNextBuild(nextDir);
    }

    // Analyze public directory
    const publicDir = path.join(process.cwd(), 'public');
    if (fs.existsSync(publicDir)) {
      console.log('📁 Analyzing public assets...');
      analyzePublicAssets(publicDir);
    }

    // Generate recommendations
    generateBundleRecommendations();

    // Generate report
    generateBundleReport();

  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
  }
}

function analyzeNextBuild(nextDir) {
  const staticDir = path.join(nextDir, 'static');
  
  if (fs.existsSync(staticDir)) {
    // Analyze chunks
    const chunksDir = path.join(staticDir, 'chunks');
    if (fs.existsSync(chunksDir)) {
      analyzeDirectory(chunksDir, 'chunk', bundleResults.chunks);
    }

    // Analyze CSS
    const cssDir = path.join(staticDir, 'css');
    if (fs.existsSync(cssDir)) {
      analyzeDirectory(cssDir, 'css', bundleResults.assets);
    }

    // Analyze JS
    const jsDir = path.join(staticDir, 'js');
    if (fs.existsSync(jsDir)) {
      analyzeDirectory(jsDir, 'js', bundleResults.assets);
    }
  }

  // Analyze pages
  const pagesDir = path.join(nextDir, 'server', 'pages');
  if (fs.existsSync(pagesDir)) {
    analyzePages(pagesDir);
  }
}

function analyzeDirectory(dir, type, results) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    if (file.isFile()) {
      const filePath = path.join(dir, file.name);
      const stats = fs.statSync(filePath);
      const size = stats.size;
      const gzipSize = getGzipSize(filePath);
      
      const fileInfo = {
        name: file.name,
        type: type,
        size: size,
        sizeKB: Math.round(size / 1024),
        gzipSize: gzipSize,
        gzipSizeKB: Math.round(gzipSize / 1024),
        path: filePath
      };
      
      results.push(fileInfo);
    } else if (file.isDirectory()) {
      analyzeDirectory(path.join(dir, file.name), type, results);
    }
  });
}

function analyzePages(pagesDir) {
  const pages = fs.readdirSync(pagesDir, { withFileTypes: true });
  
  pages.forEach(page => {
    if (page.isFile() && page.name.endsWith('.js')) {
      const pagePath = path.join(pagesDir, page.name);
      const stats = fs.statSync(pagePath);
      const size = stats.size;
      const gzipSize = getGzipSize(pagePath);
      
      bundleResults.bundles.push({
        name: page.name,
        type: 'page',
        size: size,
        sizeKB: Math.round(size / 1024),
        gzipSize: gzipSize,
        gzipSizeKB: Math.round(gzipSize / 1024),
        path: pagePath
      });
    }
  });
}

function analyzePublicAssets(publicDir) {
  const files = fs.readdirSync(publicDir, { withFileTypes: true });
  
  files.forEach(file => {
    if (file.isFile()) {
      const filePath = path.join(publicDir, file.name);
      const stats = fs.statSync(filePath);
      const size = stats.size;
      const gzipSize = getGzipSize(filePath);
      
      bundleResults.assets.push({
        name: file.name,
        type: 'public',
        size: size,
        sizeKB: Math.round(size / 1024),
        gzipSize: gzipSize,
        gzipSizeKB: Math.round(gzipSize / 1024),
        path: filePath
      });
    }
  });
}

async function getGzipSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const zlib = await import('zlib');
    const gzipped = zlib.gzipSync(content);
    return gzipped.length;
  } catch {
    return 0;
  }
}

function generateBundleRecommendations() {
  const allFiles = [
    ...bundleResults.bundles,
    ...bundleResults.chunks,
    ...bundleResults.assets
  ];

  // Check for large files
  const largeFiles = allFiles.filter(file => file.size > ANALYSIS_CONFIG.thresholds.maxAssetSize);
  if (largeFiles.length > 0) {
    bundleResults.recommendations.push({
      type: 'warning',
      message: `Found ${largeFiles.length} large files (>${ANALYSIS_CONFIG.thresholds.maxAssetSize / 1024}KB)`,
      files: largeFiles.map(f => f.name)
    });
  }

  // Check for large chunks
  const largeChunks = bundleResults.chunks.filter(chunk => chunk.size > ANALYSIS_CONFIG.thresholds.maxChunkSize);
  if (largeChunks.length > 0) {
    bundleResults.recommendations.push({
      type: 'warning',
      message: `Found ${largeChunks.length} large chunks (>${ANALYSIS_CONFIG.thresholds.maxChunkSize / 1024}KB)`,
      files: largeChunks.map(c => c.name)
    });
  }

  // Check for large bundles
  const largeBundles = bundleResults.bundles.filter(bundle => bundle.size > ANALYSIS_CONFIG.thresholds.maxBundleSize);
  if (largeBundles.length > 0) {
    bundleResults.recommendations.push({
      type: 'error',
      message: `Found ${largeBundles.length} large bundles (>${ANALYSIS_CONFIG.thresholds.maxBundleSize / 1024}KB)`,
      files: largeBundles.map(b => b.name)
    });
  }

  // Check for unoptimized images
  const imageFiles = bundleResults.assets.filter(asset => 
    /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(asset.name)
  );
  const unoptimizedImages = imageFiles.filter(img => img.size > 50000); // 50KB
  if (unoptimizedImages.length > 0) {
    bundleResults.recommendations.push({
      type: 'info',
      message: `Found ${unoptimizedImages.length} unoptimized images`,
      files: unoptimizedImages.map(img => img.name)
    });
  }

  // General recommendations
  bundleResults.recommendations.push({
    type: 'info',
    message: 'Consider implementing code splitting for better performance',
    files: []
  });

  bundleResults.recommendations.push({
    type: 'info',
    message: 'Enable gzip compression on server',
    files: []
  });

  bundleResults.recommendations.push({
    type: 'info',
    message: 'Use dynamic imports for large components',
    files: []
  });
}

function generateBundleReport() {
  console.log('📊 BUNDLE SIZE ANALYSIS REPORT');
  console.log('='.repeat(50));

  const allFiles = [
    ...bundleResults.bundles,
    ...bundleResults.chunks,
    ...bundleResults.assets
  ];

  if (allFiles.length === 0) {
    console.log('❌ No files found to analyze');
    return;
  }

  // Calculate totals
  const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);
  const totalGzipSize = allFiles.reduce((sum, file) => sum + file.gzipSize, 0);
  const totalFiles = allFiles.length;

  console.log(`📦 Total Files: ${totalFiles}`);
  console.log(`📊 Total Size: ${Math.round(totalSize / 1024)}KB`);
  console.log(`🗜️  Total Gzipped: ${Math.round(totalGzipSize / 1024)}KB`);
  console.log(`📈 Compression Ratio: ${Math.round((1 - totalGzipSize / totalSize) * 100)}%`);
  console.log('');

  // Show largest files
  console.log('🏆 LARGEST FILES:');
  allFiles
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}: ${file.sizeKB}KB (${file.gzipSizeKB}KB gzipped)`);
    });
  console.log('');

  // Show recommendations
  console.log('💡 RECOMMENDATIONS:');
  bundleResults.recommendations.forEach((rec) => {
    const icon = rec.type === 'error' ? '❌' : rec.type === 'warning' ? '⚠️' : '💡';
    console.log(`${icon} ${rec.message}`);
    if (rec.files.length > 0) {
      rec.files.slice(0, 3).forEach(file => {
        console.log(`   - ${file}`);
      });
      if (rec.files.length > 3) {
        console.log(`   ... and ${rec.files.length - 3} more`);
      }
    }
  });
  console.log('');

  // Performance targets
  console.log('🎯 BUNDLE SIZE TARGETS:');
  console.log(`   📦 Max Bundle Size: ${ANALYSIS_CONFIG.thresholds.maxBundleSize / 1024}KB`);
  console.log(`   🧩 Max Chunk Size: ${ANALYSIS_CONFIG.thresholds.maxChunkSize / 1024}KB`);
  console.log(`   📄 Max Asset Size: ${ANALYSIS_CONFIG.thresholds.maxAssetSize / 1024}KB`);
  console.log(`   🗜️  Max Gzip Size: ${ANALYSIS_CONFIG.thresholds.maxGzipSize / 1024}KB`);
  console.log('');

  console.log('📄 Full results saved to bundle-analysis-results.json');

  // Save results to file
  fs.writeFileSync(
    'bundle-analysis-results.json',
    JSON.stringify(bundleResults, null, 2)
  );
}

// Run the bundle analysis
analyzeBundleSize().catch(console.error);

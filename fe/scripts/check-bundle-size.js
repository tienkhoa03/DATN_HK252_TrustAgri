#!/usr/bin/env node

/**
 * Bundle Size Checker (NFR-C01)
 *
 * Hard limit ZMP: 20MB. Project budget: 18MB (buffer 2MB cho assets late-add).
 * Override qua env: BUNDLE_LIMIT_MB=20 để check sát ZMP limit.
 *
 * Exit codes:
 *   0 — within budget
 *   1 — exceeds budget OR build dir missing
 */

const fs = require('fs');
const path = require('path');

const BUNDLE_SIZE_LIMIT_MB = parseInt(process.env.BUNDLE_LIMIT_MB || '18', 10);
const BUNDLE_HARD_LIMIT_MB = 20; // ZMP platform limit
const BUNDLE_SIZE_LIMIT_BYTES = BUNDLE_SIZE_LIMIT_MB * 1024 * 1024;
const BUNDLE_HARD_LIMIT_BYTES = BUNDLE_HARD_LIMIT_MB * 1024 * 1024;
const BUILD_DIR = path.join(__dirname, '../www');

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get directory size recursively
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) {
    return totalSize;
  }
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  });
  
  return totalSize;
}

/**
 * Get file sizes in directory
 */
function getFileSizes(dirPath) {
  const files = [];
  
  if (!fs.existsSync(dirPath)) {
    return files;
  }
  
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      files.push(...getFileSizes(itemPath));
    } else {
      files.push({
        path: path.relative(BUILD_DIR, itemPath),
        size: stats.size,
      });
    }
  });
  
  return files;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Checking bundle size...\n');
  
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }
  
  // Get total size
  const totalSize = getDirectorySize(BUILD_DIR);
  const percentage = (totalSize / BUNDLE_SIZE_LIMIT_BYTES) * 100;
  
  console.log('📦 Bundle Size Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`Total Size: ${formatBytes(totalSize)}`);
  console.log(`Project Budget: ${formatBytes(BUNDLE_SIZE_LIMIT_BYTES)} (buffer dưới ZMP ${BUNDLE_HARD_LIMIT_MB}MB)`);
  console.log(`Usage: ${percentage.toFixed(2)}%\n`);
  
  // Get largest files
  const files = getFileSizes(BUILD_DIR);
  files.sort((a, b) => b.size - a.size);
  
  console.log('📄 Largest Files (Top 10):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  files.slice(0, 10).forEach((file, index) => {
    console.log(`${index + 1}. ${file.path}`);
    console.log(`   ${formatBytes(file.size)}\n`);
  });
  
  // Check against project budget (hard fail)
  if (totalSize > BUNDLE_SIZE_LIMIT_BYTES) {
    console.error(`❌ Bundle size vượt budget ${BUNDLE_SIZE_LIMIT_MB}MB!`);
    if (totalSize > BUNDLE_HARD_LIMIT_BYTES) {
      console.error(`   ⚠️  CŨNG VƯỢT ZMP hard limit ${BUNDLE_HARD_LIMIT_MB}MB — KHÔNG deploy được.`);
    } else {
      console.error(`   (vẫn dưới ZMP hard limit ${BUNDLE_HARD_LIMIT_MB}MB nhưng đã hết buffer.)`);
    }
    console.error(`   Tối ưu bundle: code-split heavy screen, lazy-load lib lớn, kiểm tra duplicate deps.\n`);
    process.exit(1);
  } else if (percentage > 90) {
    console.warn(`⚠️  Bundle size at ${percentage.toFixed(2)}% of budget.`);
    console.warn(`   Cân nhắc tối ưu để giữ buffer cho assets thêm sau.\n`);
  } else {
    console.log(`✅ Bundle size within ${BUNDLE_SIZE_LIMIT_MB}MB budget (ZMP hard limit ${BUNDLE_HARD_LIMIT_MB}MB).\n`);
  }
  
  // Group by file type
  const byType = {};
  files.forEach(file => {
    const ext = path.extname(file.path) || 'other';
    if (!byType[ext]) {
      byType[ext] = { count: 0, size: 0 };
    }
    byType[ext].count++;
    byType[ext].size += file.size;
  });
  
  console.log('📊 Size by File Type:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  Object.entries(byType)
    .sort((a, b) => b[1].size - a[1].size)
    .forEach(([ext, data]) => {
      const typePercentage = (data.size / totalSize) * 100;
      console.log(`${ext.padEnd(10)} ${formatBytes(data.size).padEnd(12)} (${typePercentage.toFixed(1)}%) - ${data.count} files`);
    });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run
try {
  main();
} catch (error) {
  console.error('❌ Error checking bundle size:', error.message);
  process.exit(1);
}

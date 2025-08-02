#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Deployment Optimization Script
 * Reduces app size by removing duplicates and optimizing assets
 */

const DIST_DIR = path.join(__dirname, '../dist/public');
const PUBLIC_DIR = path.join(__dirname, '../public');

// Files to keep for deployment
const ESSENTIAL_FILES = [
  'index.html',
  'favicon.ico',
  'sw.js',
  'placeholder-property.jpg'
];

// Image extensions to optimize
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function getFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    return null;
  }
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function getAllFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        getAllFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}`);
  }
  
  return fileList;
}

function findDuplicateImages() {
  console.log('🔍 Finding duplicate images...');
  
  const imageFiles = getAllFiles(DIST_DIR).filter(file => 
    IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase())
  );
  
  const hashMap = new Map();
  const duplicates = [];
  let totalSaved = 0;
  
  imageFiles.forEach(file => {
    const hash = getFileHash(file);
    const size = getFileSize(file);
    
    if (hash) {
      if (hashMap.has(hash)) {
        // Found duplicate
        const original = hashMap.get(hash);
        duplicates.push({
          original: original.path,
          duplicate: file,
          size: size
        });
        totalSaved += size;
      } else {
        hashMap.set(hash, { path: file, size: size });
      }
    }
  });
  
  console.log(`Found ${duplicates.length} duplicate images`);
  console.log(`Potential savings: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
  
  return duplicates;
}

function removeDuplicates(duplicates) {
  console.log('🗑️  Removing duplicate images...');
  
  let removedCount = 0;
  let savedBytes = 0;
  
  duplicates.forEach(({ duplicate, size }) => {
    try {
      fs.unlinkSync(duplicate);
      removedCount++;
      savedBytes += size;
      console.log(`Removed: ${path.basename(duplicate)} (${(size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.warn(`Could not remove ${duplicate}: ${error.message}`);
    }
  });
  
  console.log(`✅ Removed ${removedCount} duplicate files`);
  console.log(`💾 Saved ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
  
  return { removedCount, savedBytes };
}

function removeUnnecessaryFiles() {
  console.log('🧹 Removing unnecessary files...');
  
  const unnecessaryPatterns = [
    /\.md$/,           // Markdown files
    /-temp\./,         // Temporary files
    /debug\.html$/,    // Debug files
    /favicon-preview\.html$/, // Preview files
    /\.map$/,          // Source maps (optional for production)
  ];
  
  const allFiles = getAllFiles(DIST_DIR);
  let removedCount = 0;
  let savedBytes = 0;
  
  allFiles.forEach(file => {
    const fileName = path.basename(file);
    const shouldRemove = unnecessaryPatterns.some(pattern => pattern.test(fileName));
    
    if (shouldRemove && !ESSENTIAL_FILES.includes(fileName)) {
      try {
        const size = getFileSize(file);
        fs.unlinkSync(file);
        removedCount++;
        savedBytes += size;
        console.log(`Removed: ${fileName} (${(size / 1024).toFixed(1)} KB)`);
      } catch (error) {
        console.warn(`Could not remove ${file}: ${error.message}`);
      }
    }
  });
  
  console.log(`✅ Removed ${removedCount} unnecessary files`);
  console.log(`💾 Saved ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
  
  return { removedCount, savedBytes };
}

function optimizeAssetStructure() {
  console.log('📁 Optimizing asset structure...');
  
  // Remove empty directories
  function removeEmptyDirs(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      if (files.length === 0) {
        fs.rmdirSync(dir);
        console.log(`Removed empty directory: ${path.basename(dir)}`);
        return true;
      }
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          removeEmptyDirs(filePath);
        }
      });
      
      // Check again after removing subdirectories
      const remainingFiles = fs.readdirSync(dir);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(dir);
        console.log(`Removed empty directory: ${path.basename(dir)}`);
        return true;
      }
    } catch (error) {
      // Directory might not exist or already removed
    }
    
    return false;
  }
  
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (fs.existsSync(assetsDir)) {
    removeEmptyDirs(assetsDir);
  }
}

function generateOptimizationReport() {
  console.log('\n📊 Generating optimization report...');
  
  const distSize = getAllFiles(DIST_DIR).reduce((total, file) => {
    return total + getFileSize(file);
  }, 0);
  
  const fileCount = getAllFiles(DIST_DIR).length;
  
  console.log('='.repeat(50));
  console.log('🚀 DEPLOYMENT OPTIMIZATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`📦 Final dist size: ${(distSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📄 Total files: ${fileCount}`);
  console.log(`🎯 Ready for deployment!`);
  console.log('='.repeat(50));
  
  return { distSize, fileCount };
}

async function main() {
  console.log('🚀 Starting deployment optimization...\n');
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist/public directory not found. Run npm run build:client first.');
    process.exit(1);
  }
  
  try {
    // Step 1: Find and remove duplicate images
    const duplicates = findDuplicateImages();
    const duplicateStats = removeDuplicates(duplicates);
    
    console.log('');
    
    // Step 2: Remove unnecessary files
    const cleanupStats = removeUnnecessaryFiles();
    
    console.log('');
    
    // Step 3: Optimize directory structure
    optimizeAssetStructure();
    
    console.log('');
    
    // Step 4: Generate final report
    const finalStats = generateOptimizationReport();
    
    // Summary
    const totalSaved = duplicateStats.savedBytes + cleanupStats.savedBytes;
    console.log(`\n💡 Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📈 Size reduction: ${((totalSaved / (finalStats.distSize + totalSaved)) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Optimization failed:', error.message);
    process.exit(1);
  }
}

// Run if this is the main module
main();

export { main };
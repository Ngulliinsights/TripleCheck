#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist/public');

/**
 * Aggressive optimization for deployment
 * Removes large unnecessary assets and optimizes for production
 */

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

function removeUnusedAssets() {
  console.log('🗑️  Removing unused large assets...');
  
  const assetsToRemove = [
    // Remove large property images that aren't essential
    /Commercial\//,
    /Land\//,
    /Residential\//,
    // Remove large individual images over 1MB
    /confident-entrepreneur-looking-camera-with-arms-folded-smiling\.jpg$/,
    /nir-himi--i87qT8TJ34-unsplash\.jpg$/,
    /gautier-pfeiffer-WPapb9IqRKw-unsplash\.jpg$/,
    /caroline-badran-nf7iKpydFR4-unsplash\.jpg$/,
    // Remove duplicate blog images (keep webp, remove jpg)
    /blog[123]\.jpg$/,
    // Remove large unsplash images
    /.*-unsplash\.jpg$/,
    // Remove large depositphotos
    /depositphotos_.*\.jpg$/,
  ];
  
  const allFiles = getAllFiles(DIST_DIR);
  let removedCount = 0;
  let savedBytes = 0;
  
  allFiles.forEach(file => {
    const relativePath = path.relative(DIST_DIR, file);
    const size = getFileSize(file);
    
    // Check if file matches removal patterns
    const shouldRemove = assetsToRemove.some(pattern => pattern.test(relativePath));
    
    // Also remove files larger than 2MB
    const isLargeFile = size > 2 * 1024 * 1024;
    
    if (shouldRemove || isLargeFile) {
      try {
        fs.unlinkSync(file);
        removedCount++;
        savedBytes += size;
        console.log(`Removed: ${relativePath} (${(size / 1024 / 1024).toFixed(2)} MB)`);
      } catch (error) {
        console.warn(`Could not remove ${file}: ${error.message}`);
      }
    }
  });
  
  console.log(`✅ Removed ${removedCount} large/unused files`);
  console.log(`💾 Saved ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
  
  return { removedCount, savedBytes };
}

function keepOnlyEssentialAssets() {
  console.log('🎯 Keeping only essential assets...');
  
  const essentialAssets = [
    'index.html',
    'sw.js',
    'placeholder-property.jpg',
    // Essential favicons
    'favicon.svg',
    'Artmark.svg',
    'TripleCheck.ico',
    // Essential images
    'hero-bg.webp', // Keep webp version
    'fun.png',
    // Blog webp images (smaller than jpg)
    'blog1.webp',
    'blog2.webp', 
    'blog3.webp',
    // Customer images (small)
    'customer1.png',
    'customer2.png',
    'customer3.png',
    // Essential config files
    'site.webmanifest',
    'browserconfig.xml',
  ];
  
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) return { removedCount: 0, savedBytes: 0 };
  
  const assetFiles = fs.readdirSync(assetsDir);
  let removedCount = 0;
  let savedBytes = 0;
  
  assetFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile() && !essentialAssets.includes(file)) {
      const size = getFileSize(filePath);
      try {
        fs.unlinkSync(filePath);
        removedCount++;
        savedBytes += size;
        console.log(`Removed non-essential: ${file} (${(size / 1024).toFixed(1)} KB)`);
      } catch (error) {
        console.warn(`Could not remove ${file}: ${error.message}`);
      }
    }
  });
  
  console.log(`✅ Removed ${removedCount} non-essential assets`);
  console.log(`💾 Saved ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
  
  return { removedCount, savedBytes };
}

function removeEmptyDirectories(dir) {
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
        removeEmptyDirectories(filePath);
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

function generateFinalReport() {
  console.log('\n📊 Final optimization report...');
  
  const allFiles = getAllFiles(DIST_DIR);
  const totalSize = allFiles.reduce((total, file) => total + getFileSize(file), 0);
  
  // Show largest remaining files
  const fileSizes = allFiles.map(file => ({
    path: path.relative(DIST_DIR, file),
    size: getFileSize(file)
  })).sort((a, b) => b.size - a.size).slice(0, 10);
  
  console.log('\n🔍 Largest remaining files:');
  fileSizes.forEach(({ path: filePath, size }) => {
    console.log(`  ${filePath}: ${(size / 1024 / 1024).toFixed(2)} MB`);
  });
  
  console.log(`\n${  '='.repeat(60)}`);
  console.log('🚀 AGGRESSIVE OPTIMIZATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`📦 Final optimized size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📄 Total files: ${allFiles.length}`);
  console.log(`🎯 Ready for deployment!`);
  console.log('='.repeat(60));
  
  return { totalSize, fileCount: allFiles.length };
}

async function main() {
  console.log('🚀 Starting aggressive deployment optimization...\n');
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist/public directory not found. Run npm run build:client first.');
    process.exit(1);
  }
  
  try {
    // Get initial size
    const initialFiles = getAllFiles(DIST_DIR);
    const initialSize = initialFiles.reduce((total, file) => total + getFileSize(file), 0);
    console.log(`📊 Initial size: ${(initialSize / 1024 / 1024).toFixed(2)} MB (${initialFiles.length} files)\n`);
    
    // Step 1: Remove unused large assets
    const unusedStats = removeUnusedAssets();
    console.log('');
    
    // Step 2: Keep only essential assets
    const essentialStats = keepOnlyEssentialAssets();
    console.log('');
    
    // Step 3: Clean up empty directories
    console.log('🧹 Cleaning up empty directories...');
    const assetsDir = path.join(DIST_DIR, 'assets');
    if (fs.existsSync(assetsDir)) {
      removeEmptyDirectories(assetsDir);
    }
    console.log('');
    
    // Step 4: Generate final report
    const finalStats = generateFinalReport();
    
    // Summary
    const totalSaved = initialSize - finalStats.totalSize;
    const reductionPercent = (totalSaved / initialSize) * 100;
    
    console.log(`\n💡 Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📈 Size reduction: ${reductionPercent.toFixed(1)}%`);
    console.log(`🎯 Deployment ready: ${finalStats.totalSize < 100 * 1024 * 1024 ? '✅' : '⚠️'} ${finalStats.totalSize < 100 * 1024 * 1024 ? 'Under 100MB' : 'Still large'}`);
    
  } catch (error) {
    console.error('❌ Aggressive optimization failed:', error.message);
    process.exit(1);
  }
}

// Run the optimization
main();
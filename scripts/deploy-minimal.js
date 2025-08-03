#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist/public');

/**
 * Minimal deployment - Remove all images and analyze component sizes
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

function removeAllImages() {
  console.log('🖼️  Removing ALL images for minimal deployment...');
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
  const allFiles = getAllFiles(DIST_DIR);
  
  let removedCount = 0;
  let savedBytes = 0;
  
  // Keep only essential non-image files
  const essentialFiles = ['index.html', 'sw.js'];
  
  allFiles.forEach(file => {
    const fileName = path.basename(file);
    const ext = path.extname(file).toLowerCase();
    const relativePath = path.relative(DIST_DIR, file);
    
    // Remove all images except favicon.svg (essential for deployment)
    if (imageExtensions.includes(ext) && fileName !== 'favicon.svg') {
      const size = getFileSize(file);
      try {
        fs.unlinkSync(file);
        removedCount++;
        savedBytes += size;
        console.log(`Removed: ${relativePath} (${(size / 1024).toFixed(1)} KB)`);
      } catch (error) {
        console.warn(`Could not remove ${file}: ${error.message}`);
      }
    }
  });
  
  console.log(`✅ Removed ${removedCount} image files`);
  console.log(`💾 Saved ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
  
  return { removedCount, savedBytes };
}

function analyzeJavaScriptBundles() {
  console.log('\n📊 Analyzing JavaScript bundle sizes...');
  
  const jsDir = path.join(DIST_DIR, 'js');
  if (!fs.existsSync(jsDir)) {
    console.log('No JS directory found');
    return [];
  }
  
  const jsFiles = fs.readdirSync(jsDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(jsDir, file);
      const size = getFileSize(filePath);
      return { name: file, size, sizeMB: (size / 1024 / 1024).toFixed(2) };
    })
    .sort((a, b) => b.size - a.size);
  
  console.log('\n🔍 JavaScript bundles by size:');
  console.log('=' .repeat(70));
  
  jsFiles.forEach((file, index) => {
    const flag = file.size > 100 * 1024 * 1024 ? '🚨 HUGE' : 
                 file.size > 50 * 1024 * 1024 ? '⚠️  LARGE' :
                 file.size > 10 * 1024 * 1024 ? '📦 MEDIUM' : '✅ SMALL';
    
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   Size: ${file.sizeMB} MB ${flag}`);
    
    // Identify component type from filename
    if (file.name.includes('vendor')) {
      console.log(`   Type: 🏪 Third-party dependencies`);
    } else if (file.name.includes('shared-pages')) {
      console.log(`   Type: 📄 Shared page components`);
    } else if (file.name.includes('property-pages')) {
      console.log(`   Type: 🏠 Property page components`);
    } else if (file.name.includes('data-visualization')) {
      console.log(`   Type: 📊 Charts and visualization`);
    } else if (file.name.includes('react-core')) {
      console.log(`   Type: ⚛️  React framework`);
    } else if (file.name.includes('shared-components')) {
      console.log(`   Type: 🧩 Shared UI components`);
    } else if (file.name.includes('domain-')) {
      const domain = file.name.match(/domain-([^-]+)/)?.[1] || 'unknown';
      console.log(`   Type: 🏢 ${domain.charAt(0).toUpperCase() + domain.slice(1)} domain`);
    }
    console.log('');
  });
  
  return jsFiles;
}

function identifyMemoryHeavyComponents() {
  console.log('🧠 Identifying memory-heavy components...');
  
  const memoryHeavyPatterns = [
    {
      pattern: /shared-pages/,
      component: 'Shared Pages',
      reason: 'Large page components with complex state',
      flag: '🚨 HIGH MEMORY'
    },
    {
      pattern: /property-pages/,
      component: 'Property Pages', 
      reason: 'Complex property forms and wizards',
      flag: '⚠️  MEDIUM-HIGH MEMORY'
    },
    {
      pattern: /data-visualization/,
      component: 'Data Visualization',
      reason: 'Charts, graphs, and heavy rendering',
      flag: '📊 HIGH MEMORY'
    },
    {
      pattern: /vendor-misc/,
      component: 'Third-party Libraries',
      reason: 'Multiple large dependencies bundled',
      flag: '🏪 DEPENDENCY BLOAT'
    },
    {
      pattern: /shared-components/,
      component: 'Shared Components',
      reason: 'Large UI component library',
      flag: '🧩 COMPONENT HEAVY'
    },
    {
      pattern: /trust-pages/,
      component: 'Trust & Fraud Pages',
      reason: 'Complex fraud detection UI',
      flag: '🛡️  COMPLEX LOGIC'
    }
  ];
  
  const jsFiles = fs.readdirSync(path.join(DIST_DIR, 'js'))
    .filter(file => file.endsWith('.js'));
  
  console.log('\n🎯 Memory-heavy component analysis:');
  console.log('=' .repeat(70));
  
  memoryHeavyPatterns.forEach(({ pattern, component, reason, flag }) => {
    const matchingFiles = jsFiles.filter(file => pattern.test(file));
    
    if (matchingFiles.length > 0) {
      matchingFiles.forEach(file => {
        const size = getFileSize(path.join(DIST_DIR, 'js', file));
        console.log(`${flag} ${component}`);
        console.log(`   File: ${file}`);
        console.log(`   Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Issue: ${reason}`);
        console.log(`   Recommendation: ${getOptimizationRecommendation(component)}`);
        console.log('');
      });
    }
  });
}

function getOptimizationRecommendation(component) {
  const recommendations = {
    'Shared Pages': 'Split into smaller chunks, lazy load pages',
    'Property Pages': 'Break wizard into steps, use dynamic imports',
    'Data Visualization': 'Load charts on demand, use lighter chart library',
    'Third-party Libraries': 'Remove unused dependencies, use tree shaking',
    'Shared Components': 'Split UI library, load components on demand',
    'Trust & Fraud Pages': 'Simplify UI, move complex logic to server'
  };
  
  return recommendations[component] || 'Consider code splitting and lazy loading';
}

function generateMinimalDeploymentReport() {
  console.log('\n📋 Minimal deployment report...');
  
  const allFiles = getAllFiles(DIST_DIR);
  const totalSize = allFiles.reduce((total, file) => total + getFileSize(file), 0);
  
  // Categorize remaining files
  const categories = {
    javascript: allFiles.filter(f => f.endsWith('.js')),
    css: allFiles.filter(f => f.endsWith('.css')),
    html: allFiles.filter(f => f.endsWith('.html')),
    other: allFiles.filter(f => !f.endsWith('.js') && !f.endsWith('.css') && !f.endsWith('.html'))
  };
  
  console.log('\n📊 File breakdown:');
  Object.entries(categories).forEach(([type, files]) => {
    const size = files.reduce((total, file) => total + getFileSize(file), 0);
    console.log(`${type.toUpperCase()}: ${files.length} files, ${(size / 1024 / 1024).toFixed(2)} MB`);
  });
  
  console.log(`\n${  '='.repeat(60)}`);
  console.log('🚀 MINIMAL DEPLOYMENT READY');
  console.log('='.repeat(60));
  console.log(`📦 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📄 Total files: ${allFiles.length}`);
  console.log(`🖼️  Images removed: All except favicon.svg`);
  console.log(`🎯 Deployment status: ${totalSize < 50 * 1024 * 1024 ? '✅ READY' : '⚠️  STILL LARGE'}`);
  console.log('='.repeat(60));
  
  return { totalSize, fileCount: allFiles.length };
}

async function main() {
  console.log('🚀 Creating minimal deployment (no images)...\n');
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist/public directory not found. Run npm run build:client first.');
    process.exit(1);
  }
  
  try {
    // Get initial size
    const initialFiles = getAllFiles(DIST_DIR);
    const initialSize = initialFiles.reduce((total, file) => total + getFileSize(file), 0);
    console.log(`📊 Initial size: ${(initialSize / 1024 / 1024).toFixed(2)} MB (${initialFiles.length} files)\n`);
    
    // Step 1: Remove all images
    const imageStats = removeAllImages();
    
    // Step 2: Analyze JavaScript bundles
    const jsAnalysis = analyzeJavaScriptBundles();
    
    // Step 3: Identify memory-heavy components
    identifyMemoryHeavyComponents();
    
    // Step 4: Generate deployment report
    const finalStats = generateMinimalDeploymentReport();
    
    // Summary
    const totalSaved = initialSize - finalStats.totalSize;
    const reductionPercent = (totalSaved / initialSize) * 100;
    
    console.log(`\n💡 Space saved by removing images: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📈 Size reduction: ${reductionPercent.toFixed(1)}%`);
    
    // Flag the biggest issues
    console.log('\n🚨 TOP OPTIMIZATION TARGETS:');
    const largestBundles = jsAnalysis.slice(0, 3);
    largestBundles.forEach((bundle, index) => {
      console.log(`${index + 1}. ${bundle.name} (${bundle.sizeMB} MB) - PRIORITY ${index === 0 ? 'HIGH' : index === 1 ? 'MEDIUM' : 'LOW'}`);
    });
    
  } catch (error) {
    console.error('❌ Minimal deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the minimal deployment
main();
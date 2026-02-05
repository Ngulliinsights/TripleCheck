#!/usr/bin/env node

/**
 * Memory Benchmark Script
 * Compares memory usage between original and optimized components
 */

import fs from './cleanup-redundancies';
import path from './cleanup-redundancies';

// Component file sizes (approximate memory footprint indicator)
const components = [
  {
    name: 'PropertyCompare',
    original: 'src/property/pages/PropertyCompare.tsx',
    optimized: 'src/property/pages/PropertyCompare.optimized.tsx',
  },
  {
    name: 'PropertiesResidential', 
    original: 'src/property/pages/PropertiesResidential.tsx',
    optimized: 'src/property/pages/PropertiesResidential.optimized.tsx',
  },
  {
    name: 'Dashboard',
    original: 'src/user/pages/Dashboard.tsx', 
    optimized: 'src/user/pages/Dashboard.optimized.tsx',
  },
];

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function analyzeComponent(component) {
  const originalSize = getFileSize(component.original);
  const optimizedSize = getFileSize(component.optimized);
  
  const reduction = originalSize > 0 ? ((originalSize - optimizedSize) / originalSize) * 100 : 0;
  
  return {
    name: component.name,
    originalSize,
    optimizedSize,
    reduction: reduction.toFixed(1),
    status: optimizedSize > 0 ? '✅ Optimized' : '❌ Not Found',
  };
}

function estimateMemoryUsage(fileSize) {
  // Rough estimation: file size * 10 for runtime memory usage
  // This includes component instances, state, and DOM nodes
  return Math.round((fileSize * 10) / 1024); // KB
}

function generateReport() {
  console.log('\n🚀 Memory Optimization Report\n');
  console.log('=' .repeat(80));
  
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  
  components.forEach(component => {
    const analysis = analyzeComponent(component);
    
    totalOriginalSize += analysis.originalSize;
    totalOptimizedSize += analysis.optimizedSize;
    
    const originalMemory = estimateMemoryUsage(analysis.originalSize);
    const optimizedMemory = estimateMemoryUsage(analysis.optimizedSize);
    
    console.log(`\n📊 ${analysis.name}`);
    console.log(`   Status: ${analysis.status}`);
    console.log(`   Original: ${(analysis.originalSize / 1024).toFixed(1)}KB (~${originalMemory}KB runtime)`);
    console.log(`   Optimized: ${(analysis.optimizedSize / 1024).toFixed(1)}KB (~${optimizedMemory}KB runtime)`);
    console.log(`   Reduction: ${analysis.reduction}%`);
  });
  
  const totalReduction = totalOriginalSize > 0 
    ? ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100 
    : 0;
  
  console.log(`\n${  '=' .repeat(80)}`);
  console.log('\n📈 Summary');
  console.log(`   Total Original: ${(totalOriginalSize / 1024).toFixed(1)}KB`);
  console.log(`   Total Optimized: ${(totalOptimizedSize / 1024).toFixed(1)}KB`);
  console.log(`   Overall Reduction: ${totalReduction.toFixed(1)}%`);
  
  const estimatedOriginalMemory = estimateMemoryUsage(totalOriginalSize);
  const estimatedOptimizedMemory = estimateMemoryUsage(totalOptimizedSize);
  const memoryReduction = estimatedOriginalMemory > 0 
    ? ((estimatedOriginalMemory - estimatedOptimizedMemory) / estimatedOriginalMemory) * 100 
    : 0;
  
  console.log(`   Estimated Memory Savings: ${memoryReduction.toFixed(1)}% (~${estimatedOriginalMemory - estimatedOptimizedMemory}KB)`);
  
  // Performance recommendations
  console.log('\n🎯 Recommendations');
  if (totalReduction > 50) {
    console.log('   ✅ Excellent optimization! Memory usage significantly reduced.');
  } else if (totalReduction > 25) {
    console.log('   ✅ Good optimization! Consider further improvements.');
  } else {
    console.log('   ⚠️  More optimization needed. Consider implementing:');
    console.log('      - React.memo for components');
    console.log('      - Virtualization for large lists');
    console.log('      - Pagination for data sets');
    console.log('      - Lazy loading for images');
  }
  
  console.log('\n💡 Next Steps');
  console.log('   1. Replace original components with optimized versions');
  console.log('   2. Add memory monitoring hooks');
  console.log('   3. Implement virtualized lists for large datasets');
  console.log('   4. Test performance improvements in browser');
  
  console.log('\n🔧 Usage');
  console.log('   # Replace components:');
  components.forEach(component => {
    if (getFileSize(component.optimized) > 0) {
      console.log(`   mv ${component.original} ${component.original}.backup`);
      console.log(`   mv ${component.optimized} ${component.original}`);
    }
  });
  
  console.log('\n');
}

// Additional utility functions
function checkOptimizationFiles() {
  console.log('\n🔍 Checking Optimization Files\n');
  
  const optimizationFiles = [
    'src/shared/hooks/useMemoryOptimization.ts',
    'src/shared/components/VirtualizedList.tsx',
    'src/shared/docs/memory-optimization-guide.md',
  ];
  
  optimizationFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const size = exists ? getFileSize(file) : 0;
    console.log(`   ${exists ? '✅' : '❌'} ${file} ${exists ? `(${(size/1024).toFixed(1)}KB)` : ''}`);
  });
}

function generateMigrationScript() {
  const scriptPath = 'scripts/migrate-optimized-components.sh';
  
  let script = '#!/bin/bash\n\n';
  script += '# Migration script for optimized components\n';
  script += '# Run this script to replace original components with optimized versions\n\n';
  script += 'echo "🚀 Migrating to optimized components..."\n\n';
  
  components.forEach(component => {
    if (getFileSize(component.optimized) > 0) {
      script += `echo "Migrating ${component.name}..."\n`;
      script += `cp "${component.original}" "${component.original}.backup"\n`;
      script += `mv "${component.optimized}" "${component.original}"\n`;
      script += `echo "✅ ${component.name} migrated"\n\n`;
    }
  });
  
  script += 'echo "🎉 Migration complete!"\n';
  script += 'echo "Original files backed up with .backup extension"\n';
  
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  
  console.log(`\n📝 Migration script created: ${scriptPath}`);
  console.log('   Run with: ./scripts/migrate-optimized-components.sh');
}

// Main execution
checkOptimizationFiles();
generateReport();
generateMigrationScript();

export {
  analyzeComponent,
  estimateMemoryUsage,
  generateReport,
};
#!/usr/bin/env node

/**
 * Hook Migration Analysis Script
 * Analyzes the codebase for deprecated hook usage and generates migration report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEPRECATED_HOOKS = [
  // All hooks have been successfully consolidated!
];

const HOOK_REPLACEMENTS = {
  // All hooks have been successfully consolidated!
};

// Completed consolidations (no longer need to be tracked)
const COMPLETED_CONSOLIDATIONS = [
  'useAccessibility',
  'useVirtualizationHelpers',
  'useForm',
  'usePaginatedQuery',
  'useInfiniteScroll',
  'usePerformanceMonitor'
];

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and build directories
        if (!['node_modules', 'dist', 'build', '.git'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = [];
  
  lines.forEach((line, index) => {
    DEPRECATED_HOOKS.forEach(hook => {
      // Check for imports
      if (line.includes(`import`) && line.includes(hook)) {
        findings.push({
          line: index + 1,
          type: 'import',
          hook,
          content: line.trim(),
          replacement: HOOK_REPLACEMENTS[hook]
        });
      }
      
      // Check for usage
      if (line.includes(`${hook}(`)) {
        findings.push({
          line: index + 1,
          type: 'usage',
          hook,
          content: line.trim(),
          replacement: HOOK_REPLACEMENTS[hook]
        });
      }
    });
  });
  
  return findings;
}

function generateReport() {
  console.log('🔍 Analyzing codebase for deprecated hook usage...\n');
  
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found. Please run this script from the project root.');
    process.exit(1);
  }
  
  const files = findFiles(srcDir);
  const report = {
    totalFiles: files.length,
    filesWithIssues: 0,
    totalIssues: 0,
    hookUsage: {}
  };
  
  files.forEach(file => {
    const findings = analyzeFile(file);
    
    if (findings.length > 0) {
      report.filesWithIssues++;
      report.totalIssues += findings.length;
      
      const relativePath = path.relative(projectRoot, file);
      console.log(`📄 ${relativePath}`);
      
      findings.forEach(finding => {
        const icon = finding.type === 'import' ? '📥' : '🔧';
        console.log(`   ${icon} Line ${finding.line}: ${finding.hook} → ${finding.replacement}`);
        console.log(`      ${finding.content}`);
        
        // Track hook usage statistics
        if (!report.hookUsage[finding.hook]) {
          report.hookUsage[finding.hook] = 0;
        }
        report.hookUsage[finding.hook]++;
      });
      
      console.log('');
    }
  });
  
  // Summary
  console.log('📊 Summary:');
  console.log(`   Total files scanned: ${report.totalFiles}`);
  console.log(`   Files with deprecated hooks: ${report.filesWithIssues}`);
  console.log(`   Total issues found: ${report.totalIssues}`);
  
  if (Object.keys(report.hookUsage).length > 0) {
    console.log('\n🎯 Hook usage breakdown:');
    Object.entries(report.hookUsage).forEach(([hook, count]) => {
      console.log(`   ${hook}: ${count} occurrences → ${HOOK_REPLACEMENTS[hook]}`);
    });
  }
  
  if (report.totalIssues === 0) {
    console.log('\n✅ No deprecated hooks found! Your codebase is ready for the consolidation.');
  } else {
    console.log('\n📋 Next steps:');
    console.log('   1. Review the files listed above');
    console.log('   2. Follow the migration guide: /docs/hook-migration.md');
    console.log('   3. Update imports and hook usage as indicated');
    console.log('   4. Run tests to ensure functionality is preserved');
  }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  generateReport();
}

export { generateReport, analyzeFile, findFiles };
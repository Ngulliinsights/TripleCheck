#!/usr/bin/env node

/**
 * Responsive Design Analyzer
 * 
 * Analyzes components for responsive design issues and suggests fixes
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Common responsive design issues to look for
const RESPONSIVE_ISSUES = {
  // Fixed widths that should be responsive
  FIXED_WIDTHS: {
    pattern: /width:\s*\d+px|w-\d+(?!%)/g,
    severity: 'warning',
    description: 'Fixed width values may not be responsive',
    suggestion: 'Consider using percentage, viewport units, or Tailwind responsive classes'
  },
  
  // Missing responsive breakpoints
  MISSING_BREAKPOINTS: {
    pattern: /className.*(?:hidden|flex|grid|block)(?!\s+(?:sm:|md:|lg:|xl:))/g,
    severity: 'info',
    description: 'Display classes without responsive breakpoints',
    suggestion: 'Add responsive breakpoints like md:flex, lg:hidden, etc.'
  },
  
  // Large fixed heights
  FIXED_HEIGHTS: {
    pattern: /height:\s*[5-9]\d+px|h-\d{2,}/g,
    severity: 'warning',
    description: 'Large fixed heights may cause issues on mobile',
    suggestion: 'Consider using min-height or responsive height classes'
  },
  
  // Absolute positioning without responsive consideration
  ABSOLUTE_POSITIONING: {
    pattern: /position:\s*absolute|absolute\s+(?:top|left|right|bottom)-/g,
    severity: 'info',
    description: 'Absolute positioning may need responsive adjustments',
    suggestion: 'Ensure absolute positioned elements work on all screen sizes'
  },
  
  // Large font sizes without responsive scaling
  LARGE_FONTS: {
    pattern: /font-size:\s*[3-9]\d+px|text-[4-9]xl/g,
    severity: 'info',
    description: 'Large fonts may need responsive scaling',
    suggestion: 'Consider using responsive text classes or clamp() for fluid typography'
  },
  
  // Missing mobile-first approach
  NON_MOBILE_FIRST: {
    pattern: /className.*lg:|xl:.*(?!.*(?:sm:|md:))/g,
    severity: 'info',
    description: 'Desktop-first approach detected',
    suggestion: 'Consider mobile-first approach with base styles for mobile'
  }
};

// Responsive best practices to check for
const RESPONSIVE_BEST_PRACTICES = {
  // Good responsive patterns
  RESPONSIVE_GRID: /grid-cols-1.*md:grid-cols-2.*lg:grid-cols-3/g,
  RESPONSIVE_TEXT: /text-sm.*md:text-base.*lg:text-lg/g,
  RESPONSIVE_SPACING: /p-4.*md:p-6.*lg:p-8/g,
  RESPONSIVE_DISPLAY: /hidden.*md:block|block.*md:hidden/g,
  FLUID_TYPOGRAPHY: /text-fluid-|clamp\(/g,
  CONTAINER_QUERIES: /container.*mx-auto.*px-/g
};

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    const goodPractices = [];
    
    // Check for responsive issues
    Object.entries(RESPONSIVE_ISSUES).forEach(([key, config]) => {
      const matches = content.match(config.pattern);
      if (matches) {
        issues.push({
          type: key,
          severity: config.severity,
          description: config.description,
          suggestion: config.suggestion,
          matches: matches.length,
          examples: matches.slice(0, 3) // Show first 3 examples
        });
      }
    });
    
    // Check for good practices
    Object.entries(RESPONSIVE_BEST_PRACTICES).forEach(([key, pattern]) => {
      const matches = content.match(pattern);
      if (matches) {
        goodPractices.push({
          type: key,
          matches: matches.length,
          examples: matches.slice(0, 2)
        });
      }
    });
    
    return { issues, goodPractices };
  } catch (error) {
    log(`Error reading file ${filePath}: ${error.message}`, 'red');
    return { issues: [], goodPractices: [] };
  }
}

function analyzeDirectory(dirPath, extensions = ['.tsx', '.jsx', '.ts', '.js']) {
  const results = {};
  
  function walkDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDirectory(itemPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        const relativePath = path.relative(process.cwd(), itemPath);
        results[relativePath] = analyzeFile(itemPath);
      }
    });
  }
  
  walkDirectory(dirPath);
  return results;
}

function generateReport(results) {
  log('\n📱 Responsive Design Analysis Report', 'bright');
  log('=====================================', 'cyan');
  
  let totalIssues = 0;
  let totalGoodPractices = 0;
  const severityCounts = { error: 0, warning: 0, info: 0 };
  
  // Summary
  Object.values(results).forEach(({ issues, goodPractices }) => {
    totalIssues += issues.length;
    totalGoodPractices += goodPractices.length;
    
    issues.forEach(issue => {
      severityCounts[issue.severity]++;
    });
  });
  
  log(`\n📊 Summary:`, 'yellow');
  log(`   Total files analyzed: ${Object.keys(results).length}`);
  log(`   Total issues found: ${totalIssues}`);
  log(`   Good practices found: ${totalGoodPractices}`);
  log(`   Errors: ${severityCounts.error}`, severityCounts.error > 0 ? 'red' : 'green');
  log(`   Warnings: ${severityCounts.warning}`, severityCounts.warning > 0 ? 'yellow' : 'green');
  log(`   Info: ${severityCounts.info}`, 'blue');
  
  // Detailed results
  Object.entries(results).forEach(([filePath, { issues, goodPractices }]) => {
    if (issues.length > 0 || goodPractices.length > 0) {
      log(`\n📄 ${filePath}`, 'cyan');
      
      // Issues
      if (issues.length > 0) {
        log(`   Issues (${issues.length}):`, 'yellow');
        issues.forEach(issue => {
          const severityColor = issue.severity === 'error' ? 'red' : 
                               issue.severity === 'warning' ? 'yellow' : 'blue';
          
          log(`   ${issue.severity.toUpperCase()}: ${issue.description}`, severityColor);
          log(`   💡 ${issue.suggestion}`, 'cyan');
          log(`   📍 Found ${issue.matches} occurrence(s)`);
          
          if (issue.examples.length > 0) {
            log(`   Examples: ${issue.examples.join(', ')}`, 'magenta');
          }
          log('');
        });
      }
      
      // Good practices
      if (goodPractices.length > 0) {
        log(`   ✅ Good practices (${goodPractices.length}):`, 'green');
        goodPractices.forEach(practice => {
          log(`   ${practice.type}: ${practice.matches} occurrence(s)`, 'green');
        });
      }
    }
  });
  
  // Recommendations
  log('\n🎯 Recommendations:', 'bright');
  log('==================', 'cyan');
  
  if (severityCounts.error > 0) {
    log('🔴 Critical Issues:', 'red');
    log('   - Fix error-level responsive issues immediately');
    log('   - Test on mobile devices after fixes');
  }
  
  if (severityCounts.warning > 0) {
    log('🟡 Warnings:', 'yellow');
    log('   - Review warning-level issues for mobile compatibility');
    log('   - Consider responsive alternatives for fixed dimensions');
  }
  
  log('📱 General Recommendations:', 'blue');
  log('   - Use mobile-first approach (base styles for mobile, then md:, lg:)');
  log('   - Test on multiple screen sizes (320px, 768px, 1024px, 1920px)');
  log('   - Use responsive grid classes (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)');
  log('   - Implement fluid typography with clamp() or responsive text classes');
  log('   - Ensure touch targets are at least 44px tall on mobile');
  log('   - Use container queries for component-level responsiveness');
  
  log('\n🧪 Testing:', 'green');
  log('   Run visual regression tests to validate responsive behavior:');
  log('   npm run test:visual -- --test "responsive-design"', 'cyan');
  log('   npm run test:visual:mobile', 'cyan');
  log('   npm run test:visual:tablet', 'cyan');
}

function generateFixSuggestions(results) {
  log('\n🔧 Automated Fix Suggestions:', 'bright');
  log('=============================', 'cyan');
  
  const commonFixes = {
    'Fixed width containers': {
      find: 'w-96',
      replace: 'w-full max-w-sm md:max-w-md lg:max-w-lg',
      description: 'Replace fixed widths with responsive max-widths'
    },
    'Non-responsive grids': {
      find: 'grid-cols-3',
      replace: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      description: 'Make grids responsive across breakpoints'
    },
    'Fixed text sizes': {
      find: 'text-4xl',
      replace: 'text-2xl md:text-3xl lg:text-4xl',
      description: 'Scale text responsively'
    },
    'Fixed padding': {
      find: 'p-8',
      replace: 'p-4 md:p-6 lg:p-8',
      description: 'Scale padding for different screen sizes'
    },
    'Hidden elements': {
      find: 'hidden lg:block',
      replace: 'hidden md:block',
      description: 'Show elements on tablet and up, not just desktop'
    }
  };
  
  Object.entries(commonFixes).forEach(([name, fix]) => {
    log(`\n${name}:`, 'yellow');
    log(`   Find: ${fix.find}`, 'red');
    log(`   Replace: ${fix.replace}`, 'green');
    log(`   Why: ${fix.description}`, 'blue');
  });
  
  log('\n💡 Pro Tips:', 'magenta');
  log('   - Use Tailwind\'s responsive prefixes: sm:, md:, lg:, xl:');
  log('   - Start with mobile styles, then add larger screen styles');
  log('   - Use max-width with width: 100% for responsive containers');
  log('   - Test with browser dev tools device emulation');
  log('   - Consider using CSS Grid and Flexbox for layout');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    log('📱 Responsive Design Analyzer', 'bright');
    log('============================', 'cyan');
    log('\nUsage: node scripts/responsive-design-analyzer.js [options]');
    log('\nOptions:');
    log('  --dir <path>     Directory to analyze (default: src/)');
    log('  --fix            Show automated fix suggestions');
    log('  --help           Show this help message');
    log('\nExamples:');
    log('  node scripts/responsive-design-analyzer.js');
    log('  node scripts/responsive-design-analyzer.js --dir src/components');
    log('  node scripts/responsive-design-analyzer.js --fix');
    return;
  }
  
  const dirIndex = args.indexOf('--dir');
  const targetDir = dirIndex !== -1 && args[dirIndex + 1] ? args[dirIndex + 1] : 'src';
  const showFixes = args.includes('--fix');
  
  if (!fs.existsSync(targetDir)) {
    log(`❌ Directory not found: ${targetDir}`, 'red');
    process.exit(1);
  }
  
  log(`🔍 Analyzing responsive design in: ${targetDir}`, 'blue');
  
  const results = analyzeDirectory(targetDir);
  generateReport(results);
  
  if (showFixes) {
    generateFixSuggestions(results);
  }
  
  log('\n✨ Analysis complete!', 'green');
  log('Run with --fix flag to see automated fix suggestions', 'cyan');
}

if (require.main === module) {
  main();
}

module.exports = { analyzeFile, analyzeDirectory, generateReport };
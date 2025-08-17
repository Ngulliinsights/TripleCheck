#!/usr/bin/env tsx

/**
 * Simple audit runner to analyze project structure for redundancies
 */

import * as fs from 'fs';
import * as path from 'path';

interface ProjectAnalysis {
  redundantFiles: string[];
  duplicateComponents: string[];
  unusedFiles: string[];
  structuralIssues: string[];
  recommendations: string[];
}

class ProjectStructureAnalyzer {
  private projectRoot: string;
  private excludePaths = ['node_modules', 'dist', 'build', '.git', 'coverage', 'reports', '.venv', '__pycache__', 'playwright-report', 'test-results'];

  constructor(projectRoot: string = '.') {
    this.projectRoot = projectRoot;
  }

  async analyzeProject(): Promise<ProjectAnalysis> {
    console.log('🔍 Analyzing project structure for redundancies...');

    const analysis: ProjectAnalysis = {
      redundantFiles: [],
      duplicateComponents: [],
      unusedFiles: [],
      structuralIssues: [],
      recommendations: []
    };

    try {
      // Analyze file structure
      const allFiles = await this.getAllFiles();
      
      // Check for redundant files
      analysis.redundantFiles = this.findRedundantFiles(allFiles);
      
      // Check for duplicate components
      analysis.duplicateComponents = this.findDuplicateComponents(allFiles);
      
      // Check for structural issues
      analysis.structuralIssues = this.findStructuralIssues(allFiles);
      
      // Add specific redundancy analysis
      const specificIssues = this.analyzeSpecificRedundancies(allFiles);
      analysis.structuralIssues.push(...specificIssues);
      
      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      this.printAnalysis(analysis);
      
      return analysis;
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  private async getAllFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const walkDir = async (dir: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          const relativePath = path.relative(this.projectRoot, fullPath);
          
          if (this.excludePaths.some(excluded => relativePath.includes(excluded))) {
            continue;
          }
          
          if (item.isDirectory()) {
            await walkDir(fullPath);
          } else if (item.isFile()) {
            files.push(relativePath);
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read directory ${dir}`);
      }
    };
    
    await walkDir(this.projectRoot);
    return files;
  }

  private findRedundantFiles(files: string[]): string[] {
    const redundant: string[] = [];
    
    // Check for duplicate TypeScript/JavaScript files
    const jsFiles = files.filter(f => /\.(js|ts|jsx|tsx)$/.test(f));
    const fileGroups = new Map<string, string[]>();
    
    for (const file of jsFiles) {
      const baseName = path.basename(file, path.extname(file));
      const dir = path.dirname(file);
      const key = `${dir}/${baseName}`;
      
      if (!fileGroups.has(key)) {
        fileGroups.set(key, []);
      }
      fileGroups.get(key)!.push(file);
    }
    
    // Find groups with multiple files (potential duplicates)
    for (const [key, group] of fileGroups) {
      if (group.length > 1) {
        // Check if we have both .ts and .js versions
        const hasTs = group.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
        const hasJs = group.some(f => f.endsWith('.js') || f.endsWith('.jsx'));
        
        if (hasTs && hasJs) {
          redundant.push(...group.filter(f => f.endsWith('.js') || f.endsWith('.jsx')));
        }
      }
    }
    
    // Check for test files without corresponding source files
    const testFiles = files.filter(f => /\.(test|spec)\.(js|ts|jsx|tsx)$/.test(f));
    for (const testFile of testFiles) {
      const sourceFile = testFile.replace(/\.(test|spec)\./, '.');
      if (!files.includes(sourceFile)) {
        redundant.push(testFile);
      }
    }
    
    return redundant;
  }

  private findDuplicateComponents(files: string[]): string[] {
    const duplicates: string[] = [];
    const componentFiles = files.filter(f => 
      /\.(tsx|jsx)$/.test(f) && 
      !f.includes('test') && 
      !f.includes('spec')
    );
    
    const componentNames = new Map<string, string[]>();
    
    for (const file of componentFiles) {
      const baseName = path.basename(file, path.extname(file));
      
      if (!componentNames.has(baseName)) {
        componentNames.set(baseName, []);
      }
      componentNames.get(baseName)!.push(file);
    }
    
    // Find components with same name in different locations
    for (const [name, locations] of componentNames) {
      if (locations.length > 1) {
        duplicates.push(`Component "${name}" found in multiple locations: ${locations.join(', ')}`);
      }
    }
    
    return duplicates;
  }

  private findStructuralIssues(files: string[]): string[] {
    const issues: string[] = [];
    
    // Check for deeply nested directories
    const maxDepth = 6;
    for (const file of files) {
      const depth = file.split(path.sep).length;
      if (depth > maxDepth) {
        issues.push(`Deeply nested file (${depth} levels): ${file}`);
      }
    }
    
    // Check for inconsistent naming patterns
    const componentFiles = files.filter(f => /\.(tsx|jsx)$/.test(f));
    const inconsistentNaming: string[] = [];
    
    for (const file of componentFiles) {
      const baseName = path.basename(file, path.extname(file));
      
      // Check for PascalCase component names
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(baseName) && !baseName.includes('.')) {
        inconsistentNaming.push(file);
      }
    }
    
    if (inconsistentNaming.length > 0) {
      issues.push(`Components with inconsistent naming: ${inconsistentNaming.slice(0, 5).join(', ')}${inconsistentNaming.length > 5 ? ` and ${inconsistentNaming.length - 5} more` : ''}`);
    }
    
    // Check for missing index files in directories with multiple components
    const directories = new Map<string, string[]>();
    for (const file of componentFiles) {
      const dir = path.dirname(file);
      if (!directories.has(dir)) {
        directories.set(dir, []);
      }
      directories.get(dir)!.push(file);
    }
    
    for (const [dir, dirFiles] of directories) {
      if (dirFiles.length > 2 && !files.includes(path.join(dir, 'index.ts')) && !files.includes(path.join(dir, 'index.tsx'))) {
        issues.push(`Directory with multiple components missing index file: ${dir}`);
      }
    }
    
    return issues;
  }

  private analyzeSpecificRedundancies(files: string[]): string[] {
    const specificIssues: string[] = [];
    
    // Check for compiled files in source directories
    const compiledInSrc = files.filter(f => 
      f.startsWith('src/') && (f.endsWith('.js') || f.endsWith('.d.ts'))
    );
    if (compiledInSrc.length > 0) {
      specificIssues.push(`${compiledInSrc.length} compiled files found in src/ directory`);
    }
    
    // Check for duplicate hook patterns
    const hookFiles = files.filter(f => f.includes('hooks/') && f.endsWith('.ts'));
    const hookNames = new Map<string, string[]>();
    
    for (const file of hookFiles) {
      const baseName = path.basename(file, '.ts');
      if (!hookNames.has(baseName)) {
        hookNames.set(baseName, []);
      }
      hookNames.get(baseName)!.push(file);
    }
    
    for (const [name, locations] of hookNames) {
      if (locations.length > 1) {
        specificIssues.push(`Hook "${name}" duplicated in: ${locations.join(', ')}`);
      }
    }
    
    // Check for similar service patterns
    const serviceFiles = files.filter(f => f.includes('service') && f.endsWith('.ts'));
    const servicePatterns = new Map<string, string[]>();
    
    for (const file of serviceFiles) {
      const baseName = path.basename(file, '.ts').toLowerCase();
      const pattern = baseName.replace(/service|api|client/, '').replace(/-/g, '');
      
      if (!servicePatterns.has(pattern)) {
        servicePatterns.set(pattern, []);
      }
      servicePatterns.get(pattern)!.push(file);
    }
    
    for (const [pattern, locations] of servicePatterns) {
      if (locations.length > 1 && pattern.length > 2) {
        specificIssues.push(`Similar services for "${pattern}": ${locations.join(', ')}`);
      }
    }
    
    return specificIssues;
  }

  private generateRecommendations(analysis: ProjectAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (analysis.redundantFiles.length > 0) {
      recommendations.push(`Remove ${analysis.redundantFiles.length} redundant files to reduce bundle size`);
    }
    
    if (analysis.duplicateComponents.length > 0) {
      recommendations.push(`Consolidate ${analysis.duplicateComponents.length} duplicate components into shared components`);
    }
    
    if (analysis.structuralIssues.length > 0) {
      recommendations.push('Improve project structure organization');
      recommendations.push('Add index files to directories with multiple exports');
      recommendations.push('Follow consistent naming conventions');
    }
    
    // Specific recommendations based on current project structure
    recommendations.push('Consider consolidating similar hooks in shared/hooks');
    recommendations.push('Merge duplicate type definitions across modules');
    recommendations.push('Standardize component organization patterns');
    recommendations.push('Implement barrel exports for better import paths');
    
    // Project-specific recommendations
    recommendations.push('Remove compiled .js/.d.ts files from src/ (use build process instead)');
    recommendations.push('Consolidate PropertyMap components (component vs page)');
    recommendations.push('Merge MobileNav implementations into single component');
    recommendations.push('Standardize UserProfile component location');
    recommendations.push('Clean up test files without corresponding source files');
    
    return recommendations;
  }

  private printAnalysis(analysis: ProjectAnalysis): void {
    console.log('\n' + '='.repeat(80));
    console.log('PROJECT STRUCTURE ANALYSIS REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Redundant Files: ${analysis.redundantFiles.length}`);
    console.log(`   Duplicate Components: ${analysis.duplicateComponents.length}`);
    console.log(`   Structural Issues: ${analysis.structuralIssues.length}`);
    console.log(`   Recommendations: ${analysis.recommendations.length}`);
    
    if (analysis.redundantFiles.length > 0) {
      console.log('\n🗑️  REDUNDANT FILES:');
      analysis.redundantFiles.slice(0, 10).forEach(file => {
        console.log(`   - ${file}`);
      });
      if (analysis.redundantFiles.length > 10) {
        console.log(`   ... and ${analysis.redundantFiles.length - 10} more`);
      }
    }
    
    if (analysis.duplicateComponents.length > 0) {
      console.log('\n🔄 DUPLICATE COMPONENTS:');
      analysis.duplicateComponents.slice(0, 5).forEach(duplicate => {
        console.log(`   - ${duplicate}`);
      });
    }
    
    if (analysis.structuralIssues.length > 0) {
      console.log('\n⚠️  STRUCTURAL ISSUES:');
      analysis.structuralIssues.slice(0, 5).forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run the analysis
async function main() {
  try {
    const analyzer = new ProjectStructureAnalyzer();
    await analyzer.analyzeProject();
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
main();

export { ProjectStructureAnalyzer };
#!/usr/bin/env tsx

/**
 * Barrel Exports Generator
 * 
 * Creates index.ts files with barrel exports for major directories
 * to improve import organization and developer experience.
 */

import * as fs from './add-b2b-messaging';
import * as path from './fix-core-import-paths';

interface BarrelConfig {
  path: string;
  name: string;
  description: string;
  pattern: RegExp;
  exclude: string[];
  includeSubdirectories?: boolean;
  customExports?: { [key: string]: string };
}

class BarrelExportsGenerator {
  private createdFiles: string[] = [];
  
  private configs: BarrelConfig[] = [
    // Property module
    {
      path: 'src/property/components',
      name: 'Property Components',
      description: 'Property-related UI components',
      pattern: /\.(tsx|ts)$/,
      exclude: ['index.ts', 'index.tsx', '__tests__', '.test.', '.spec.'],
      customExports: {
        'PropertyMap': 'export { PropertyMap, PropertyMapEmbedded, PropertyMapPage } from \'./PropertyMap\';'
      }
    },
    {
      path: 'src/property/hooks',
      name: 'Property Hooks',
      description: 'Property-related React hooks',
      pattern: /\.ts$/,
      exclude: ['index.ts', '__tests__', '.test.', '.spec.']
    },
    {
      path: 'src/property/pages',
      name: 'Property Pages',
      description: 'Property-related page components',
      pattern: /\.(tsx|ts)$/,
      exclude: ['index.ts', 'index.tsx', '__tests__', '.test.', '.spec.']
    },
    {
      path: 'src/property/services',
      name: 'Property Services',
      description: 'Property-related business logic and API services',
      pattern: /\.ts$/,
      exclude: ['index.ts', '__tests__', '.test.', '.spec.']
    },
    
    // Shared module
    {
      path: 'src/shared/components/ui',
      name: 'UI Components',
      description: 'Reusable UI components and design system elements',
      pattern: /\.(tsx|ts)$/,
      exclude: ['index.ts', 'index.tsx', '__tests__', '.test.', '.spec.']
    },
    {
      path: 'src/shared/components/layout',
      name: 'Layout Components',
      description: 'Layout and structural components',
      pattern: /\.(tsx|ts)$/,
      exclude: ['index.ts', 'index.tsx', '__tests__', '.test.', '.spec.']
    },
    {
      path: 'src/shared/components/navigation',
      name: 'Navigation Components',
      description: 'Navigation and routing components',
      pattern: /\.(tsx|ts)$/,
      exclude: ['index.ts', 'index.tsx', '__tests__', '.test.', '.spec.']
    },
    {
      path: 'src/shared/hooks',
      name: 'Shared Hooks',
      description: 'Reusable React hooks and utilities',
      pattern: /\.ts$/,
      exclude: ['index.ts', '__tests__', '.test.', '.spec.']
    },
    {
      path: 'src/shared/utils',
      name: 'Shared Utilities',
      description: 'Utility functions and helpers',
      pattern: /\.ts$/,
      exclude: ['index.ts', '__tests__', '.test.', '.spec.']
    },
    {
      path: 'src/shared/services',
      name: 'Shared Services',
      description: 'Shared business logic and API services',
      pattern: /\.ts$/,
      exclude: ['index.ts', '__tests__', '.test.', '.spec.']
    },
    
    // User module
    {
      path: 'src/user/components',
      name: 'User Components',
      description: 'User-related UI components',
      pattern: /\.(tsx|ts)$/,
      exclude: ['index.ts', 'index.tsx', '__tests__', '.test.', '.spec.']
    },
    {
      path: 'src/user/pages',
      name: 'User Pages',
      description: 'User-related page components',
      pattern: /\.(tsx|ts)$/,
      exclude: ['index.ts', 'index.tsx', '__tests__', '.test.', '.spec.']
    },
    {
      path: 'src/user/hooks',
      name: 'User Hooks',
      description: 'User-related React hooks',
      pattern: /\.ts$/,
      exclude: ['index.ts', '__tests__', '.test.', '.spec.']
    },
    
    // Search module
    {
      path: 'src/search/components',
      name: 'Search Components',
      description: 'Search-related UI components',
      pattern: /\.(tsx|ts)$/,
      exclude: ['index.ts', 'index.tsx', '__tests__', '.test.', '.spec.']
    },
    {
      path: 'src/search/hooks',
      name: 'Search Hooks',
      description: 'Search-related React hooks',
      pattern: /\.ts$/,
      exclude: ['index.ts', '__tests__', '.test.', '.spec.']
    },
    
    // Auth module
    {
      path: 'src/auth/components',
      name: 'Auth Components',
      description: 'Authentication-related UI components',
      pattern: /\.(tsx|ts)$/,
      exclude: ['index.ts', 'index.tsx', '__tests__', '.test.', '.spec.']
    },
    {
      path: 'src/auth/hooks',
      name: 'Auth Hooks',
      description: 'Authentication-related React hooks',
      pattern: /\.ts$/,
      exclude: ['index.ts', '__tests__', '.test.', '.spec.']
    }
  ];

  async generateBarrelExports(): Promise<void> {
    console.log('📦 Creating barrel exports for major directories...');

    for (const config of this.configs) {
      await this.createBarrelExport(config);
    }

    this.printSummary();
  }

  private async createBarrelExport(config: BarrelConfig): Promise<void> {
    try {
      // Check if directory exists
      if (!await this.directoryExists(config.path)) {
        console.log(`   ⚠️ Skipping ${config.path} - directory not found`);
        return;
      }

      const files = await this.getExportableFiles(config);
      
      if (files.length === 0) {
        console.log(`   ⚠️ Skipping ${config.path} - no exportable files found`);
        return;
      }

      const barrelContent = this.generateBarrelContent(config, files);
      const indexPath = path.join(config.path, 'index.ts');

      await fs.promises.writeFile(indexPath, barrelContent, 'utf8');
      this.createdFiles.push(indexPath);
      
      console.log(`   ✓ Created: ${indexPath} (${files.length} exports)`);
    } catch (error) {
      console.warn(`   ⚠️ Failed to create barrel export for ${config.path}: ${error}`);
    }
  }

  private async getExportableFiles(config: BarrelConfig): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await fs.promises.readdir(config.path, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isFile() && config.pattern.test(item.name)) {
          // Check if file should be excluded
          const shouldExclude = config.exclude.some(pattern => 
            item.name.includes(pattern)
          );
          
          if (!shouldExclude) {
            files.push(item.name);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${config.path}: ${error}`);
    }

    return files.sort();
  }

  private generateBarrelContent(config: BarrelConfig, files: string[]): string {
    const lines: string[] = [];
    
    // Header comment
    lines.push('/**');
    lines.push(` * ${config.name} Barrel Export`);
    lines.push(' * ');
    lines.push(` * ${config.description}`);
    lines.push(' * ');
    lines.push(' * This file provides a centralized export point for all');
    lines.push(` * ${config.name.toLowerCase()} to improve import organization.`);
    lines.push(' * ');
    lines.push(' * Usage:');
    lines.push(` * import { ComponentName } from '${config.path.replace('src/', '@')}';`);
    lines.push(' */');
    lines.push('');

    // Custom exports first (if any)
    if (config.customExports) {
      lines.push('// Custom exports');
      Object.values(config.customExports).forEach(exportLine => {
        lines.push(exportLine);
      });
      lines.push('');
    }

    // Standard exports
    if (files.length > 0) {
      lines.push('// Standard exports');
      files.forEach(file => {
        const fileName = path.parse(file).name;
        
        // Skip if already handled by custom exports
        if (config.customExports && config.customExports[fileName]) {
          return;
        }
        
        // Generate export statement
        if (file.endsWith('.tsx')) {
          lines.push(`export { default as ${fileName} } from './${fileName}';`);
        } else {
          lines.push(`export * from './${fileName}';`);
        }
      });
    }

    return lines.join('\n') + '\n';
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.promises.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('BARREL EXPORTS GENERATION SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n📊 RESULTS:`);
    console.log(`   Barrel exports created: ${this.createdFiles.length}`);

    if (this.createdFiles.length > 0) {
      console.log('\n📦 CREATED BARREL EXPORTS:');
      this.createdFiles.forEach(file => {
        console.log(`   - ${path.relative('.', file)}`);
      });
    }

    console.log('\n✅ Barrel exports generation completed!');
    console.log('   Benefits:');
    console.log('   - Cleaner import statements');
    console.log('   - Better code organization');
    console.log('   - Easier refactoring');
    console.log('   - Improved developer experience');
    console.log('   - Centralized export management');

    console.log('\n💡 Usage Examples:');
    console.log('   // Before');
    console.log('   import { PropertyCard } from \'../property/components/PropertyCard\';');
    console.log('   import { PropertyList } from \'../property/components/PropertyList\';');
    console.log('');
    console.log('   // After');
    console.log('   import { PropertyCard, PropertyList } from \'@property/components\';');

    console.log('='.repeat(60));
  }
}

// CLI interface
async function main() {
  try {
    const generator = new BarrelExportsGenerator();
    await generator.generateBarrelExports();
  } catch (error) {
    console.error('Barrel exports generation failed:', error);
    process.exit(1);
  }
}

main();
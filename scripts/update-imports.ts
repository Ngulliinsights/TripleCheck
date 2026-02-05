#!/usr/bin/env tsx

/**
 * Import Update Script
 * 
 * Automatically updates import statements after component consolidation
 */

import * as fs from './add-b2b-messaging';
import * as path from './fix-core-import-paths';

interface ImportUpdate {
  pattern: RegExp;
  replacement: string;
  description: string;
}

class ImportUpdater {
  private updates: ImportUpdate[] = [
    {
      pattern: /from\s+['"]\.\.\/pages\/PropertyMap['"]/g,
      replacement: "from '../components/PropertyMap'",
      description: 'PropertyMap: pages → components'
    },
    {
      pattern: /from\s+['"]\.\.\/\.\.\/property\/pages\/PropertyMap['"]/g,
      replacement: "from '../../property/components/PropertyMap'",
      description: 'PropertyMap: pages → components (deep import)'
    },
    {
      pattern: /from\s+['"]\.\.\/layout\/MobileNav['"]/g,
      replacement: "from '../navigation/MobileNav'",
      description: 'MobileNav: layout → navigation'
    },
    {
      pattern: /from\s+['"]\.\.\/\.\.\/shared\/components\/layout\/MobileNav['"]/g,
      replacement: "from '../../shared/components/navigation/MobileNav'",
      description: 'MobileNav: layout → navigation (deep import)'
    },
    {
      pattern: /from\s+['"]\.\.\/LazyComponents['"]/g,
      replacement: "from '../lazy/LazyComponents'",
      description: 'LazyComponents: root → lazy directory'
    },
    {
      pattern: /from\s+['"]\.\.\/\.\.\/shared\/components\/LazyComponents['"]/g,
      replacement: "from '../../shared/components/lazy/LazyComponents'",
      description: 'LazyComponents: root → lazy directory (deep import)'
    }
  ];

  private updatedFiles: string[] = [];
  private dryRun: boolean;

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;
  }

  async updateAllImports(): Promise<void> {
    console.log('🔄 Updating import statements after component consolidation...');
    
    if (this.dryRun) {
      console.log('   Running in DRY RUN mode - no files will be modified');
    }

    const sourceFiles = await this.findSourceFiles();
    console.log(`   Found ${sourceFiles.length} source files to check`);

    for (const filePath of sourceFiles) {
      await this.updateFileImports(filePath);
    }

    this.printSummary();
  }

  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const excludeDirs = ['node_modules', 'dist', 'build', '.git', 'coverage'];

    const walkDir = async (dir: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(dir, item.name);

          if (item.isDirectory() && !excludeDirs.includes(item.name)) {
            await walkDir(fullPath);
          } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await walkDir('src');
    return files;
  }

  private async updateFileImports(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      let updatedContent = content;
      let hasChanges = false;

      for (const update of this.updates) {
        if (update.pattern.test(updatedContent)) {
          updatedContent = updatedContent.replace(update.pattern, update.replacement);
          hasChanges = true;
          console.log(`   ✓ ${path.relative('.', filePath)}: ${update.description}`);
        }
      }

      if (hasChanges) {
        if (!this.dryRun) {
          await fs.promises.writeFile(filePath, updatedContent);
        }
        this.updatedFiles.push(filePath);
      }
    } catch (error) {
      console.warn(`   ⚠️ Could not update ${filePath}: ${error}`);
    }
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('IMPORT UPDATE SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n📊 RESULTS:`);
    console.log(`   Files updated: ${this.updatedFiles.length}`);

    if (this.updatedFiles.length > 0) {
      console.log('\n📝 UPDATED FILES:');
      this.updatedFiles.forEach(file => {
        console.log(`   - ${path.relative('.', file)}`);
      });
    }

    if (this.dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no files were actually modified.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Import updates completed successfully!');
      console.log('   Next steps:');
      console.log('   1. Run TypeScript compilation: npm run build:client');
      console.log('   2. Run tests: npm test');
      console.log('   3. Start dev server: npm run dev');
    }

    console.log('='.repeat(60));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
Import Update Tool

Usage: tsx scripts/update-imports.ts [options]

Options:
  --dry-run     Show what would be changed without making changes
  --help, -h    Show this help message

Examples:
  tsx scripts/update-imports.ts --dry-run
  tsx scripts/update-imports.ts
`);
    return;
  }

  try {
    const updater = new ImportUpdater(dryRun);
    await updater.updateAllImports();
  } catch (error) {
    console.error('Import update failed:', error);
    process.exit(1);
  }
}

main();
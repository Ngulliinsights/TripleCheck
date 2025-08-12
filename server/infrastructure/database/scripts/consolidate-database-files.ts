#!/usr/bin/env tsx

/**
 * Database Files Consolidation Script
 * 
 * This script consolidates the fragmented database infrastructure from
 * server/infrastructure/database/ into the unified database/ folder.
 */

import { promises as fs } from 'fs';
import path from 'path';

interface ConsolidationResult {
  success: boolean;
  filesProcessed: number;
  filesMerged: number;
  filesSkipped: number;
  errors: string[];
  warnings: string[];
}

class DatabaseConsolidator {
  private result: ConsolidationResult = {
    success: false,
    filesProcessed: 0,
    filesMerged: 0,
    filesSkipped: 0,
    errors: [],
    warnings: []
  };

  private readonly sourceDir = 'server/infrastructure/database';
  private readonly targetDir = 'database';
  private readonly backupDir = 'database-consolidation-backup';

  async consolidate(): Promise<ConsolidationResult> {
    console.log('🚀 Starting database files consolidation...');
    
    try {
      // Step 1: Create backup
      await this.createBackup();
      
      // Step 2: Analyze and merge files
      await this.analyzeAndMergeFiles();
      
      // Step 3: Update import paths
      await this.updateImportPaths();
      
      // Step 4: Validate consolidation
      await this.validateConsolidation();
      
      this.result.success = true;
      console.log('✅ Database consolidation completed successfully!');
      
    } catch (error) {
      this.result.errors.push(`Consolidation failed: ${error}`);
      console.error('❌ Database consolidation failed:', error);
    }
    
    return this.result;
  }

  private async createBackup(): Promise<void> {
    console.log('📦 Creating backup of current structure...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.backupDir}/${timestamp}`;
    
    try {
      await fs.mkdir(backupPath, { recursive: true });
      
      // Backup server infrastructure database
      await this.copyDirectory(this.sourceDir, `${backupPath}/server-infrastructure-database`);
      
      // Backup current database directory
      await this.copyDirectory(this.targetDir, `${backupPath}/database`);
      
      console.log(`✅ Backup created at: ${backupPath}`);
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  private async copyDirectory(source: string, destination: string): Promise<void> {
    try {
      await fs.mkdir(destination, { recursive: true });
      const entries = await fs.readdir(source, { withFileTypes: true });
      
      for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const destPath = path.join(destination, entry.name);
        
        if (entry.isDirectory()) {
          await this.copyDirectory(sourcePath, destPath);
        } else {
          await fs.copyFile(sourcePath, destPath);
        }
      }
    } catch (error) {
      // Directory might not exist, which is okay for some cases
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async analyzeAndMergeFiles(): Promise<void> {
    console.log('🔍 Analyzing and merging database files...');
    
    const filesToMerge = [
      {
        source: 'server/infrastructure/database/config/database.config.ts',
        target: 'database/config/database.config.ts',
        action: 'merge'
      },
      {
        source: 'server/infrastructure/database/utils/database-utils.ts',
        target: 'database/utils/database-utils.ts',
        action: 'merge'
      },
      {
        source: 'server/infrastructure/database/types/database.types.ts',
        target: 'database/types/database.types.ts',
        action: 'move'
      },
      {
        source: 'server/infrastructure/database/QueryOptimizer.ts',
        target: 'database/utils/QueryOptimizer.ts',
        action: 'move'
      },
      {
        source: 'server/infrastructure/database/seeds/database-seeder.ts',
        target: 'database/seeds/database-seeder.ts',
        action: 'merge'
      },
      {
        source: 'server/infrastructure/database/seeds/land-verification-seed.ts',
        target: 'database/seeds/land-verification-seed.ts',
        action: 'merge'
      },
      {
        source: 'server/infrastructure/database/seeds/sample-ai-data.ts',
        target: 'database/seeds/sample-ai-data.ts',
        action: 'merge'
      }
    ];

    for (const fileOp of filesToMerge) {
      await this.processFile(fileOp);
    }

    // Handle schema consolidation separately
    await this.consolidateSchemas();
    
    // Handle connection consolidation
    await this.consolidateConnection();
  }

  private async processFile(fileOp: { source: string; target: string; action: string }): Promise<void> {
    try {
      this.result.filesProcessed++;
      
      const sourceExists = await this.fileExists(fileOp.source);
      const targetExists = await this.fileExists(fileOp.target);
      
      if (!sourceExists) {
        this.result.warnings.push(`Source file not found: ${fileOp.source}`);
        this.result.filesSkipped++;
        return;
      }

      if (fileOp.action === 'move') {
        await this.moveFile(fileOp.source, fileOp.target);
      } else if (fileOp.action === 'merge') {
        await this.mergeFile(fileOp.source, fileOp.target);
      }
      
      this.result.filesMerged++;
      console.log(`✅ Processed: ${fileOp.source} → ${fileOp.target}`);
      
    } catch (error) {
      this.result.errors.push(`Failed to process ${fileOp.source}: ${error}`);
      console.error(`❌ Failed to process ${fileOp.source}:`, error);
    }
  }

  private async moveFile(source: string, target: string): Promise<void> {
    // Ensure target directory exists
    await fs.mkdir(path.dirname(target), { recursive: true });
    
    // Copy file to target
    await fs.copyFile(source, target);
    
    console.log(`📁 Moved: ${source} → ${target}`);
  }

  private async mergeFile(source: string, target: string): Promise<void> {
    const targetExists = await this.fileExists(target);
    
    if (!targetExists) {
      // If target doesn't exist, just move the file
      await this.moveFile(source, target);
      return;
    }

    // Read both files
    const sourceContent = await fs.readFile(source, 'utf-8');
    const targetContent = await fs.readFile(target, 'utf-8');
    
    // Create merged content with clear separation
    const mergedContent = this.createMergedContent(sourceContent, targetContent, source, target);
    
    // Write merged content
    await fs.writeFile(target, mergedContent, 'utf-8');
    
    console.log(`🔀 Merged: ${source} → ${target}`);
  }

  private createMergedContent(sourceContent: string, targetContent: string, sourcePath: string, targetPath: string): string {
    const timestamp = new Date().toISOString();
    
    return `${targetContent}

// ============================================================================
// MERGED CONTENT FROM: ${sourcePath}
// Merged on: ${timestamp}
// ============================================================================

${sourceContent}

// ============================================================================
// END MERGED CONTENT FROM: ${sourcePath}
// ============================================================================
`;
  }

  private async consolidateSchemas(): Promise<void> {
    console.log('📋 Consolidating schema definitions...');
    
    try {
      // Check if server schemas exist
      const serverSchemasExist = await this.fileExists('server/infrastructure/database/schemas');
      
      if (serverSchemasExist) {
        // Copy server schemas to database schemas with merge logic
        await this.copyDirectory(
          'server/infrastructure/database/schemas',
          'database/schemas/server-merged'
        );
        
        console.log('✅ Server schemas copied for manual review');
        this.result.warnings.push('Server schemas copied to database/schemas/server-merged for manual review');
      }
      
    } catch (error) {
      this.result.errors.push(`Schema consolidation failed: ${error}`);
    }
  }

  private async consolidateConnection(): Promise<void> {
    console.log('🔌 Consolidating connection management...');
    
    try {
      const serverConnectionExists = await this.fileExists('server/infrastructure/database/connection.ts');
      
      if (serverConnectionExists) {
        // Create a consolidated connection file that merges both approaches
        const serverConnection = await fs.readFile('server/infrastructure/database/connection.ts', 'utf-8');
        
        // Create a new consolidated connection file
        const consolidatedConnection = this.createConsolidatedConnection(serverConnection);
        
        await fs.writeFile('database/connection/consolidated-connection.ts', consolidatedConnection, 'utf-8');
        
        console.log('✅ Connection management consolidated');
        this.result.warnings.push('Review database/connection/consolidated-connection.ts for connection management consolidation');
      }
      
    } catch (error) {
      this.result.errors.push(`Connection consolidation failed: ${error}`);
    }
  }

  private createConsolidatedConnection(serverConnectionContent: string): string {
    const timestamp = new Date().toISOString();
    
    return `/**
 * Consolidated Database Connection Management
 * 
 * This file consolidates connection management from both the main database
 * infrastructure and the server infrastructure database.
 * 
 * Generated on: ${timestamp}
 */

// Import from the main database connection infrastructure
export * from './ProductionConnectionPool';
export * from './DatabaseCircuitBreaker';

// ============================================================================
// LEGACY SERVER CONNECTION FUNCTIONALITY
// This section contains the server infrastructure database connection code
// Review and integrate as needed, then remove this section
// ============================================================================

${serverConnectionContent}

// ============================================================================
// END LEGACY SERVER CONNECTION FUNCTIONALITY
// ============================================================================

// TODO: Review and integrate the above legacy connection code
// TODO: Update all imports to use the consolidated connection management
// TODO: Remove redundant functionality
// TODO: Test all connection-related functionality
`;
  }

  private async updateImportPaths(): Promise<void> {
    console.log('🔄 Updating import paths...');
    
    const importMappings = [
      {
        from: 'server/infrastructure/database/config/database.config',
        to: 'database/config'
      },
      {
        from: 'server/infrastructure/database/connection',
        to: 'database/connection'
      },
      {
        from: 'server/infrastructure/database/schemas/core',
        to: 'database/schemas/core'
      },
      {
        from: 'server/infrastructure/database/schemas/land-verification',
        to: 'database/schemas/verification'
      },
      {
        from: 'server/infrastructure/database/utils/database-utils',
        to: 'database/utils'
      },
      {
        from: 'server/infrastructure/database/types/database.types',
        to: 'database/types'
      },
      {
        from: 'server/infrastructure/database/QueryOptimizer',
        to: 'database/utils/QueryOptimizer'
      }
    ];

    // Create import path update script
    const updateScript = this.createImportUpdateScript(importMappings);
    await fs.writeFile('database/scripts/update-import-paths.ts', updateScript, 'utf-8');
    
    console.log('✅ Import path update script created');
    this.result.warnings.push('Run database/scripts/update-import-paths.ts to update all import paths');
  }

  private createImportUpdateScript(mappings: Array<{ from: string; to: string }>): string {
    return `#!/usr/bin/env tsx

/**
 * Import Path Update Script
 * 
 * This script updates all import paths from the old server infrastructure
 * database paths to the new consolidated database paths.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

const importMappings = ${JSON.stringify(mappings, null, 2)};

async function updateImportPaths() {
  console.log('🔄 Updating import paths...');
  
  // Find all TypeScript files
  const files = await glob('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
  });
  
  let filesUpdated = 0;
  
  for (const file of files) {
    try {
      let content = await fs.readFile(file, 'utf-8');
      let updated = false;
      
      for (const mapping of importMappings) {
        const oldImportRegex = new RegExp(
          \`from ['"].*\${mapping.from.replace(/\\//g, '\\\\/')}['\"]\`,
          'g'
        );
        
        if (oldImportRegex.test(content)) {
          content = content.replace(
            oldImportRegex,
            \`from '\${mapping.to}'\`
          );
          updated = true;
        }
      }
      
      if (updated) {
        await fs.writeFile(file, content, 'utf-8');
        filesUpdated++;
        console.log(\`✅ Updated: \${file}\`);
      }
      
    } catch (error) {
      console.error(\`❌ Failed to update \${file}:\`, error);
    }
  }
  
  console.log(\`🎉 Updated \${filesUpdated} files\`);
}

updateImportPaths().catch(console.error);
`;
  }

  private async validateConsolidation(): Promise<void> {
    console.log('✅ Validating consolidation...');
    
    // Check that key files exist
    const keyFiles = [
      'database/schemas/consolidated.ts',
      'database/connection/ProductionConnectionPool.ts',
      'database/config/database.config.ts',
      'database/utils/database-utils.ts'
    ];

    for (const file of keyFiles) {
      const exists = await this.fileExists(file);
      if (!exists) {
        this.result.errors.push(`Key file missing after consolidation: ${file}`);
      }
    }

    // Create validation report
    const report = this.createValidationReport();
    await fs.writeFile('database-consolidation-report.md', report, 'utf-8');
    
    console.log('📊 Consolidation report created: database-consolidation-report.md');
  }

  private createValidationReport(): string {
    return `# Database Consolidation Report

## Summary
- **Files Processed**: ${this.result.filesProcessed}
- **Files Merged**: ${this.result.filesMerged}
- **Files Skipped**: ${this.result.filesSkipped}
- **Errors**: ${this.result.errors.length}
- **Warnings**: ${this.result.warnings.length}

## Errors
${this.result.errors.map(error => `- ${error}`).join('\\n')}

## Warnings
${this.result.warnings.map(warning => `- ${warning}`).join('\\n')}

## Next Steps

1. **Review Merged Files**: Check all merged files for conflicts and redundancy
2. **Update Import Paths**: Run \`tsx database/scripts/update-import-paths.ts\`
3. **Test Functionality**: Run all database tests to ensure functionality is preserved
4. **Remove Redundant Files**: After validation, remove the old server infrastructure database files
5. **Update Documentation**: Update all documentation to reflect the new structure

## Files to Review

- \`database/connection/consolidated-connection.ts\` - Review connection management consolidation
- \`database/schemas/server-merged/\` - Review schema consolidation
- All merged files with "MERGED CONTENT" sections

## Validation Commands

\`\`\`bash
# Test database connection
npm run db:status

# Run database tests
npm test database/

# Validate schema consistency
npm run db:validate

# Test application functionality
npm run test:integration
\`\`\`
`;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Main execution
async function main() {
  const consolidator = new DatabaseConsolidator();
  const result = await consolidator.consolidate();
  
  console.log('\\n📊 Consolidation Results:');
  console.log(`Files Processed: ${result.filesProcessed}`);
  console.log(`Files Merged: ${result.filesMerged}`);
  console.log(`Files Skipped: ${result.filesSkipped}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Warnings: ${result.warnings.length}`);
  
  if (result.errors.length > 0) {
    console.log('\\n❌ Errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  process.exit(result.success ? 0 : 1);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DatabaseConsolidator };
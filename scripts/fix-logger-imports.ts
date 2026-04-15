/**
 * Script to fix logger imports from old location to new location
 * Old: from '../infrastructure/monitoring/logger'
 * New: from '../infrastructure/observability/telemetry'
 */

import * as fs from 'fs';
import * as path from 'path';

interface ImportFix {
  file: string;
  line: number;
  oldImport: string;
  newImport: string;
}

const fixes: ImportFix[] = [];

function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

async function fixLoggerImports() {
  const files = getAllTsFiles('server');

  console.log(`Found ${files.length} TypeScript files to process`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    let modified = false;
    const newLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const originalLine = line;

      // Fix logger imports from old monitoring location to new observability location
      if (line.includes('infrastructure/monitoring/logger')) {
        const oldImport = line;
        line = line.replace(
          /(['"])(.*)infrastructure\/monitoring\/logger(['"])/g,
          (match, quote1, prefix, quote2) => {
            return `${quote1}${prefix}infrastructure/observability/telemetry${quote2}`;
          }
        );
        
        if (line !== originalLine) {
          modified = true;
          fixes.push({
            file,
            line: i + 1,
            oldImport: originalLine.trim(),
            newImport: line.trim(),
          });
        }
      }

      newLines.push(line);
    }

    if (modified) {
      fs.writeFileSync(file, newLines.join('\n'), 'utf-8');
      console.log(`✓ Fixed ${file}`);
    }
  }

  console.log(`\n✅ Fixed ${fixes.length} logger imports in ${files.length} files`);
  
  // Write report
  const report = fixes.map(f => 
    `${f.file}:${f.line}\n  OLD: ${f.oldImport}\n  NEW: ${f.newImport}\n`
  ).join('\n');
  
  fs.writeFileSync('logger-import-fixes-report.txt', report);
  console.log('📄 Report written to logger-import-fixes-report.txt');
}

fixLoggerImports().catch(console.error);

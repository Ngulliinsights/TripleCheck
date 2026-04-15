/**
 * Script to fix logger API calls from old format to new Pino format
 * Old: logger.info('message', 'Component', { data })
 * New: logger.info({ data }, 'message')
 */

import * as fs from 'fs';
import * as path from 'path';

interface LoggerCall {
  file: string;
  line: number;
  oldCode: string;
  newCode: string;
}

const fixes: LoggerCall[] = [];

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

async function fixLoggerCalls() {
  // Find all TypeScript files
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

      // Pattern 1: logger.level('message', 'Component')
      line = line.replace(
        /logger\.(info|warn|error|debug)\((['"`])([^'"]+)\2,\s*(['"`])[^'"]+\4\)/g,
        (match, level, quote1, message) => {
          modified = true;
          return `logger.${level}('${message}')`;
        }
      );

      // Pattern 2: logger.level('message', 'Component', { data }) - keep message first, add data
      line = line.replace(
        /logger\.(info|warn|error|debug)\((['"`])([^'"]+)\2,\s*(['"`])[^'"]+\4,\s*(\{[^}]+\})\)/g,
        (match, level, quote1, message, quote2, data) => {
          modified = true;
          return `logger.${level}('${message}', ${data})`;
        }
      );

      // Pattern 3: logger.level('message', 'Component', undefined, error) - convert to message with error object
      line = line.replace(
        /logger\.(error|warn)\((['"`])([^'"]+)\2,\s*(['"`])[^'"]+\4,\s*undefined,\s*(\w+)\s+as\s+Error\)/g,
        (match, level, quote1, message, quote2, errorVar) => {
          modified = true;
          return `logger.${level}('${message}', { error: (${errorVar} as Error).message, stack: (${errorVar} as Error).stack })`;
        }
      );

      // Pattern 4: logger.level('message', error) - keep as is, Pino accepts this
      // No change needed for this pattern

      // Pattern 5: this.logger.level('message', 'Component')
      line = line.replace(
        /this\.logger\.(info|warn|error|debug)\((['"`])([^'"]+)\2,\s*(['"`])[^'"]+\4\)/g,
        (match, level, quote1, message) => {
          modified = true;
          return `this.logger.${level}('${message}')`;
        }
      );

      // Pattern 6: this.logger.level('message', error)
      line = line.replace(
        /this\.logger\.(error|warn)\((['"`])([^'"]+)\2,\s*(\w+)\)/g,
        (match, level, quote1, message, errorVar) => {
          modified = true;
          return `this.logger.${level}({ error: ${errorVar} }, '${message}')`;
        }
      );

      if (line !== originalLine) {
        fixes.push({
          file,
          line: i + 1,
          oldCode: originalLine.trim(),
          newCode: line.trim(),
        });
      }

      newLines.push(line);
    }

    if (modified) {
      fs.writeFileSync(file, newLines.join('\n'), 'utf-8');
      console.log(`✓ Fixed ${file}`);
    }
  }

  console.log(`\n✅ Fixed ${fixes.length} logger calls in ${files.length} files`);
  
  // Write report
  const report = fixes.map(f => 
    `${f.file}:${f.line}\n  OLD: ${f.oldCode}\n  NEW: ${f.newCode}\n`
  ).join('\n');
  
  fs.writeFileSync('logger-fixes-report.txt', report);
  console.log('📄 Report written to logger-fixes-report.txt');
}

fixLoggerCalls().catch(console.error);

import fs from 'fs';
import path from 'path';

const moduleMap = {
  'fs': 'fs',
  'path': 'path',
  'crypto': 'crypto',
  'express': 'express',
  'bcrypt': 'bcrypt',
  'chalk': 'chalk',
  'inquirer': 'inquirer',
  'postgres': 'postgres',
  'sharp': 'sharp',
  'multer': 'multer',
  'Redis': 'ioredis',
  'react': 'react',
  'userEvent': '@testing-library/user-event'
};

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f === 'node_modules') return;
      walk(dirPath, callback);
    } else {
      if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')) {
        callback(dirPath);
      }
    }
  });
}

function fixBaseline() {
  const dirs = ['client/src', 'server', 'shared', 'scripts', 'tests', 'types'];
  let fixedQuotesCount = 0;
  let fixedImportsCount = 0;
  let fixedRenamesCount = 0;

  dirs.forEach(dir => {
    walk(dir, (filePath) => {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;

      // FIX QUOTES
      // `from '../../local/components/ui/button"` -> `from "../../local/components/ui/button"`
      // Check for mismatched quotes in imports: from '..." or from "...\'
      content = content.replace(/from\s+'((?:[^'"])+)"/g, 'from "$1"');
      content = content.replace(/from\s+"((?:[^'"])+)'/g, "from '$1'");

      // Also fix single quote to double quote for strings globally in imports if mismatched like '...' but ending in "
      const lines = content.split('\n');
      lines.forEach((line, i) => {
         if (line.includes('from') && line.includes("'") && line.includes('"')) {
           lines[i] = line.replace(/from\s+'([^'"]+)"/g, 'from "$1"').replace(/from\s+"([^'"]+)'/g, "from '$1'");
         }
      });
      content = lines.join('\n');

      // FIX CLEANUP REDUNDANCIES
      content = content.replace(
        /import\s+(\w+)\s+from\s+(['"])[^'"]*\/scripts\/cleanup-redundancies\2/g,
        (match, importName, quote) => {
          const correctModule = moduleMap[importName];
          if (correctModule) {
            fixedImportsCount++;
            return `import ${importName} from ${quote}${correctModule}${quote}`;
          }
          return match;
        }
      );
      content = content.replace(
        /import\s+\{\s*([^\}]+)\s*\}\s*from\s+(['"])[^'"]*\/scripts\/cleanup-redundancies\2/g,
        (match, imports, quote) => {
          console.log(`Manual review needed for curly import: ${match} in ${filePath}`);
          return match;
        }
      );

      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        fixedQuotesCount++;
        console.log(`Fixed syntax/imports in ${filePath}`);
      }
    });
  });

  // Rename ConsolidatedTestFramework.ts to .tsx due to JSX content
  if (fs.existsSync('tests/shared/ConsolidatedTestFramework.ts')) {
     fs.renameSync('tests/shared/ConsolidatedTestFramework.ts', 'tests/shared/ConsolidatedTestFramework.tsx');
     fixedRenamesCount++;
     console.log('Renamed ConsolidatedTestFramework.ts to .tsx');
  }

  console.log(`Total: Fixed files=${fixedQuotesCount}, Imports mapped=${fixedImportsCount}, Renames=${fixedRenamesCount}`);
}

fixBaseline();

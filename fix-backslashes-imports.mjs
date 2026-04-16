import fs from 'fs';
import path from 'path';

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

function fixBackslashesInImports() {
  const dirs = ['client/src', 'server', 'shared', 'scripts', 'tests', 'types'];
  let fixedCount = 0;

  dirs.forEach(dir => {
    walk(dir, (filePath) => {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;

      // Only target lines starting with import or export, to avoid touching actual string logic containing backslashes
      content = content.replace(/^(import|export)\s+(.*?)\s+from\s+(['"])(.*?)['"]/gm, (match, imp_exp, vars, quote, impPath) => {
          if (impPath.includes('\\')) {
            const forwardSlashedPath = impPath.replace(/\\/g, '/');
            return `${imp_exp} ${vars} from ${quote}${forwardSlashedPath}${quote}`;
          }
          return match;
      });
      // also fix simple imports like `import '..\\something'`
      content = content.replace(/^import\s+(['"])(.*?)['"]/gm, (match, quote, impPath) => {
          if (impPath.includes('\\')) {
            const forwardSlashedPath = impPath.replace(/\\/g, '/');
            return `import ${quote}${forwardSlashedPath}${quote}`;
          }
          return match;
      });

      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        fixedCount++;
        console.log(`Fixed backslashes in ${filePath}`);
      }
    });
  });
  console.log(`Fixed backslashes in ${fixedCount} files`);
}

fixBackslashesInImports();

/**
 * Build Artifact Cleanup Script
 * 
 * Safely removes compiled .js, .js.map, .d.ts, and .d.ts.map files
 * that exist alongside their .ts/.tsx source files.
 * 
 * This ensures build outputs are NEVER mixed with raw source code.
 */

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

// Directories to scan (source code directories only)
const SOURCE_DIRS = ['client/src', 'server', 'shared', 'scripts', 'tests', 'types'];

// Directories to skip entirely
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.gemini']);

// Extensions that indicate a generated artifact
const ARTIFACT_EXTENSIONS = ['.js', '.js.map', '.d.ts', '.d.ts.map'];

// Source extensions that prove a .js file is a build artifact
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

let deletedCount = 0;
let skippedCount = 0;
let totalBytes = 0;

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(fullPath);
    } else {
      checkAndDelete(fullPath);
    }
  }
}

function checkAndDelete(filePath) {
  const ext = getFullExtension(filePath);
  
  if (!ARTIFACT_EXTENSIONS.includes(ext)) return;
  
  // Determine what the source file would be
  const baseName = stripArtifactExtension(filePath);
  
  // Check if a corresponding source file exists
  const hasSource = SOURCE_EXTENSIONS.some(srcExt => 
    fs.existsSync(baseName + srcExt)
  );
  
  if (hasSource) {
    const stats = fs.statSync(filePath);
    totalBytes += stats.size;
    fs.unlinkSync(filePath);
    deletedCount++;
    console.log(`  🗑️  ${path.relative(projectRoot, filePath)}`);
  } else {
    skippedCount++;
  }
}

function getFullExtension(filePath) {
  // Handle compound extensions like .d.ts, .d.ts.map, .js.map
  const name = path.basename(filePath);
  
  if (name.endsWith('.d.ts.map')) return '.d.ts.map';
  if (name.endsWith('.d.ts')) return '.d.ts';
  if (name.endsWith('.js.map')) return '.js.map';
  if (name.endsWith('.js')) return '.js';
  
  return path.extname(filePath);
}

function stripArtifactExtension(filePath) {
  const name = filePath;
  
  if (name.endsWith('.d.ts.map')) return name.slice(0, -'.d.ts.map'.length);
  if (name.endsWith('.d.ts')) return name.slice(0, -'.d.ts'.length);
  if (name.endsWith('.js.map')) return name.slice(0, -'.js.map'.length);
  if (name.endsWith('.js')) return name.slice(0, -'.js'.length);
  
  return name;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Main execution
console.log('🧹 Build Artifact Cleanup');
console.log('========================');
console.log('Scanning source directories for generated .js/.d.ts files...\n');

for (const dir of SOURCE_DIRS) {
  const fullDir = path.join(projectRoot, dir);
  if (fs.existsSync(fullDir)) {
    console.log(`📂 Scanning ${dir}/`);
    walk(fullDir);
  }
}

console.log('\n========================');
console.log(`✅ Deleted: ${deletedCount} build artifacts (${formatBytes(totalBytes)})`);
console.log(`⏭️  Skipped: ${skippedCount} JS-only files (no .ts source)`);
console.log('========================');

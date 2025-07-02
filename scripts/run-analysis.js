
/**
 * TripleCheck Code Analysis Runner
 * 
 * Simple JavaScript wrapper to run the TypeScript analysis
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runAnalysis() {
  try {
    console.log('🚀 Starting TripleCheck code analysis...\n');
    
    // Compile and run the TypeScript analyzer
    const { stdout, stderr } = await execAsync('npx tsx scripts/code-analysis.ts');
    
    if (stderr) {
      console.error('Analysis warnings:', stderr);
    }
    
    console.log(stdout);
    
  } catch (error) {
    console.error('Analysis failed:', error.message);
    process.exit(1);
  }
}

runAnalysis();

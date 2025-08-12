/**
 * Python Generator Runner
 * 
 * Utility for running Python data generators from TypeScript
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export interface PythonRunnerConfig {
  script: string;
  args: string[];
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface PythonRunnerResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

/**
 * Runs Python data generation scripts
 */
export class PythonGeneratorRunner {
  private pythonPath: string;

  constructor(pythonPath: string = 'python') {
    this.pythonPath = pythonPath;
  }

  /**
   * Run a Python script with the given configuration
   */
  async run(config: PythonRunnerConfig): Promise<PythonRunnerResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const process = spawn(this.pythonPath, [config.script, ...config.args], {
        cwd: config.cwd || path.dirname(config.script),
        env: { ...process.env, ...config.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code || 0,
          duration
        });
      });

      process.on('error', (error) => {
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          stdout,
          stderr: stderr + error.message,
          exitCode: -1,
          duration
        });
      });

      // Set timeout if specified
      if (config.timeout) {
        setTimeout(() => {
          process.kill();
          const duration = Date.now() - startTime;
          resolve({
            success: false,
            stdout,
            stderr: `${stderr  }Process timeout`,
            exitCode: -1,
            duration
          });
        }, config.timeout);
      }
    });
  }

  /**
   * Check if Python is available
   */
  async checkPython(): Promise<boolean> {
    try {
      const result = await this.run({
        script: '-c',
        args: ['print("Python available")'],
        timeout: 5000
      });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Install Python dependencies
   */
  async installDependencies(packages: string[]): Promise<PythonRunnerResult> {
    return this.run({
      script: '-m',
      args: ['pip', 'install', ...packages],
      timeout: 300000 // 5 minutes
    });
  }

  /**
   * Check if Python packages are installed
   */
  async checkDependencies(packages: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const pkg of packages) {
      try {
        const result = await this.run({
          script: '-c',
          args: [`import ${pkg}`],
          timeout: 5000
        });
        results[pkg] = result.success;
      } catch {
        results[pkg] = false;
      }
    }
    
    return results;
  }
}
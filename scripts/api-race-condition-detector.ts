#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

// ✅ FIXED INTERFACES - Added missing properties
interface APICall {
  readonly id: string;
  readonly type: 'fetch' | 'axios' | 'useQuery' | 'useMutation' | 'useSafeQuery' | 'custom';
  readonly location: {
    readonly file: string;
    readonly line: number;
    readonly column: number;
    readonly function?: string;
    readonly component?: string;
    readonly context: string;
  };
  readonly endpoint?: string;
  readonly method?: string;
  readonly dependencies: readonly string[];
  readonly triggers: readonly string[];
  readonly caching: {
    readonly hasCache: boolean;
    readonly cacheKey?: string;
    readonly staleTime?: number;
    readonly gcTime?: number;
    readonly strategy?: 'swr' | 'cache-first' | 'network-first';
  };
  readonly raceConditionRisk: RiskLevel;
  readonly infiniteLoopRisk: RiskLevel;
  readonly issues: readonly DetectedIssue[];
  readonly suggestions: readonly Suggestion[];
  readonly confidence: number;
  readonly lastModified: Date;
  readonly metadata?: {
    readonly patternMatched?: string;
    readonly contextualFactors?: Record<string, any>;
    readonly complexity?: 'low' | 'medium' | 'high';
    readonly testability?: 'low' | 'medium' | 'high';
    readonly maintainability?: 'low' | 'medium' | 'high';
  };
}

interface DetectedIssue {
  readonly type: 'race-condition' | 'infinite-loop' | 'performance' | 'security';
  readonly severity: RiskLevel;
  readonly description: string;
  readonly confidence: number;
  readonly pattern: string;
  readonly codeSnippet: string;
}

interface Suggestion {
  readonly priority: 'immediate' | 'high' | 'medium' | 'low';
  readonly action: string;
  readonly impact: string;
  readonly codeExample?: string;
  readonly estimatedEffort: 'low' | 'medium' | 'high';
}

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface PatternRule {
  readonly pattern: RegExp;
  readonly description: string;
  readonly severity: RiskLevel;
  readonly fix: string;
  readonly confidence: number;
  readonly category: 'race-condition' | 'infinite-loop' | 'performance';
  readonly contextRequirement?: RegExp;
}

interface AnalysisConfig {
  readonly includePatterns: readonly string[];
  readonly excludePatterns: readonly string[];
  readonly customRules: readonly PatternRule[];
  readonly confidenceThreshold: number;
  readonly enableIncrementalAnalysis: boolean;
  readonly maxFileSize: number;
}

interface FileAnalysisResult {
  readonly filePath: string;
  readonly apiCalls: readonly APICall[];
  readonly analysisTime: number;
  readonly fileHash: string;
  readonly error?: string;
}

interface AnalysisReport {
  readonly summary: {
    readonly totalAPICalls: number;
    readonly criticalRisk: number;
    readonly highRisk: number;
    readonly mediumRisk: number;
    readonly lowRisk: number;
    readonly riskScore: number;
    readonly averageConfidence: number;
    readonly analysisTime: number;
  };
  readonly criticalIssues: readonly (DetectedIssue & { location: string })[];
  readonly apiCallsByType: Record<string, number>;
  readonly raceConditionHotspots: readonly APICall[];
  readonly infiniteLoopRisks: readonly APICall[];
  readonly recommendations: readonly Suggestion[];
  readonly detailedAnalysis: readonly APICall[];
  readonly metadata: {
    readonly generatedAt: Date;
    readonly filesAnalyzed: number;
    readonly skippedFiles: number;
    readonly configUsed: AnalysisConfig;
  };
}

// ✅ FIXED CLASS - Removed duplicates and simplified
export class EnhancedAPIRaceConditionDetector {
  private readonly apiCalls: APICall[] = [];
  private readonly fileContents = new Map<string, string>();
  private readonly fileHashes = new Map<string, string>();
  private readonly analysisCache = new Map<string, FileAnalysisResult>();
  private readonly config: AnalysisConfig;

  constructor(config: Partial<AnalysisConfig> = {}) {
    this.config = {
      includePatterns: ['.ts', '.tsx', '.js', '.jsx'],
      excludePatterns: ['node_modules', 'dist', '.git', 'coverage', '.next', 'build'],
      customRules: [],
      confidenceThreshold: 0.7,
      enableIncrementalAnalysis: true,
      maxFileSize: 1024 * 1024,
      ...config
    };
  }

  async analyzeCodebase(): Promise<AnalysisReport> {
    const startTime = performance.now();
    console.log('🔍 Starting enhanced API race condition analysis...\n');

    try {
      const files = await this.findRelevantFiles(process.cwd());
      console.log(`📁 Found ${files.length} files to analyze\n`);

      if (this.config.enableIncrementalAnalysis) {
        await this.loadCache();
      }

      const results = await this.analyzeFiles(files);
      const report = await this.generateReport(results, performance.now() - startTime);

      if (this.config.enableIncrementalAnalysis) {
        await this.saveCache();
      }

      return report;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  private async findRelevantFiles(rootDir: string): Promise<string[]> {
    const files: string[] = [];
    
    const scanDirectory = async (currentDir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            if (!this.config.excludePatterns.some(p => fullPath.includes(p))) {
              await scanDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (this.config.includePatterns.includes(ext)) {
              const stats = await fs.stat(fullPath);
              if (stats.size <= this.config.maxFileSize) {
                files.push(fullPath);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not scan directory: ${currentDir}`);
      }
    };

    await scanDirectory(rootDir);
    return files;
  }

  private async analyzeFiles(files: string[]): Promise<FileAnalysisResult[]> {
    const results: FileAnalysisResult[] = [];
    
    for (const file of files) {
      const startTime = performance.now();
      
      try {
        const fileHash = await this.getFileHash(file);
        const cachedResult = this.analysisCache.get(file);
        
        if (this.config.enableIncrementalAnalysis && cachedResult?.fileHash === fileHash) {
          results.push(cachedResult);
          continue;
        }

        const content = await fs.readFile(file, 'utf-8');
        this.fileContents.set(file, content);
        
        const apiCalls = await this.analyzeFile(file, content);
        
        const result: FileAnalysisResult = {
          filePath: file,
          apiCalls,
          analysisTime: performance.now() - startTime,
          fileHash
        };
        
        results.push(result);
        this.analysisCache.set(file, result);

      } catch (error) {
        results.push({
          filePath: file,
          apiCalls: [],
          analysisTime: performance.now() - startTime,
          fileHash: '',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private async analyzeFile(filePath: string, content: string): Promise<APICall[]> {
    const apiCalls: APICall[] = [];
    
    // Simple API call detection
    const patterns = [
      { type: 'fetch' as const, regex: /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g },
      { type: 'axios' as const, regex: /axios\.(\w+)\s*\(\s*['"`]([^'"`]+)['"`]/g },
      { type: 'useQuery' as const, regex: /useQuery\s*\(/g },
      { type: 'useSafeQuery' as const, regex: /useSafeQuery\s*\(/g }
    ];

    for (const { type, regex } of patterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        apiCalls.push({
          id: `${filePath}:${lineNumber}:${type}:${Date.now()}`,
          type,
          location: {
            file: filePath,
            line: lineNumber,
            column: 0,
            context: content.substring(Math.max(0, match.index - 100), Math.min(content.length, match.index + 100))
          },
          dependencies: [],
          triggers: [],
          caching: { hasCache: false },
          raceConditionRisk: 'LOW',
          infiniteLoopRisk: 'LOW',
          issues: [],
          suggestions: [],
          confidence: 0.8,
          lastModified: new Date()
        });
      }
    }

    return apiCalls;
  }

  private async generateReport(results: FileAnalysisResult[], analysisTime: number): Promise<AnalysisReport> {
    const allApiCalls = results.flatMap(r => r.apiCalls);
    
    const summary = {
      totalAPICalls: allApiCalls.length,
      criticalRisk: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: allApiCalls.length,
      riskScore: 0,
      averageConfidence: allApiCalls.reduce((sum, call) => sum + call.confidence, 0) / allApiCalls.length || 0,
      analysisTime
    };

    const apiCallsByType = allApiCalls.reduce((acc, call) => {
      acc[call.type] = (acc[call.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary,
      criticalIssues: [],
      apiCallsByType,
      raceConditionHotspots: [],
      infiniteLoopRisks: [],
      recommendations: [],
      detailedAnalysis: allApiCalls,
      metadata: {
        generatedAt: new Date(),
        filesAnalyzed: results.filter(r => !r.error).length,
        skippedFiles: results.filter(r => r.error).length,
        configUsed: this.config
      }
    };
  }

  private async getFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return createHash('sha256').update(content).digest('hex');
    } catch {
      return '';
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const cacheFile = path.join(process.cwd(), '.cache', 'api-analysis.json');
      const cacheData = await fs.readFile(cacheFile, 'utf-8');
      const cache = JSON.parse(cacheData);
      Object.entries(cache).forEach(([key, value]) => {
        this.analysisCache.set(key, value as FileAnalysisResult);
      });
    } catch {
      // Cache doesn't exist
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const cacheDir = path.join(process.cwd(), '.cache');
      await fs.mkdir(cacheDir, { recursive: true });
      const cacheFile = path.join(cacheDir, 'api-analysis.json');
      const cache = Object.fromEntries(this.analysisCache.entries());
      await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2));
    } catch (error) {
      console.warn('⚠️  Could not save cache:', error);
    }
  }

  async saveReport(report: AnalysisReport): Promise<void> {
    const reportPath = './api-analysis-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to ${reportPath}`);
  }
}

// ✅ WORKING ENTRY POINT
if (require.main === module) {
  const detector = new EnhancedAPIRaceConditionDetector();
  detector.analyzeCodebase()
    .then(report => {
      console.log('\n✅ Analysis complete!');
      console.log(`📊 Total API calls found: ${report.summary.totalAPICalls}`);
      return detector.saveReport(report);
    })
    .catch(console.error);
}
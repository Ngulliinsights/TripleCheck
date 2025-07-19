import { StreamingJSONProcessor } from './streaming-json-processor';
import path from 'path';
import { storage } from '../server/storage';

// Property fraud analysis interface
interface FraudAnalysisResult {
  propertyId: string;
  riskScore: number;
  fraudIndicators: string[];
  recommendations: string[];
  processedAt: Date;
}

// Fraud detection rules
class FraudDetector {
  static analyzeProperty(property: any): FraudAnalysisResult {
    const indicators: string[] = [];
    let riskScore = 0;

    // Price anomaly detection
    const pricePerSqFt = property.price / property.squareFeet;
    if (pricePerSqFt > 10000) { // Unusually high price per sq ft
      indicators.push('Unusually high price per square foot');
      riskScore += 30;
    }
    if (pricePerSqFt < 100) { // Suspiciously low price
      indicators.push('Suspiciously low price per square foot');
      riskScore += 25;
    }

    // Property age vs last sale date inconsistency
    const currentYear = new Date().getFullYear();
    const yearBuilt = property.yearBuilt;
    const lastSaleYear = new Date(property.lastSaleDate).getFullYear();
    
    if (lastSaleYear < yearBuilt) {
      indicators.push('Last sale date before construction year');
      riskScore += 40;
    }

    // Bathroom to bedroom ratio anomaly
    const bathroomRatio = property.features.bathrooms / property.features.bedrooms;
    if (bathroomRatio > 2) {
      indicators.push('Unusual bathroom to bedroom ratio');
      riskScore += 15;
    }

    // Missing or suspicious image URLs
    if (!property.imageUrls || property.imageUrls.length === 0) {
      indicators.push('No property images provided');
      riskScore += 20;
    }

    // Description quality check
    if (property.description.length < 50) {
      indicators.push('Insufficient property description');
      riskScore += 10;
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskScore > 50) {
      recommendations.push('Require additional documentation');
      recommendations.push('Manual verification recommended');
    }
    if (riskScore > 30) {
      recommendations.push('Request property photos');
      recommendations.push('Verify ownership documents');
    }
    if (indicators.includes('Suspiciously low price per square foot')) {
      recommendations.push('Market price comparison required');
    }

    return {
      propertyId: property.id,
      riskScore: Math.min(riskScore, 100),
      fraudIndicators: indicators,
      recommendations,
      processedAt: new Date()
    };
  }
}

// Progress display utility
class ProgressDisplay {
  private lastUpdate = 0;
  private startTime = Date.now();

  display(stats: any): void {
    const now = Date.now();
    if (now - this.lastUpdate < 1000) return; // Update every second
    
    this.lastUpdate = now;
    const elapsed = (now - this.startTime) / 1000;
    const rate = stats.processedRecords / elapsed;
    
    console.clear();
    console.log('🔄 Streaming JSON Processor - Fraudulent Properties Analysis');
    console.log('═'.repeat(60));
    console.log(`📊 Processed: ${stats.processedRecords.toLocaleString()} records`);
    console.log(`⚠️  Errors: ${stats.errorRecords.toLocaleString()}`);
    console.log(`⏭️  Skipped: ${stats.skippedRecords.toLocaleString()}`);
    console.log(`📦 Batches: ${stats.currentBatch.toLocaleString()}`);
    console.log(`⚡ Rate: ${rate.toFixed(1)} records/sec`);
    console.log(`⏱️  Elapsed: ${elapsed.toFixed(1)}s`);
    
    if (stats.estimatedTimeRemaining > 0) {
      console.log(`⏳ ETA: ${stats.estimatedTimeRemaining.toFixed(1)}s`);
    }
    
    // Progress bar
    if (stats.totalRecords > 0) {
      const progress = (stats.processedRecords / stats.totalRecords) * 100;
      const barLength = 40;
      const filledLength = Math.round((progress / 100) * barLength);
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      console.log(`\n[${bar}] ${progress.toFixed(1)}%`);
    }
  }
}

// Main processing function
async function processFraudulentProperties() {
  const datasetPath = path.join(__dirname, 'data-generation', 'fraudulent_property_dataset.json');
  const progressDisplay = new ProgressDisplay();
  const fraudResults: FraudAnalysisResult[] = [];
  
  console.log('🚀 Starting fraudulent property analysis...');
  console.log(`📁 Dataset: ${datasetPath}`);

  const processor = new StreamingJSONProcessor({
    batchSize: 50,
    checkpointInterval: 500,
    resumeFromCheckpoint: process.argv.includes('--resume'),
    
    onProgress: (stats) => {
      progressDisplay.display(stats);
    },
    
    onRecord: async (property, index) => {
      // Analyze each property for fraud indicators
      const analysis = FraudDetector.analyzeProperty(property);
      
      // Add analysis results to the property
      return {
        ...property,
        fraudAnalysis: analysis,
        processedAt: new Date().toISOString()
      };
    },
    
    onBatch: async (batch, startIndex) => {
      // Process batch of analyzed properties
      const highRiskProperties = batch.filter(p => p.fraudAnalysis.riskScore > 50);
      const mediumRiskProperties = batch.filter(p => p.fraudAnalysis.riskScore > 25 && p.fraudAnalysis.riskScore <= 50);
      
      console.log(`\n📊 Batch ${Math.floor(startIndex / 50) + 1} Analysis:`);
      console.log(`   🔴 High Risk: ${highRiskProperties.length}`);
      console.log(`   🟡 Medium Risk: ${mediumRiskProperties.length}`);
      console.log(`   🟢 Low Risk: ${batch.length - highRiskProperties.length - mediumRiskProperties.length}`);
      
      // Store results for final report
      fraudResults.push(...batch.map(p => p.fraudAnalysis));
      
      // Simulate database insertion (replace with actual DB calls)
      try {
        // await storage.insertFraudAnalysisResults(batch.map(p => p.fraudAnalysis));
        console.log(`   ✅ Batch processed successfully`);
      } catch (error) {
        console.error(`   ❌ Batch processing error:`, error);
        throw error;
      }
    },
    
    onError: (error, record, index) => {
      console.error(`\n❌ Error processing record ${index}:`, error.message);
      if (record) {
        console.error(`   Property ID: ${record.id || 'Unknown'}`);
      }
    }
  });

  // Set up event handlers
  processor.on('start', () => {
    console.log('✅ Processing started');
  });

  processor.on('paused', () => {
    console.log('\n⏸️  Processing paused');
  });

  processor.on('resumed', () => {
    console.log('\n▶️  Processing resumed');
  });

  processor.on('complete', (stats) => {
    console.clear();
    console.log('🎉 Processing Complete!');
    console.log('═'.repeat(50));
    generateFinalReport(stats, fraudResults);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Graceful shutdown initiated...');
    processor.pause();
    setTimeout(() => {
      processor.stop();
      process.exit(0);
    }, 2000);
  });

  // Start processing
  try {
    await processor.processFile(datasetPath);
  } catch (error) {
    console.error('💥 Processing failed:', error);
    process.exit(1);
  }
}

function generateFinalReport(stats: any, results: FraudAnalysisResult[]) {
  const highRisk = results.filter(r => r.riskScore > 50);
  const mediumRisk = results.filter(r => r.riskScore > 25 && r.riskScore <= 50);
  const lowRisk = results.filter(r => r.riskScore <= 25);
  
  console.log(`📈 Final Analysis Report`);
  console.log(`   Total Properties: ${results.length.toLocaleString()}`);
  console.log(`   🔴 High Risk: ${highRisk.length.toLocaleString()} (${((highRisk.length/results.length)*100).toFixed(1)}%)`);
  console.log(`   🟡 Medium Risk: ${mediumRisk.length.toLocaleString()} (${((mediumRisk.length/results.length)*100).toFixed(1)}%)`);
  console.log(`   🟢 Low Risk: ${lowRisk.length.toLocaleString()} (${((lowRisk.length/results.length)*100).toFixed(1)}%)`);
  
  console.log(`\n⚡ Performance Stats:`);
  console.log(`   Processing Rate: ${stats.processingRate.toFixed(1)} records/sec`);
  console.log(`   Total Time: ${((Date.now() - stats.startTime.getTime()) / 1000).toFixed(1)}s`);
  console.log(`   Errors: ${stats.errorRecords}`);
  
  // Top fraud indicators
  const allIndicators = results.flatMap(r => r.fraudIndicators);
  const indicatorCounts = allIndicators.reduce((acc, indicator) => {
    acc[indicator] = (acc[indicator] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`\n🚨 Top Fraud Indicators:`);
  Object.entries(indicatorCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([indicator, count]) => {
      console.log(`   • ${indicator}: ${count} properties`);
    });
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
🔧 Fraudulent Property Processor

Usage:
  npm run process:fraud                    # Start fresh processing
  npm run process:fraud -- --resume       # Resume from checkpoint
  
Controls:
  Ctrl+C                                   # Pause and save checkpoint
  
Features:
  ✅ Memory-efficient streaming
  ✅ Progress tracking with ETA
  ✅ Pause/resume with checkpoints
  ✅ Batch processing
  ✅ Error handling and recovery
  ✅ Real-time fraud analysis
    `);
    process.exit(0);
  }
  
  processFraudulentProperties().catch(console.error);
}

export { FraudDetector, processFraudulentProperties };
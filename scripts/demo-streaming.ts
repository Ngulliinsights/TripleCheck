import { StreamingJSONProcessor } from './streaming-json-processor';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fraud detection for demo
function analyzeFraud(property: any) {
  const indicators: string[] = [];
  let riskScore = 0;

  // Price anomaly detection
  const pricePerSqFt = property.price / property.squareFeet;
  if (pricePerSqFt > 10000) {
    indicators.push('Unusually high price per square foot');
    riskScore += 30;
  }
  if (pricePerSqFt < 100) {
    indicators.push('Suspiciously low price per square foot');
    riskScore += 40;
  }

  // Property age inconsistency
  const currentYear = new Date().getFullYear();
  if (property.yearBuilt > currentYear) {
    indicators.push('Future construction year');
    riskScore += 50;
  }

  // Bathroom to bedroom ratio
  const bathroomRatio = property.features.bathrooms / Math.max(property.features.bedrooms, 1);
  if (bathroomRatio > 3) {
    indicators.push('Unusual bathroom to bedroom ratio');
    riskScore += 25;
  }

  // Description quality
  if (property.description.length < 20) {
    indicators.push('Insufficient property description');
    riskScore += 15;
  }

  return {
    riskScore: Math.min(riskScore, 100),
    indicators,
    riskLevel: riskScore > 50 ? 'HIGH' : riskScore > 25 ? 'MEDIUM' : 'LOW'
  };
}

async function demonstrateStreamingProcessor() {
  console.log('🚀 Streaming JSON Processor - Complete Demo');
  console.log('═'.repeat(60));
  
  const sampleDataPath = path.join(__dirname, 'sample-data.json');
  console.log(`📁 Processing: ${path.basename(sampleDataPath)}`);
  
  let processedProperties: any[] = [];
  let fraudAnalysis: any[] = [];
  
  const processor = new StreamingJSONProcessor({
    batchSize: 2, // Small batches for demo
    checkpointInterval: 3, // Frequent checkpoints for demo
    resumeFromCheckpoint: false,
    
    onRecord: async (property, index) => {
      console.log(`\n📄 Processing Record ${index + 1}:`);
      console.log(`   🏠 ${property.title}`);
      console.log(`   📍 ${property.location}`);
      console.log(`   💰 $${property.price.toLocaleString()}`);
      console.log(`   📐 ${property.squareFeet} sq ft`);
      
      // Perform fraud analysis
      const analysis = analyzeFraud(property);
      console.log(`   🔍 Risk Level: ${analysis.riskLevel} (Score: ${analysis.riskScore})`);
      
      if (analysis.indicators.length > 0) {
        console.log(`   ⚠️  Fraud Indicators:`);
        analysis.indicators.forEach(indicator => {
          console.log(`      • ${indicator}`);
        });
      }
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        ...property,
        fraudAnalysis: analysis,
        processedAt: new Date().toISOString(),
        processingIndex: index
      };
    },
    
    onBatch: async (batch, startIndex) => {
      console.log(`\n📦 Batch Processing (${batch.length} properties, starting at ${startIndex}):`);
      
      const highRisk = batch.filter(p => p.fraudAnalysis.riskLevel === 'HIGH');
      const mediumRisk = batch.filter(p => p.fraudAnalysis.riskLevel === 'MEDIUM');
      const lowRisk = batch.filter(p => p.fraudAnalysis.riskLevel === 'LOW');
      
      console.log(`   🔴 High Risk: ${highRisk.length}`);
      console.log(`   🟡 Medium Risk: ${mediumRisk.length}`);
      console.log(`   🟢 Low Risk: ${lowRisk.length}`);
      
      // Store results
      processedProperties.push(...batch);
      fraudAnalysis.push(...batch.map(p => p.fraudAnalysis));
      
      // Simulate database operations
      console.log(`   💾 Saving batch to database...`);
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(`   ✅ Batch saved successfully`);
    },
    
    onProgress: (stats) => {
      console.log(`\n⚡ Progress Update:`);
      console.log(`   📊 Processed: ${stats.processedRecords} records`);
      console.log(`   🚀 Rate: ${stats.processingRate.toFixed(1)} records/sec`);
      console.log(`   ❌ Errors: ${stats.errorRecords}`);
      console.log(`   📦 Batches: ${stats.currentBatch}`);
    },
    
    onError: (error, record, index) => {
      console.error(`\n❌ Error processing record ${index}:`);
      console.error(`   Error: ${error.message}`);
      if (record) {
        console.error(`   Property: ${record.title || record.id || 'Unknown'}`);
      }
    }
  });

  // Event handlers
  processor.on('start', () => {
    console.log('\n🎬 Processing Started');
    console.log('   Features demonstrated:');
    console.log('   ✅ Memory-efficient streaming');
    console.log('   ✅ Real-time fraud detection');
    console.log('   ✅ Progress tracking');
    console.log('   ✅ Batch processing');
    console.log('   ✅ Error handling');
  });

  processor.on('complete', (stats) => {
    console.log('\n🎉 Processing Complete!');
    console.log('═'.repeat(50));
    
    // Final statistics
    console.log('📈 Final Statistics:');
    console.log(`   Total Properties: ${stats.processedRecords}`);
    console.log(`   Processing Time: ${((Date.now() - stats.startTime.getTime()) / 1000).toFixed(2)}s`);
    console.log(`   Average Rate: ${stats.processingRate.toFixed(2)} records/sec`);
    console.log(`   Memory Used: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Errors: ${stats.errorRecords}`);
    console.log(`   Batches Processed: ${stats.currentBatch}`);
    
    // Fraud analysis summary
    console.log('\n🚨 Fraud Analysis Summary:');
    const highRiskCount = fraudAnalysis.filter(a => a.riskLevel === 'HIGH').length;
    const mediumRiskCount = fraudAnalysis.filter(a => a.riskLevel === 'MEDIUM').length;
    const lowRiskCount = fraudAnalysis.filter(a => a.riskLevel === 'LOW').length;
    
    console.log(`   🔴 High Risk: ${highRiskCount} (${((highRiskCount/fraudAnalysis.length)*100).toFixed(1)}%)`);
    console.log(`   🟡 Medium Risk: ${mediumRiskCount} (${((mediumRiskCount/fraudAnalysis.length)*100).toFixed(1)}%)`);
    console.log(`   🟢 Low Risk: ${lowRiskCount} (${((lowRiskCount/fraudAnalysis.length)*100).toFixed(1)}%)`);
    
    // Top fraud indicators
    const allIndicators = fraudAnalysis.flatMap(a => a.indicators);
    const indicatorCounts = allIndicators.reduce((acc, indicator) => {
      acc[indicator] = (acc[indicator] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    if (Object.keys(indicatorCounts).length > 0) {
      console.log('\n🔍 Most Common Fraud Indicators:');
      Object.entries(indicatorCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([indicator, count]) => {
          console.log(`   • ${indicator}: ${count} properties`);
        });
    }
    
    console.log('\n✨ Demo completed successfully!');
    console.log('🔧 This streaming processor can handle:');
    console.log('   • Files of any size (GB+)');
    console.log('   • Real-time processing and analysis');
    console.log('   • Pause/resume functionality');
    console.log('   • Checkpoint-based recovery');
    console.log('   • Memory-efficient operations');
  });

  try {
    console.log('\n🚀 Starting demonstration...');
    await processor.processFile(sampleDataPath);
    
  } catch (error) {
    console.error('\n💥 Demo failed:', error);
  }
}

// Pause/Resume demo
async function demonstratePauseResume() {
  console.log('\n🔄 Pause/Resume Demo');
  console.log('═'.repeat(30));
  
  const processor = new StreamingJSONProcessor({
    batchSize: 1,
    checkpointInterval: 2,
    resumeFromCheckpoint: true, // This will resume from checkpoint if exists
    
    onRecord: async (record, index) => {
      console.log(`Processing: ${record.title}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...record, processed: true };
    },
    
    onBatch: async (batch) => {
      console.log(`Batch completed: ${batch.length} records`);
    }
  });

  processor.on('start', () => {
    console.log('✅ Started (will auto-pause after 3 seconds)');
    
    // Auto-pause for demo
    setTimeout(() => {
      console.log('⏸️  Auto-pausing...');
      processor.pause();
      
      // Auto-resume after 2 seconds
      setTimeout(() => {
        console.log('▶️  Auto-resuming...');
        processor.resume();
      }, 2000);
    }, 3000);
  });

  const sampleDataPath = path.join(__dirname, 'sample-data.json');
  await processor.processFile(sampleDataPath);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--pause-demo')) {
    await demonstratePauseResume();
  } else {
    await demonstrateStreamingProcessor();
  }
}

main().catch(console.error);
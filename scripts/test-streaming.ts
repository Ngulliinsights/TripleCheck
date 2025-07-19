import { StreamingJSONProcessor } from './streaming-json-processor';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testStreamingProcessor() {
  console.log('🧪 Testing Streaming JSON Processor...');
  
  const datasetPath = path.join(__dirname, 'data-generation', 'fraudulent_property_dataset.json');
  console.log(`📁 Dataset path: ${datasetPath}`);
  
  let recordCount = 0;
  let batchCount = 0;
  
  const processor = new StreamingJSONProcessor({
    batchSize: 5,
    checkpointInterval: 10,
    
    onRecord: (record, index) => {
      recordCount++;
      if (recordCount <= 3) {
        console.log(`📄 Record ${index}: ${record.title || record.id || 'Unknown'}`);
      }
      return { ...record, processed: true };
    },
    
    onBatch: async (batch, startIndex) => {
      batchCount++;
      console.log(`📦 Batch ${batchCount}: ${batch.length} records (starting at ${startIndex})`);
    },
    
    onProgress: (stats) => {
      if (stats.processedRecords % 50 === 0) {
        console.log(`⚡ Progress: ${stats.processedRecords} records processed`);
      }
    },
    
    onError: (error, record, index) => {
      console.error(`❌ Error at record ${index}:`, error.message);
    }
  });

  try {
    const stats = await processor.processFile(datasetPath);
    
    console.log('\n✅ Test completed successfully!');
    console.log(`📊 Final stats:`);
    console.log(`   - Processed: ${stats.processedRecords} records`);
    console.log(`   - Batches: ${batchCount}`);
    console.log(`   - Errors: ${stats.errorRecords}`);
    console.log(`   - Rate: ${stats.processingRate.toFixed(1)} records/sec`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStreamingProcessor().catch(console.error);
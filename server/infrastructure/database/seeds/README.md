# Unified Data Generation System

A comprehensive, scenario-based data generation system that consolidates existing Python generators into a TypeScript orchestrator, supporting multiple data scenarios with configurable volumes and intelligent relationship patterns.

## 🎯 Overview

The Unified Data Generation System provides:

- **5 Predefined Scenarios**: From minimal testing (100 records) to performance testing (1M+ records)
- **Python Integration**: Seamless integration with existing Python generators with TypeScript fallback
- **Progress Tracking**: Real-time progress monitoring with detailed statistics
- **Data Validation**: Comprehensive validation and quality assurance
- **CLI Interface**: Easy-to-use command-line interface for all operations
- **Checkpoint Management**: Resume interrupted generations and track progress

## 🚀 Quick Start

### List Available Scenarios

```bash
npm run data:unified:list
```

### Generate Data for Development

```bash
npm run data:unified:dev
```

### Generate Minimal Test Data

```bash
npm run data:unified:minimal
```

### Check System Status

```bash
npm run data:unified:status
```

## 📊 Available Scenarios

### 1. Minimal (`minimal`)
- **Purpose**: Quick testing and development
- **Records**: 100 users, 200 properties, 50 reviews
- **Features**: Basic fraud patterns, land verification
- **Duration**: ~30 seconds

### 2. Development (`development`)
- **Purpose**: Regular development and feature testing
- **Records**: 5K users, 10K properties, 2K reviews
- **Features**: Full feature set except analytics
- **Duration**: ~5 minutes

### 3. Testing (`testing`)
- **Purpose**: Comprehensive testing and QA
- **Records**: 25K users, 50K properties, 10K reviews
- **Features**: Complete feature set with analytics
- **Duration**: ~15 minutes

### 4. Performance (`performance`)
- **Purpose**: Load testing and performance validation
- **Records**: 100K users, 200K properties, 50K reviews
- **Features**: Complete feature set optimized for performance
- **Duration**: ~45 minutes

### 5. Demo (`demo`)
- **Purpose**: Investor presentations and demonstrations
- **Records**: 10K users, 15K properties, 5K reviews
- **Features**: Curated high-quality data with realistic patterns
- **Duration**: ~8 minutes

## 🛠️ Advanced Usage

### Custom Configuration

```bash
# Override user count and fraud rate
npm run data:unified -- generate development --users 2000 --fraud-rate 0.05

# Use TypeScript generators only
npm run data:unified -- generate minimal --no-python

# Run generators sequentially
npm run data:unified -- generate testing --sequential

# Custom output directory
npm run data:unified -- generate demo --output-dir ./custom-data
```

### Programmatic Usage

```typescript
import { UnifiedDataGenerator } from './database/seeds/UnifiedDataGenerator';

const generator = new UnifiedDataGenerator();

// Generate with progress tracking
generator.onProgress((progress) => {
  console.log(`${progress.stage}: ${progress.percentage.toFixed(1)}%`);
});

// Generate development scenario
const result = await generator.generateScenario('development', {
  usePython: true,
  validateOutput: true,
  customConfig: {
    users: 3000,
    fraudRate: 0.04
  }
});

console.log(`Generated ${result.recordsGenerated.users} users in ${result.duration}ms`);
```

## 📁 Generated Data Structure

### Core Data Files

```
database/seeds/generators/
├── user_dataset.json              # Clean user profiles
├── user_statistics.json           # User generation statistics
├── property_dataset.json          # Clean property listings
├── property_statistics.json       # Property generation statistics
├── fraudulent_user_dataset.json   # Users with fraud patterns
├── fraudulent_property_dataset.json # Properties with suspicious indicators
├── fraudulent_transaction_dataset.json # Transactions with fraud patterns
├── fraud_analysis_report.json     # Comprehensive fraud analysis
├── optimized_land_dataset.json    # Land verification data
├── optimized_land_dataset_statistics.json # Land data statistics
└── community_insights_dataset.json # Community feedback data
```

### Data Quality Features

- **Kenyan Context**: Authentic names, locations, phone numbers (+254 format)
- **Market Dynamics**: Realistic pricing based on location and property type
- **Fraud Patterns**: Sophisticated fraud indicators seamlessly integrated
- **Relationship Consistency**: Proper foreign key relationships and data integrity
- **Temporal Patterns**: Logical date sequences and seasonal variations

## 🔧 Configuration Options

### Scenario Features

Each scenario can enable/disable specific features:

```typescript
interface ScenarioFeatures {
  enableFraudPatterns: boolean;      // Generate fraud detection training data
  enableLandVerification: boolean;   // Generate land verification workflows
  enableCommunityFeedback: boolean;  // Generate community intelligence data
  enableExpertNetwork: boolean;      // Generate expert coordination data
  enableAnalytics: boolean;          // Generate analytics and reporting data
}
```

### Generation Configuration

```typescript
interface GenerationConfig {
  scenario: string;                  // Scenario name
  outputDir: string;                 // Output directory
  usePython: boolean;                // Use Python generators (with TS fallback)
  validateOutput: boolean;           // Validate generated data
  enableCheckpoints: boolean;        // Enable checkpoint management
  parallelProcessing: boolean;       // Run generators in parallel
  maxConcurrency: number;           // Maximum concurrent generators
  customConfig?: Partial<DataScenario>; // Override scenario settings
}
```

## 📈 Performance Monitoring

### Real-time Progress Tracking

```bash
# Watch progress in real-time
npm run data:unified -- generate performance
```

Output includes:
- Current generation stage
- Progress percentage and ETA
- Records generated per second
- Memory usage and performance metrics

### Generation Statistics

After completion, detailed statistics are provided:

```
📊 Generation Summary
═══════════════════════════════════════════════════════
Scenario: development
Duration: 4m 32s
Success: ✓

📈 Records Generated:
  Users: 5,000
  Properties: 10,000
  Reviews: 2,000
  Professionals: 200
  Verification Sessions: 500
  Fraud Cases: 150

📊 Quality Statistics:
  Data Quality: 95.0%
  Fraud Detection Accuracy: 92.0%
  Relationship Consistency: 98.0%
```

## 🧪 Testing and Validation

### Automated Testing

```bash
# Run comprehensive test suite
npm test database/seeds/__tests__/UnifiedDataGenerator.test.ts

# Test specific scenario
npm run data:unified:validate
```

### Data Quality Validation

The system automatically validates:
- JSON structure integrity
- Data type consistency
- Relationship constraints
- Business rule compliance
- Statistical distributions

### Error Handling

Robust error handling includes:
- Python dependency checking
- Script execution monitoring
- File system error recovery
- Graceful degradation to TypeScript generators
- Detailed error reporting and suggestions

## 🔄 Integration with Existing Systems

### Database Integration

Generated data integrates seamlessly with:
- Drizzle ORM schema definitions
- Existing database migration system
- Cache warming strategies
- Performance monitoring

### Python Generator Compatibility

Maintains full compatibility with existing Python generators:
- `user-generator.py` - User profiles and transaction histories
- `property-generator.py` - Property listings with market pricing
- `fraud-simulator.py` - Sophisticated fraud pattern simulation
- `land-verification-generator.py` - Land verification workflows
- `community-insights-generator.py` - Community feedback data

### Cache Integration

Automatically warms the unified cache system with generated data:
- Property cache for frequently accessed listings
- User cache for session and profile data
- Fraud cache for security-related data
- Analytics cache for reporting data

## 🚨 Troubleshooting

### Common Issues

1. **Python Dependencies Missing**
   ```bash
   # Install required packages
   pip install pandas numpy faker networkx geopy
   ```

2. **Memory Issues with Large Datasets**
   ```bash
   # Use sequential processing
   npm run data:unified -- generate performance --sequential
   ```

3. **Generation Timeout**
   ```bash
   # Check system resources and reduce concurrency
   npm run data:unified -- generate testing --max-concurrency 1
   ```

### Debug Mode

Enable detailed logging:
```bash
DEBUG=data-generation npm run data:unified -- generate development
```

### Recovery from Failures

The system supports checkpoint recovery:
```bash
# Resume from last checkpoint
npm run data:unified -- generate performance --resume
```

## 🔒 Security Considerations

### Data Privacy

- Generated data uses synthetic information only
- No real personal information is included
- Fraud patterns are simulated, not based on real cases
- All generated data is suitable for development and testing

### Access Control

- Generated files are created with appropriate permissions
- Sensitive configuration is handled securely
- Database connections use environment variables
- No hardcoded credentials or sensitive data

## 📚 API Reference

### UnifiedDataGenerator Class

#### Methods

- `generateScenario(scenarioName, config?)` - Generate data for a scenario
- `getAvailableScenarios()` - List available scenarios
- `onProgress(callback)` - Register progress callback

#### Events

- `progress` - Generation progress updates
- `error` - Error notifications
- `complete` - Generation completion

### CLI Commands

- `list` - List available scenarios
- `generate <scenario>` - Generate data for scenario
- `status` - Show system status
- `validate` - Validate existing data
- `clean` - Clean generated files

## 🤝 Contributing

When contributing to the data generation system:

1. Add tests for new scenarios or features
2. Update documentation for API changes
3. Ensure Python generator compatibility
4. Test with different data volumes
5. Validate generated data quality

## 📄 License

This unified data generation system is part of the TripleCheck project and follows the same license terms.
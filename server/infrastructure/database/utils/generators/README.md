# Data Generation Framework

A comprehensive data generation system for TripleCheck that supports multiple scenarios, realistic Kenyan data, and extensive validation capabilities.

## Overview

The Data Generation Framework provides:

- **Multiple Scenarios**: Development, testing, performance, and minimal data sets
- **Realistic Data**: Kenya-specific names, locations, phone numbers, and pricing
- **Batch Processing**: Configurable batch sizes for optimal performance
- **Data Validation**: Schema validation and foreign key integrity checks
- **Flexible Configuration**: Customizable volumes, options, and localization

## Quick Start

### Using CLI Scripts

```bash
# Quick development setup
npm run seed:dev

# Quick testing setup  
npm run seed:test

# Generate minimal data
npm run seed:minimal

# Check current status
npm run seed:status

# List all scenarios
npm run seed:list
```

### Using the API

```typescript
import { generateDataForScenario, DataGenerator } from './database/utils/generators';
import { DatabaseService } from './database/service';

// Initialize database
const databaseService = new DatabaseService();
await databaseService.initialize();
const sql = databaseService.getConnection();

// Generate development data
const result = await generateDataForScenario(sql, 'development');

// Or use custom configuration
const generator = new DataGenerator(sql, {
  scenario: 'custom',
  volumes: {
    users: 100,
    properties: 500,
    reviews: 1000,
    transactions: 200,
    verifications: 300
  },
  options: {
    useRealisticData: true,
    includeTestData: false,
    generateImages: false,
    seedRandomness: 'my-seed',
    batchSize: 100,
    validateConstraints: true
  },
  locale: 'en_KE',
  region: 'kenya'
});

const customResult = await generator.generateAll();
```

## Scenarios

### Development
- **Purpose**: Local development with realistic data
- **Volume**: 50 users, 200 properties, 500 reviews
- **Features**: Realistic Kenyan data, test data included, validation enabled

### Testing
- **Purpose**: Automated testing with consistent data
- **Volume**: 20 users, 50 properties, 100 reviews
- **Features**: Stable seed, smaller volumes, validation enabled

### Performance
- **Purpose**: Load testing and performance benchmarking
- **Volume**: 10,000 users, 50,000 properties, 100,000 reviews
- **Features**: Large volumes, validation disabled for speed

### Minimal
- **Purpose**: Quick testing with minimal data
- **Volume**: 5 users, 10 properties, 20 reviews
- **Features**: Smallest possible dataset, fast generation

## Configuration Options

### Volumes
Control how many records to generate for each entity:

```typescript
volumes: {
  users: number;           // Number of users to generate
  properties: number;      // Number of properties to generate
  reviews: number;         // Number of reviews to generate
  transactions: number;    // Number of transactions to generate
  verifications: number;   // Number of verifications to generate
}
```

### Options
Fine-tune generation behavior:

```typescript
options: {
  useRealisticData: boolean;      // Use Kenya-specific realistic data
  includeTestData: boolean;       // Include test-specific data patterns
  generateImages: boolean;        // Generate image references (future)
  seedRandomness: string | null;  // Seed for reproducible randomness
  batchSize: number;             // Records per database batch
  validateConstraints: boolean;   // Validate generated data
}
```

### Localization
- **locale**: Faker.js locale (e.g., 'en_KE' for Kenyan English)
- **region**: Regional customizations ('kenya' or 'global')

## Kenyan Data Features

### Names
- Authentic Kenyan first names: Wanjiku, Kamau, Otieno, Achieng
- Common Kenyan surnames: Kenyatta, Odinga, Ruto, Macharia

### Locations
- Major Kenyan cities and neighborhoods
- Nairobi areas: CBD, Westlands, Karen, Kilimani, Lavington
- Other cities: Mombasa, Kisumu, Nakuru, Eldoret

### Phone Numbers
- Kenyan mobile format: 0701-0710 prefixes
- Realistic 10-digit numbers

### Property Pricing
- Kenya-appropriate pricing in KES
- Location-based price adjustments
- Property type considerations

## Data Validation

### Schema Validation
All generated data is validated against Zod schemas:

```typescript
// User validation
const user = DataValidationSchemas.user.parse(userData);

// Property validation  
const property = DataValidationSchemas.property.parse(propertyData);

// Review validation
const review = DataValidationSchemas.review.parse(reviewData);
```

### Foreign Key Integrity
- Validates all foreign key relationships
- Detects orphaned records
- Reports constraint violations

### Business Rules
- Price ranges appropriate for property types
- Rating distributions that make sense
- Realistic transaction patterns

## Performance Considerations

### Batch Processing
- Configurable batch sizes (default: 50-1000 depending on scenario)
- Memory-efficient processing for large datasets
- Progress tracking and logging

### Database Optimization
- Uses prepared statements where possible
- Minimizes database round trips
- Efficient bulk inserts

### Memory Management
- Streams large datasets
- Clears intermediate data structures
- Garbage collection friendly

## Error Handling

### Graceful Degradation
- Continues processing after non-critical errors
- Provides detailed error reporting
- Maintains data consistency

### Validation Errors
- Reports schema validation failures
- Identifies constraint violations
- Suggests fixes for common issues

### Database Errors
- Handles connection failures
- Retries transient errors
- Provides rollback capabilities

## Testing

### Unit Tests
```bash
# Run data generator tests
npm test database/utils/generators

# Run with coverage
npm run test:coverage database/utils/generators
```

### Integration Tests
```bash
# Test with real database
npm run test:integration -- --grep "data generation"
```

## CLI Reference

### Commands

```bash
# Generate data for specific scenario
npm run seed generate <scenario> [options]

# Quick commands
npm run seed:dev          # Development setup
npm run seed:test         # Testing setup  
npm run seed:performance  # Performance data (requires --confirm)
npm run seed:minimal      # Minimal data

# Utility commands
npm run seed:status       # Show database status
npm run seed:validate     # Validate existing data
npm run seed:clear        # Clear all data (requires --confirm)
npm run seed:list         # List available scenarios
```

### Options

```bash
-c, --clear              # Clear existing data before seeding
-v, --validate           # Validate generated data (default: true)
-d, --dry-run           # Perform dry run without writing data
--verbose               # Enable verbose output
--confirm               # Confirm destructive operations
```

## Examples

### Custom Data Generation

```typescript
import { DataGenerator } from './database/utils/generators';

// Create custom configuration
const customConfig = {
  scenario: 'custom' as const,
  volumes: {
    users: 200,
    properties: 1000,
    reviews: 2000,
    transactions: 500,
    verifications: 600
  },
  options: {
    useRealisticData: true,
    includeTestData: false,
    generateImages: false,
    seedRandomness: 'custom-seed-2024',
    batchSize: 200,
    validateConstraints: true
  },
  locale: 'en_KE',
  region: 'kenya' as const
};

// Generate data
const generator = new DataGenerator(sql, customConfig);
const result = await generator.generateAll();

console.log(`Generated ${result.recordsGenerated.users} users`);
console.log(`Generated ${result.recordsGenerated.properties} properties`);
```

### Validation Only

```typescript
import { DataGenerator } from './database/utils/generators';

// Create generator with zero volumes for validation only
const validationConfig = {
  ...DATA_SCENARIOS.testing,
  volumes: { users: 0, properties: 0, reviews: 0, transactions: 0, verifications: 0 },
  options: { ...DATA_SCENARIOS.testing.options, validateConstraints: true }
};

const generator = new DataGenerator(sql, validationConfig);
const result = await generator.generateAll();

// Check validation results
if (result.validationResults) {
  console.log(`Valid records: ${result.validationResults.validRecords}`);
  console.log(`Invalid records: ${result.validationResults.invalidRecords}`);
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure database is running
   - Check connection configuration
   - Verify credentials

2. **Memory Issues with Large Datasets**
   - Reduce batch size
   - Use performance scenario settings
   - Monitor memory usage

3. **Validation Failures**
   - Check schema definitions
   - Verify foreign key relationships
   - Review constraint violations

4. **Slow Generation**
   - Increase batch size
   - Disable validation for large datasets
   - Use performance-optimized settings

### Debug Mode

```bash
# Enable verbose logging
npm run seed generate development --verbose

# Dry run to test configuration
npm run seed generate development --dry-run

# Validate without generating
npm run seed:validate
```

## Contributing

### Adding New Data Types

1. Update the `DataGenerationConfig` interface
2. Add generation methods to `DataGenerator`
3. Create validation schemas
4. Add tests
5. Update documentation

### Adding New Scenarios

1. Add scenario to `DATA_SCENARIOS`
2. Test with different volumes
3. Validate performance characteristics
4. Update CLI help text

### Improving Kenyan Data

1. Research authentic data patterns
2. Add new location data
3. Improve name distributions
4. Enhance pricing algorithms

## License

This data generation framework is part of the TripleCheck project and follows the same license terms.
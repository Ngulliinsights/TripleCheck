# TripleCheck Data Generation System

Consolidated data generation system for creating realistic test data, fraud simulation data, and Kenya-specific property data for the TripleCheck platform.

## 📁 Directory Structure

```
database/data-generation/
├── README.md                          # This file
├── index.ts                          # Main exports
├── cli/                              # Command-line interfaces
│   ├── unified-data-generation.ts    # Main CLI tool
│   └── data-generation-cli.ts        # Legacy CLI support
├── core/                             # Core generation logic
│   ├── UnifiedDataGenerator.ts       # Main orchestrator
│   ├── KenyanDataGenerator.ts        # Kenya-specific data
│   ├── checkpoint-manager.ts         # Progress checkpoints
│   └── data-validator.ts             # Data validation
├── generators/                       # Individual generators
│   ├── python/                       # Python generators
│   │   ├── user-generator.py         # User profiles
│   │   ├── property-generator.py     # Property listings
│   │   ├── fraud-simulator.py        # Fraud patterns
│   │   ├── land-verification-generator.py # Land verification
│   │   └── community-insights-generator.py # Community data
│   ├── typescript/                   # TypeScript generators
│   │   ├── user-generator.ts         # TS user generator
│   │   ├── property-generator.ts     # TS property generator
│   │   └── fraud-generator.ts        # TS fraud generator
│   └── index.ts                      # Generator exports
├── scenarios/                        # Predefined scenarios
│   ├── minimal.ts                    # Minimal test data
│   ├── development.ts                # Development data
│   ├── testing.ts                    # Testing data
│   ├── performance.ts                # Performance data
│   ├── demo.ts                       # Demo data
│   └── index.ts                      # Scenario exports
├── output/                           # Generated data files
│   ├── datasets/                     # JSON datasets
│   ├── statistics/                   # Generation statistics
│   ├── reports/                      # Analysis reports
│   └── checkpoints/                  # Progress checkpoints
├── templates/                        # Data templates
│   ├── kenyan-locations.json         # Kenya locations
│   ├── property-types.json           # Property types
│   ├── user-profiles.json            # User profile templates
│   └── fraud-patterns.json           # Fraud pattern templates
├── integrations/                     # System integrations
│   ├── database-loader.ts            # Database integration
│   ├── cache-warmer.ts               # Cache integration
│   └── migration-helper.ts           # Migration support
├── __tests__/                        # Test files
│   ├── UnifiedDataGenerator.test.ts  # Main tests
│   ├── scenarios.test.ts             # Scenario tests
│   ├── generators.test.ts            # Generator tests
│   └── integration.test.ts           # Integration tests
└── docs/                             # Documentation
    ├── api-reference.md              # API documentation
    ├── scenarios-guide.md            # Scenario guide
    ├── troubleshooting.md            # Troubleshooting
    └── examples/                     # Usage examples
        ├── basic-usage.md            # Basic examples
        ├── advanced-usage.md         # Advanced examples
        └── custom-scenarios.md       # Custom scenarios
```

## 🚀 Quick Start

### Generate Development Data
```bash
npm run data:generate:dev
```

### Generate Minimal Test Data
```bash
npm run data:generate:minimal
```

### List Available Scenarios
```bash
npm run data:generate:list
```

### Check System Status
```bash
npm run data:generate:status
```

## 📊 Available Scenarios

| Scenario | Records | Duration | Use Case |
|----------|---------|----------|----------|
| Minimal | ~350 | 30s | Quick testing |
| Development | ~17K | 5min | Feature development |
| Testing | ~85K | 15min | QA testing |
| Performance | ~350K | 45min | Load testing |
| Demo | ~30K | 8min | Presentations |

## 🛠️ Advanced Usage

### Custom Configuration
```bash
npm run data:generate -- --scenario development --users 2000 --fraud-rate 0.05
```

### Programmatic Usage
```typescript
import { UnifiedDataGenerator } from './database/data-generation';

const generator = new UnifiedDataGenerator();
const result = await generator.generateScenario('development');
```

## 📁 Generated Files

All generated data is organized in the `output/` directory:
- `datasets/` - JSON data files
- `statistics/` - Generation statistics
- `reports/` - Analysis reports
- `checkpoints/` - Progress tracking

## 🔧 Configuration

The system supports extensive configuration through:
- Environment variables
- Configuration files
- Command-line options
- Programmatic configuration

See `docs/api-reference.md` for complete configuration options.

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm test database/data-generation/__tests__/
```

## 📚 Documentation

- [API Reference](./docs/api-reference.md)
- [Scenarios Guide](./docs/scenarios-guide.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Examples](./docs/examples/)

## 🤝 Contributing

When contributing to the data generation system:
1. Add tests for new features
2. Update documentation
3. Follow the established patterns
4. Ensure data quality validation
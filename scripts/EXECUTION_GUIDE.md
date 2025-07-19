# TripleCheck Scripts Execution Guide

## 🎯 Optimal Execution Sequence

Follow this sequence for the best results when setting up your TripleCheck system:

### Phase 1: Environment Verification
```bash
# 1. Test database connection
npx tsx scripts/database-manager.ts test

# 2. Check current database state
npx tsx scripts/database-manager.ts stats
```

### Phase 2: Data Generation (if needed)
```bash
# Generate fresh data (optional - you already have quality data)
npx tsx scripts/unified-data-generator.ts 1000 500 2000

# Or use existing data files in scripts/data-generation/
```

### Phase 3: Data Loading
```bash
# Load data with comprehensive pipeline
npx tsx scripts/unified-data-pipeline.ts

# Or with specific options:
npx tsx scripts/unified-data-pipeline.ts --clear --generate
```

### Phase 4: Verification & Quality Check
```bash
# Verify database integrity
npx tsx scripts/database-manager.ts verify

# Check data quality
npx tsx scripts/quality-gates.ts
```

### Phase 5: Application Testing
```bash
# Start your application
npm run dev

# Test functionality
npx tsx scripts/test-tutorial.js
```

## 🔄 Recovery Scenarios

### Scenario 1: Data Loading Failed
```bash
# Check what happened
npx tsx scripts/checkpoint-manager.ts list

# Resume from checkpoint
npx tsx scripts/unified-data-pipeline.ts --resume

# Or start fresh
npx tsx scripts/checkpoint-manager.ts cleanup
npx tsx scripts/unified-data-pipeline.ts --clear
```

### Scenario 2: Database Issues
```bash
# Diagnose issues
npx tsx scripts/database-manager.ts verify

# Fix common issues
npx tsx scripts/database-manager.ts fix

# Or reset completely
npx tsx scripts/database-manager.ts clear
npx tsx scripts/unified-data-pipeline.ts --clear
```

### Scenario 3: Data Quality Problems
```bash
# Generate new quality data
npx tsx scripts/unified-data-generator.ts 2000 1000 5000 --fraud-rate=0.03

# Load with validation
npx tsx scripts/unified-data-pipeline.ts --clear --validate
```

## 📊 Scripts Overview

### Core Scripts (Use These)
1. **`unified-data-pipeline.ts`** - Main data loading with chunking and recovery
2. **`database-manager.ts`** - Database operations and integrity checking  
3. **`unified-data-generator.ts`** - Data generation with quality controls

### Utility Scripts (Keep Separate)
4. **`checkpoint-manager.ts`** - Checkpoint management and recovery
5. **`quality-gates.ts`** - Quality assurance checks
6. **`fix-database.ts`** - Emergency database repairs

### Legacy Scripts (Can Remove After Migration)
- `load-generated-data.ts` → Merged into `unified-data-pipeline.ts`
- `data-integrity-checker.ts` → Merged into `database-manager.ts`
- `test-db-connection.js` → Merged into `database-manager.ts`
- `test-data-check.js` → Merged into `database-manager.ts`
- `data-generator.js` → Merged into `unified-data-generator.ts`
- `run-data-generation.js` → Merged into `unified-data-generator.ts`

## 🧹 Cleanup Commands

### Remove Redundant Scripts
```bash
# After confirming the unified scripts work, remove these:
rm scripts/load-generated-data.ts
rm scripts/data-integrity-checker.ts  
rm scripts/test-db-connection.js
rm scripts/test-data-check.js
rm scripts/data-generator.js
rm scripts/run-data-generation.js
rm scripts/integrate-quality-data.ts
rm scripts/data-generation/integrate-data.ts
```

### Clean Up Generated Files
```bash
# Remove old checkpoints
npx tsx scripts/checkpoint-manager.ts cleanup

# Remove old logs (optional)
rm -rf scripts/logs/*

# Remove test files
rm scripts/quick-data-test.ts
rm scripts/test-robust-loader.ts
rm investigate-data-loss.js
rm test-data-check.js
```

## 🎛️ Command Reference

### Database Manager
```bash
npx tsx scripts/database-manager.ts test           # Test connection
npx tsx scripts/database-manager.ts verify         # Full verification
npx tsx scripts/database-manager.ts stats          # Quick statistics
npx tsx scripts/database-manager.ts help           # Show all options
```

### Data Pipeline
```bash
npx tsx scripts/unified-data-pipeline.ts           # Standard load
npx tsx scripts/unified-data-pipeline.ts --clear   # Clear and reload
npx tsx scripts/unified-data-pipeline.ts --resume  # Resume from checkpoint
npx tsx scripts/unified-data-pipeline.ts --help    # Show all options
```

### Data Generator
```bash
npx tsx scripts/unified-data-generator.ts                    # Default: 1000/500/2000
npx tsx scripts/unified-data-generator.ts 2000 1000 5000    # Custom counts
npx tsx scripts/unified-data-generator.ts --python          # Use Python generators
npx tsx scripts/unified-data-generator.ts --help            # Show all options
```

### Checkpoint Manager
```bash
npx tsx scripts/checkpoint-manager.ts list         # List checkpoints
npx tsx scripts/checkpoint-manager.ts cleanup      # Clean old checkpoints
npx tsx scripts/checkpoint-manager.ts analyze      # Analyze logs
npx tsx scripts/checkpoint-manager.ts help         # Show recovery options
```

## 🚀 Quick Start (Recommended)

For the fastest setup with your existing quality data:

```bash
# 1. Verify environment
npx tsx scripts/database-manager.ts test

# 2. Load your existing quality data
npx tsx scripts/unified-data-pipeline.ts

# 3. Verify everything worked
npx tsx scripts/database-manager.ts verify

# 4. Start your application
npm run dev
```

## 🔧 Troubleshooting

### Common Issues

**"Cannot find module" errors:**
```bash
# Ensure you're in project root
pwd
# Should show: /path/to/AfricanPropertyTrust

# Check data files exist
ls scripts/data-generation/
```

**Database connection failures:**
```bash
# Check environment
echo $DATABASE_URL

# Test connection specifically
npx tsx scripts/database-manager.ts test
```

**Memory or timeout errors:**
```bash
# Use smaller chunks
# Edit unified-data-pipeline.ts: CHUNK_SIZE: 500

# Or process in stages
npx tsx scripts/unified-data-pipeline.ts --no-reviews
# Then add reviews later
```

**Data quality issues:**
```bash
# Check data integrity
npx tsx scripts/database-manager.ts verify

# Generate fresh data if needed
npx tsx scripts/unified-data-generator.ts 1000 500 2000
```

## 📈 Performance Tips

### For Large Datasets (>10K records)
- Increase `CHUNK_SIZE` to 2000 in `unified-data-pipeline.ts`
- Use `--no-validate` flag to skip validation during loading
- Run verification separately after loading

### For Production Use
- Set `NODE_ENV=production`
- Use connection pooling in your database
- Consider running data loading during off-peak hours
- Monitor database performance during loading

### For Development
- Use smaller datasets for faster iteration
- Keep validation enabled to catch issues early
- Use checkpoints for recovery during development

## 📋 Success Indicators

After running the pipeline, you should see:
- ✅ Database connection successful
- ✅ Data loaded without critical errors  
- ✅ Integrity verification passed
- ✅ Frontend displays properties correctly
- ✅ Search functionality works
- ✅ User authentication works

If any of these fail, use the recovery scenarios above to fix the issues.

---

This unified approach reduces complexity from 10+ scripts to 3 core scripts while preserving all functionality and adding better error handling, recovery mechanisms, and progress tracking.
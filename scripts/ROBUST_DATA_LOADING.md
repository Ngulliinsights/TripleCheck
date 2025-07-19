# Robust Data Loading Pipeline for TripleCheck

## Overview

This robust data loading pipeline processes large datasets in manageable chunks with comprehensive error handling, validation checkpoints, and recovery mechanisms. It's designed to handle the real-world challenges of loading thousands of records while maintaining data integrity.

## Key Features

### 🔄 Chunk-Based Processing
- Processes data in 1000-record chunks to avoid memory issues
- Smaller database batches (25-50 records) for optimal performance
- Progress tracking with detailed reporting

### ✅ Validation Checkpoints
- Validates each chunk before processing
- Skips invalid records while continuing with valid ones
- Detailed validation error reporting

### 🛡️ Error Handling & Recovery
- Automatic retry with exponential backoff
- Continues processing even if individual chunks fail
- Comprehensive error logging with structured format

### 💾 Checkpoint System
- Saves progress after each successful chunk
- Automatic recovery from last successful checkpoint
- Resume interrupted operations seamlessly

### 📊 Data Integrity Checking
- Comprehensive database validation
- Foreign key integrity verification
- Duplicate detection and data quality checks

## File Structure

```
scripts/
├── robust-data-loader.ts       # Main chunk-based data loader
├── checkpoint-manager.ts       # Checkpoint management utilities
├── data-integrity-checker.ts   # Database validation and integrity checks
├── test-robust-loader.ts       # Testing and demonstration script
├── checkpoints/                # Checkpoint files (auto-created)
├── logs/                       # Processing logs (auto-created)
└── data-generation/            # Source data files
    ├── fraudulent_user_dataset.json
    ├── fraudulent_property_dataset.json
    └── ...
```

## Quick Start

### 1. Basic Data Loading
```bash
# Load data with automatic recovery
npx tsx scripts/robust-data-loader.ts
```

### 2. Check Current Status
```bash
# List available checkpoints
npx tsx scripts/checkpoint-manager.ts list

# Check data integrity
npx tsx scripts/data-integrity-checker.ts
```

### 3. Recovery Operations
```bash
# Resume from last checkpoint (automatic)
npx tsx scripts/robust-data-loader.ts

# Clean up old checkpoints
npx tsx scripts/checkpoint-manager.ts cleanup

# Analyze processing logs
npx tsx scripts/checkpoint-manager.ts analyze
```

## Detailed Usage

### Robust Data Loader

The main data loading script processes your generated datasets in chunks:

```bash
# Basic usage - loads all data with recovery
npx tsx scripts/robust-data-loader.ts
```

**Features:**
- Automatically detects and resumes from checkpoints
- Processes users first, then properties, then generates reviews
- Validates each record before insertion
- Logs all operations with structured format
- Handles database timeouts and connection issues

**Configuration:**
- Chunk size: 1000 records (configurable in script)
- Batch size: 25-50 records for database operations
- Max retries: 3 attempts with exponential backoff
- Automatic checkpoint saving after each chunk

### Checkpoint Manager

Manage processing checkpoints and recovery:

```bash
# List all available checkpoints
npx tsx scripts/checkpoint-manager.ts list

# Clean up checkpoints older than 7 days
npx tsx scripts/checkpoint-manager.ts cleanup

# Clean up checkpoints older than specific days
npx tsx scripts/checkpoint-manager.ts cleanup 3

# Analyze processing logs
npx tsx scripts/checkpoint-manager.ts analyze

# Analyze specific session logs
npx tsx scripts/checkpoint-manager.ts analyze session_123456

# Show recovery help
npx tsx scripts/checkpoint-manager.ts help
```

### Data Integrity Checker

Validate database consistency and quality:

```bash
# Run comprehensive integrity check
npx tsx scripts/data-integrity-checker.ts

# Save report to file
npx tsx scripts/data-integrity-checker.ts --save
```

**Checks performed:**
- Basic record counts and empty table detection
- Foreign key integrity (orphaned records)
- Duplicate detection (usernames, properties)
- Data completeness (missing required fields)
- Data quality (realistic values, valid ranges)

### Test Suite

Run comprehensive tests of the entire pipeline:

```bash
# Full test suite (recommended)
npx tsx scripts/test-robust-loader.ts

# Run only integrity check
npx tsx scripts/test-robust-loader.ts integrity

# Check checkpoints only
npx tsx scripts/test-robust-loader.ts checkpoints

# Run data loader only
npx tsx scripts/test-robust-loader.ts load
```

## Recovery Scenarios

### Scenario 1: Process Interrupted
If the loading process is interrupted (network issue, system restart, etc.):

```bash
# Simply run the loader again - it will automatically resume
npx tsx scripts/robust-data-loader.ts
```

The system will:
1. Detect existing checkpoints
2. Resume from the last successful chunk
3. Continue processing remaining data

### Scenario 2: Partial Failure
If some chunks fail but others succeed:

```bash
# Check what happened
npx tsx scripts/checkpoint-manager.ts analyze

# Resume processing (will skip successful chunks)
npx tsx scripts/robust-data-loader.ts
```

### Scenario 3: Data Corruption
If you suspect data integrity issues:

```bash
# Check data integrity
npx tsx scripts/data-integrity-checker.ts

# If issues found, clean up and restart
npx tsx scripts/checkpoint-manager.ts cleanup
npx tsx scripts/robust-data-loader.ts
```

### Scenario 4: Start Fresh
To completely restart the loading process:

```bash
# Clean up checkpoints and logs
npx tsx scripts/checkpoint-manager.ts cleanup 0

# Clear database (if needed)
# ... your database clearing commands ...

# Start fresh
npx tsx scripts/robust-data-loader.ts
```

## Monitoring and Logging

### Log Files
All operations are logged to structured JSON files in `scripts/logs/`:

```
logs/
├── data_loader_session_1234567890_abc123.log
├── data_loader_session_1234567891_def456.log
└── ...
```

Each log entry includes:
- Timestamp
- Log level (INFO, WARN, ERROR, DEBUG)
- Session ID
- Message
- Additional data (errors, progress, etc.)

### Checkpoint Files
Progress is saved in `scripts/checkpoints/`:

```
checkpoints/
├── session_1234567890_abc123_users.json
├── session_1234567890_abc123_properties.json
└── ...
```

Each checkpoint contains:
- Processing progress (chunks completed)
- ID mappings (for foreign key relationships)
- Error history
- Recovery information

## Performance Optimization

### Recommended Settings
For optimal performance with large datasets:

```typescript
// In robust-data-loader.ts
const CONFIG = {
  CHUNK_SIZE: 1000,        // Records per chunk
  BATCH_SIZE: 50,          // Database batch size for users
  PROPERTY_BATCH_SIZE: 25, // Smaller batches for properties
  MAX_RETRIES: 3,          // Retry attempts
  RETRY_DELAY_BASE: 1000   // Base delay in ms
};
```

### Database Considerations
- Ensure your database has sufficient connection limits
- Consider increasing timeout settings for large batches
- Monitor database performance during loading

### Memory Management
- The chunk-based approach keeps memory usage low
- Each chunk is processed independently
- Garbage collection happens between chunks

## Troubleshooting

### Common Issues

**1. "Cannot find module" errors**
```bash
# Ensure you're in the project root
cd /path/to/your/project

# Check that data files exist
ls scripts/data-generation/
```

**2. Database connection failures**
```bash
# Test database connection
npx tsx scripts/test-db-connection.js

# Check environment variables
echo $DATABASE_URL
```

**3. Out of memory errors**
```bash
# Reduce chunk size in robust-data-loader.ts
# Change CHUNK_SIZE from 1000 to 500
```

**4. Slow processing**
```bash
# Check database performance
# Consider increasing BATCH_SIZE for faster inserts
# Monitor network latency to database
```

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
DEBUG=true npx tsx scripts/robust-data-loader.ts
```

## Data Validation Rules

### User Validation
- Must have ID, firstName, lastName, email, phone
- Email must contain '@' symbol
- Phone must be present
- UserType must be specified

### Property Validation
- Must have ID, title, description, location
- Price must be greater than 0
- Features must include bedrooms, bathrooms, squareFeet
- All numeric values must be non-negative
- SquareFeet must be greater than 0

### Review Generation
- Reviews are generated for random property-user combinations
- Users cannot review their own properties
- Ratings are between 1-5
- Comments are selected from predefined templates

## Best Practices

### Before Loading
1. **Backup your database** if it contains important data
2. **Test with small datasets** first
3. **Check available disk space** for logs and checkpoints
4. **Verify data file integrity** using the integrity checker

### During Loading
1. **Monitor progress** through console output
2. **Check logs** if you notice unusual behavior
3. **Don't interrupt** unless absolutely necessary
4. **Monitor database performance** and connections

### After Loading
1. **Run integrity check** to verify data quality
2. **Clean up checkpoints** if loading was successful
3. **Archive logs** for future reference
4. **Test your application** with the loaded data

## Integration with TripleCheck

After successful data loading:

1. **Start your application:**
   ```bash
   npm run dev
   ```

2. **Verify data appears in frontend:**
   - Check property listings
   - Test search functionality
   - Verify user authentication works

3. **Test AI features:**
   - Property verification
   - Fraud detection
   - Document analysis

## Support and Maintenance

### Regular Maintenance
- Clean up old checkpoints weekly: `npx tsx scripts/checkpoint-manager.ts cleanup`
- Run integrity checks monthly: `npx tsx scripts/data-integrity-checker.ts`
- Archive old log files as needed

### Performance Monitoring
- Monitor database size growth
- Check query performance with large datasets
- Consider adding database indexes for frequently queried fields

### Scaling Considerations
- For datasets > 100K records, consider increasing chunk sizes
- For production use, implement proper database connection pooling
- Consider using database-specific bulk loading tools for very large datasets

---

This robust data loading pipeline ensures your TripleCheck application has high-quality, consistent data while providing the reliability and recovery mechanisms needed for production use.
# Test Data Setup Guide

This guide explains how to set up comprehensive test data for the African Property Trust application, including transactions, fraudulent properties, and statistics data.

## Quick Setup

To load all test data with a single command:

```bash
npm run setup-test-data
```

This will load:
- ✅ **1,000 regular users + 100 fraudulent users**
- ✅ **2,000 regular properties + 200 fraudulent properties**
- ✅ **1,000 regular transactions + 100 fraudulent transactions**
- ✅ **800 property reviews and ratings**
- ✅ **500 user favorites**
- ✅ **2,000 property views**
- ✅ **Comprehensive statistics for analytics**

## What Gets Loaded

### Users
- Regular users with realistic profiles
- Fraudulent users with suspicious patterns
- Mix of buyers, sellers, agents, and investors
- Trust scores ranging from 0-100

### Properties
- Properties across major Kenyan cities (Nairobi, Mombasa, Kisumu, Nakuru)
- Various property types (apartments, houses, condos, townhouses, studios)
- Price range from KES 500K to KES 200M+
- Regular and fraudulent listings with different verification statuses

### Transactions
- Buy, sell, rent, and lease transactions
- Completed, pending, cancelled, and failed statuses
- Transaction amounts matching property values
- Fraud scores and suspicious transaction flags
- Associated agents, banks, and other parties

### Statistics
- Property count by type and city
- Price and size statistics
- User trust score distributions
- Transaction volume and patterns
- Engagement metrics (reviews, favorites, views)
- Fraud detection statistics

## Load Testing

After loading the data, you can run comprehensive load tests:

```bash
# Install k6 if you haven't already
# On macOS: brew install k6
# On Windows: choco install k6
# On Linux: sudo apt-get install k6

# Run the load test
k6 run scripts/load-test.js
```

The load test will:
- Test all major endpoints with realistic traffic patterns
- Simulate 50 RPS baseline load
- Include spike testing up to 100 RPS
- Test fraud detection and statistics endpoints
- Verify response times and error rates

## Available Test Endpoints

After loading data, these endpoints will have realistic test data:

### Core Endpoints
- `GET /api/properties` - Property listings with filters
- `GET /api/properties/:id` - Individual property details
- `GET /api/users/profile` - User profiles (requires auth)

### Transaction Endpoints
- `GET /api/transactions` - Transaction history with filters
- `GET /api/transactions/:id` - Individual transaction details

### Fraud Detection Endpoints
- `GET /api/fraud/detection` - Fraud detection analysis
- `GET /api/fraud/properties` - Fraudulent property listings
- `GET /api/fraud/transactions` - Suspicious transactions
- `GET /api/fraud/users` - Users with fraud flags

### Statistics Endpoints
- `GET /api/statistics` - General statistics
- `GET /api/statistics/properties` - Property analytics
- `GET /api/statistics/transactions` - Transaction analytics
- `GET /api/statistics/users` - User analytics
- `GET /api/statistics/fraud` - Fraud statistics

### Trust & Verification
- `GET /api/trust/score` - Trust score calculations
- `GET /api/trust/score/:userId` - Individual user trust scores

## Manual Data Loading

If you need to load specific types of data separately:

```bash
# Load only basic data (users, properties, reviews)
tsx scripts/simple-data-loader.ts

# Load comprehensive data (everything)
tsx scripts/comprehensive-data-loader.ts

# Generate new datasets (requires Python)
npm run data:properties
npm run data:users
npm run data:fraud
```

## Data Sources

The test data is generated from:
- `scripts/data-generation/user_dataset.json` - Regular users
- `scripts/data-generation/fraudulent_user_dataset.json` - Fraudulent users
- `scripts/data-generation/property_dataset.json` - Regular properties
- `scripts/data-generation/fraudulent_property_dataset.json` - Fraudulent properties
- `scripts/data-generation/transaction_dataset.json` - Regular transactions
- `scripts/data-generation/fraudulent_transaction_dataset.json` - Fraudulent transactions
- `scripts/data-generation/property_statistics.json` - Property analytics
- `scripts/data-generation/user_statistics.json` - User analytics

## Troubleshooting

### Database Connection Issues
```bash
# Check your .env file has DATABASE_URL set
cat .env | grep DATABASE_URL

# Test database connection
npm run db:studio
```

### Missing Data Files
```bash
# Regenerate data files if missing
npm run data:properties
npm run data:users
npm run data:fraud
```

### Schema Issues
```bash
# Push schema changes to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### Performance Issues
The comprehensive loader processes:
- 1,100 users in batches
- 2,200 properties in batches
- 1,100 transactions in batches
- Additional engagement data

If you experience timeouts, you can modify the batch sizes in `scripts/comprehensive-data-loader.ts`.

## Next Steps

After loading test data:

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Run Load Tests**
   ```bash
   k6 run scripts/load-test.js
   ```

3. **Test Fraud Detection**
   - Visit fraud detection pages
   - Test suspicious property flagging
   - Verify transaction monitoring

4. **Verify Statistics**
   - Check analytics dashboards
   - Test metric calculations
   - Verify data aggregations

5. **Test User Flows**
   - Property browsing and filtering
   - Transaction processing
   - Trust score calculations
   - Review and rating systems

The app is now ready for comprehensive testing with realistic data patterns!
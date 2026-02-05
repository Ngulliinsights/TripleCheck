# Database Setup Guide

This guide will help you establish proper database persistence for the TripleCheck application before deployment.

## Overview

The database setup process involves:
1. Creating all required database tables from the schema
2. Loading sample data for testing and development
3. Validating the deployment

## Prerequisites

1. **Environment Variables**: Ensure you have `DATABASE_URL` set in your `.env` file
2. **Data Files**: The following data files should exist in `scripts/data-generation/`:
   - `fraudulent_user_dataset.json`
   - `fraudulent_property_dataset.json`
3. **Dependencies**: Run `npm install` to ensure all dependencies are installed

## Quick Setup (Recommended)

Run the complete database deployment script:

```bash
tsx database/scripts/deploy.ts
```

This single command will:
- ✅ Check your environment setup
- ✅ Create all database tables
- ✅ Load sample data
- ✅ Validate the deployment

## Manual Setup (Step by Step)

If you prefer to run each step manually:

### Step 1: Create Database Tables

```bash
tsx scripts/database-setup/initialize-database.ts
```

This creates all tables including:
- Core tables (users, properties, reviews, favorites)
- Land verification tables (sessions, layers, risk factors)
- Expert management tables (profiles, assignments, reports)
- Monitoring tables (alerts, property monitoring)
- Fraud intelligence tables (alerts, trends, subscriptions)
- Community resources tables (experiences, comments, interactions)

### Step 2: Load Sample Data

```bash
tsx scripts/data-migration/robust-batch-loader.ts
```

This loads:
- ~1,500 users with realistic profiles
- ~3,000 properties with detailed features
- ~1,000 reviews with varied ratings and comments

### Step 3: Validate Setup

```bash
tsx scripts/validate-database.ts
```

This checks:
- Database connection
- Table existence
- Data counts
- Basic functionality

## Database Schema Overview

The database includes these main components:

### Core Tables
- **users**: User accounts with trust scores and roles
- **properties**: Property listings with features and verification status
- **reviews**: User reviews and ratings for properties
- **favorites**: User favorite properties
- **property_views**: Property view tracking
- **transactions**: Property transaction records

### Land Verification System
- **land_verification_sessions**: Verification session management
- **verification_layers**: Multi-layer verification process
- **risk_factors**: Risk assessment and scoring
- **government_designations**: Government land designations
- **community_feedback**: Community intelligence gathering

### Expert Network
- **expert_profiles**: Verified expert profiles
- **expert_assignments**: Expert task assignments
- **expert_reports**: Expert verification reports

### Monitoring & Alerts
- **property_monitoring**: Continuous property monitoring
- **monitoring_alerts**: Alert management system

### Fraud Intelligence
- **fraud_alerts**: Active fraud alerts
- **fraud_trends**: Fraud pattern analysis
- **fraud_subscriptions**: User alert subscriptions

### Community Resources
- **community_experiences**: User fraud experiences
- **experience_comments**: Community discussions
- **experience_interactions**: User engagement tracking

## Environment Configuration

Ensure your `.env` file contains:

```env
DATABASE_URL=postgresql://username:password@host:port/database
```

For Neon (recommended):
```env
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/database?sslmode=require
```

## Troubleshooting

### Common Issues

1. **"DATABASE_URL not found"**
   - Ensure `.env` file exists in project root
   - Check that `DATABASE_URL` is properly set

2. **"Connection failed"**
   - Verify database credentials
   - Check network connectivity
   - Ensure database server is running

3. **"Data files not found"**
   - Run data generation scripts first:
     ```bash
     python scripts/data-generation/user-generator.py
     python scripts/data-generation/property-generator.py
     ```

4. **"Table already exists"**
   - The scripts handle existing tables automatically
   - Tables are dropped and recreated for clean setup

### Reset Database

To completely reset the database:

```bash
tsx scripts/deploy-database.ts
```

This will drop all existing tables and recreate them with fresh data.

## Verification

After setup, verify your database has:
- ✅ All required tables created
- ✅ Sample data loaded
- ✅ Indexes created for performance
- ✅ Foreign key relationships established

You can check this with:

```bash
tsx scripts/validate-database.ts
```

## Next Steps

Once database setup is complete:

1. **Start your application server**:
   ```bash
   npm run dev
   ```

2. **Test API endpoints**:
   - `GET /api/properties` - List properties
   - `POST /api/land-verification/sessions` - Start verification
   - `GET /api/users/profile` - User profiles

3. **Deploy to production**:
   - Ensure production `DATABASE_URL` is set
   - Run the same setup process in production environment

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify all prerequisites are met
3. Try the manual setup steps individually
4. Check database logs for connection issues

The database setup is now complete and ready for deployment! 🚀
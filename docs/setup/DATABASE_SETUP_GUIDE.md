# Database Setup Guide

## Quick Start (No Database Required)

The TripleCheck server is designed to work **immediately** without any database setup! It will automatically use mock data for development.

```bash
npm run dev
```

The server will start on `http://localhost:3001` with sample property data.

## Database Options

### Option 1: Mock Data (Recommended for Quick Start)
- ✅ **No setup required**
- ✅ **Works immediately**
- ✅ **Perfect for development and testing**
- ✅ **Includes sample properties, users, and reviews**

### Option 2: Cloud Database (Recommended for Persistence)

#### Neon (Serverless PostgreSQL) - FREE
1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Update `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/triplecheck?sslmode=require
   ```

#### Supabase - FREE
1. Go to [supabase.com](https://supabase.com)
2. Create a free account
3. Create a new project
4. Go to Settings > Database
5. Copy the connection string
6. Update `.env` file:
   ```
   DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
   ```

### Option 3: Local PostgreSQL
1. Install PostgreSQL locally
2. Create database:
   ```bash
   createdb triplecheck
   ```
3. Update `.env` file:
   ```
   DATABASE_URL=postgresql://localhost:5432/triplecheck
   ```

## Environment Setup

1. **Run setup script:**
   ```bash
   npm run setup:dev
   ```

2. **Edit `.env` file** (optional - only if you want to use a real database)

3. **Start the server:**
   ```bash
   npm run dev
   ```

## Troubleshooting

### Server Won't Start
- Check if port 3001 is available
- Run `npm run setup:dev` to create `.env` file

### Database Connection Issues
- **Don't worry!** The server will automatically use mock data
- Check your DATABASE_URL format
- For cloud databases, ensure SSL is enabled

### SSL Connection Errors
- The server automatically handles SSL for cloud databases
- For local development, SSL is disabled automatically

## Testing the Integration

```bash
# Test the integration
npm run test:integration

# Check specific endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/properties
```

## Mock Data Includes

- **Users**: Demo users with different roles
- **Properties**: Sample properties in various Kenyan locations
- **Reviews**: Property reviews and ratings
- **Verification**: Sample verification data

## Production Deployment

For production, use a cloud database:
1. Set up Neon or Supabase
2. Update `DATABASE_URL` in production environment
3. Set `NODE_ENV=production`

The server will automatically:
- Enable SSL for cloud databases
- Create tables if they don't exist
- Seed initial data

## Need Help?

The server is designed to "just work" out of the box. If you encounter any issues:

1. Try `npm run setup:dev`
2. Check the server logs for detailed error messages
3. The server will fall back to mock data if database fails

**Remember**: You can start developing immediately without any database setup! 🚀
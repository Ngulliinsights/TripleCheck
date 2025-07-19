# TripleCheck MVP Setup Guide

This guide will help you set up and run the TripleCheck real estate verification platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- PostgreSQL database (we recommend [Neon](https://neon.tech) for easy setup)
- Google Gemini API key for AI features

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install --legacy-peer-deps
```

### 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and fill in your actual values:

```env
# Required - Get from your database provider
DATABASE_URL=postgresql://username:password@host:port/database

# Required for AI features - Get from https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=your_google_gemini_api_key

# Recommended for security
SESSION_SECRET=your_super_secure_random_string
```

### 3. Database Setup

```bash
# Push database schema and initialize with sample data
npm run db:push
npm run db:setup
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api

## 🔐 Demo Login Credentials

After running `npm run db:setup`, you can use these demo accounts:

- **Username**: `demo_user` | **Password**: `password123`
- **Username**: `property_owner` | **Password**: `secure456`
- **Username**: `agent_smith` | **Password**: `agent789`

## 🏗️ Architecture Overview

### Current Implementation
- ✅ **Database**: PostgreSQL with Drizzle ORM
- ✅ **Authentication**: Secure session-based auth with bcrypt
- ✅ **AI Verification**: Google Gemini AI for fraud detection
- ✅ **Security**: Rate limiting, CORS, Helmet security headers
- ✅ **Logging**: Structured logging system
- ✅ **Frontend**: React + TypeScript + TailwindCSS
- ✅ **Backend**: Express.js + TypeScript

### Key Features Working
- ✅ User registration and login
- ✅ Property listing and search
- ✅ AI-powered fraud detection
- ✅ Document verification
- ✅ Review and rating system
- ✅ Trust score calculations
- ✅ Comprehensive reporting

## 🧪 Testing the System

### 1. Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'
```

### 2. Test User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'
```

### 3. Test Property Listing
```bash
curl http://localhost:5000/api/properties
```

### 4. Test Property Search
```bash
curl "http://localhost:5000/api/properties?q=Kilimani"
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:setup        # Initialize database with sample data
npm run db:push         # Push schema changes to database
npm run db:generate     # Generate migrations
npm run db:studio       # Open Drizzle Studio (database GUI)

# Code Quality
npm run check           # TypeScript type checking
npm run lint            # ESLint code linting
npm run format          # Prettier code formatting

# Testing
npm run test            # Run tests
npm run test:ui         # Run tests with UI
npm run test:coverage   # Run tests with coverage
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if DATABASE_URL is set correctly
echo $DATABASE_URL

# Test database connection
npm run db:studio
```

### AI Features Not Working
- Verify `GOOGLE_API_KEY` is set in `.env`
- Check API key permissions at https://makersuite.google.com

### Port Already in Use
```bash
# Change port in .env file
PORT=3001
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 📊 System Status

### ✅ Working Features
- User authentication with secure password hashing
- Property CRUD operations with database persistence
- AI-powered fraud detection and document verification
- Search and filtering functionality
- Review and rating system
- Trust score calculations
- Comprehensive error handling and logging
- Security middleware (rate limiting, CORS, helmet)

### 🚧 Known Limitations
- Blockchain integration is prepared but not yet active
- File upload for document verification needs testing
- Email notifications not implemented
- Advanced search filters need refinement

## 🔄 Next Steps for Blockchain Integration

Once the MVP is stable, blockchain features can be added:

1. **Smart Contract Deployment**: Deploy verification contracts to testnet
2. **Web3 Integration**: Add wallet connectivity to frontend
3. **Hybrid Verification**: Store verification results on-chain
4. **Token System**: Implement trust score tokenization

## 📞 Support

If you encounter issues:

1. Check the logs in the console
2. Verify all environment variables are set
3. Ensure database is accessible
4. Check that all required ports are available

The system now has robust error handling and logging to help diagnose issues quickly.
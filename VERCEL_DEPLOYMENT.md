# Vercel Deployment Guide for TripleCheck

## Overview
This guide covers deploying the TripleCheck application to Vercel with proper configuration for both the React frontend and Express.js backend.

## Prerequisites
- Vercel account
- GitHub repository with your code
- Environment variables configured

## Deployment Steps

### 1. Environment Variables
In your Vercel dashboard, configure these environment variables:

```
NODE_ENV=production
GOOGLE_API_KEY=your_google_ai_api_key
SESSION_SECRET=your_64_character_random_string
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_key (optional)
```

### 2. Build Configuration
The project is configured with:
- `vercel.json` - Proper routing and build configuration
- `.vercelignore` - Excludes unnecessary files from deployment
- Build scripts that compile both frontend and backend

### 3. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically deploy on every push to main branch

#### Option B: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

## Project Structure After Build
```
dist/
├── public/           # Static frontend files (served by Vercel)
│   ├── index.html
│   └── assets/
└── server/           # Backend API (serverless function)
    └── index.js
```

## Key Configuration Files

### vercel.json
- Configures static file serving for frontend
- Routes API calls to serverless function
- Sets up proper SPA routing

### .vercelignore
- Excludes source files and development artifacts
- Only includes built `dist/` folder and essential config files

## API Routes
All API endpoints are available at:
- `https://your-app.vercel.app/api/*`

## Frontend Routes
All frontend routes are handled by the SPA:
- `https://your-app.vercel.app/*`

## Troubleshooting

### Build Failures
1. Check that all dependencies are in `dependencies` (not `devDependencies`)
2. Ensure TypeScript compilation succeeds
3. Verify environment variables are set

### Runtime Errors
1. Check Vercel function logs in dashboard
2. Verify database connection string
3. Ensure API keys are properly configured

### Static File Issues
1. Verify `dist/public/` contains built frontend
2. Check that asset paths are correct
3. Ensure proper routing in `vercel.json`

## Performance Optimization
- Frontend bundle is optimized with Vite
- Backend is bundled as a single serverless function
- Static assets are served via Vercel's CDN
- Consider code splitting for large bundles (current: 666KB)

## Security Notes
- Session secret is configured via environment variables
- Database credentials are not committed to repository
- API keys are properly secured in Vercel environment

## Monitoring
- Use Vercel Analytics for performance monitoring
- Check function logs for backend errors
- Monitor database connections and performance
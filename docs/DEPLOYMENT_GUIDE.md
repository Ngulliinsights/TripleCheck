# 🚀 Deployment Guide

This guide will help you deploy the African Property Trust application to production.

## 📋 Prerequisites

- Node.js 18+ installed
- Git repository set up
- Database (PostgreSQL) ready
- Domain name (optional but recommended)

## 🌐 Deployment Platforms

### Option 1: Vercel (Recommended)

**Pros:**
- Automatic deployments from Git
- Built-in preview deployments
- Serverless functions
- Easy environment variable management
- Free tier available

**Setup:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

### Option 2: Railway

**Pros:**
- Traditional server deployment
- Built-in database
- Simple pricing
- Good for long-running processes

### Option 3: Render

**Pros:**
- Free tier with PostgreSQL
- Automatic SSL
- Easy scaling

## 🔧 Environment Variables Setup

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"

# Application
NODE_ENV="production"
PORT="3000"
FRONTEND_URL="https://your-domain.com"
```

### Optional but Recommended

```bash
# AI Features
GOOGLE_API_KEY="your-google-ai-api-key"

# Email Notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Uploads
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# Payment (M-Pesa for Kenya)
MPESA_CONSUMER_KEY="your-mpesa-consumer-key"
MPESA_CONSUMER_SECRET="your-mpesa-consumer-secret"
MPESA_BUSINESS_SHORT_CODE="your-business-short-code"
MPESA_PASSKEY="your-mpesa-passkey"
MPESA_ENVIRONMENT="production"
```

## 🗄️ Database Setup

### Option 1: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Set `DATABASE_URL` environment variable

### Option 2: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Set `DATABASE_URL` environment variable

### Option 3: Railway PostgreSQL
1. Add PostgreSQL service in Railway
2. Copy the connection string from variables
3. Set `DATABASE_URL` environment variable

## 🚀 Deployment Steps

### 1. Prepare for Deployment

```bash
# Run deployment setup script
npm run deploy:setup

# Or manually:
npm run test
npm run build
npm run check
```

### 2. Deploy to Vercel

```bash
# First time deployment
vercel

# Production deployment
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... add other variables
```

### 3. Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### 4. Deploy to Render

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables in dashboard

## 🔄 Continuous Deployment

### Branch Strategy

```bash
main        # Development (auto-deploy to staging)
staging     # Testing (manual deploy)
production  # Stable releases (manual deploy)
```

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main, staging, production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./
```

## 🔍 Post-Deployment Checklist

### 1. Health Check
- [ ] Application loads successfully
- [ ] Database connection works
- [ ] Authentication works
- [ ] API endpoints respond correctly

### 2. Performance Check
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Images load properly
- [ ] Mobile responsiveness

### 3. Security Check
- [ ] HTTPS enabled
- [ ] Environment variables secure
- [ ] No sensitive data in logs
- [ ] CORS configured correctly

### 4. Monitoring Setup
- [ ] Error tracking (Sentry recommended)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Database monitoring

## 🐛 Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Database Connection Issues:**
- Check DATABASE_URL format
- Verify database is accessible
- Check firewall settings

**Environment Variables Not Working:**
- Verify variable names match exactly
- Check for typos in values
- Restart deployment after changes

**Static Files Not Loading:**
- Check build output in `dist/` folder
- Verify Vercel routes configuration
- Check file paths in HTML

## 📊 Monitoring & Maintenance

### Recommended Tools

1. **Error Tracking:** Sentry
2. **Performance:** Vercel Analytics
3. **Uptime:** UptimeRobot
4. **Database:** Built-in provider monitoring

### Regular Maintenance

- [ ] Update dependencies monthly
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Backup database regularly
- [ ] Review security logs

## 🔄 Rolling Back

### Vercel
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Railway
```bash
# Redeploy previous version
railway rollback
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review deployment logs
3. Check environment variables
4. Verify database connectivity
5. Contact support if needed

---

**Next Steps:** After successful deployment, continue with backend refactoring while your app is live!
# 🚀 Quick Deployment Checklist

## Before You Deploy

### 1. Environment Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Set up database (Neon/Supabase recommended)
- [ ] Add `DATABASE_URL` to environment
- [ ] Generate secure `JWT_SECRET` (32+ characters)
- [ ] Add `GOOGLE_API_KEY` for AI features (optional)

### 2. Pre-deployment Check
```bash
# Run this command to check everything
npm run deploy:setup
```

### 3. Choose Deployment Platform

#### Option A: Vercel (Recommended - Easiest)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

#### Option B: Railway (Good for databases)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway link
railway up
```

## Quick Start (5 minutes)

### 1. Database Setup (Neon - Free)
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create new project
4. Copy connection string
5. Add to environment variables

### 2. Deploy to Vercel
```bash
# One-time setup
npm i -g vercel
vercel login

# Deploy
npm run deploy:setup  # Check everything works
vercel                # Deploy to preview
vercel --prod         # Deploy to production
```

### 3. Set Environment Variables in Vercel
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add GOOGLE_API_KEY  # Optional
```

## Environment Variables Template

```bash
# Required
DATABASE_URL="postgresql://user:pass@host/db"
JWT_SECRET="your-super-secret-32-character-key"
NODE_ENV="production"

# Optional but recommended
GOOGLE_API_KEY="your-google-ai-key"
FRONTEND_URL="https://your-app.vercel.app"
```

## Post-Deployment

### Test Your Deployment
- [ ] App loads at your URL
- [ ] Can register new user
- [ ] Can login/logout
- [ ] Properties load correctly
- [ ] Search works
- [ ] Mobile responsive

### Monitor
- [ ] Check Vercel dashboard for errors
- [ ] Monitor database usage
- [ ] Set up error alerts (optional)

## Troubleshooting

**Build fails?**
```bash
npm run clean
npm install
npm run build
```

**Database connection issues?**
- Check DATABASE_URL format
- Verify database is accessible
- Check Neon dashboard for connection info

**Environment variables not working?**
- Redeploy after adding variables: `vercel --prod`
- Check variable names match exactly

---

**🎉 That's it! Your app should be live and ready for users while you continue development.**
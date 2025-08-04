# TripleCheck Deployment Guide

## 🚀 Quick Deployment

### For Vercel (Recommended)
```bash
# Basic deployment
npm run prepare:vercel
npm run deploy:vercel

# Aggressive optimization (smaller bundle)
npm run prepare:vercel:aggressive
npm run deploy:vercel
```

### For Other Platforms
```bash
# Render
npm run prepare:render

# Netlify
npm run prepare:netlify

# Generic/Custom
npm run prepare:deployment generic production basic
```

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Set up production database (PostgreSQL recommended)
- [ ] Configure environment variables (see `.env.production`)
- [ ] Set up domain and SSL certificate
- [ ] Configure CDN (optional but recommended)

### Security Configuration
- [ ] Generate strong JWT secret
- [ ] Set up CORS origins
- [ ] Configure rate limiting
- [ ] Enable security headers
- [ ] Set up error monitoring (Sentry recommended)

### External Services
- [ ] Google Maps API key (with domain restrictions)
- [ ] M-Pesa integration (production credentials)
- [ ] Email service (SMTP configuration)
- [ ] Redis for caching (optional)

### Performance Optimization
- [ ] Enable gzip compression
- [ ] Configure caching headers
- [ ] Set up monitoring and analytics
- [ ] Configure backup strategy

## 🔧 Environment Variables

### Required for Production
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secure-secret
FRONTEND_URL=https://your-domain.com
```

### Optional but Recommended
```bash
VITE_GOOGLE_MAPS_API_KEY=your-api-key
SMTP_HOST=your-smtp-host
SMTP_USER=your-email
SMTP_PASS=your-password
SENTRY_DSN=your-sentry-dsn
```

## 🌍 Platform-Specific Instructions

### Vercel
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy using: `npm run deploy:production`

**Vercel Configuration:**
- Build Command: `npm run build:optimized`
- Output Directory: `dist/public`
- Install Command: `npm ci`

### Render
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Push to main branch to auto-deploy

**Render Configuration:**
- Build Command: `npm run build:optimized`
- Publish Directory: `./dist/public`
- Environment: Static Site

### Netlify
1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy using: `netlify deploy --prod`

**Netlify Configuration:**
- Build Command: `npm run build:optimized`
- Publish Directory: `dist/public`

## 🔍 Post-Deployment Verification

### Automated Checks
```bash
# Test deployment readiness
npm run test:deployment

# Health check
npm run monitor:health

# Security audit
npm run security:scan
```

### Manual Verification
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Property search functions
- [ ] User authentication works
- [ ] Database connections are stable
- [ ] External APIs are responding
- [ ] Error pages display correctly
- [ ] Mobile responsiveness
- [ ] Performance metrics are acceptable

## 📊 Monitoring and Maintenance

### Health Monitoring
```bash
# Start monitoring
npm run monitor:start

# Check system health
npm run monitor:health

# View metrics
npm run monitor:metrics
```

### Performance Monitoring
- Set up uptime monitoring
- Configure performance alerts
- Monitor database performance
- Track Core Web Vitals
- Monitor error rates

### Regular Maintenance
- [ ] Weekly security updates
- [ ] Monthly dependency updates
- [ ] Quarterly performance reviews
- [ ] Database maintenance and backups
- [ ] SSL certificate renewal

## 🚨 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear cache and rebuild
npm run clean
npm ci
npm run build
```

**Environment Variable Issues**
```bash
# Verify environment variables
node -e "console.log(process.env.DATABASE_URL ? 'DB configured' : 'DB missing')"
```

**Database Connection Issues**
```bash
# Test database connection
npm run test:db-connection
```

**Performance Issues**
```bash
# Analyze bundle size
npm run analyze:bundle

# Run performance tests
npm run test:performance
```

### Emergency Procedures

**Rollback Deployment**
1. Revert to previous Git commit
2. Redeploy previous version
3. Check database migrations
4. Verify functionality

**Database Issues**
1. Check connection strings
2. Verify SSL configuration
3. Check firewall rules
4. Review connection limits

## 📈 Optimization Tips

### Bundle Size Optimization
- Use aggressive chunking: `npm run prepare:vercel:aggressive`
- Analyze bundle: `npm run analyze:bundle`
- Remove unused dependencies
- Optimize images and assets

### Performance Optimization
- Enable CDN for static assets
- Configure proper caching headers
- Use Redis for session storage
- Optimize database queries
- Enable gzip compression

### Security Hardening
- Use strong JWT secrets
- Configure CORS properly
- Enable rate limiting
- Set up security headers
- Regular security audits

## 🔗 Useful Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Web Performance Best Practices](https://web.dev/performance/)

## 📞 Support

For deployment issues:
1. Check this documentation
2. Review error logs
3. Check platform-specific documentation
4. Contact the development team

---

**Last Updated:** $(date)
**Version:** 1.0.0
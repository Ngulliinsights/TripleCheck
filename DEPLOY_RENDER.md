# Deploy TripleCheck to Render

This guide will help you deploy the TripleCheck land verification application to Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Database**: Set up a PostgreSQL database (Render PostgreSQL or external like Neon/Supabase)

## Step 1: Database Setup

### Option A: Render PostgreSQL (Recommended)
1. In your Render dashboard, click "New +" → "PostgreSQL"
2. Choose a name like `triplecheck-db`
3. Select your preferred region (Oregon recommended)
4. Choose the Free tier for testing or Starter for production
5. Click "Create Database"
6. Copy the **Internal Database URL** for later use

### Option B: External Database (Neon/Supabase)
If using an external database, have your connection string ready:
```
postgresql://username:password@host:port/database?sslmode=require
```

## Step 2: Web Service Deployment

1. **Create Web Service**
   - In Render dashboard, click "New +" → "Web Service"
   - Connect your GitHub repository
   - Choose the repository containing TripleCheck

2. **Configure Service Settings**
   - **Name**: `triplecheck-app`
   - **Region**: Oregon (or same as your database)
   - **Branch**: `main` (or your deployment branch)
   - **Runtime**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

3. **Environment Variables**
   Set these required environment variables:

   ```bash
   # Core Configuration
   NODE_ENV=production
   PORT=10000
   
   # Database (use your database URL)
   DATABASE_URL=postgresql://username:password@host:port/database
   
   # Security (Render can auto-generate these)
   JWT_SECRET=your-secure-jwt-secret-here
   SESSION_SECRET=your-secure-session-secret-here
   
   # CORS Configuration
   CORS_ORIGIN=https://your-app-name.onrender.com
   BASE_URL=https://your-app-name.onrender.com
   FRONTEND_URL=https://your-app-name.onrender.com
   ```

   **Optional Environment Variables** (add as needed):
   ```bash
   # Google Maps Integration
   GOOGLE_MAPS_API_KEY=your-google-maps-key
   
   # Email Service (SendGrid recommended)
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=your-sendgrid-key
   FROM_EMAIL=noreply@yourdomain.com
   
   # File Storage (Cloudinary recommended)
   FILE_STORAGE_PROVIDER=cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # M-Pesa (for Kenya payments)
   MPESA_ENVIRONMENT=sandbox
   MPESA_CONSUMER_KEY=your-mpesa-key
   MPESA_CONSUMER_SECRET=your-mpesa-secret
   
   # AI Services (optional)
   OPENAI_API_KEY=your-openai-key
   GEMINI_API_KEY=your-gemini-key
   ```

4. **Advanced Settings**
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: Yes (recommended)

## Step 3: Deploy

1. Click "Create Web Service"
2. Render will automatically start building and deploying your app
3. Monitor the build logs for any issues
4. Once deployed, your app will be available at `https://your-app-name.onrender.com`

## Step 4: Database Migration

After successful deployment, you may need to set up your database:

1. **Access your deployed app's shell** (if needed):
   - In Render dashboard, go to your web service
   - Click "Shell" tab
   - Run database setup commands:
   ```bash
   npm run db:push
   npm run db:seed
   ```

2. **Or use database migration scripts** (if available):
   ```bash
   npm run migrate:run
   ```

## Step 5: Verification

1. **Health Check**: Visit `https://your-app-name.onrender.com/health`
   - Should return JSON with status "ok"

2. **Frontend**: Visit `https://your-app-name.onrender.com`
   - Should load the TripleCheck application

3. **API**: Test API endpoints at `https://your-app-name.onrender.com/api/`

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Ensure database allows connections from Render IPs
   - Check if SSL is required (`?sslmode=require`)

3. **Environment Variable Issues**
   - Double-check all required environment variables are set
   - Ensure no typos in variable names
   - Verify sensitive values are properly escaped

4. **Memory Issues**
   - Consider upgrading to a higher tier plan
   - Monitor memory usage in Render dashboard
   - Optimize application memory usage

### Performance Optimization

1. **Enable Caching**
   - Set up Redis for caching (Render Redis or external)
   - Configure `REDIS_URL` environment variable

2. **CDN for Static Assets**
   - Use Cloudinary or similar for image optimization
   - Configure proper caching headers

3. **Database Optimization**
   - Use connection pooling
   - Optimize database queries
   - Consider read replicas for high traffic

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to version control
   - Use Render's environment variable management
   - Rotate secrets regularly

2. **HTTPS**
   - Render provides HTTPS by default
   - Ensure `CORS_ORIGIN` uses HTTPS

3. **Database Security**
   - Use strong database passwords
   - Enable SSL connections
   - Restrict database access to necessary IPs

## Monitoring

1. **Render Dashboard**
   - Monitor CPU, memory, and response times
   - Set up alerts for downtime

2. **Application Logs**
   - Use Render's log streaming
   - Consider external logging services for production

3. **Health Checks**
   - Render automatically monitors `/health` endpoint
   - Set up custom health checks as needed

## Scaling

1. **Horizontal Scaling**
   - Upgrade to higher tier plans for auto-scaling
   - Configure load balancing

2. **Database Scaling**
   - Monitor database performance
   - Consider upgrading database tier
   - Implement read replicas if needed

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **TripleCheck Issues**: Check your repository's issues page
- **Community Support**: Render community forums

## Cost Optimization

1. **Free Tier Limitations**
   - Services sleep after 15 minutes of inactivity
   - 750 hours per month limit
   - Consider upgrading for production use

2. **Paid Tiers**
   - Starter: $7/month - No sleeping, better performance
   - Standard: $25/month - Auto-scaling, more resources
   - Pro: $85/month - Advanced features, priority support

Remember to test thoroughly in a staging environment before deploying to production!
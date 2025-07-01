# TripleCheck Platform - Production Deployment Guide

## Quick Start Migration from Replit

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database access
- Google AI API key
- Domain/hosting provider

### 1. Environment Setup

Create `.env` file:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/triplecheck

# AI Services
GOOGLE_API_KEY=your_google_ai_api_key

# Security
SESSION_SECRET=your_64_character_random_string
NODE_ENV=production

# Optional Services
OPENAI_API_KEY=your_openai_key

# Server Configuration
PORT=5000
HOST=0.0.0.0
```

### 2. Database Setup

#### Option A: Using Neon Database (Recommended)
1. Create account at [neon.tech](https://neon.tech)
2. Create new project: "triplecheck-production"
3. Copy connection string to `DATABASE_URL`

#### Option B: Self-hosted PostgreSQL
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE triplecheck;
CREATE USER triplecheck_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE triplecheck TO triplecheck_user;
\q
```

### 3. Application Deployment

#### Option A: Docker Deployment (Recommended)

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

**Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - SESSION_SECRET=${SESSION_SECRET}
      - NODE_ENV=production
    restart: unless-stopped
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=triplecheck
      - POSTGRES_USER=triplecheck_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy:**
```bash
# Clone your repository
git clone your-repo-url triplecheck-production
cd triplecheck-production

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Start services
docker-compose up -d

# Run database migrations
docker-compose exec app npm run db:migrate
```

#### Option B: Manual Deployment

```bash
# 1. Clone and setup
git clone your-repo-url triplecheck-production
cd triplecheck-production

# 2. Install dependencies
npm ci --only=production

# 3. Build application
npm run build

# 4. Setup environment
cp .env.example .env
# Edit .env with production values

# 5. Run database migrations
npm run db:migrate

# 6. Start application with PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### 4. Database Migration

Create `migrate.js`:
```javascript
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function runMigrations() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrations completed!');
}

runMigrations().catch(console.error);
```

Add to `package.json`:
```json
{
  "scripts": {
    "db:migrate": "node migrate.js",
    "db:generate": "drizzle-kit generate:pg",
    "start": "node dist/server/index.js",
    "build": "tsc && vite build"
  }
}
```

### 5. Nginx Configuration

Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }

    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security Headers
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # File Upload Size
        client_max_body_size 10M;

        # Proxy Configuration
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static Files
        location /uploads/ {
            alias /app/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 6. PM2 Configuration

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'triplecheck',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    autorestart: true
  }]
};
```

### 7. SSL Certificate Setup

#### Option A: Let's Encrypt (Free)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Option B: Custom Certificate
```bash
# Place your SSL certificate files
mkdir ssl
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem
```

### 8. Monitoring and Backup

#### Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# System monitoring
sudo apt install htop iotop

# Log monitoring
tail -f logs/combined.log
```

#### Database Backup
```bash
# Create backup script
cat > backup-db.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_triplecheck_\$DATE.sql"
pg_dump \$DATABASE_URL > /backups/\$BACKUP_FILE
echo "Backup created: \$BACKUP_FILE"
EOF

chmod +x backup-db.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup-db.sh
```

### 9. Security Checklist

- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] SSL/TLS enabled
- [ ] Security headers configured
- [ ] File upload restrictions in place
- [ ] Rate limiting enabled
- [ ] Regular security updates scheduled
- [ ] Backup strategy implemented
- [ ] Monitoring system active

### 10. Performance Optimization

#### Application Level
```javascript
// In server/index.ts
import compression from 'compression';
import helmet from 'helmet';

app.use(helmet());
app.use(compression());
```

#### Database Level
```sql
-- Add indexes for better performance
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_reviews_property_id ON reviews(property_id);
```

### 11. Scaling Considerations

#### Horizontal Scaling
- Use load balancer (Nginx/HAProxy)
- Configure PM2 cluster mode
- Implement session sharing (Redis)

#### Database Scaling
- Read replicas for query optimization
- Connection pooling
- Query optimization

#### CDN Integration
- CloudFlare for static assets
- Image optimization service
- Global content distribution

---

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify database permissions
   - Check firewall settings

2. **SSL Certificate Issues**
   - Verify certificate validity
   - Check domain DNS records
   - Confirm certificate file paths

3. **Performance Issues**
   - Monitor memory usage
   - Check database query performance
   - Review application logs

4. **File Upload Problems**
   - Check directory permissions
   - Verify file size limits
   - Review storage space

### Support Resources:
- Application logs: `/logs/`
- Database logs: Check PostgreSQL logs
- System logs: `journalctl -u your-service`
- Performance monitoring: PM2 monit

**Estimated Migration Time**: 4-8 hours for complete production setup
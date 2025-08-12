#!/bin/bash

# Restore Primary Region Script
# Switches back to primary region when it becomes available

set -e

echo "🔄 Restoring primary region..."

# Configuration
PRIMARY_HOST=${1:-"primary.triplecheck.co.ke"}
PRIMARY_PORT=${2:-5432}
PRIMARY_DB=${3:-"triplecheck"}
PRIMARY_USER=${4:-"postgres"}
SECONDARY_HOST=${5:-"secondary.triplecheck.co.ke"}

echo "Primary Host: $PRIMARY_HOST"
echo "Secondary Host: $SECONDARY_HOST"
echo "Database: $PRIMARY_DB"

# Test primary region connectivity
echo "🔍 Testing primary region connectivity..."
if ! psql -h $PRIMARY_HOST -p $PRIMARY_PORT -U $PRIMARY_USER -d $PRIMARY_DB -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Primary region is still not accessible"
    exit 1
fi

echo "✅ Primary region is accessible"

# Check if we need to sync data from secondary to primary
echo "🔄 Checking data synchronization requirements..."

# Get latest transaction ID from secondary
SECONDARY_LATEST=$(psql -h $SECONDARY_HOST -p $PRIMARY_PORT -U $PRIMARY_USER -d $PRIMARY_DB -t -c "SELECT txid_current();" | xargs)
PRIMARY_LATEST=$(psql -h $PRIMARY_HOST -p $PRIMARY_PORT -U $PRIMARY_USER -d $PRIMARY_DB -t -c "SELECT txid_current();" | xargs)

echo "Secondary latest transaction: $SECONDARY_LATEST"
echo "Primary latest transaction: $PRIMARY_LATEST"

if [ "$SECONDARY_LATEST" -gt "$PRIMARY_LATEST" ]; then
    echo "⚠️ Secondary region has newer data. Synchronization required."
    
    # Create backup of secondary data
    SYNC_BACKUP="./database/disaster-recovery/storage/backups/secondary-sync-$(date +%Y%m%d_%H%M%S).sql"
    echo "💾 Creating backup of secondary data..."
    pg_dump -h $SECONDARY_HOST -p $PRIMARY_PORT -U $PRIMARY_USER -d $PRIMARY_DB -f "$SYNC_BACKUP" --verbose --no-password
    
    # Apply changes to primary
    echo "📥 Applying secondary changes to primary..."
    psql -h $PRIMARY_HOST -p $PRIMARY_PORT -U $PRIMARY_USER -d $PRIMARY_DB -f "$SYNC_BACKUP" --quiet
    
    echo "✅ Data synchronization completed"
else
    echo "✅ Primary region data is up to date"
fi

# Update DNS routing back to primary region
echo "🌐 Updating DNS routing to primary region..."
# This would typically involve updating Route 53 or similar DNS service
# For now, we'll simulate this step
echo "✅ DNS routing updated (simulated)"

# Update application configuration
echo "🔧 Updating application configuration..."

# Update database configuration to point to primary
cat > "./config/database.config.ts" << EOF
export const databaseConfig = {
  host: '$PRIMARY_HOST',
  port: $PRIMARY_PORT,
  database: '$PRIMARY_DB',
  username: '$PRIMARY_USER',
  password: process.env.DATABASE_PASSWORD || 'password',
  ssl: true,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
EOF

# Update environment variables
if [ -f ".env" ]; then
    sed -i.bak "s/DATABASE_HOST=.*/DATABASE_HOST=$PRIMARY_HOST/" .env
    sed -i.bak "s/DATABASE_PORT=.*/DATABASE_PORT=$PRIMARY_PORT/" .env
fi

# Restart application services
echo "🔄 Restarting application services..."
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "✅ PM2 services restarted"
elif command -v systemctl &> /dev/null; then
    systemctl restart triplecheck
    echo "✅ System service restarted"
fi

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Verify primary region is working
echo "🔍 Verifying primary region functionality..."
if curl -f http://localhost:3003/api/health > /dev/null 2>&1; then
    echo "✅ Application is responding from primary region"
else
    echo "❌ Application health check failed"
    exit 1
fi

# Test database connectivity
if psql -h $PRIMARY_HOST -p $PRIMARY_PORT -U $PRIMARY_USER -d $PRIMARY_DB -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    echo "✅ Primary database is functioning correctly"
else
    echo "❌ Primary database connectivity test failed"
    exit 1
fi

# Optionally shut down secondary region services
echo "🛑 Shutting down secondary region services..."
# This would involve stopping services in the secondary region
echo "✅ Secondary region services stopped (simulated)"

echo "✅ Primary region restoration completed successfully"
echo "📊 System is now running from primary region: $PRIMARY_HOST"
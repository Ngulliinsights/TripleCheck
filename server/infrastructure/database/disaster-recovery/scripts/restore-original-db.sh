#!/bin/bash

# Restore Original Database Script
# Switches back to the original database after recovery testing

set -e

echo "🔄 Restoring original database connection..."

# Configuration
ORIGINAL_HOST=${1:-"localhost"}
ORIGINAL_PORT=${2:-5432}
ORIGINAL_DB=${3:-"triplecheck"}
ORIGINAL_USER=${4:-"postgres"}

echo "Original Host: $ORIGINAL_HOST"
echo "Original Port: $ORIGINAL_PORT"
echo "Database: $ORIGINAL_DB"

# Test original database connectivity
echo "🔍 Testing original database connectivity..."
if psql -h $ORIGINAL_HOST -p $ORIGINAL_PORT -U $ORIGINAL_USER -d $ORIGINAL_DB -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Original database is accessible"
else
    echo "❌ Original database is not accessible"
    exit 1
fi

# Update application configuration to point back to original database
echo "🔧 Updating application configuration..."

# Create configuration backup if it doesn't exist
BACKUP_DIR="./database/disaster-recovery/storage/config-backup"
mkdir -p "$BACKUP_DIR"

# Update database configuration
cat > "./config/database.config.ts" << EOF
export const databaseConfig = {
  host: '$ORIGINAL_HOST',
  port: $ORIGINAL_PORT,
  database: '$ORIGINAL_DB',
  username: '$ORIGINAL_USER',
  password: process.env.DATABASE_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
EOF

# Update environment variables
if [ -f ".env" ]; then
    sed -i.bak "s/DATABASE_HOST=.*/DATABASE_HOST=$ORIGINAL_HOST/" .env
    sed -i.bak "s/DATABASE_PORT=.*/DATABASE_PORT=$ORIGINAL_PORT/" .env
    sed -i.bak "s/DATABASE_NAME=.*/DATABASE_NAME=$ORIGINAL_DB/" .env
    sed -i.bak "s/DATABASE_USER=.*/DATABASE_USER=$ORIGINAL_USER/" .env
fi

# Restart application
echo "🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "✅ PM2 services restarted"
elif command -v systemctl &> /dev/null; then
    systemctl restart triplecheck
    echo "✅ System service restarted"
else
    echo "⚠️ Please manually restart the application"
fi

# Verify connection
echo "🔍 Verifying application database connection..."
sleep 5

if curl -f http://localhost:3003/api/health > /dev/null 2>&1; then
    echo "✅ Application is responding with original database"
else
    echo "⚠️ Application health check failed. Please verify manually."
fi

echo "✅ Original database restoration completed successfully"
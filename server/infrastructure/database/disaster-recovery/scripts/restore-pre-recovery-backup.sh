#!/bin/bash

# Restore Pre-Recovery Backup Script
# Restores the backup created before recovery attempt

set -e

echo "🔄 Restoring pre-recovery backup..."

# Configuration
BACKUP_DIR="./database/disaster-recovery/storage/backups"
PRE_RECOVERY_BACKUP="$BACKUP_DIR/pre-recovery-backup.sql"
DB_HOST=${1:-"localhost"}
DB_PORT=${2:-5432}
DB_NAME=${3:-"triplecheck"}
DB_USER=${4:-"postgres"}

echo "Database Host: $DB_HOST"
echo "Database Port: $DB_PORT"
echo "Database Name: $DB_NAME"

# Check if pre-recovery backup exists
if [ ! -f "$PRE_RECOVERY_BACKUP" ]; then
    echo "❌ Pre-recovery backup not found at $PRE_RECOVERY_BACKUP"
    exit 1
fi

echo "📁 Found pre-recovery backup"

# Create a backup of current state before restoration
CURRENT_BACKUP="$BACKUP_DIR/current-state-$(date +%Y%m%d_%H%M%S).sql"
echo "💾 Creating backup of current state..."
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$CURRENT_BACKUP" --verbose --no-password

# Stop application to prevent connections during restore
echo "🛑 Stopping application..."
if command -v pm2 &> /dev/null; then
    pm2 stop all
elif command -v systemctl &> /dev/null; then
    systemctl stop triplecheck
fi

# Terminate existing connections
echo "🔌 Terminating existing database connections..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Drop and recreate database
echo "🗑️ Dropping and recreating database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restore from pre-recovery backup
echo "📥 Restoring from pre-recovery backup..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$PRE_RECOVERY_BACKUP" --quiet

# Verify restoration
echo "🔍 Verifying restoration..."
TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ Database restored successfully ($TABLE_COUNT tables)"
else
    echo "❌ Database restoration may have failed (no tables found)"
    exit 1
fi

# Start application
echo "🚀 Starting application..."
if command -v pm2 &> /dev/null; then
    pm2 start all
elif command -v systemctl &> /dev/null; then
    systemctl start triplecheck
fi

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 10

# Verify application health
if curl -f http://localhost:3003/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy after restoration"
else
    echo "⚠️ Application health check failed. Please verify manually."
fi

echo "✅ Pre-recovery backup restoration completed successfully"
echo "📁 Current state backup saved to: $CURRENT_BACKUP"
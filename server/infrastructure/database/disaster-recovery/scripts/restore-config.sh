#!/bin/bash

# Restore Configuration Script
# Restores original application configuration

set -e

echo "🔄 Restoring original application configuration..."

# Configuration paths
CONFIG_BACKUP_PATH="./database/disaster-recovery/storage/config-backup"
APP_CONFIG_PATH="./config"
ENV_CONFIG_PATH="./.env"

# Check if backup exists
if [ ! -d "$CONFIG_BACKUP_PATH" ]; then
    echo "❌ Configuration backup not found at $CONFIG_BACKUP_PATH"
    exit 1
fi

echo "📁 Found configuration backup"

# Restore application configuration
if [ -f "$CONFIG_BACKUP_PATH/app.config.ts" ]; then
    echo "🔧 Restoring app configuration..."
    cp "$CONFIG_BACKUP_PATH/app.config.ts" "$APP_CONFIG_PATH/app.config.ts"
    echo "✅ App configuration restored"
fi

# Restore database configuration
if [ -f "$CONFIG_BACKUP_PATH/database.config.ts" ]; then
    echo "🔧 Restoring database configuration..."
    cp "$CONFIG_BACKUP_PATH/database.config.ts" "$APP_CONFIG_PATH/database.config.ts"
    echo "✅ Database configuration restored"
fi

# Restore environment variables
if [ -f "$CONFIG_BACKUP_PATH/.env" ]; then
    echo "🔧 Restoring environment configuration..."
    cp "$CONFIG_BACKUP_PATH/.env" "$ENV_CONFIG_PATH"
    echo "✅ Environment configuration restored"
fi

# Restart application services
echo "🔄 Restarting application services..."
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "✅ PM2 services restarted"
elif command -v systemctl &> /dev/null; then
    systemctl restart triplecheck
    echo "✅ System service restarted"
else
    echo "⚠️ Please manually restart the application"
fi

echo "✅ Configuration restoration completed successfully"
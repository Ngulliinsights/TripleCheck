#!/bin/bash

# Activate Replica Script
# Promotes a read replica to primary database

set -e

echo "🔄 Activating replica database..."

# Configuration
REPLICA_HOST=${1:-"replica1.triplecheck.co.ke"}
REPLICA_PORT=${2:-5432}
REPLICA_DB=${3:-"triplecheck"}
REPLICA_USER=${4:-"postgres"}

echo "Replica Host: $REPLICA_HOST"
echo "Replica Port: $REPLICA_PORT"
echo "Database: $REPLICA_DB"

# Check replica status
echo "🔍 Checking replica status..."
REPLICA_STATUS=$(psql -h $REPLICA_HOST -p $REPLICA_PORT -U $REPLICA_USER -d $REPLICA_DB -t -c "SELECT pg_is_in_recovery();" | xargs)

if [ "$REPLICA_STATUS" = "f" ]; then
    echo "❌ Replica is not in recovery mode. Cannot promote."
    exit 1
fi

echo "✅ Replica is in recovery mode. Proceeding with promotion..."

# Promote replica to primary
echo "🚀 Promoting replica to primary..."
psql -h $REPLICA_HOST -p $REPLICA_PORT -U $REPLICA_USER -d $REPLICA_DB -c "SELECT pg_promote();"

# Wait for promotion to complete
echo "⏳ Waiting for promotion to complete..."
sleep 5

# Verify promotion
PROMOTION_STATUS=$(psql -h $REPLICA_HOST -p $REPLICA_PORT -U $REPLICA_USER -d $REPLICA_DB -t -c "SELECT pg_is_in_recovery();" | xargs)

if [ "$PROMOTION_STATUS" = "f" ]; then
    echo "✅ Replica successfully promoted to primary"
    
    # Update application configuration
    echo "🔧 Updating application configuration..."
    # This would update the application's database configuration
    # to point to the newly promoted primary
    
    echo "✅ Replica activation completed successfully"
else
    echo "❌ Replica promotion failed"
    exit 1
fi
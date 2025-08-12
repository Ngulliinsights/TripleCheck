#!/bin/bash
# Setup PostgreSQL Replication for TripleCheck

set -e

echo "Setting up PostgreSQL replication..."

# Create replication user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create replication user
    CREATE USER ${POSTGRES_REPLICATION_USER:-replicator} WITH REPLICATION ENCRYPTED PASSWORD '${POSTGRES_REPLICATION_PASSWORD}';
    
    -- Grant necessary permissions
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_REPLICATION_USER:-replicator};
    
    -- Create replication slots for each replica
    SELECT pg_create_physical_replication_slot('replica_1_slot');
    SELECT pg_create_physical_replication_slot('replica_2_slot');
    
    -- Create application users with different privileges
    CREATE USER triplecheck_app WITH ENCRYPTED PASSWORD '${POSTGRES_PASSWORD}';
    CREATE USER triplecheck_ro WITH ENCRYPTED PASSWORD '${POSTGRES_PASSWORD}';
    CREATE USER triplecheck_backup WITH ENCRYPTED PASSWORD '${POSTGRES_PASSWORD}';
    
    -- Grant permissions to application user
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO triplecheck_app;
    GRANT USAGE ON SCHEMA public TO triplecheck_app;
    GRANT CREATE ON SCHEMA public TO triplecheck_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO triplecheck_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO triplecheck_app;
    
    -- Grant read-only permissions
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO triplecheck_ro;
    GRANT USAGE ON SCHEMA public TO triplecheck_ro;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO triplecheck_ro;
    
    -- Grant backup permissions
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO triplecheck_backup;
    GRANT USAGE ON SCHEMA public TO triplecheck_backup;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO triplecheck_backup;
    GRANT pg_read_all_data TO triplecheck_backup;
    
    -- Set default privileges for future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO triplecheck_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO triplecheck_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO triplecheck_ro;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO triplecheck_backup;
    
    -- Create monitoring views
    CREATE OR REPLACE VIEW replication_status AS
    SELECT 
        client_addr,
        client_hostname,
        client_port,
        application_name,
        state,
        sent_lsn,
        write_lsn,
        flush_lsn,
        replay_lsn,
        write_lag,
        flush_lag,
        replay_lag,
        sync_priority,
        sync_state
    FROM pg_stat_replication;
    
    -- Grant access to monitoring views
    GRANT SELECT ON replication_status TO triplecheck_app, triplecheck_ro;
    
    -- Create health check function
    CREATE OR REPLACE FUNCTION health_check()
    RETURNS TABLE(
        is_primary boolean,
        is_in_recovery boolean,
        current_wal_lsn text,
        active_connections integer,
        replication_lag_seconds numeric
    ) AS \$\$
    BEGIN
        RETURN QUERY
        SELECT 
            NOT pg_is_in_recovery() as is_primary,
            pg_is_in_recovery() as is_in_recovery,
            CASE 
                WHEN pg_is_in_recovery() THEN pg_last_wal_replay_lsn()::text
                ELSE pg_current_wal_lsn()::text
            END as current_wal_lsn,
            (SELECT count(*)::integer FROM pg_stat_activity WHERE state = 'active') as active_connections,
            CASE 
                WHEN pg_is_in_recovery() THEN 
                    EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
                ELSE 0
            END as replication_lag_seconds;
    END;
    \$\$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Grant execute permission on health check function
    GRANT EXECUTE ON FUNCTION health_check() TO triplecheck_app, triplecheck_ro, triplecheck_backup;
EOSQL

echo "Replication setup completed successfully!"

# Create WAL archive directory
mkdir -p /var/lib/postgresql/wal_archive
chown postgres:postgres /var/lib/postgresql/wal_archive
chmod 700 /var/lib/postgresql/wal_archive

# Create backup directory
mkdir -p /var/lib/postgresql/backups
chown postgres:postgres /var/lib/postgresql/backups
chmod 700 /var/lib/postgresql/backups

echo "Directories created successfully!"

# Log replication status
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT * FROM replication_status;"

echo "Initial replication status logged."
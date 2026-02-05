#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import path from '..\..\..\..\scripts\cleanup-redundancies';

import { connectionRouter } from './ConnectionRouter';
import { failoverManager } from './FailoverManager';
import { replicationManager } from './ReplicationManager';

interface HASetupConfig {
  environment: 'development' | 'staging' | 'production';
  enableReplication: boolean;
  enableFailover: boolean;
  enableLoadBalancing: boolean;
  enableMonitoring: boolean;
  primaryHost: string;
  primaryPort: number;
  replicas: Array<{
    id: string;
    host: string;
    port: number;
    priority: number;
    region?: string;
  }>;
  database: string;
  username: string;
  password: string;
  replicationUser: string;
  replicationPassword: string;
}

class HASetup {
  private config: HASetupConfig;

  constructor(environment: 'development' | 'staging' | 'production') {
    this.config = {
      environment,
      enableReplication: true,
      enableFailover: environment === 'production',
      enableLoadBalancing: true,
      enableMonitoring: true,
      primaryHost: process.env.POSTGRES_PRIMARY_HOST || 'localhost',
      primaryPort: parseInt(process.env.POSTGRES_PRIMARY_PORT || '5432'),
      replicas: [
        {
          id: 'replica-1',
          host: process.env.POSTGRES_REPLICA1_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_REPLICA1_PORT || '5433'),
          priority: 100,
          region: 'primary'
        },
        {
          id: 'replica-2',
          host: process.env.POSTGRES_REPLICA2_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_REPLICA2_PORT || '5434'),
          priority: 90,
          region: 'secondary'
        }
      ],
      database: process.env.POSTGRES_DB || 'triplecheck',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      replicationUser: process.env.POSTGRES_REPLICATION_USER || 'replicator',
      replicationPassword: process.env.POSTGRES_REPLICATION_PASSWORD || ''
    };
  }

  async setup(): Promise<void> {
    console.log(`🚀 Setting up PostgreSQL High Availability for ${this.config.environment}`);

    try {
      await this.validatePrerequisites();
      await this.createDirectories();
      await this.generateEnvironmentFile();
      await this.setupDockerNetwork();
      await this.startDatabaseCluster();
      await this.waitForServices();
      await this.initializeReplication();
      await this.setupFailover();
      await this.setupLoadBalancing();
      await this.setupMonitoring();
      await this.validateSetup();
      await this.generateDocumentation();

      console.log('✅ High Availability setup completed successfully!');
      this.printAccessInformation();
    } catch (error) {
      console.error('❌ High Availability setup failed:', error);
      throw error;
    }
  }

  private async validatePrerequisites(): Promise<void> {
    console.log('🔍 Validating prerequisites...');

    // Check Docker
    try {
      execSync('docker --version', { stdio: 'pipe' });
      console.log('  ✅ Docker is available');
    } catch (error) {
      throw new Error('Docker is not installed or not accessible');
    }

    // Check Docker Compose
    try {
      execSync('docker-compose --version', { stdio: 'pipe' });
      console.log('  ✅ Docker Compose is available');
    } catch (error) {
      throw new Error('Docker Compose is not installed or not accessible');
    }

    // Check required environment variables
    const requiredVars = ['POSTGRES_PASSWORD'];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`Required environment variable ${varName} is not set`);
      }
    }
    console.log('  ✅ Required environment variables are set');

    // Check available ports
    const requiredPorts = [5432, 5433, 5434, 5000, 5001, 6432, 8404];
    for (const port of requiredPorts) {
      try {
        execSync(`netstat -ln | grep :${port}`, { stdio: 'pipe' });
        console.warn(`  ⚠️ Port ${port} appears to be in use`);
      } catch (error) {
        // Port is available (netstat returns non-zero when no matches found)
      }
    }
  }

  private async createDirectories(): Promise<void> {
    console.log('📁 Creating directory structure...');

    const directories = [
      'database/replication/data/primary',
      'database/replication/data/replica1',
      'database/replication/data/replica2',
      'database/replication/logs',
      'database/replication/backups',
      'database/replication/wal_archive',
      'database/replication/scripts/health-checks',
      'database/replication/scripts/failover',
      'database/replication/consul',
      'database/replication/monitoring'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
        console.log(`  Created: ${dir}`);
      }
    });
  }

  private async generateEnvironmentFile(): Promise<void> {
    console.log('⚙️ Generating environment configuration...');

    const envContent = `
# TripleCheck High Availability Database Configuration
# Generated on ${new Date().toISOString()}

# Environment
NODE_ENV=${this.config.environment}

# Primary Database
POSTGRES_DB=${this.config.database}
POSTGRES_USER=${this.config.username}
POSTGRES_PASSWORD=${this.config.password}

# Replication
POSTGRES_REPLICATION_USER=${this.config.replicationUser}
POSTGRES_REPLICATION_PASSWORD=${this.config.replicationPassword}

# Primary Database Connection
POSTGRES_PRIMARY_HOST=${this.config.primaryHost}
POSTGRES_PRIMARY_PORT=${this.config.primaryPort}

# Replica Connections
POSTGRES_REPLICA1_HOST=${this.config.replicas[0].host}
POSTGRES_REPLICA1_PORT=${this.config.replicas[0].port}
POSTGRES_REPLICA2_HOST=${this.config.replicas[1].host}
POSTGRES_REPLICA2_PORT=${this.config.replicas[1].port}

# HAProxy Configuration
HAPROXY_STATS_PASSWORD=triplecheck2024

# PgBouncer Configuration
PGBOUNCER_POOL_MODE=transaction
PGBOUNCER_MAX_CLIENT_CONN=1000
PGBOUNCER_DEFAULT_POOL_SIZE=25

# Keepalived (for production)
KEEPALIVED_PASSWORD=changeme_in_production

# Monitoring
ENABLE_MONITORING=${this.config.enableMonitoring}
ENABLE_FAILOVER=${this.config.enableFailover}
`.trim();

    writeFileSync('database/replication/.env', envContent);
    console.log('  ✅ Environment file generated');
  }

  private async setupDockerNetwork(): Promise<void> {
    console.log('🌐 Setting up Docker network...');

    try {
      // Create custom network for HA setup
      execSync('docker network create triplecheck-ha --subnet=172.20.0.0/16 || true', { stdio: 'pipe' });
      console.log('  ✅ Docker network created');
    } catch (error) {
      console.log('  ℹ️ Docker network already exists or creation failed');
    }
  }

  private async startDatabaseCluster(): Promise<void> {
    console.log('🗄️ Starting database cluster...');

    try {
      // Start the HA cluster using Docker Compose
      execSync('cd database/replication && docker-compose -f docker-compose.ha.yml up -d', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('  ✅ Database cluster started');
    } catch (error) {
      throw new Error(`Failed to start database cluster: ${error.message}`);
    }
  }

  private async waitForServices(): Promise<void> {
    console.log('⏳ Waiting for services to be ready...');

    const maxWaitTime = 120000; // 2 minutes
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check primary database
        execSync('docker exec triplecheck-postgres-primary pg_isready -U postgres', { stdio: 'pipe' });
        
        // Check replicas
        execSync('docker exec triplecheck-postgres-replica1 pg_isready -U postgres', { stdio: 'pipe' });
        execSync('docker exec triplecheck-postgres-replica2 pg_isready -U postgres', { stdio: 'pipe' });
        
        // Check HAProxy
        execSync('curl -f http://localhost:8404/stats > /dev/null 2>&1', { stdio: 'pipe' });
        
        console.log('  ✅ All services are ready');
        return;
      } catch (error) {
        console.log('  ⏳ Services not ready yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    throw new Error('Services did not become ready within the timeout period');
  }

  private async initializeReplication(): Promise<void> {
    if (!this.config.enableReplication) return;

    console.log('🔄 Initializing replication manager...');

    try {
      await replicationManager.initialize();
      console.log('  ✅ Replication manager initialized');

      // Wait a bit for replication to establish
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check replication status
      const status = replicationManager.getReplicationStatus();
      console.log('  📊 Replication status:');
      console.log(`    Primary healthy: ${status.primary.isHealthy}`);
      console.log(`    Replicas healthy: ${status.replicas.filter(r => r.isHealthy).length}/${status.replicas.length}`);
    } catch (error) {
      throw new Error(`Failed to initialize replication: ${error.message}`);
    }
  }

  private async setupFailover(): Promise<void> {
    if (!this.config.enableFailover) {
      console.log('⚠️ Failover is disabled for this environment');
      return;
    }

    console.log('🔄 Setting up failover manager...');

    try {
      await failoverManager.initialize();
      console.log('  ✅ Failover manager initialized');

      // Test failover readiness
      const testResult = await failoverManager.testFailover(true);
      console.log(`  📊 Failover readiness: ${testResult.success ? 'Ready' : 'Not Ready'}`);
      
      if (!testResult.success) {
        console.log('  ⚠️ Failover issues detected:');
        testResult.checks.forEach(check => {
          if (!check.passed) {
            console.log(`    ❌ ${check.name}: ${check.message}`);
          }
        });
      }
    } catch (error) {
      throw new Error(`Failed to setup failover: ${error.message}`);
    }
  }

  private async setupLoadBalancing(): Promise<void> {
    if (!this.config.enableLoadBalancing) return;

    console.log('⚖️ Setting up connection router...');

    try {
      // Connection router is initialized automatically
      const healthCheck = await connectionRouter.healthCheck();
      console.log(`  ✅ Connection router status: ${healthCheck.status}`);
    } catch (error) {
      throw new Error(`Failed to setup load balancing: ${error.message}`);
    }
  }

  private async setupMonitoring(): Promise<void> {
    if (!this.config.enableMonitoring) return;

    console.log('📊 Setting up monitoring...');

    // Create Consul service definitions
    const consulServices = {
      services: [
        {
          id: 'postgres-primary',
          name: 'postgres-primary',
          tags: ['database', 'primary', 'postgres'],
          address: '172.20.0.10',
          port: 5432,
          check: {
            tcp: '172.20.0.10:5432',
            interval: '10s'
          }
        },
        {
          id: 'postgres-replica1',
          name: 'postgres-replica',
          tags: ['database', 'replica', 'postgres', 'priority-100'],
          address: '172.20.0.11',
          port: 5432,
          check: {
            tcp: '172.20.0.11:5432',
            interval: '10s'
          }
        },
        {
          id: 'postgres-replica2',
          name: 'postgres-replica',
          tags: ['database', 'replica', 'postgres', 'priority-90'],
          address: '172.20.0.12',
          port: 5432,
          check: {
            tcp: '172.20.0.12:5432',
            interval: '10s'
          }
        }
      ]
    };

    writeFileSync('database/replication/consul/services.json', JSON.stringify(consulServices, null, 2));
    console.log('  ✅ Consul service definitions created');
  }

  private async validateSetup(): Promise<void> {
    console.log('✅ Validating High Availability setup...');

    const validations = [
      { name: 'Primary Database', test: () => this.testPrimaryConnection() },
      { name: 'Replica Connections', test: () => this.testReplicaConnections() },
      { name: 'Replication Status', test: () => this.testReplicationStatus() },
      { name: 'Load Balancer', test: () => this.testLoadBalancer() },
      { name: 'Connection Routing', test: () => this.testConnectionRouting() }
    ];

    for (const validation of validations) {
      try {
        await validation.test();
        console.log(`  ✅ ${validation.name}: Passed`);
      } catch (error) {
        console.log(`  ❌ ${validation.name}: Failed - ${error.message}`);
        throw new Error(`Validation failed: ${validation.name}`);
      }
    }
  }

  private async testPrimaryConnection(): Promise<void> {
    const connection = await replicationManager.getPrimaryConnection();
    const result = await connection.query('SELECT 1 as test');
    connection.release();
    
    if (result.rows[0].test !== 1) {
      throw new Error('Primary connection test failed');
    }
  }

  private async testReplicaConnections(): Promise<void> {
    const connection = await replicationManager.getReadOnlyConnection();
    const result = await connection.query('SELECT 1 as test');
    connection.release();
    
    if (result.rows[0].test !== 1) {
      throw new Error('Replica connection test failed');
    }
  }

  private async testReplicationStatus(): Promise<void> {
    const status = replicationManager.getReplicationStatus();
    
    if (!status.primary.isHealthy) {
      throw new Error('Primary is not healthy');
    }

    const healthyReplicas = status.replicas.filter(r => r.isHealthy);
    if (healthyReplicas.length === 0) {
      throw new Error('No healthy replicas found');
    }
  }

  private async testLoadBalancer(): Promise<void> {
    try {
      const response = await fetch('http://localhost:8404/stats');
      if (!response.ok) {
        throw new Error(`HAProxy stats returned ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Load balancer test failed: ${error.message}`);
    }
  }

  private async testConnectionRouting(): Promise<void> {
    const result = await connectionRouter.executeQuery('SELECT 1 as test');
    if (result.rows[0].test !== 1) {
      throw new Error('Connection routing test failed');
    }
  }

  private async generateDocumentation(): Promise<void> {
    console.log('📚 Generating documentation...');

    const documentation = `
# TripleCheck High Availability Database Setup

## Overview

This High Availability setup provides:
- **Primary Database**: Write operations and failover source
- **2 Read Replicas**: Read operations with automatic failover capability
- **HAProxy Load Balancer**: Intelligent connection routing
- **PgBouncer**: Connection pooling and management
- **Automatic Failover**: ${this.config.enableFailover ? 'Enabled' : 'Disabled'}
- **Service Discovery**: Consul-based health checking

## Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Application   │    │   Application   │
│    Server 1     │    │    Server 2     │    │    Server 3     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      HAProxy LB           │
                    │   (Port 5000/5001)       │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────┴───────┐    ┌─────────┴───────┐    ┌─────────┴───────┐
│   Primary DB    │    │   Replica 1     │    │   Replica 2     │
│  (Port 5432)    │◄───┤  (Port 5433)    │    │  (Port 5434)    │
│                 │    │                 │◄───┤                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## Connection Information

### Direct Database Connections
- **Primary (Write)**: localhost:5432
- **Replica 1 (Read)**: localhost:5433  
- **Replica 2 (Read)**: localhost:5434

### Load Balanced Connections
- **Write Operations**: localhost:5000 (HAProxy → Primary)
- **Read Operations**: localhost:5001 (HAProxy → Replicas)
- **Connection Pool**: localhost:6432 (PgBouncer)

### Management Interfaces
- **HAProxy Stats**: http://localhost:8404/stats (admin/triplecheck2024)
- **Consul UI**: http://localhost:8500

## Environment: ${this.config.environment}

### Configuration
- **Database**: ${this.config.database}
- **Replication**: ${this.config.enableReplication ? 'Enabled' : 'Disabled'}
- **Automatic Failover**: ${this.config.enableFailover ? 'Enabled' : 'Disabled'}
- **Load Balancing**: ${this.config.enableLoadBalancing ? 'Enabled' : 'Disabled'}
- **Monitoring**: ${this.config.enableMonitoring ? 'Enabled' : 'Disabled'}

### Replica Configuration
${this.config.replicas.map(r => `- **${r.id}**: ${r.host}:${r.port} (Priority: ${r.priority}, Region: ${r.region || 'default'})`).join('\n')}

## Management Commands

### Start/Stop Services
\`\`\`bash
# Start all services
cd database/replication && docker-compose -f docker-compose.ha.yml up -d

# Stop all services  
cd database/replication && docker-compose -f docker-compose.ha.yml down

# View logs
cd database/replication && docker-compose -f docker-compose.ha.yml logs -f
\`\`\`

### Health Checks
\`\`\`bash
# Check replication status
docker exec triplecheck-postgres-primary psql -U postgres -d triplecheck -c "SELECT * FROM pg_stat_replication;"

# Check replica lag
docker exec triplecheck-postgres-replica1 psql -U postgres -d triplecheck -c "SELECT * FROM health_check();"

# Check HAProxy status
curl http://localhost:8404/stats
\`\`\`

### Manual Failover
\`\`\`bash
# Test failover readiness
npm run db:test-failover

# Trigger manual failover (production only)
npm run db:manual-failover
\`\`\`

## Monitoring

The setup includes comprehensive monitoring:
- **Replication Lag**: Monitored continuously
- **Connection Health**: Health checks every 5 seconds
- **Failover Status**: Real-time failover monitoring
- **Load Balancer Stats**: HAProxy statistics dashboard

## Troubleshooting

### Common Issues

1. **Replica not connecting**
   - Check network connectivity between containers
   - Verify replication user credentials
   - Check pg_hba.conf configuration

2. **High replication lag**
   - Check network bandwidth between primary and replica
   - Monitor primary database load
   - Verify WAL archiving is working

3. **Failover not working**
   - Check failover manager logs
   - Verify replica health status
   - Test manual failover procedures

### Log Locations
- **Primary DB**: \`docker logs triplecheck-postgres-primary\`
- **Replica 1**: \`docker logs triplecheck-postgres-replica1\`
- **Replica 2**: \`docker logs triplecheck-postgres-replica2\`
- **HAProxy**: \`docker logs triplecheck-haproxy\`
- **PgBouncer**: \`docker logs triplecheck-pgbouncer\`

## Security Considerations

- Change default passwords in production
- Configure SSL/TLS for database connections
- Restrict network access using firewalls
- Regular security updates for all components
- Monitor access logs for suspicious activity

## Backup Strategy

- **Continuous WAL Archiving**: Enabled on primary
- **Point-in-time Recovery**: Available with WAL replay
- **Replica Backups**: Can be used for backup without affecting primary
- **Automated Backups**: Configure with pg_dump or pg_basebackup

Generated on: ${new Date().toISOString()}
`.trim();

    writeFileSync('database/replication/README.md', documentation);
    console.log('  ✅ Documentation generated');
  }

  private printAccessInformation(): void {
    console.log('\n🌐 High Availability Database Access Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Database Connections:');
    console.log(`  • Primary (Write): localhost:5432`);
    console.log(`  • Replica 1 (Read): localhost:5433`);
    console.log(`  • Replica 2 (Read): localhost:5434`);
    console.log('');
    console.log('⚖️ Load Balanced Connections:');
    console.log(`  • Write Operations: localhost:5000`);
    console.log(`  • Read Operations: localhost:5001`);
    console.log(`  • Connection Pool: localhost:6432`);
    console.log('');
    console.log('🔧 Management Interfaces:');
    console.log(`  • HAProxy Stats: http://localhost:8404/stats`);
    console.log(`  • Consul UI: http://localhost:8500`);
    console.log('');
    console.log('📋 Configuration:');
    console.log(`  • Environment: ${this.config.environment}`);
    console.log(`  • Database: ${this.config.database}`);
    console.log(`  • Replication: ${this.config.enableReplication ? '✅' : '❌'}`);
    console.log(`  • Auto Failover: ${this.config.enableFailover ? '✅' : '❌'}`);
    console.log(`  • Load Balancing: ${this.config.enableLoadBalancing ? '✅' : '❌'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📚 Next Steps:');
    console.log('  1. Test database connections using the provided endpoints');
    console.log('  2. Configure your application to use the load balanced connections');
    console.log('  3. Set up monitoring alerts for replication lag and failover events');
    console.log('  4. Test failover procedures in a non-production environment');
    console.log('  5. Configure backup and recovery procedures');
    
    console.log('\n🔧 Management Commands:');
    console.log('  • View logs: cd database/replication && docker-compose -f docker-compose.ha.yml logs -f');
    console.log('  • Stop services: cd database/replication && docker-compose -f docker-compose.ha.yml down');
    console.log('  • Restart services: cd database/replication && docker-compose -f docker-compose.ha.yml restart');
    console.log('  • Check replication: docker exec triplecheck-postgres-primary psql -U postgres -c "SELECT * FROM pg_stat_replication;"');
  }
}

// CLI interface
async function main() {
  const environment = process.argv[2] as 'development' | 'staging' | 'production';
  
  if (!environment || !['development', 'staging', 'production'].includes(environment)) {
    console.error('Usage: npm run setup:ha <environment>');
    console.error('Environment must be one of: development, staging, production');
    process.exit(1);
  }

  const setup = new HASetup(environment);
  
  try {
    await setup.setup();
    process.exit(0);
  } catch (error) {
    console.error('High Availability setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { HASetup };
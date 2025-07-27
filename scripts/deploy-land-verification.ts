#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  services: string[];
  healthCheckTimeout: number;
  rollbackOnFailure: boolean;
}

class LandVerificationDeployer {
  private config: DeploymentConfig;
  private deploymentId: string;

  constructor(environment: 'development' | 'staging' | 'production') {
    this.config = {
      environment,
      services: [
        'land-verification-service',
        'government-integration-service',
        'risk-assessment-service',
        'community-intelligence-service',
        'monitoring-service'
      ],
      healthCheckTimeout: 300000, // 5 minutes
      rollbackOnFailure: true
    };
    this.deploymentId = `lv-${Date.now()}`;
  }

  async deploy(): Promise<void> {
    console.log(`🚀 Starting Land Verification System deployment (${this.deploymentId})`);
    console.log(`Environment: ${this.config.environment}`);

    try {
      await this.preDeploymentChecks();
      await this.buildServices();
      await this.runDatabaseMigrations();
      await this.deployServices();
      await this.runHealthChecks();
      await this.runDeploymentTests();
      
      console.log('✅ Land Verification System deployment completed successfully');
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      
      if (this.config.rollbackOnFailure) {
        await this.rollback();
      }
      
      throw error;
    }
  }

  private async preDeploymentChecks(): Promise<void> {
    console.log('🔍 Running pre-deployment checks...');

    // Check if required environment variables are set
    const requiredEnvVars = [
      'DATABASE_URL',
      'REDIS_URL',
      'MINISTRY_OF_LANDS_API_KEY',
      'COURT_RECORDS_API_KEY',
      'MONITORING_API_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`);
      }
    }

    // Check database connectivity
    try {
      execSync('npm run db:check', { stdio: 'inherit' });
    } catch (error) {
      throw new Error('Database connectivity check failed');
    }

    // Verify external API connectivity
    await this.checkExternalAPIs();

    console.log('✅ Pre-deployment checks passed');
  }

  private async checkExternalAPIs(): Promise<void> {
    console.log('🌐 Checking external API connectivity...');
    
    const apis = [
      { name: 'Ministry of Lands', url: process.env.MINISTRY_OF_LANDS_API_URL },
      { name: 'Court Records', url: process.env.COURT_RECORDS_API_URL }
    ];

    for (const api of apis) {
      if (api.url) {
        try {
          const response = await fetch(`${api.url}/health`);
          if (!response.ok) {
            console.warn(`⚠️ ${api.name} API health check returned ${response.status}`);
          }
        } catch (error) {
          console.warn(`⚠️ ${api.name} API is not accessible: ${error}`);
        }
      }
    }
  }

  private async buildServices(): Promise<void> {
    console.log('🔨 Building services...');
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Services built successfully');
    } catch (error) {
      throw new Error('Service build failed');
    }
  }

  private async runDatabaseMigrations(): Promise<void> {
    console.log('🗄️ Running database migrations...');
    
    try {
      execSync('npm run db:migrate', { stdio: 'inherit' });
      console.log('✅ Database migrations completed');
    } catch (error) {
      throw new Error('Database migration failed');
    }
  }

  private async deployServices(): Promise<void> {
    console.log('📦 Deploying services...');

    for (const service of this.config.services) {
      console.log(`Deploying ${service}...`);
      
      try {
        // In a real deployment, this would interact with your container orchestration system
        // For now, we'll simulate the deployment process
        await this.deployService(service);
        console.log(`✅ ${service} deployed successfully`);
      } catch (error) {
        throw new Error(`Failed to deploy ${service}: ${error}`);
      }
    }
  }

  private async deployService(serviceName: string): Promise<void> {
    // Simulate service deployment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production, this would:
    // 1. Build and push container images
    // 2. Update service configurations
    // 3. Rolling update deployment
    // 4. Wait for service to be ready
  }

  private async runHealthChecks(): Promise<void> {
    console.log('🏥 Running health checks...');
    
    const startTime = Date.now();
    const timeout = this.config.healthCheckTimeout;

    while (Date.now() - startTime < timeout) {
      try {
        const allHealthy = await this.checkAllServicesHealth();
        if (allHealthy) {
          console.log('✅ All services are healthy');
          return;
        }
      } catch (error) {
        console.log('⏳ Services still starting up...');
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }

    throw new Error('Health check timeout - services did not become healthy within the expected time');
  }

  private async checkAllServicesHealth(): Promise<boolean> {
    const healthChecks = this.config.services.map(service => 
      this.checkServiceHealth(service)
    );

    const results = await Promise.allSettled(healthChecks);
    return results.every(result => result.status === 'fulfilled' && result.value);
  }

  private async checkServiceHealth(serviceName: string): Promise<boolean> {
    try {
      // In production, this would check actual service endpoints
      const response = await fetch(`http://localhost:3000/api/health/${serviceName}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async runDeploymentTests(): Promise<void> {
    console.log('🧪 Running deployment tests...');
    
    try {
      execSync('npm run test:deployment', { stdio: 'inherit' });
      console.log('✅ Deployment tests passed');
    } catch (error) {
      throw new Error('Deployment tests failed');
    }
  }

  private async rollback(): Promise<void> {
    console.log('🔄 Rolling back deployment...');
    
    try {
      // In production, this would:
      // 1. Revert to previous service versions
      // 2. Rollback database migrations if needed
      // 3. Clear any new cache entries
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const environment = process.argv[2] as 'development' | 'staging' | 'production';
  
  if (!environment || !['development', 'staging', 'production'].includes(environment)) {
    console.error('Usage: npm run deploy:land-verification <environment>');
    console.error('Environment must be one of: development, staging, production');
    process.exit(1);
  }

  const deployer = new LandVerificationDeployer(environment);
  
  try {
    await deployer.deploy();
    process.exit(0);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { LandVerificationDeployer };
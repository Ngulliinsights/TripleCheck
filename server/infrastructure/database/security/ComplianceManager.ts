/**
 * Compliance Manager
 * 
 * Handles regulatory compliance including GDPR, data classification,
 * and compliance reporting for the TripleCheck system.
 */

import { createHash, randomBytes } from 'crypto';
import { EventEmitter } from 'events';

import { Pool, PoolClient } from 'pg';

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: string[];
  retentionPeriod: number; // in days
  encryptionRequired: boolean;
  accessControls: string[];
  geographicRestrictions?: string[];
}

export interface GDPRRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  userId: string;
  requestedBy: string;
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  completionDate?: Date;
  reason?: string;
  dataExported?: string;
  verificationToken: string;
}

export interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'audit' | 'security' | 'data_retention';
  period: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed';
  reportData: any;
  filePath?: string;
  hash: string;
}

export interface DataRetentionPolicy {
  tableName: string;
  retentionPeriod: number; // in days
  archiveBeforeDelete: boolean;
  anonymizeBeforeDelete: boolean;
  conditions?: string; // SQL WHERE conditions
  lastProcessed?: Date;
}

export class ComplianceManager extends EventEmitter {
  private pool: Pool;
  private dataClassifications: Map<string, DataClassification> = new Map();
  private retentionPolicies: Map<string, DataRetentionPolicy> = new Map();

  constructor(pool: Pool) {
    super();
    this.pool = pool;
    this.initializeDataClassifications();
    this.initializeRetentionPolicies();
  }

  /**
   * Initialize data classifications for different data types
   */
  private initializeDataClassifications(): void {
    // Personal Identifiable Information (PII)
    this.dataClassifications.set('pii', {
      level: 'restricted',
      categories: ['personal_data', 'gdpr_protected'],
      retentionPeriod: 2555, // 7 years
      encryptionRequired: true,
      accessControls: ['data_protection_officer', 'authorized_personnel'],
      geographicRestrictions: ['eu', 'uk']
    });

    // Financial Information
    this.dataClassifications.set('financial', {
      level: 'confidential',
      categories: ['financial_data', 'payment_info'],
      retentionPeriod: 2555, // 7 years for financial records
      encryptionRequired: true,
      accessControls: ['finance_team', 'compliance_officer']
    });

    // Property Information
    this.dataClassifications.set('property', {
      level: 'internal',
      categories: ['business_data', 'property_records'],
      retentionPeriod: 3650, // 10 years for property records
      encryptionRequired: false,
      accessControls: ['property_team', 'verification_experts']
    });

    // System Logs
    this.dataClassifications.set('logs', {
      level: 'internal',
      categories: ['system_data', 'audit_logs'],
      retentionPeriod: 2555, // 7 years for audit compliance
      encryptionRequired: true,
      accessControls: ['security_team', 'system_admin']
    });

    // Public Information
    this.dataClassifications.set('public', {
      level: 'public',
      categories: ['public_data'],
      retentionPeriod: 1095, // 3 years
      encryptionRequired: false,
      accessControls: ['all_users']
    });
  }

  /**
   * Initialize data retention policies
   */
  private initializeRetentionPolicies(): void {
    // User data retention
    this.retentionPolicies.set('users', {
      tableName: 'users',
      retentionPeriod: 2555, // 7 years after last activity
      archiveBeforeDelete: true,
      anonymizeBeforeDelete: true,
      conditions: "last_login_at < NOW() - INTERVAL '7 years' OR (is_active = false AND updated_at < NOW() - INTERVAL '2 years')"
    });

    // Property views retention
    this.retentionPolicies.set('property_views', {
      tableName: 'property_views',
      retentionPeriod: 365, // 1 year
      archiveBeforeDelete: true,
      anonymizeBeforeDelete: true,
      conditions: "viewed_at < NOW() - INTERVAL '1 year'"
    });

    // Audit logs retention
    this.retentionPolicies.set('audit_logs', {
      tableName: 'audit_logs',
      retentionPeriod: 2555, // 7 years for compliance
      archiveBeforeDelete: true,
      anonymizeBeforeDelete: false, // Keep audit logs intact
      conditions: "created_at < NOW() - INTERVAL '7 years'"
    });

    // Session data retention
    this.retentionPolicies.set('user_sessions', {
      tableName: 'user_sessions',
      retentionPeriod: 90, // 3 months
      archiveBeforeDelete: false,
      anonymizeBeforeDelete: true,
      conditions: "expires_at < NOW() - INTERVAL '3 months'"
    });
  }

  /**
   * Initialize compliance tracking tables
   */
  async initializeComplianceTables(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // GDPR requests table
      await client.query(`
        CREATE TABLE IF NOT EXISTS gdpr_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(20) NOT NULL CHECK (type IN ('access', 'rectification', 'erasure', 'portability', 'restriction')),
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          requested_by VARCHAR(255) NOT NULL,
          request_date TIMESTAMP DEFAULT NOW() NOT NULL,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
          completion_date TIMESTAMP,
          reason TEXT,
          data_exported TEXT,
          verification_token VARCHAR(64) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX IF NOT EXISTS gdpr_requests_user_id_idx ON gdpr_requests(user_id);
        CREATE INDEX IF NOT EXISTS gdpr_requests_status_idx ON gdpr_requests(status);
        CREATE INDEX IF NOT EXISTS gdpr_requests_type_idx ON gdpr_requests(type);
        CREATE INDEX IF NOT EXISTS gdpr_requests_date_idx ON gdpr_requests(request_date);
      `);

      // Compliance reports table
      await client.query(`
        CREATE TABLE IF NOT EXISTS compliance_reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(20) NOT NULL CHECK (type IN ('gdpr', 'audit', 'security', 'data_retention')),
          period_start TIMESTAMP NOT NULL,
          period_end TIMESTAMP NOT NULL,
          generated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          generated_by VARCHAR(255) NOT NULL,
          status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
          report_data JSONB DEFAULT '{}',
          file_path VARCHAR(500),
          hash VARCHAR(64) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX IF NOT EXISTS compliance_reports_type_idx ON compliance_reports(type);
        CREATE INDEX IF NOT EXISTS compliance_reports_period_idx ON compliance_reports(period_start, period_end);
        CREATE INDEX IF NOT EXISTS compliance_reports_status_idx ON compliance_reports(status);
      `);

      // Data classification table
      await client.query(`
        CREATE TABLE IF NOT EXISTS data_classifications (
          id SERIAL PRIMARY KEY,
          table_name VARCHAR(100) NOT NULL,
          column_name VARCHAR(100) NOT NULL,
          classification_level VARCHAR(20) NOT NULL CHECK (classification_level IN ('public', 'internal', 'confidential', 'restricted')),
          categories JSONB DEFAULT '[]',
          retention_period INTEGER NOT NULL,
          encryption_required BOOLEAN DEFAULT false,
          access_controls JSONB DEFAULT '[]',
          geographic_restrictions JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE(table_name, column_name)
        );

        CREATE INDEX IF NOT EXISTS data_classifications_table_idx ON data_classifications(table_name);
        CREATE INDEX IF NOT EXISTS data_classifications_level_idx ON data_classifications(classification_level);
      `);

      // Data retention log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS data_retention_log (
          id SERIAL PRIMARY KEY,
          table_name VARCHAR(100) NOT NULL,
          action VARCHAR(20) NOT NULL CHECK (action IN ('archived', 'anonymized', 'deleted')),
          records_affected INTEGER NOT NULL,
          retention_policy JSONB NOT NULL,
          executed_at TIMESTAMP DEFAULT NOW() NOT NULL,
          executed_by VARCHAR(255) NOT NULL,
          success BOOLEAN NOT NULL,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX IF NOT EXISTS data_retention_log_table_idx ON data_retention_log(table_name);
        CREATE INDEX IF NOT EXISTS data_retention_log_date_idx ON data_retention_log(executed_at);
      `);

      await client.query('COMMIT');
      console.log('✅ Compliance tracking tables initialized');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process GDPR data subject request
   */
  async processGDPRRequest(request: Omit<GDPRRequest, 'id' | 'verificationToken' | 'requestDate' | 'status'>): Promise<string> {
    const client = await this.pool.connect();
    
    try {
      const requestId = randomBytes(16).toString('hex');
      const verificationToken = randomBytes(32).toString('hex');

      await client.query(`
        INSERT INTO gdpr_requests (id, type, user_id, requested_by, verification_token)
        VALUES ($1, $2, $3, $4, $5)
      `, [requestId, request.type, request.userId, request.requestedBy, verificationToken]);

      // Process the request based on type
      switch (request.type) {
        case 'access':
          await this.processDataAccessRequest(requestId, request.userId, client);
          break;
        case 'erasure':
          await this.processDataErasureRequest(requestId, request.userId, client);
          break;
        case 'portability':
          await this.processDataPortabilityRequest(requestId, request.userId, client);
          break;
        case 'rectification':
          // This requires manual intervention
          break;
        case 'restriction':
          await this.processDataRestrictionRequest(requestId, request.userId, client);
          break;
      }

      this.emit('gdpr_request_created', { requestId, type: request.type, userId: request.userId });
      
      return requestId;
    } finally {
      client.release();
    }
  }

  /**
   * Process data access request (GDPR Article 15)
   */
  private async processDataAccessRequest(requestId: string, userId: string, client: PoolClient): Promise<void> {
    try {
      await client.query('UPDATE gdpr_requests SET status = $1 WHERE id = $2', ['processing', requestId]);

      // Collect all user data from various tables
      const userData: any = {};

      // User profile data
      const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      userData.profile = userResult.rows[0];

      // Property data
      const propertiesResult = await client.query('SELECT * FROM properties WHERE owner_id = $1', [userId]);
      userData.properties = propertiesResult.rows;

      // Reviews data
      const reviewsResult = await client.query('SELECT * FROM reviews WHERE user_id = $1', [userId]);
      userData.reviews = reviewsResult.rows;

      // Activity logs
      const logsResult = await client.query('SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1000', [userId]);
      userData.activityLogs = logsResult.rows;

      // Verification sessions
      const verificationsResult = await client.query('SELECT * FROM land_verification_sessions WHERE user_id = $1', [userId]);
      userData.verificationSessions = verificationsResult.rows;

      const dataExport = JSON.stringify(userData, null, 2);
      
      await client.query(`
        UPDATE gdpr_requests 
        SET status = $1, completion_date = NOW(), data_exported = $2 
        WHERE id = $3
      `, ['completed', dataExport, requestId]);

      this.emit('gdpr_access_completed', { requestId, userId, dataSize: dataExport.length });
    } catch (error) {
      await client.query('UPDATE gdpr_requests SET status = $1, reason = $2 WHERE id = $3', 
        ['rejected', error instanceof Error ? error.message : 'Unknown error', requestId]);
      throw error;
    }
  }

  /**
   * Process data erasure request (GDPR Article 17 - Right to be forgotten)
   */
  private async processDataErasureRequest(requestId: string, userId: string, client: PoolClient): Promise<void> {
    try {
      await client.query('UPDATE gdpr_requests SET status = $1 WHERE id = $2', ['processing', requestId]);

      // Anonymize user data instead of deleting to maintain referential integrity
      const anonymizedData = {
        username: `deleted_user_${randomBytes(8).toString('hex')}`,
        email: `deleted_${randomBytes(8).toString('hex')}@anonymized.local`,
        first_name: '[DELETED]',
        last_name: '[DELETED]',
        phone: null,
        profile_image_url: null,
        bio: '[DELETED BY USER REQUEST]',
        is_active: false
      };

      await client.query(`
        UPDATE users 
        SET username = $1, email = $2, first_name = $3, last_name = $4, 
            phone = $5, profile_image_url = $6, bio = $7, is_active = $8,
            updated_at = NOW()
        WHERE id = $9
      `, [
        anonymizedData.username, anonymizedData.email, anonymizedData.first_name,
        anonymizedData.last_name, anonymizedData.phone, anonymizedData.profile_image_url,
        anonymizedData.bio, anonymizedData.is_active, userId
      ]);

      // Anonymize related data
      await client.query('UPDATE reviews SET comment = $1 WHERE user_id = $2', ['[DELETED BY USER REQUEST]', userId]);
      await client.query('UPDATE community_feedback SET source_name = $1, contact_info = $2 WHERE session_id IN (SELECT id FROM land_verification_sessions WHERE user_id = $3)', 
        ['[DELETED]', null, userId]);

      await client.query('UPDATE gdpr_requests SET status = $1, completion_date = NOW() WHERE id = $2', ['completed', requestId]);

      this.emit('gdpr_erasure_completed', { requestId, userId });
    } catch (error) {
      await client.query('UPDATE gdpr_requests SET status = $1, reason = $2 WHERE id = $3', 
        ['rejected', error instanceof Error ? error.message : 'Unknown error', requestId]);
      throw error;
    }
  }

  /**
   * Process data portability request (GDPR Article 20)
   */
  private async processDataPortabilityRequest(requestId: string, userId: string, client: PoolClient): Promise<void> {
    // Similar to access request but in structured format for portability
    await this.processDataAccessRequest(requestId, userId, client);
  }

  /**
   * Process data restriction request (GDPR Article 18)
   */
  private async processDataRestrictionRequest(requestId: string, userId: string, client: PoolClient): Promise<void> {
    try {
      await client.query('UPDATE gdpr_requests SET status = $1 WHERE id = $2', ['processing', requestId]);

      // Mark user account as restricted
      await client.query('UPDATE users SET is_active = false WHERE id = $1', [userId]);
      
      // Add restriction flag to properties
      await client.query('UPDATE properties SET is_active = false WHERE owner_id = $1', [userId]);

      await client.query('UPDATE gdpr_requests SET status = $1, completion_date = NOW() WHERE id = $2', ['completed', requestId]);

      this.emit('gdpr_restriction_completed', { requestId, userId });
    } catch (error) {
      await client.query('UPDATE gdpr_requests SET status = $1, reason = $2 WHERE id = $3', 
        ['rejected', error instanceof Error ? error.message : 'Unknown error', requestId]);
      throw error;
    }
  }

  /**
   * Execute data retention policies
   */
  async executeDataRetention(): Promise<void> {
    console.log('🔄 Executing data retention policies...');

    for (const [policyName, policy] of this.retentionPolicies) {
      try {
        await this.executeRetentionPolicy(policyName, policy);
      } catch (error) {
        console.error(`❌ Failed to execute retention policy for ${policyName}:`, error);
        this.emit('retention_policy_failed', { policyName, error });
      }
    }
  }

  /**
   * Execute a specific retention policy
   */
  private async executeRetentionPolicy(policyName: string, policy: DataRetentionPolicy): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Find records that need retention processing
      const query = `SELECT COUNT(*) as count FROM ${policy.tableName} WHERE ${policy.conditions}`;
      const countResult = await client.query(query);
      const recordsToProcess = parseInt(countResult.rows[0].count);

      if (recordsToProcess === 0) {
        console.log(`✅ No records to process for ${policyName}`);
        await client.query('ROLLBACK');
        return;
      }

      console.log(`🔄 Processing ${recordsToProcess} records for ${policyName}`);

      let action = 'deleted';
      
      if (policy.archiveBeforeDelete) {
        // Archive data first
        await this.archiveData(client, policy.tableName, policy.conditions);
        action = 'archived';
      }

      if (policy.anonymizeBeforeDelete) {
        // Anonymize data
        await this.anonymizeData(client, policy.tableName, policy.conditions);
        action = 'anonymized';
      } else {
        // Delete data
        await client.query(`DELETE FROM ${policy.tableName} WHERE ${policy.conditions}`);
      }

      // Log the retention action
      await client.query(`
        INSERT INTO data_retention_log (table_name, action, records_affected, retention_policy, executed_by, success)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [policy.tableName, action, recordsToProcess, JSON.stringify(policy), 'system', true]);

      await client.query('COMMIT');
      
      console.log(`✅ Successfully processed ${recordsToProcess} records for ${policyName}`);
      this.emit('retention_policy_executed', { policyName, recordsProcessed: recordsToProcess, action });

    } catch (error) {
      await client.query('ROLLBACK');
      
      // Log the failure
      await client.query(`
        INSERT INTO data_retention_log (table_name, action, records_affected, retention_policy, executed_by, success, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [policy.tableName, 'failed', 0, JSON.stringify(policy), 'system', false, error instanceof Error ? error.message : 'Unknown error']);

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Archive data to separate archive tables
   */
  private async archiveData(client: PoolClient, tableName: string, conditions: string): Promise<void> {
    const archiveTableName = `${tableName}_archive`;
    
    // Create archive table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${archiveTableName} (
        LIKE ${tableName} INCLUDING ALL,
        archived_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Copy data to archive
    await client.query(`
      INSERT INTO ${archiveTableName} 
      SELECT *, NOW() as archived_at FROM ${tableName} WHERE ${conditions}
    `);
  }

  /**
   * Anonymize sensitive data
   */
  private async anonymizeData(client: PoolClient, tableName: string, conditions: string): Promise<void> {
    // Table-specific anonymization rules
    const anonymizationRules: Record<string, Record<string, string>> = {
      users: {
        email: `'anonymized_' || id || '@deleted.local'`,
        username: `'deleted_user_' || id`,
        first_name: `'[DELETED]'`,
        last_name: `'[DELETED]'`,
        phone: 'NULL',
        bio: `'[DELETED BY RETENTION POLICY]'`
      },
      property_views: {
        ip_address: `'0.0.0.0'`,
        user_agent: `'[ANONYMIZED]'`
      }
    };

    const rules = anonymizationRules[tableName];
    if (!rules) {
      console.warn(`No anonymization rules defined for table: ${tableName}`);
      return;
    }

    const setClause = Object.entries(rules)
      .map(([column, value]) => `${column} = ${value}`)
      .join(', ');

    await client.query(`UPDATE ${tableName} SET ${setClause} WHERE ${conditions}`);
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(type: ComplianceReport['type'], period: { start: Date; end: Date }, generatedBy: string): Promise<string> {
    const client = await this.pool.connect();
    
    try {
      const reportId = randomBytes(16).toString('hex');
      const reportData: any = {};

      switch (type) {
        case 'gdpr':
          reportData.gdprRequests = await this.getGDPRRequestsReport(client, period);
          reportData.dataSubjects = await this.getDataSubjectsReport(client, period);
          break;
        case 'audit':
          reportData.auditLogs = await this.getAuditLogsReport(client, period);
          reportData.accessPatterns = await this.getAccessPatternsReport(client, period);
          break;
        case 'security':
          reportData.securityEvents = await this.getSecurityEventsReport(client, period);
          reportData.vulnerabilities = await this.getVulnerabilitiesReport(client, period);
          break;
        case 'data_retention':
          reportData.retentionActions = await this.getRetentionActionsReport(client, period);
          reportData.dataVolumes = await this.getDataVolumesReport(client, period);
          break;
      }

      const hash = createHash('sha256').update(JSON.stringify(reportData)).digest('hex');

      await client.query(`
        INSERT INTO compliance_reports (id, type, period_start, period_end, generated_by, report_data, hash, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [reportId, type, period.start, period.end, generatedBy, JSON.stringify(reportData), hash, 'completed']);

      this.emit('compliance_report_generated', { reportId, type, period });
      
      return reportId;
    } finally {
      client.release();
    }
  }

  /**
   * Get GDPR requests report data
   */
  private async getGDPRRequestsReport(client: PoolClient, period: { start: Date; end: Date }): Promise<any> {
    const result = await client.query(`
      SELECT 
        type,
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (completion_date - request_date))/3600) as avg_processing_hours
      FROM gdpr_requests 
      WHERE request_date BETWEEN $1 AND $2
      GROUP BY type, status
      ORDER BY type, status
    `, [period.start, period.end]);

    return result.rows;
  }

  /**
   * Get data subjects report
   */
  private async getDataSubjectsReport(client: PoolClient, period: { start: Date; end: Date }): Promise<any> {
    const result = await client.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_data_subjects,
        COUNT(DISTINCT CASE WHEN type = 'erasure' THEN user_id END) as erasure_requests,
        COUNT(DISTINCT CASE WHEN type = 'access' THEN user_id END) as access_requests
      FROM gdpr_requests 
      WHERE request_date BETWEEN $1 AND $2
    `, [period.start, period.end]);

    return result.rows[0];
  }

  /**
   * Get audit logs report data
   */
  private async getAuditLogsReport(client: PoolClient, period: { start: Date; end: Date }): Promise<any> {
    const result = await client.query(`
      SELECT 
        action_type,
        table_name,
        COUNT(*) as count
      FROM audit_logs 
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY action_type, table_name
      ORDER BY count DESC
    `, [period.start, period.end]);

    return result.rows;
  }

  /**
   * Get access patterns report
   */
  private async getAccessPatternsReport(client: PoolClient, period: { start: Date; end: Date }): Promise<any> {
    const result = await client.query(`
      SELECT 
        user_role,
        COUNT(*) as access_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.created_at BETWEEN $1 AND $2
      GROUP BY user_role
      ORDER BY access_count DESC
    `, [period.start, period.end]);

    return result.rows;
  }

  /**
   * Get security events report
   */
  private async getSecurityEventsReport(client: PoolClient, period: { start: Date; end: Date }): Promise<any> {
    // This would integrate with security monitoring system
    return {
      failedLogins: 0,
      suspiciousActivity: 0,
      blockedIPs: 0,
      securityAlerts: 0
    };
  }

  /**
   * Get vulnerabilities report
   */
  private async getVulnerabilitiesReport(client: PoolClient, period: { start: Date; end: Date }): Promise<any> {
    // This would integrate with vulnerability scanning
    return {
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      mediumVulnerabilities: 0,
      lowVulnerabilities: 0
    };
  }

  /**
   * Get retention actions report
   */
  private async getRetentionActionsReport(client: PoolClient, period: { start: Date; end: Date }): Promise<any> {
    const result = await client.query(`
      SELECT 
        table_name,
        action,
        SUM(records_affected) as total_records,
        COUNT(*) as execution_count
      FROM data_retention_log 
      WHERE executed_at BETWEEN $1 AND $2 AND success = true
      GROUP BY table_name, action
      ORDER BY total_records DESC
    `, [period.start, period.end]);

    return result.rows;
  }

  /**
   * Get data volumes report
   */
  private async getDataVolumesReport(client: PoolClient, period: { start: Date; end: Date }): Promise<any> {
    const result = await client.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables
      ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
    `);

    return result.rows;
  }

  /**
   * Get data classification for a table/column
   */
  getDataClassification(tableColumn: string): DataClassification | undefined {
    return this.dataClassifications.get(tableColumn);
  }

  /**
   * Classify data based on content analysis
   */
  async classifyData(tableName: string, columnName: string, sampleData: any[]): Promise<DataClassification> {
    // Analyze sample data to determine classification
    const hasPersonalInfo = sampleData.some(data => 
      /email|phone|address|name/i.test(columnName) || 
      (typeof data === 'string' && /@/.test(data))
    );

    const hasFinancialInfo = sampleData.some(data =>
      /price|payment|cost|fee|amount/i.test(columnName) ||
      (typeof data === 'number' && data > 1000)
    );

    if (hasPersonalInfo) {
      return this.dataClassifications.get('pii')!;
    } else if (hasFinancialInfo) {
      return this.dataClassifications.get('financial')!;
    } else {
      return this.dataClassifications.get('internal')!;
    }
  }
}
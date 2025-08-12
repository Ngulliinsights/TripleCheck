/**
 * Schema Consolidation Migration
 * 
 * Creates all missing tables from the consolidated schema architecture
 * and ensures proper indexes and constraints are in place.
 */

import postgres from 'postgres';

import { 
  allSchemas, 
  tableNames,
  professionals,
  transactions,
  statistics,
  landVerificationSessions,
  verificationLayers,
  riskFactors,
  governmentDesignations,
  communityFeedback,
  expertAssignments
} from '../../schemas/consolidated';

export interface ConsolidationResult {
  success: boolean;
  tablesCreated: string[];
  indexesCreated: string[];
  constraintsAdded: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Consolidates fragmented database schemas into unified structure
 */
export class SchemaConsolidator {
  constructor(private sql: postgres.Sql) {}

  /**
   * Runs the complete schema consolidation process
   */
  async consolidateSchemas(): Promise<ConsolidationResult> {
    const result: ConsolidationResult = {
      success: false,
      tablesCreated: [],
      indexesCreated: [],
      constraintsAdded: [],
      errors: [],
      warnings: []
    };

    try {
      console.log('🔄 Starting schema consolidation...');

      // Step 1: Create missing core tables
      await this.createMissingCoreTables(result);

      // Step 2: Create missing verification tables
      await this.createMissingVerificationTables(result);

      // Step 3: Add missing indexes
      await this.addMissingIndexes(result);

      // Step 4: Add missing constraints
      await this.addMissingConstraints(result);

      // Step 5: Validate schema integrity
      await this.validateSchemaIntegrity(result);

      result.success = result.errors.length === 0;
      
      console.log(`✅ Schema consolidation completed. Tables created: ${result.tablesCreated.length}`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Schema consolidation failed: ${errorMessage}`);
      console.error('❌ Schema consolidation failed:', error);
      return result;
    }
  }

  /**
   * Creates missing core tables
   */
  private async createMissingCoreTables(result: ConsolidationResult): Promise<void> {
    const coreTables = [
      { name: 'professionals', exists: false },
      { name: 'transactions', exists: false },
      { name: 'statistics', exists: false }
    ];

    for (const table of coreTables) {
      try {
        // Check if table exists
        const tableExists = await this.checkTableExists(table.name);
        
        if (!tableExists) {
          await this.createTable(table.name);
          result.tablesCreated.push(table.name);
          console.log(`✅ Created table: ${table.name}`);
        } else {
          result.warnings.push(`Table ${table.name} already exists`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to create table ${table.name}: ${errorMessage}`);
      }
    }
  }

  /**
   * Creates missing verification tables
   */
  private async createMissingVerificationTables(result: ConsolidationResult): Promise<void> {
    const verificationTables = [
      'land_verification_sessions',
      'verification_layers',
      'risk_factors',
      'government_designations',
      'community_feedback',
      'expert_assignments'
    ];

    for (const tableName of verificationTables) {
      try {
        const tableExists = await this.checkTableExists(tableName);
        
        if (!tableExists) {
          await this.createTable(tableName);
          result.tablesCreated.push(tableName);
          console.log(`✅ Created verification table: ${tableName}`);
        } else {
          result.warnings.push(`Verification table ${tableName} already exists`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to create verification table ${tableName}: ${errorMessage}`);
      }
    }
  }

  /**
   * Adds missing indexes for performance optimization
   */
  private async addMissingIndexes(result: ConsolidationResult): Promise<void> {
    const criticalIndexes = [
      // Professionals table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS professionals_specialization_idx ON professionals(primary_specialization)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS professionals_verification_status_idx ON professionals(verification_status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS professionals_active_verified_idx ON professionals(is_active, verification_status)',
      
      // Transactions table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS transactions_user_date_idx ON transactions(user_id, transaction_date)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS transactions_property_date_idx ON transactions(property_id, transaction_date)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS transactions_fraud_score_idx ON transactions(fraud_score)',
      
      // Land verification indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS land_verification_sessions_property_status_idx ON land_verification_sessions(property_id, status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS verification_layers_session_layer_idx ON verification_layers(session_id, layer_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS risk_factors_session_severity_idx ON risk_factors(session_id, severity)',
    ];

    for (const indexSQL of criticalIndexes) {
      try {
        await this.sql.unsafe(indexSQL);
        const indexName = this.extractIndexName(indexSQL);
        result.indexesCreated.push(indexName);
        console.log(`✅ Created index: ${indexName}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.warnings.push(`Index creation warning: ${errorMessage}`);
      }
    }
  }

  /**
   * Adds missing foreign key constraints
   */
  private async addMissingConstraints(result: ConsolidationResult): Promise<void> {
    const constraints = [
      // Professionals constraints
      'ALTER TABLE professionals ADD CONSTRAINT IF NOT EXISTS professionals_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
      
      // Verification constraints
      'ALTER TABLE verification_layers ADD CONSTRAINT IF NOT EXISTS verification_layers_assigned_expert_id_fkey FOREIGN KEY (assigned_expert_id) REFERENCES professionals(id)',
      'ALTER TABLE expert_assignments ADD CONSTRAINT IF NOT EXISTS expert_assignments_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE',
    ];

    for (const constraintSQL of constraints) {
      try {
        await this.sql.unsafe(constraintSQL);
        const constraintName = this.extractConstraintName(constraintSQL);
        result.constraintsAdded.push(constraintName);
        console.log(`✅ Added constraint: ${constraintName}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.warnings.push(`Constraint creation warning: ${errorMessage}`);
      }
    }
  }

  /**
   * Validates schema integrity after consolidation
   */
  private async validateSchemaIntegrity(result: ConsolidationResult): Promise<void> {
    try {
      // Check that all expected tables exist
      for (const tableName of tableNames) {
        const exists = await this.checkTableExists(tableName);
        if (!exists) {
          result.errors.push(`Expected table ${tableName} does not exist after consolidation`);
        }
      }

      // Check foreign key relationships
      const foreignKeyCheck = await this.sql`
        SELECT 
          tc.table_name, 
          tc.constraint_name, 
          tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name
      `;

      console.log(`✅ Schema integrity check completed. Foreign keys found: ${foreignKeyCheck.length}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Schema integrity validation failed: ${errorMessage}`);
    }
  }

  /**
   * Checks if a table exists in the database
   */
  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )
      `;
      return result[0]?.exists || false;
    } catch (error) {
      console.warn(`Warning: Could not check if table ${tableName} exists:`, error);
      return false;
    }
  }

  /**
   * Creates a table using Drizzle schema definition
   */
  private async createTable(tableName: string): Promise<void> {
    // This would need to be implemented with actual Drizzle table creation
    // For now, we'll use raw SQL for the most critical tables
    
    switch (tableName) {
      case 'professionals':
        await this.createProfessionalsTable();
        break;
      case 'transactions':
        await this.createTransactionsTable();
        break;
      case 'statistics':
        await this.createStatisticsTable();
        break;
      case 'land_verification_sessions':
        await this.createLandVerificationSessionsTable();
        break;
      case 'verification_layers':
        await this.createVerificationLayersTable();
        break;
      case 'risk_factors':
        await this.createRiskFactorsTable();
        break;
      case 'government_designations':
        await this.createGovernmentDesignationsTable();
        break;
      case 'community_feedback':
        await this.createCommunityFeedbackTable();
        break;
      case 'expert_assignments':
        await this.createExpertAssignmentsTable();
        break;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  /**
   * Creates the professionals table
   */
  private async createProfessionalsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS professionals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        alternate_phone VARCHAR(20),
        business_address TEXT NOT NULL,
        service_areas JSONB DEFAULT '[]'::jsonb NOT NULL,
        primary_specialization VARCHAR(50) NOT NULL,
        secondary_specializations JSONB DEFAULT '[]'::jsonb,
        years_of_experience INTEGER NOT NULL,
        license_number VARCHAR(100),
        license_expiry_date TIMESTAMP,
        certifications JSONB DEFAULT '[]'::jsonb,
        education JSONB DEFAULT '[]'::jsonb,
        profile_image_url VARCHAR(500),
        bio TEXT,
        website VARCHAR(255),
        social_media JSONB DEFAULT '{}'::jsonb,
        hourly_rate DECIMAL(8,2),
        project_minimum DECIMAL(8,2),
        availability JSONB DEFAULT '{}'::jsonb,
        verification_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        verification_documents JSONB DEFAULT '[]'::jsonb,
        rating DECIMAL(3,2) DEFAULT 0.00,
        review_count INTEGER DEFAULT 0 NOT NULL,
        completed_projects INTEGER DEFAULT 0 NOT NULL,
        response_time INTEGER DEFAULT 24,
        is_active BOOLEAN DEFAULT true NOT NULL,
        is_available BOOLEAN DEFAULT true NOT NULL,
        last_active_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
  }

  /**
   * Creates the transactions table
   */
  private async createTransactionsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(50) UNIQUE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
        transaction_type VARCHAR(20) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        transaction_date TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        other_parties JSONB DEFAULT '[]'::jsonb NOT NULL,
        is_suspicious BOOLEAN DEFAULT false NOT NULL,
        fraud_score INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
  }

  /**
   * Creates the statistics table
   */
  private async createStatisticsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS statistics (
        id SERIAL PRIMARY KEY,
        metric_type VARCHAR(100) NOT NULL,
        metric_key VARCHAR(100) NOT NULL,
        metric_value JSONB NOT NULL,
        period_type VARCHAR(20) DEFAULT 'all_time',
        period_start TIMESTAMP,
        period_end TIMESTAMP,
        calculated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL
      )
    `;
  }

  /**
   * Creates the land_verification_sessions table
   */
  private async createLandVerificationSessionsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS land_verification_sessions (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        status VARCHAR(20) DEFAULT 'not_started' NOT NULL,
        current_layer VARCHAR(20),
        overall_risk_score INTEGER DEFAULT 0,
        risk_level VARCHAR(20) DEFAULT 'low' NOT NULL,
        confidence DECIMAL(3,2) DEFAULT 0.00,
        estimated_completion_date TIMESTAMP,
        actual_completion_date TIMESTAMP,
        monitoring_enabled BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
  }

  /**
   * Creates the verification_layers table
   */
  private async createVerificationLayersTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS verification_layers (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
        layer_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'not_started' NOT NULL,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        estimated_duration INTEGER,
        actual_duration INTEGER,
        assigned_expert_id INTEGER,
        results JSONB DEFAULT '{}'::jsonb,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(session_id, layer_type)
      )
    `;
  }

  /**
   * Creates the risk_factors table
   */
  private async createRiskFactorsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS risk_factors (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
        category VARCHAR(20) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        confidence DECIMAL(3,2) NOT NULL,
        description TEXT NOT NULL,
        evidence JSONB DEFAULT '[]'::jsonb,
        impact TEXT NOT NULL,
        likelihood DECIMAL(3,2) NOT NULL,
        mitigation JSONB DEFAULT '[]'::jsonb,
        source_layer VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
  }

  /**
   * Creates the government_designations table
   */
  private async createGovernmentDesignationsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS government_designations (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
        designation_type VARCHAR(50) NOT NULL,
        authority VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NOT NULL,
        restrictions JSONB DEFAULT '[]'::jsonb,
        buffer_zone INTEGER,
        risk_level VARCHAR(20) NOT NULL,
        affected_area JSONB,
        planned_changes JSONB DEFAULT '[]'::jsonb,
        last_verified TIMESTAMP DEFAULT NOW() NOT NULL,
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
  }

  /**
   * Creates the community_feedback table
   */
  private async createCommunityFeedbackTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS community_feedback (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
        source VARCHAR(50) NOT NULL,
        source_name VARCHAR(255),
        source_position VARCHAR(255),
        contact_info VARCHAR(255),
        years_in_area INTEGER,
        ownership_history TEXT,
        known_disputes JSONB DEFAULT '[]'::jsonb,
        land_use_patterns JSONB DEFAULT '[]'::jsonb,
        recent_changes JSONB DEFAULT '[]'::jsonb,
        concerns JSONB DEFAULT '[]'::jsonb,
        reliability DECIMAL(3,2) DEFAULT 0.50,
        verified_by VARCHAR(255),
        is_confidential BOOLEAN DEFAULT false NOT NULL,
        recorded_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
  }

  /**
   * Creates the expert_assignments table
   */
  private async createExpertAssignmentsTable(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS expert_assignments (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES land_verification_sessions(id) ON DELETE CASCADE NOT NULL,
        layer_id INTEGER REFERENCES verification_layers(id) ON DELETE CASCADE,
        professional_id INTEGER NOT NULL,
        expert_type VARCHAR(50) NOT NULL,
        assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expected_completion_date TIMESTAMP,
        actual_completion_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'assigned' NOT NULL,
        report_url VARCHAR(500),
        cost DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
  }

  /**
   * Extracts index name from CREATE INDEX SQL
   */
  private extractIndexName(sql: string): string {
    const match = sql.match(/CREATE INDEX.*?IF NOT EXISTS\s+(\w+)/i);
    return match ? match[1] : 'unknown_index';
  }

  /**
   * Extracts constraint name from ALTER TABLE SQL
   */
  private extractConstraintName(sql: string): string {
    const match = sql.match(/CONSTRAINT\s+IF NOT EXISTS\s+(\w+)/i);
    return match ? match[1] : 'unknown_constraint';
  }
}

/**
 * Runs schema consolidation migration
 */
export async function runSchemaConsolidation(sql: postgres.Sql): Promise<ConsolidationResult> {
  const consolidator = new SchemaConsolidator(sql);
  return await consolidator.consolidateSchemas();
}

export default SchemaConsolidator;
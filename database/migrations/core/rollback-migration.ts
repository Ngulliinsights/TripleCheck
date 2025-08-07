#!/usr/bin/env tsx
/**
 * Migration Rollback Script
 * 
 * This script provides rollback procedures for failed migrations
 * and can restore the database to a previous state.
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { 
  properties, 
  landVerificationSessions,
  verificationLayers,
  riskFactors,
  governmentDesignations,
  communityFeedback,
  expertAssignments,
  propertyMonitoring,
  monitoringAlerts
} from "../../src/shared/schema";

// Load environment variables
config();

interface RollbackOptions {
  preserveExistingData?: boolean;
  createBackup?: boolean;
  rollbackType: 'full' | 'partial' | 'properties_only' | 'sessions_only';
  targetDate?: Date;
}

interface RollbackStats {
  sessionsRemoved: number;
  layersRemoved: number;
  riskFactorsRemoved: number;
  designationsRemoved: number;
  feedbackRemoved: number;
  expertsRemoved: number;
  monitoringRemoved: number;
  alertsRemoved: number;
  propertiesReverted: number;
  backupCreated: boolean;
  errors: number;
}

async function rollbackMigration(options: RollbackOptions = { rollbackType: 'full' }): Promise<RollbackStats> {
  console.log("🔄 Starting migration rollback...");
  console.log(`   Rollback Type: ${options.rollbackType}`);
  console.log(`   Preserve Existing Data: ${options.preserveExistingData ?? false}`);
  console.log(`   Create Backup: ${options.createBackup ?? false}`);

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const sql_client = neon(process.env.DATABASE_URL);
  const db = drizzle(sql_client);

  const stats: RollbackStats = {
    sessionsRemoved: 0,
    layersRemoved: 0,
    riskFactorsRemoved: 0,
    designationsRemoved: 0,
    feedbackRemoved: 0,
    expertsRemoved: 0,
    monitoringRemoved: 0,
    alertsRemoved: 0,
    propertiesReverted: 0,
    backupCreated: false,
    errors: 0
  };

  try {
    console.log("✅ Database connection established");

    // Create backup if requested
    if (options.createBackup) {
      console.log("\n💾 Creating backup before rollback...");
      await createBackup(db, stats);
    }

    // Confirm rollback with user
    if (!await confirmRollback(options)) {
      console.log("❌ Rollback cancelled by user");
      return stats;
    }

    // Execute rollback based on type
    switch (options.rollbackType) {
      case 'full':
        await performFullRollback(db, stats, options);
        break;
      case 'partial':
        await performPartialRollback(db, stats, options);
        break;
      case 'properties_only':
        await rollbackPropertyChanges(db, stats, options);
        break;
      case 'sessions_only':
        await rollbackSessionsOnly(db, stats, options);
        break;
      default:
        throw new Error(`Unknown rollback type: ${options.rollbackType}`);
    }

    console.log("\n🎉 Migration rollback completed!");
    printRollbackStats(stats);

  } catch (error) {
    console.error("❌ Rollback failed:", error);
    stats.errors++;
    throw error;
  }

  return stats;
}

async function createBackup(db: any, stats: RollbackStats) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPrefix = `backup_${timestamp}`;

    console.log(`   Creating backup tables with prefix: ${backupPrefix}`);

    // Create backup tables
    const backupQueries = [
      `CREATE TABLE ${backupPrefix}_land_verification_sessions AS SELECT * FROM land_verification_sessions`,
      `CREATE TABLE ${backupPrefix}_verification_layers AS SELECT * FROM verification_layers`,
      `CREATE TABLE ${backupPrefix}_risk_factors AS SELECT * FROM risk_factors`,
      `CREATE TABLE ${backupPrefix}_government_designations AS SELECT * FROM government_designations`,
      `CREATE TABLE ${backupPrefix}_community_feedback AS SELECT * FROM community_feedback`,
      `CREATE TABLE ${backupPrefix}_expert_assignments AS SELECT * FROM expert_assignments`,
      `CREATE TABLE ${backupPrefix}_property_monitoring AS SELECT * FROM property_monitoring`,
      `CREATE TABLE ${backupPrefix}_monitoring_alerts AS SELECT * FROM monitoring_alerts`,
      `CREATE TABLE ${backupPrefix}_properties AS SELECT * FROM properties`
    ];

    for (const query of backupQueries) {
      try {
        await db.execute(sql.raw(query));
        console.log(`   ✅ Created backup: ${query.split(' ')[2]}`);
      } catch (error) {
        console.log(`   ⚠️  Backup warning: ${error}`);
      }
    }

    stats.backupCreated = true;
    console.log("   ✅ Backup completed successfully");

  } catch (error) {
    console.error("   ❌ Backup failed:", error);
    stats.errors++;
  }
}

async function confirmRollback(options: RollbackOptions): Promise<boolean> {
  // In a real implementation, you might want to add interactive confirmation
  // For now, we'll assume confirmation based on environment or options
  
  if (process.env.NODE_ENV === 'production' && !process.env.FORCE_ROLLBACK) {
    console.log("⚠️  Production environment detected. Set FORCE_ROLLBACK=true to proceed.");
    return false;
  }

  console.log("⚠️  This will permanently delete land verification data!");
  console.log("   Proceeding with rollback...");
  return true;
}

async function performFullRollback(db: any, stats: RollbackStats, options: RollbackOptions) {
  console.log("\n🗑️  Performing full rollback...");

  try {
    // Remove in reverse dependency order to avoid foreign key constraints

    // 1. Remove monitoring alerts
    console.log("   Removing monitoring alerts...");
    const alertsResult = await db.delete(monitoringAlerts);
    stats.alertsRemoved = alertsResult.rowCount || 0;

    // 2. Remove property monitoring
    console.log("   Removing property monitoring...");
    const monitoringResult = await db.delete(propertyMonitoring);
    stats.monitoringRemoved = monitoringResult.rowCount || 0;

    // 3. Remove expert assignments
    console.log("   Removing expert assignments...");
    const expertsResult = await db.delete(expertAssignments);
    stats.expertsRemoved = expertsResult.rowCount || 0;

    // 4. Remove community feedback
    console.log("   Removing community feedback...");
    const feedbackResult = await db.delete(communityFeedback);
    stats.feedbackRemoved = feedbackResult.rowCount || 0;

    // 5. Remove government designations
    console.log("   Removing government designations...");
    const designationsResult = await db.delete(governmentDesignations);
    stats.designationsRemoved = designationsResult.rowCount || 0;

    // 6. Remove risk factors
    console.log("   Removing risk factors...");
    const riskResult = await db.delete(riskFactors);
    stats.riskFactorsRemoved = riskResult.rowCount || 0;

    // 7. Remove verification layers
    console.log("   Removing verification layers...");
    const layersResult = await db.delete(verificationLayers);
    stats.layersRemoved = layersResult.rowCount || 0;

    // 8. Remove land verification sessions
    console.log("   Removing land verification sessions...");
    const sessionsResult = await db.delete(landVerificationSessions);
    stats.sessionsRemoved = sessionsResult.rowCount || 0;

    // 9. Revert property changes
    await rollbackPropertyChanges(db, stats, options);

  } catch (error) {
    console.error("   ❌ Error during full rollback:", error);
    stats.errors++;
    throw error;
  }
}

async function performPartialRollback(db: any, stats: RollbackStats, options: RollbackOptions) {
  console.log("\n🗑️  Performing partial rollback...");

  try {
    // Only remove data created after target date if specified
    const targetDate = options.targetDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: 24 hours ago

    console.log(`   Removing data created after: ${targetDate.toISOString()}`);

    // Remove sessions created after target date
    const sessionsResult = await db
      .delete(landVerificationSessions)
      .where(sql`created_at > ${targetDate.toISOString()}`);
    stats.sessionsRemoved = sessionsResult.rowCount || 0;

    // Note: Related data will be cascade deleted due to foreign key constraints

    console.log("   ✅ Partial rollback completed");

  } catch (error) {
    console.error("   ❌ Error during partial rollback:", error);
    stats.errors++;
    throw error;
  }
}

async function rollbackPropertyChanges(db: any, stats: RollbackStats, options: RollbackOptions) {
  console.log("\n🏠 Rolling back property changes...");

  try {
    // Get all properties that have land verification flags
    const propertiesWithFlags = await db
      .select()
      .from(properties)
      .where(sql`features->>'landVerificationEligible' = 'true'`);

    console.log(`   Found ${propertiesWithFlags.length} properties with land verification flags`);

    for (const property of propertiesWithFlags) {
      try {
        // Remove land verification specific features
        const updatedFeatures = { ...property.features };
        delete updatedFeatures.landVerificationEligible;
        delete updatedFeatures.landVerificationStatus;

        await db
          .update(properties)
          .set({ features: updatedFeatures })
          .where(eq(properties.id, property.id));

        stats.propertiesReverted++;

      } catch (error) {
        console.error(`   ❌ Error reverting property ${property.id}:`, error);
        stats.errors++;
      }
    }

    console.log(`   ✅ Reverted ${stats.propertiesReverted} properties`);

  } catch (error) {
    console.error("   ❌ Error during property rollback:", error);
    stats.errors++;
    throw error;
  }
}

async function rollbackSessionsOnly(db: any, stats: RollbackStats, options: RollbackOptions) {
  console.log("\n📋 Rolling back sessions only...");

  try {
    // Remove all land verification sessions (cascade will handle related data)
    const sessionsResult = await db.delete(landVerificationSessions);
    stats.sessionsRemoved = sessionsResult.rowCount || 0;

    console.log(`   ✅ Removed ${stats.sessionsRemoved} sessions`);

  } catch (error) {
    console.error("   ❌ Error during sessions rollback:", error);
    stats.errors++;
    throw error;
  }
}

function printRollbackStats(stats: RollbackStats) {
  console.log("\n📊 Rollback Statistics:");
  console.log(`   Sessions Removed: ${stats.sessionsRemoved}`);
  console.log(`   Layers Removed: ${stats.layersRemoved}`);
  console.log(`   Risk Factors Removed: ${stats.riskFactorsRemoved}`);
  console.log(`   Designations Removed: ${stats.designationsRemoved}`);
  console.log(`   Feedback Removed: ${stats.feedbackRemoved}`);
  console.log(`   Expert Assignments Removed: ${stats.expertsRemoved}`);
  console.log(`   Monitoring Configs Removed: ${stats.monitoringRemoved}`);
  console.log(`   Alerts Removed: ${stats.alertsRemoved}`);
  console.log(`   Properties Reverted: ${stats.propertiesReverted}`);
  console.log(`   Backup Created: ${stats.backupCreated ? 'Yes' : 'No'}`);
  console.log(`   Errors: ${stats.errors}`);

  if (stats.errors > 0) {
    console.log(`\n⚠️  ${stats.errors} errors occurred during rollback`);
  } else {
    console.log(`\n✅ Rollback completed successfully!`);
  }
}

// Utility function to list available backups
async function listBackups(db: any) {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'backup_%'
      ORDER BY table_name
    `);

    console.log("\n📋 Available Backups:");
    const backups = new Set<string>();
    
    for (const row of result) {
      const tableName = row.table_name;
      const backupId = tableName.split('_').slice(1, 3).join('_'); // Extract timestamp
      backups.add(backupId);
    }

    if (backups.size === 0) {
      console.log("   No backups found");
    } else {
      backups.forEach(backup => {
        console.log(`   - ${backup}`);
      });
    }

  } catch (error) {
    console.error("❌ Error listing backups:", error);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'full':
      await rollbackMigration({ rollbackType: 'full', createBackup: true });
      break;
    case 'partial':
      await rollbackMigration({ rollbackType: 'partial', createBackup: true });
      break;
    case 'properties':
      await rollbackMigration({ rollbackType: 'properties_only', createBackup: true });
      break;
    case 'sessions':
      await rollbackMigration({ rollbackType: 'sessions_only', createBackup: true });
      break;
    case 'list-backups':
      const sql_client = neon(process.env.DATABASE_URL!);
      const db = drizzle(sql_client);
      await listBackups(db);
      break;
    default:
      console.log("Usage: tsx rollback-migration.ts [full|partial|properties|sessions|list-backups]");
      console.log("");
      console.log("Commands:");
      console.log("  full         - Complete rollback of all land verification data");
      console.log("  partial      - Rollback data created in last 24 hours");
      console.log("  properties   - Only revert property feature changes");
      console.log("  sessions     - Only remove verification sessions");
      console.log("  list-backups - List available backup tables");
      process.exit(1);
  }
}

// Run main if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('\n✨ Rollback operation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Rollback operation failed:', error);
      process.exit(1);
    });
}

export { rollbackMigration, listBackups, type RollbackOptions, type RollbackStats };
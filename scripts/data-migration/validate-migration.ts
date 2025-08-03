#!/usr/bin/env tsx
/**
 * Data Migration Validation Script
 * 
 * This script validates the integrity and accuracy of migrated data
 * for the Kenya Land Verification System.
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { eq, count, sql } from "drizzle-orm";
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
  users
} from "../../src/shared/schema";

// Load environment variables
config();

interface ValidationResult {
  tableName: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  issues: string[];
  passed: boolean;
}

interface ValidationSummary {
  totalTables: number;
  passedTables: number;
  failedTables: number;
  totalIssues: number;
  overallPassed: boolean;
  results: ValidationResult[];
}

async function validateMigration(): Promise<ValidationSummary> {
  console.log("🔍 Starting data migration validation...");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const sql_client = neon(process.env.DATABASE_URL);
  const db = drizzle(sql_client);

  console.log("✅ Database connection established");

  const summary: ValidationSummary = {
    totalTables: 0,
    passedTables: 0,
    failedTables: 0,
    totalIssues: 0,
    overallPassed: true,
    results: []
  };

  try {
    // Validate each table
    console.log("\n📋 Validating data integrity...");

    // Validate properties table
    summary.results.push(await validateProperties(db));
    
    // Validate land verification sessions
    summary.results.push(await validateLandVerificationSessions(db));
    
    // Validate verification layers
    summary.results.push(await validateVerificationLayers(db));
    
    // Validate risk factors
    summary.results.push(await validateRiskFactors(db));
    
    // Validate government designations
    summary.results.push(await validateGovernmentDesignations(db));
    
    // Validate community feedback
    summary.results.push(await validateCommunityFeedback(db));
    
    // Validate expert assignments
    summary.results.push(await validateExpertAssignments(db));
    
    // Validate property monitoring
    summary.results.push(await validatePropertyMonitoring(db));

    // Validate referential integrity
    summary.results.push(await validateReferentialIntegrity(db));

    // Calculate summary statistics
    summary.totalTables = summary.results.length;
    summary.passedTables = summary.results.filter(r => r.passed).length;
    summary.failedTables = summary.results.filter(r => !r.passed).length;
    summary.totalIssues = summary.results.reduce((sum, r) => sum + r.issues.length, 0);
    summary.overallPassed = summary.failedTables === 0;

    // Print results
    printValidationResults(summary);

  } catch (error) {
    console.error("❌ Validation failed:", error);
    throw error;
  }

  return summary;
}

async function validateProperties(db: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    tableName: 'properties',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    issues: [],
    passed: true
  };

  try {
    // Get total count
    const totalCount = await db.select({ count: count() }).from(properties);
    result.totalRecords = totalCount[0].count;

    if (result.totalRecords === 0) {
      result.issues.push("No properties found in database");
      result.passed = false;
      return result;
    }

    // Get all properties
    const allProperties = await db.select().from(properties);

    for (const property of allProperties) {
      let isValid = true;

      // Validate required fields
      if (!property.title || property.title.trim() === '') {
        result.issues.push(`Property ${property.id}: Missing or empty title`);
        isValid = false;
      }

      if (!property.description || property.description.trim() === '') {
        result.issues.push(`Property ${property.id}: Missing or empty description`);
        isValid = false;
      }

      if (!property.location || property.location.trim() === '') {
        result.issues.push(`Property ${property.id}: Missing or empty location`);
        isValid = false;
      }

      if (!property.price || property.price <= 0) {
        result.issues.push(`Property ${property.id}: Invalid price (${property.price})`);
        isValid = false;
      }

      // Validate land verification eligibility for land properties
      if (property.features?.propertyType === 'land' || property.features?.propertyType === 'house') {
        if (!property.features?.landVerificationEligible) {
          result.issues.push(`Property ${property.id}: Land property missing landVerificationEligible flag`);
          isValid = false;
        }
      }

      // Validate coordinates if present
      if (property.coordinates) {
        const coords = property.coordinates as any;
        if (!coords.lat || !coords.lng || 
            typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
          result.issues.push(`Property ${property.id}: Invalid coordinates format`);
          isValid = false;
        }
      }

      if (isValid) {
        result.validRecords++;
      } else {
        result.invalidRecords++;
      }
    }

    result.passed = result.invalidRecords === 0;

  } catch (error) {
    result.issues.push(`Validation error: ${error}`);
    result.passed = false;
  }

  return result;
}

async function validateLandVerificationSessions(db: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    tableName: 'land_verification_sessions',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    issues: [],
    passed: true
  };

  try {
    const totalCount = await db.select({ count: count() }).from(landVerificationSessions);
    result.totalRecords = totalCount[0].count;

    if (result.totalRecords === 0) {
      result.issues.push("No land verification sessions found");
      return result;
    }

    const allSessions = await db.select().from(landVerificationSessions);

    for (const session of allSessions) {
      let isValid = true;

      // Validate required fields
      if (!session.propertyId) {
        result.issues.push(`Session ${session.id}: Missing propertyId`);
        isValid = false;
      }

      if (!session.userId) {
        result.issues.push(`Session ${session.id}: Missing userId`);
        isValid = false;
      }

      // Validate risk score range
      if (session.overallRiskScore < 0 || session.overallRiskScore > 100) {
        result.issues.push(`Session ${session.id}: Invalid risk score (${session.overallRiskScore})`);
        isValid = false;
      }

      // Validate confidence range
      if (session.confidence < 0 || session.confidence > 1) {
        result.issues.push(`Session ${session.id}: Invalid confidence (${session.confidence})`);
        isValid = false;
      }

      // Validate status consistency
      if (session.status === 'completed' && !session.actualCompletionDate) {
        result.issues.push(`Session ${session.id}: Completed status but no completion date`);
        isValid = false;
      }

      if (isValid) {
        result.validRecords++;
      } else {
        result.invalidRecords++;
      }
    }

    result.passed = result.invalidRecords === 0;

  } catch (error) {
    result.issues.push(`Validation error: ${error}`);
    result.passed = false;
  }

  return result;
}

async function validateVerificationLayers(db: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    tableName: 'verification_layers',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    issues: [],
    passed: true
  };

  try {
    const totalCount = await db.select({ count: count() }).from(verificationLayers);
    result.totalRecords = totalCount[0].count;

    if (result.totalRecords === 0) {
      return result; // No layers is acceptable
    }

    const allLayers = await db.select().from(verificationLayers);

    for (const layer of allLayers) {
      let isValid = true;

      // Validate required fields
      if (!layer.sessionId) {
        result.issues.push(`Layer ${layer.id}: Missing sessionId`);
        isValid = false;
      }

      if (!layer.layerType) {
        result.issues.push(`Layer ${layer.id}: Missing layerType`);
        isValid = false;
      }

      // Validate duration consistency
      if (layer.status === 'completed' && layer.estimatedDuration && layer.actualDuration) {
        const variance = Math.abs(layer.actualDuration - layer.estimatedDuration) / layer.estimatedDuration;
        if (variance > 2.0) { // More than 200% variance
          result.issues.push(`Layer ${layer.id}: Large duration variance (estimated: ${layer.estimatedDuration}, actual: ${layer.actualDuration})`);
        }
      }

      if (isValid) {
        result.validRecords++;
      } else {
        result.invalidRecords++;
      }
    }

    result.passed = result.invalidRecords === 0;

  } catch (error) {
    result.issues.push(`Validation error: ${error}`);
    result.passed = false;
  }

  return result;
}

async function validateRiskFactors(db: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    tableName: 'risk_factors',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    issues: [],
    passed: true
  };

  try {
    const totalCount = await db.select({ count: count() }).from(riskFactors);
    result.totalRecords = totalCount[0].count;

    if (result.totalRecords === 0) {
      return result; // No risk factors is acceptable
    }

    const allRiskFactors = await db.select().from(riskFactors);

    for (const risk of allRiskFactors) {
      let isValid = true;

      // Validate required fields
      if (!risk.sessionId) {
        result.issues.push(`Risk ${risk.id}: Missing sessionId`);
        isValid = false;
      }

      if (!risk.description || risk.description.trim() === '') {
        result.issues.push(`Risk ${risk.id}: Missing or empty description`);
        isValid = false;
      }

      // Validate confidence range
      if (risk.confidence < 0 || risk.confidence > 1) {
        result.issues.push(`Risk ${risk.id}: Invalid confidence (${risk.confidence})`);
        isValid = false;
      }

      // Validate likelihood range
      if (risk.likelihood < 0 || risk.likelihood > 1) {
        result.issues.push(`Risk ${risk.id}: Invalid likelihood (${risk.likelihood})`);
        isValid = false;
      }

      if (isValid) {
        result.validRecords++;
      } else {
        result.invalidRecords++;
      }
    }

    result.passed = result.invalidRecords === 0;

  } catch (error) {
    result.issues.push(`Validation error: ${error}`);
    result.passed = false;
  }

  return result;
}

async function validateGovernmentDesignations(db: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    tableName: 'government_designations',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    issues: [],
    passed: true
  };

  try {
    const totalCount = await db.select({ count: count() }).from(governmentDesignations);
    result.totalRecords = totalCount[0].count;

    if (result.totalRecords === 0) {
      return result; // No designations is acceptable
    }

    const allDesignations = await db.select().from(governmentDesignations);

    for (const designation of allDesignations) {
      let isValid = true;

      // Validate required fields
      if (!designation.sessionId) {
        result.issues.push(`Designation ${designation.id}: Missing sessionId`);
        isValid = false;
      }

      if (!designation.authority || designation.authority.trim() === '') {
        result.issues.push(`Designation ${designation.id}: Missing or empty authority`);
        isValid = false;
      }

      if (!designation.designation || designation.designation.trim() === '') {
        result.issues.push(`Designation ${designation.id}: Missing or empty designation`);
        isValid = false;
      }

      // Validate buffer zone
      if (designation.bufferZone && designation.bufferZone < 0) {
        result.issues.push(`Designation ${designation.id}: Invalid buffer zone (${designation.bufferZone})`);
        isValid = false;
      }

      if (isValid) {
        result.validRecords++;
      } else {
        result.invalidRecords++;
      }
    }

    result.passed = result.invalidRecords === 0;

  } catch (error) {
    result.issues.push(`Validation error: ${error}`);
    result.passed = false;
  }

  return result;
}

async function validateCommunityFeedback(db: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    tableName: 'community_feedback',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    issues: [],
    passed: true
  };

  try {
    const totalCount = await db.select({ count: count() }).from(communityFeedback);
    result.totalRecords = totalCount[0].count;

    if (result.totalRecords === 0) {
      return result; // No feedback is acceptable
    }

    const allFeedback = await db.select().from(communityFeedback);

    for (const feedback of allFeedback) {
      let isValid = true;

      // Validate required fields
      if (!feedback.sessionId) {
        result.issues.push(`Feedback ${feedback.id}: Missing sessionId`);
        isValid = false;
      }

      // Validate reliability range
      if (feedback.reliability < 0 || feedback.reliability > 1) {
        result.issues.push(`Feedback ${feedback.id}: Invalid reliability (${feedback.reliability})`);
        isValid = false;
      }

      // Validate years in area
      if (feedback.yearsInArea && feedback.yearsInArea < 0) {
        result.issues.push(`Feedback ${feedback.id}: Invalid years in area (${feedback.yearsInArea})`);
        isValid = false;
      }

      if (isValid) {
        result.validRecords++;
      } else {
        result.invalidRecords++;
      }
    }

    result.passed = result.invalidRecords === 0;

  } catch (error) {
    result.issues.push(`Validation error: ${error}`);
    result.passed = false;
  }

  return result;
}

async function validateExpertAssignments(db: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    tableName: 'expert_assignments',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    issues: [],
    passed: true
  };

  try {
    const totalCount = await db.select({ count: count() }).from(expertAssignments);
    result.totalRecords = totalCount[0].count;

    if (result.totalRecords === 0) {
      return result; // No assignments is acceptable
    }

    const allAssignments = await db.select().from(expertAssignments);

    for (const assignment of allAssignments) {
      let isValid = true;

      // Validate required fields
      if (!assignment.sessionId) {
        result.issues.push(`Assignment ${assignment.id}: Missing sessionId`);
        isValid = false;
      }

      if (!assignment.expertName || assignment.expertName.trim() === '') {
        result.issues.push(`Assignment ${assignment.id}: Missing or empty expertName`);
        isValid = false;
      }

      if (!assignment.expertType || assignment.expertType.trim() === '') {
        result.issues.push(`Assignment ${assignment.id}: Missing or empty expertType`);
        isValid = false;
      }

      // Validate cost
      if (assignment.cost && assignment.cost < 0) {
        result.issues.push(`Assignment ${assignment.id}: Invalid cost (${assignment.cost})`);
        isValid = false;
      }

      if (isValid) {
        result.validRecords++;
      } else {
        result.invalidRecords++;
      }
    }

    result.passed = result.invalidRecords === 0;

  } catch (error) {
    result.issues.push(`Validation error: ${error}`);
    result.passed = false;
  }

  return result;
}

async function validatePropertyMonitoring(db: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    tableName: 'property_monitoring',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    issues: [],
    passed: true
  };

  try {
    const totalCount = await db.select({ count: count() }).from(propertyMonitoring);
    result.totalRecords = totalCount[0].count;

    if (result.totalRecords === 0) {
      return result; // No monitoring is acceptable
    }

    const allMonitoring = await db.select().from(propertyMonitoring);

    for (const monitoring of allMonitoring) {
      let isValid = true;

      // Validate required fields
      if (!monitoring.propertyId) {
        result.issues.push(`Monitoring ${monitoring.id}: Missing propertyId`);
        isValid = false;
      }

      if (!monitoring.userId) {
        result.issues.push(`Monitoring ${monitoring.id}: Missing userId`);
        isValid = false;
      }

      if (!monitoring.monitoringType || monitoring.monitoringType.trim() === '') {
        result.issues.push(`Monitoring ${monitoring.id}: Missing or empty monitoringType`);
        isValid = false;
      }

      // Validate alerts generated
      if (monitoring.alertsGenerated < 0) {
        result.issues.push(`Monitoring ${monitoring.id}: Invalid alertsGenerated (${monitoring.alertsGenerated})`);
        isValid = false;
      }

      if (isValid) {
        result.validRecords++;
      } else {
        result.invalidRecords++;
      }
    }

    result.passed = result.invalidRecords === 0;

  } catch (error) {
    result.issues.push(`Validation error: ${error}`);
    result.passed = false;
  }

  return result;
}

async function validateReferentialIntegrity(db: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    tableName: 'referential_integrity',
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    issues: [],
    passed: true
  };

  try {
    // Check land verification sessions reference valid properties and users
    const orphanedSessions = await db.execute(sql`
      SELECT lvs.id, lvs.property_id, lvs.user_id
      FROM land_verification_sessions lvs
      LEFT JOIN properties p ON lvs.property_id = p.id
      LEFT JOIN users u ON lvs.user_id = u.id
      WHERE p.id IS NULL OR u.id IS NULL
    `);

    if (orphanedSessions.length > 0) {
      result.issues.push(`Found ${orphanedSessions.length} land verification sessions with invalid property or user references`);
      result.invalidRecords += orphanedSessions.length;
    }

    // Check verification layers reference valid sessions
    const orphanedLayers = await db.execute(sql`
      SELECT vl.id, vl.session_id
      FROM verification_layers vl
      LEFT JOIN land_verification_sessions lvs ON vl.session_id = lvs.id
      WHERE lvs.id IS NULL
    `);

    if (orphanedLayers.length > 0) {
      result.issues.push(`Found ${orphanedLayers.length} verification layers with invalid session references`);
      result.invalidRecords += orphanedLayers.length;
    }

    // Check risk factors reference valid sessions
    const orphanedRisks = await db.execute(sql`
      SELECT rf.id, rf.session_id
      FROM risk_factors rf
      LEFT JOIN land_verification_sessions lvs ON rf.session_id = lvs.id
      WHERE lvs.id IS NULL
    `);

    if (orphanedRisks.length > 0) {
      result.issues.push(`Found ${orphanedRisks.length} risk factors with invalid session references`);
      result.invalidRecords += orphanedRisks.length;
    }

    result.totalRecords = orphanedSessions.length + orphanedLayers.length + orphanedRisks.length;
    result.validRecords = 0; // All found records are invalid
    result.passed = result.invalidRecords === 0;

  } catch (error) {
    result.issues.push(`Validation error: ${error}`);
    result.passed = false;
  }

  return result;
}

function printValidationResults(summary: ValidationSummary) {
  console.log("\n📊 Validation Results Summary:");
  console.log(`   Total Tables Validated: ${summary.totalTables}`);
  console.log(`   Passed: ${summary.passedTables}`);
  console.log(`   Failed: ${summary.failedTables}`);
  console.log(`   Total Issues: ${summary.totalIssues}`);
  console.log(`   Overall Status: ${summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);

  console.log("\n📋 Detailed Results:");
  for (const result of summary.results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`\n   ${status} ${result.tableName}:`);
    console.log(`      Total Records: ${result.totalRecords}`);
    console.log(`      Valid Records: ${result.validRecords}`);
    console.log(`      Invalid Records: ${result.invalidRecords}`);
    
    if (result.issues.length > 0) {
      console.log(`      Issues:`);
      result.issues.forEach(issue => console.log(`        - ${issue}`));
    }
  }

  if (summary.overallPassed) {
    console.log("\n🎉 All validation checks passed! Data migration is successful.");
  } else {
    console.log("\n⚠️  Some validation checks failed. Please review and fix the issues above.");
  }
}

// Run validation if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateMigration()
    .then((summary) => {
      console.log('\n✨ Validation completed!');
      process.exit(summary.overallPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export { validateMigration, type ValidationSummary, type ValidationResult };
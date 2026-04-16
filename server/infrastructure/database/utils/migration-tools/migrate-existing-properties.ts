#!/usr/bin/env tsx
/**
 * Data Migration Script for Existing Properties
 * 
 * This script migrates existing properties to include land verification status
 * and prepares them for the Kenya Land Verification System.
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { eq, and, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { properties, landVerificationSessions } from "../../schemas/consolidated";

// Load environment variables
config();

interface MigrationStats {
  totalProperties: number;
  propertiesProcessed: number;
  landPropertiesFound: number;
  sessionsCreated: number;
  errors: number;
}

async function migrateExistingProperties() {
  console.log("🔄 Starting migration of existing properties for land verification...");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  const stats: MigrationStats = {
    totalProperties: 0,
    propertiesProcessed: 0,
    landPropertiesFound: 0,
    sessionsCreated: 0,
    errors: 0
  };

  try {
    console.log("✅ Database connection established");

    // Get all existing properties
    console.log("📋 Fetching existing properties...");
    const existingProperties = await db.select().from(properties);
    stats.totalProperties = existingProperties.length;
    
    console.log(`ℹ️  Found ${stats.totalProperties} existing properties`);

    if (stats.totalProperties === 0) {
      console.log("ℹ️  No properties found to migrate");
      return stats;
    }

    // Process each property
    for (const property of existingProperties) {
      try {
        stats.propertiesProcessed++;
        console.log(`\n🏠 Processing property ${stats.propertiesProcessed}/${stats.totalProperties}: ${property.title}`);

        // Check if this property is land or has land components
        const isLandProperty = isLandRelatedProperty(property);
        
        if (isLandProperty) {
          stats.landPropertiesFound++;
          console.log(`   📍 Land-related property identified`);

          // Check if verification session already exists
          const existingSession = await db
            .select()
            .from(landVerificationSessions)
            .where(eq(landVerificationSessions.propertyId, property.id))
            .limit(1);

          if (existingSession.length === 0) {
            // Create initial land verification session
            const newSession = await db
              .insert(landVerificationSessions)
              .values({
                propertyId: property.id,
                userId: property.ownerId,
                status: 'not_started',
                overallRiskScore: 0,
                riskLevel: 'low',
                confidence: 0.00,
                monitoringEnabled: false
              })
              .returning();

            stats.sessionsCreated++;
            console.log(`   ✅ Created verification session (ID: ${newSession[0].id})`);
          } else {
            console.log(`   ℹ️  Verification session already exists`);
          }

          // Update property features to include land verification flag
          if (property.features) {
            const updatedFeatures = {
              ...property.features,
              landVerificationEligible: true,
              landVerificationStatus: 'not_started'
            };

            await db
              .update(properties)
              .set({ features: updatedFeatures })
              .where(eq(properties.id, property.id));

            console.log(`   ✅ Updated property features`);
          }
        } else {
          console.log(`   ⏭️  Not a land-related property, skipping`);
        }

      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Error processing property ${property.id}:`, error);
      }
    }

    console.log("\n🎉 Property migration completed!");
    printMigrationStats(stats);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }

  return stats;
}

/**
 * Determines if a property is land-related and eligible for land verification
 */
function isLandRelatedProperty(property: any): boolean {
  // Check property type
  if (property.features?.propertyType === 'land') {
    return true;
  }

  // Check if it's a house (which includes land)
  if (property.features?.propertyType === 'house') {
    return true;
  }

  // Check location patterns that suggest land ownership
  const landKeywords = ['acres', 'hectares', 'plot', 'land', 'farm', 'ranch'];
  const titleLower = property.title.toLowerCase();
  const descriptionLower = property.description.toLowerCase();
  
  const hasLandKeywords = landKeywords.some(keyword => 
    titleLower.includes(keyword) || descriptionLower.includes(keyword)
  );

  if (hasLandKeywords) {
    return true;
  }

  // Check if property has coordinates (suggests surveyed land)
  if (property.coordinates?.lat && property.coordinates.lng) {
    return true;
  }

  // Check price range (high-value properties likely include land)
  const price = parseFloat(property.price.toString());
  if (price > 20000000) { // Properties over 20M KES likely include significant land
    return true;
  }

  return false;
}

/**
 * Print migration statistics
 */
function printMigrationStats(stats: MigrationStats) {
  console.log("\n📊 Migration Statistics:");
  console.log(`   Total Properties: ${stats.totalProperties}`);
  console.log(`   Properties Processed: ${stats.propertiesProcessed}`);
  console.log(`   Land Properties Found: ${stats.landPropertiesFound}`);
  console.log(`   Verification Sessions Created: ${stats.sessionsCreated}`);
  console.log(`   Errors: ${stats.errors}`);
  
  if (stats.errors > 0) {
    console.log(`\n⚠️  ${stats.errors} errors occurred during migration`);
  }
  
  const successRate = stats.propertiesProcessed > 0 
    ? ((stats.propertiesProcessed - stats.errors) / stats.propertiesProcessed * 100).toFixed(1)
    : '0';
  
  console.log(`\n✅ Migration Success Rate: ${successRate}%`);
}

// Run migration if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateExistingProperties()
    .then((stats) => {
      console.log('\n✨ Migration completed successfully!');
      process.exit(stats.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateExistingProperties, type MigrationStats };
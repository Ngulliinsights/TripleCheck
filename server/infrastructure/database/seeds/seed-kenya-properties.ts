#!/usr/bin/env tsx
/**
 * Kenya Property Seeding Script
 * 
 * This script creates realistic Kenya property scenarios for testing
 * the land verification system with authentic data patterns.
 */

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";

import { 
  users, 
  properties, 
  landVerificationSessions,
  verificationLayers,
  riskFactors,
  governmentDesignations,
  communityFeedback,
  expertAssignments,
  propertyMonitoring
} from "../../../../src/shared/schema";
import type { 
  InsertUser, 
  InsertProperty, 
  InsertLandVerificationSession,
  InsertVerificationLayer,
  InsertRiskFactor,
  InsertGovernmentDesignation,
  InsertCommunityFeedback,
  InsertExpertAssignment,
  InsertPropertyMonitoring
} from "../../../../src/shared/schema";


// Load environment variables
config();

interface SeedingStats {
  usersCreated: number;
  propertiesCreated: number;
  sessionsCreated: number;
  layersCreated: number;
  riskFactorsCreated: number;
  designationsCreated: number;
  feedbackCreated: number;
  expertsCreated: number;
  monitoringCreated: number;
  errors: number;
}

async function seedKenyaProperties() {
  console.log("🌱 Starting Kenya property seeding for land verification testing...");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  const stats: SeedingStats = {
    usersCreated: 0,
    propertiesCreated: 0,
    sessionsCreated: 0,
    layersCreated: 0,
    riskFactorsCreated: 0,
    designationsCreated: 0,
    feedbackCreated: 0,
    expertsCreated: 0,
    monitoringCreated: 0,
    errors: 0
  };

  try {
    console.log("✅ Database connection established");

    // Create test users with Kenya-specific profiles
    console.log("\n👥 Creating Kenya-specific test users...");
    const kenyaUsers = await createKenyaUsers(db, stats);

    // Create realistic Kenya properties
    console.log("\n🏠 Creating realistic Kenya properties...");
    const kenyaProperties = await createKenyaProperties(db, kenyaUsers, stats);

    // Create land verification sessions
    console.log("\n📋 Creating land verification sessions...");
    const sessions = await createVerificationSessions(db, kenyaProperties, kenyaUsers, stats);

    // Create verification layers
    console.log("\n🔍 Creating verification layers...");
    await createVerificationLayers(db, sessions, stats);

    // Create risk factors
    console.log("\n⚠️  Creating risk factors...");
    await createRiskFactors(db, sessions, stats);

    // Create government designations
    console.log("\n🏛️  Creating government designations...");
    await createGovernmentDesignations(db, sessions, stats);

    // Create community feedback
    console.log("\n👥 Creating community feedback...");
    await createCommunityFeedback(db, sessions, stats);

    // Create expert assignments
    console.log("\n👨‍💼 Creating expert assignments...");
    await createExpertAssignments(db, sessions, stats);

    // Create property monitoring
    console.log("\n📊 Creating property monitoring...");
    await createPropertyMonitoring(db, kenyaProperties, sessions, kenyaUsers, stats);

    console.log("\n🎉 Kenya property seeding completed!");
    printSeedingStats(stats);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }

  return stats;
}

async function createKenyaUsers(db: any, stats: SeedingStats) {
  const kenyaUsers: InsertUser[] = [
    {
      username: 'nairobi_investor',
      email: 'investor@nairobi.ke',
      password: await bcrypt.hash('secure123', 12),
      role: 'user',
      trustScore: 85,
      firstName: 'James',
      lastName: 'Mwangi',
      phone: '+254722123456'
    },
    {
      username: 'karen_resident',
      email: 'resident@karen.ke',
      password: await bcrypt.hash('secure456', 12),
      role: 'user',
      trustScore: 92,
      firstName: 'Grace',
      lastName: 'Wanjiku',
      phone: '+254733987654'
    },
    {
      username: 'mombasa_agent',
      email: 'agent@mombasa.ke',
      password: await bcrypt.hash('secure789', 12),
      role: 'agent',
      trustScore: 88,
      firstName: 'Omar',
      lastName: 'Hassan',
      phone: '+254711555777',
      isVerifiedAgent: true
    },
    {
      username: 'kisumu_developer',
      email: 'developer@kisumu.ke',
      password: await bcrypt.hash('secure101', 12),
      role: 'user',
      trustScore: 78,
      firstName: 'Peter',
      lastName: 'Ochieng',
      phone: '+254720444333'
    },
    {
      username: 'nakuru_farmer',
      email: 'farmer@nakuru.ke',
      password: await bcrypt.hash('secure202', 12),
      role: 'user',
      trustScore: 95,
      firstName: 'Mary',
      lastName: 'Njeri',
      phone: '+254734666888'
    }
  ];

  const createdUsers = [];
  for (const userData of kenyaUsers) {
    try {
      const insertedUsers = await db.insert(users).values(userData).returning();
      const user = insertedUsers[0];
      if (user) {
        createdUsers.push(user);
        stats.usersCreated++;
        console.log(`   ✅ Created user: ${user.firstName} ${user.lastName} (${user.username})`);
      }
    } catch (error) {
      stats.errors++;
      console.log(`   ⚠️  User ${userData.username} might already exist, skipping...`);
    }
  }

  return createdUsers;
}

async function createKenyaProperties(db: any, users: any[], stats: SeedingStats) {
  const kenyaProperties: InsertProperty[] = [
    {
      ownerId: users[0]?.id ?? 1,
      title: "Prime Land in Kiambu - 5 Acres",
      description: "Excellent agricultural land with red soil, ideal for coffee farming. Located 2km from Kiambu town with good road access. Has a borehole and electricity connection. Perfect for farming or residential development.",
      location: "Kiambu County, Kenya",
      address: "Kiambu-Ruiru Road, Kiambu County",
      price: 15000000,
      coordinates: { lat: -1.1719, lng: 36.8356 },
      imageUrls: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
      ],
      features: {
        propertyType: "land",
        squareFeet: 217800, // 5 acres
        amenities: ["Borehole", "Electricity", "Road Access", "Red Soil"],
        landVerificationEligible: true
      }
    },
    {
      ownerId: users[1]?.id ?? 2,
      title: "Residential Plot in Karen - 1 Acre",
      description: "Premium residential plot in Karen with mature trees and gentle slope. Ideal for building a family home. Located in a quiet neighborhood with good security. Title deed available.",
      location: "Karen, Nairobi",
      address: "Karen Road, Nairobi County",
      price: 35000000,
      coordinates: { lat: -1.3194, lng: 36.7085 },
      imageUrls: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
      ],
      features: {
        propertyType: "land",
        squareFeet: 43560, // 1 acre
        amenities: ["Mature Trees", "Gentle Slope", "Security", "Title Deed"],
        landVerificationEligible: true
      }
    },
    {
      ownerId: users[2]?.id ?? 3,
      title: "Beachfront Land in Kilifi - 2 Acres",
      description: "Stunning beachfront land with 200m of beach frontage. Perfect for resort development or private residence. Has coconut trees and natural vegetation. Access road needs improvement.",
      location: "Kilifi County, Kenya",
      address: "Kilifi-Malindi Road, Kilifi County",
      price: 45000000,
      coordinates: { lat: -3.5053, lng: 39.8499 },
      imageUrls: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
      ],
      features: {
        propertyType: "land",
        squareFeet: 87120, // 2 acres
        amenities: ["Beach Frontage", "Coconut Trees", "Natural Vegetation"],
        landVerificationEligible: true
      }
    },
    {
      ownerId: users[3]?.id ?? 4,
      title: "Commercial Land in Kisumu CBD - 0.5 Acres",
      description: "Prime commercial land in Kisumu Central Business District. Suitable for office complex or shopping mall. Has existing structures that can be demolished. High foot traffic area.",
      location: "Kisumu, Kenya",
      address: "Oginga Odinga Street, Kisumu",
      price: 25000000,
      coordinates: { lat: -0.0917, lng: 34.7680 },
      imageUrls: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
      ],
      features: {
        propertyType: "land",
        squareFeet: 21780, // 0.5 acres
        amenities: ["CBD Location", "High Traffic", "Existing Structures"],
        landVerificationEligible: true
      }
    },
    {
      ownerId: users[4]?.id ?? 5,
      title: "Agricultural Land in Nakuru - 10 Acres",
      description: "Fertile agricultural land suitable for wheat and maize farming. Has seasonal river running through the property. Good access road and nearby market. Ideal for large-scale farming.",
      location: "Nakuru County, Kenya",
      address: "Nakuru-Eldoret Highway, Nakuru County",
      price: 20000000,
      coordinates: { lat: -0.3031, lng: 36.0800 },
      imageUrls: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
      ],
      features: {
        propertyType: "land",
        squareFeet: 435600, // 10 acres
        amenities: ["Seasonal River", "Fertile Soil", "Market Access", "Highway Access"],
        landVerificationEligible: true
      }
    },
    {
      ownerId: users[0]?.id ?? 1,
      title: "Family Home with Large Compound in Runda",
      description: "Beautiful 4-bedroom house on 0.75 acres in Runda. Modern finishes with swimming pool and mature garden. Servant quarters and ample parking. Gated community with 24/7 security.",
      location: "Runda, Nairobi",
      address: "Runda Grove, Nairobi County",
      price: 55000000,
      coordinates: { lat: -1.2096, lng: 36.8147 },
      imageUrls: [
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
      ],
      features: {
        propertyType: "house",
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 32670, // 0.75 acres
        parkingSpaces: 4,
        yearBuilt: 2018,
        amenities: ["Swimming Pool", "Garden", "Servant Quarters", "Security", "Gated Community"],
        landVerificationEligible: true
      }
    }
  ];

  const createdProperties = [];
  for (const propertyData of kenyaProperties) {
    try {
      const insertedProperties = await db.insert(properties).values(propertyData).returning();
      const property = insertedProperties[0];
      if (property) {
        createdProperties.push(property);
        stats.propertiesCreated++;
        console.log(`   ✅ Created property: ${property.title}`);
      }
    } catch (error) {
      stats.errors++;
      console.error(`   ❌ Error creating property: ${propertyData.title}`, error);
    }
  }

  return createdProperties;
}

async function createVerificationSessions(db: any, properties: any[], users: any[], stats: SeedingStats) {
  const sessions = [];
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    const user = users[i % users.length];
    
    try {
      const sessionData: InsertLandVerificationSession = {
        propertyId: property.id,
        userId: user.id,
        status: i === 0 ? 'in_progress' : i === 1 ? 'completed' : 'not_started',
        currentLayer: i === 0 ? 'registry' : i === 2 ? 'community' : undefined,
        overallRiskScore: i === 0 ? 35 : i === 1 ? 15 : i === 2 ? 65 : 0,
        riskLevel: i === 0 ? 'medium' : i === 1 ? 'low' : i === 2 ? 'high' : 'low',
        confidence: i === 0 ? 0.75 : i === 1 ? 0.92 : i === 2 ? 0.68 : 0.00,
        monitoringEnabled: i < 3
      };

      const insertedSessions = await db.insert(landVerificationSessions).values(sessionData).returning();
      const session = insertedSessions[0];
      if (session) {
        sessions.push(session);
        stats.sessionsCreated++;
        console.log(`   ✅ Created session for: ${property.title}`);
      }
    } catch (error) {
      stats.errors++;
      console.error(`   ❌ Error creating session for property ${property.id}:`, error);
    }
  }

  return sessions;
}

async function createVerificationLayers(db: any, sessions: any[], stats: SeedingStats) {
  const layerTypes = ['registry', 'physical', 'community', 'government', 'legal', 'expert'];
  
  for (const session of sessions.slice(0, 3)) { // Only create layers for first 3 sessions
    for (let i = 0; i < layerTypes.length; i++) {
      try {
        const layerData: InsertVerificationLayer = {
          sessionId: session.id,
          layerType: layerTypes[i] as any,
          status: i < 2 ? 'completed' : i === 2 ? 'in_progress' : 'not_started',
          estimatedDuration: 8 + (i * 2),
          results: i < 2 ? { completed: true, findings: `${layerTypes[i]} verification completed` } : {},
          notes: i < 2 ? `${layerTypes[i]} layer completed successfully` : undefined
        };

        const insertedLayers = await db.insert(verificationLayers).values(layerData).returning();
        if (insertedLayers[0]) {
          stats.layersCreated++;
        }
      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Error creating layer ${layerTypes[i]} for session ${session.id}:`, error);
      }
    }
  }
  
  console.log(`   ✅ Created ${stats.layersCreated} verification layers`);
}

async function createRiskFactors(db: any, sessions: any[], stats: SeedingStats) {
  const riskFactorsData: Omit<InsertRiskFactor, 'sessionId'>[] = [
    {
      category: 'physical',
      severity: 'medium',
      confidence: 0.80,
      description: 'Minor boundary discrepancy on eastern border',
      evidence: ['Survey measurements show 2.3m difference', 'Neighbor disputes boundary'],
      impact: 'Could affect property size calculation and future disputes',
      likelihood: 0.65,
      mitigation: ['Conduct detailed resurvey', 'Negotiate with neighbor'],
      sourceLayer: 'physical',
      isActive: true
    },
    {
      category: 'ownership',
      severity: 'low',
      confidence: 0.70,
      description: 'Outstanding mortgage registered against property',
      evidence: ['Mortgage instrument registered with registrar'],
      impact: 'Must be cleared before transfer',
      likelihood: 0.90,
      mitigation: ['Verify mortgage balance', 'Arrange clearance'],
      sourceLayer: 'registry',
      isActive: true
    },
    {
      category: 'government',
      severity: 'high',
      confidence: 0.85,
      description: 'Property falls within planned road expansion corridor',
      evidence: ['KENHA road expansion plan 2024-2028', 'Gazette notice pending'],
      impact: 'Potential government acquisition for public use',
      likelihood: 0.75,
      mitigation: ['Monitor gazette notices', 'Seek legal counsel'],
      sourceLayer: 'government',
      isActive: true
    }
  ];

  for (let i = 0; i < Math.min(sessions.length, riskFactorsData.length); i++) {
    try {
      const riskData: InsertRiskFactor = {
        ...riskFactorsData[i],
        sessionId: sessions[i].id
      };

      const insertedRisks = await db.insert(riskFactors).values(riskData).returning();
      if (insertedRisks[0]) {
        stats.riskFactorsCreated++;
      }
    } catch (error) {
      stats.errors++;
      console.error(`   ❌ Error creating risk factor for session ${sessions[i].id}:`, error);
    }
  }

  console.log(`   ✅ Created ${stats.riskFactorsCreated} risk factors`);
}

async function createGovernmentDesignations(db: any, sessions: any[], stats: SeedingStats) {
  const designationsData: Omit<InsertGovernmentDesignation, 'sessionId'>[] = [
    {
      designationType: 'riparian',
      authority: 'Water Resources Authority',
      designation: 'Riparian Reserve - Nairobi River',
      restrictions: ['No construction within 30m of river', 'No waste disposal'],
      bufferZone: 30,
      riskLevel: 'medium',
      affectedArea: { type: 'buffer', coordinates: [36.8356, -1.1719] },
      plannedChanges: [],
      lastVerified: new Date(),
      isActive: true
    },
    {
      designationType: 'road_reserve',
      authority: 'Kenya National Highways Authority',
      designation: 'Road Reserve - Kiambu-Ruiru Highway',
      restrictions: ['No permanent structures within reserve', 'Access restrictions'],
      bufferZone: 15,
      riskLevel: 'high',
      affectedArea: { type: 'linear', coordinates: [36.8356, -1.1719] },
      plannedChanges: [{ type: 'expansion', year: 2025, impact: 'Additional 10m reserve' }],
      lastVerified: new Date(),
      isActive: true
    }
  ];

  for (let i = 0; i < Math.min(sessions.length, designationsData.length); i++) {
    try {
      const designationData: InsertGovernmentDesignation = {
        ...designationsData[i],
        sessionId: sessions[i].id
      };

      const insertedDesignations = await db.insert(governmentDesignations).values(designationData).returning();
      if (insertedDesignations[0]) {
        stats.designationsCreated++;
      }
    } catch (error) {
      stats.errors++;
      console.error(`   ❌ Error creating designation for session ${sessions[i].id}:`, error);
    }
  }

  console.log(`   ✅ Created ${stats.designationsCreated} government designations`);
}

async function createCommunityFeedback(db: any, sessions: any[], stats: SeedingStats) {
  const feedbackData: Omit<InsertCommunityFeedback, 'sessionId'>[] = [
    {
      source: 'local_admin',
      sourceName: 'John Kamau',
      sourcePosition: 'Assistant Chief',
      yearsInArea: 15,
      ownershipHistory: 'Property has been in the Mwangi family for over 20 years. No known disputes.',
      knownDisputes: [],
      landUsePatterns: ['Coffee farming', 'Residential'],
      recentChanges: ['New borehole installed 2023'],
      concerns: [],
      reliability: 0.90,
      verifiedBy: 'Field Officer Mary Njeri',
      isConfidential: false,
      recordedAt: new Date()
    },
    {
      source: 'neighbor',
      sourceName: 'Grace Wanjiku',
      sourcePosition: 'Neighbor',
      yearsInArea: 8,
      ownershipHistory: 'Current owner bought from previous family. Peaceful transition.',
      knownDisputes: ['Minor boundary issue resolved in 2022'],
      landUsePatterns: ['Residential', 'Small garden'],
      recentChanges: ['Fence erected 2023'],
      concerns: ['Drainage during rainy season'],
      reliability: 0.75,
      verifiedBy: 'Community Liaison Officer',
      isConfidential: false,
      recordedAt: new Date()
    }
  ];

  for (let i = 0; i < Math.min(sessions.length, feedbackData.length); i++) {
    try {
      const feedback: InsertCommunityFeedback = {
        ...feedbackData[i],
        sessionId: sessions[i].id
      };

      const insertedFeedback = await db.insert(communityFeedback).values(feedback).returning();
      if (insertedFeedback[0]) {
        stats.feedbackCreated++;
      }
    } catch (error) {
      stats.errors++;
      console.error(`   ❌ Error creating feedback for session ${sessions[i].id}:`, error);
    }
  }

  console.log(`   ✅ Created ${stats.feedbackCreated} community feedback entries`);
}

async function createExpertAssignments(db: any, sessions: any[], stats: SeedingStats) {
  const expertsData: Omit<InsertExpertAssignment, 'sessionId'>[] = [
    {
      expertType: 'surveyor',
      expertName: 'David Mutua',
      expertCredentials: 'Licensed Land Surveyor (LSK/2018/0234)',
      contactInfo: '+254722123456',
      specialization: 'Boundary surveys and land measurement',
      assignedAt: new Date(),
      status: 'in_progress',
      cost: 45000.00,
      notes: 'Experienced surveyor with 12 years in Kiambu area'
    },
    {
      expertType: 'lawyer',
      expertName: 'Advocate Sarah Wanjiku',
      expertCredentials: 'Advocate of the High Court (LSK/A/2020/0156)',
      contactInfo: '+254733987654',
      specialization: 'Property law and land transactions',
      assignedAt: new Date(),
      status: 'assigned',
      cost: 75000.00,
      notes: 'Specializes in complex land ownership cases'
    },
    {
      expertType: 'appraiser',
      expertName: 'Peter Ochieng',
      expertCredentials: 'Certified Property Appraiser (IVS/2019/0892)',
      contactInfo: '+254711555777',
      specialization: 'Land valuation and market analysis',
      assignedAt: new Date(),
      status: 'completed',
      cost: 35000.00,
      notes: 'Completed comprehensive property valuation'
    }
  ];

  for (let i = 0; i < Math.min(sessions.length, expertsData.length); i++) {
    try {
      const expertData: InsertExpertAssignment = {
        ...expertsData[i],
        sessionId: sessions[i].id
      };

      const insertedExperts = await db.insert(expertAssignments).values(expertData).returning();
      if (insertedExperts[0]) {
        stats.expertsCreated++;
      }
    } catch (error) {
      stats.errors++;
      console.error(`   ❌ Error creating expert assignment for session ${sessions[i].id}:`, error);
    }
  }

  console.log(`   ✅ Created ${stats.expertsCreated} expert assignments`);
}

async function createPropertyMonitoring(db: any, properties: any[], sessions: any[], users: any[], stats: SeedingStats) {
  for (let i = 0; i < Math.min(properties.length, 3); i++) {
    try {
      const monitoringData: InsertPropertyMonitoring = {
        propertyId: properties[i].id,
        sessionId: sessions[i]?.id,
        userId: users[i % users.length].id,
        monitoringType: i === 0 ? 'government_changes' : i === 1 ? 'legal_disputes' : 'market_changes',
        frequency: i === 0 ? 'monthly' : i === 1 ? 'weekly' : 'quarterly',
        alertsGenerated: i,
        isActive: true,
        configuration: {
          checkRoadPlans: true,
          alertThreshold: i === 0 ? 'medium' : i === 1 ? 'low' : 'high',
          notificationMethods: ['email', 'sms']
        }
      };

      const insertedMonitoring = await db.insert(propertyMonitoring).values(monitoringData).returning();
      if (insertedMonitoring[0]) {
        stats.monitoringCreated++;
      }
    } catch (error) {
      stats.errors++;
      console.error(`   ❌ Error creating monitoring for property ${properties[i].id}:`, error);
    }
  }

  console.log(`   ✅ Created ${stats.monitoringCreated} monitoring configurations`);
}

function printSeedingStats(stats: SeedingStats) {
  console.log("\n📊 Seeding Statistics:");
  console.log(`   Users Created: ${stats.usersCreated}`);
  console.log(`   Properties Created: ${stats.propertiesCreated}`);
  console.log(`   Verification Sessions: ${stats.sessionsCreated}`);
  console.log(`   Verification Layers: ${stats.layersCreated}`);
  console.log(`   Risk Factors: ${stats.riskFactorsCreated}`);
  console.log(`   Government Designations: ${stats.designationsCreated}`);
  console.log(`   Community Feedback: ${stats.feedbackCreated}`);
  console.log(`   Expert Assignments: ${stats.expertsCreated}`);
  console.log(`   Monitoring Configs: ${stats.monitoringCreated}`);
  console.log(`   Errors: ${stats.errors}`);
  
  if (stats.errors > 0) {
    console.log(`\n⚠️  ${stats.errors} errors occurred during seeding`);
  }
  
  console.log(`\n✅ Seeding completed with realistic Kenya property scenarios!`);
}

// Run seeding if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedKenyaProperties()
    .then((stats) => {
      console.log('\n✨ Seeding completed successfully!');
      process.exit(stats.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedKenyaProperties, type SeedingStats };
// Land Verification System Database Seeding Script
// This script creates realistic test data for the Kenya Land Verification System

import { db } from '../index';

import {
  landVerificationSessions,
  verificationLayers,
  riskFactors,
  governmentDesignations,
  communityFeedback,
  expertAssignments,
  propertyMonitoring,
  monitoringAlerts,
  properties,
  users
} from '@/shared/schema';

// Sample data for seeding
const sampleVerificationSessions = [
  {
    propertyId: 1, // Assuming property with ID 1 exists
    userId: 1, // Assuming user with ID 1 exists
    status: 'in_progress' as const,
    currentLayer: 'registry' as const,
    overallRiskScore: 35,
    riskLevel: 'medium' as const,
    confidence: 0.75,
    estimatedCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    monitoringEnabled: true
  },
  {
    propertyId: 2,
    userId: 2,
    status: 'completed' as const,
    currentLayer: null,
    overallRiskScore: 15,
    riskLevel: 'low' as const,
    confidence: 0.92,
    actualCompletionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    monitoringEnabled: true
  },
  {
    propertyId: 3,
    userId: 1,
    status: 'in_progress' as const,
    currentLayer: 'community' as const,
    overallRiskScore: 65,
    riskLevel: 'high' as const,
    confidence: 0.68,
    estimatedCompletionDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    monitoringEnabled: false
  }
];

const sampleVerificationLayers = [
  // Session 1 layers
  {
    sessionId: 1,
    layerType: 'registry' as const,
    status: 'completed' as const,
    startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    estimatedDuration: 8,
    actualDuration: 6,
    results: {
      titleVerified: true,
      ownershipChainComplete: true,
      legalInstrumentsFound: 2,
      suspiciousTransfers: 0
    },
    notes: 'Registry search completed successfully. Title deed verified with Ministry of Lands.'
  },
  {
    sessionId: 1,
    layerType: 'physical' as const,
    status: 'in_progress' as const,
    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    estimatedDuration: 12,
    assignedExpertId: 1,
    results: {
      boundariesSurveyed: 75,
      beaconsVerified: 8,
      beaconsMissing: 2,
      discrepanciesFound: 1
    },
    notes: 'Physical survey in progress. Minor boundary discrepancy identified on eastern border.'
  },
  {
    sessionId: 1,
    layerType: 'community' as const,
    status: 'not_started' as const,
    estimatedDuration: 16
  },
  // Session 2 layers (completed)
  {
    sessionId: 2,
    layerType: 'registry' as const,
    status: 'completed' as const,
    startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    estimatedDuration: 8,
    actualDuration: 7,
    results: {
      titleVerified: true,
      ownershipChainComplete: true,
      legalInstrumentsFound: 0,
      suspiciousTransfers: 0
    }
  },
  {
    sessionId: 2,
    layerType: 'physical' as const,
    status: 'completed' as const,
    startedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    estimatedDuration: 10,
    actualDuration: 8,
    assignedExpertId: 2,
    results: {
      boundariesSurveyed: 100,
      beaconsVerified: 12,
      beaconsMissing: 0,
      discrepanciesFound: 0
    }
  },
  {
    sessionId: 2,
    layerType: 'community' as const,
    status: 'completed' as const,
    startedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    estimatedDuration: 12,
    actualDuration: 10,
    results: {
      interviewsCompleted: 8,
      consensusLevel: 95,
      disputesReported: 0,
      concernsRaised: 1
    }
  }
];

const sampleRiskFactors = [
  {
    sessionId: 1,
    category: 'physical' as const,
    severity: 'medium' as const,
    confidence: 0.80,
    description: 'Minor boundary discrepancy identified on eastern border during physical survey',
    evidence: ['Survey measurements show 2.3m difference from title deed', 'Eastern beacon appears to have been moved'],
    impact: 'Could affect property size calculation and future development plans',
    likelihood: 0.65,
    mitigation: ['Conduct detailed resurvey with licensed surveyor', 'Negotiate boundary agreement with neighbor'],
    sourceLayer: 'physical' as const,
    isActive: true
  },
  {
    sessionId: 1,
    category: 'legal' as const,
    severity: 'low' as const,
    confidence: 0.70,
    description: 'Outstanding mortgage registered against the property',
    evidence: ['Mortgage instrument #MG2023/4567 registered on 2023-03-15', 'Amount: KES 2,500,000'],
    impact: 'Mortgage must be cleared before property transfer can be completed',
    likelihood: 0.90,
    mitigation: ['Verify mortgage balance with lending institution', 'Ensure mortgage clearance before purchase'],
    sourceLayer: 'registry' as const,
    isActive: true
  },
  {
    sessionId: 3,
    category: 'ownership' as const,
    severity: 'high' as const,
    confidence: 0.85,
    description: 'Rapid ownership transfers in the past 18 months raise suspicion',
    evidence: ['Property sold 3 times between Jan 2023 and Jun 2024', 'Each sale below market value', 'Different sellers each time'],
    impact: 'Potential land grabbing scheme or fraudulent ownership claims',
    likelihood: 0.75,
    mitigation: ['Investigate each ownership transfer thoroughly', 'Verify identity of all previous owners', 'Consider legal counsel'],
    sourceLayer: 'registry' as const,
    isActive: true
  },
  {
    sessionId: 3,
    category: 'community' as const,
    severity: 'high' as const,
    confidence: 0.70,
    description: 'Community members report ongoing land dispute with neighboring family',
    evidence: ['Multiple community interviews mention boundary dispute', 'Dispute ongoing for 5+ years', 'Previous court case filed but withdrawn'],
    impact: 'Potential for legal challenges and property access issues',
    likelihood: 0.80,
    mitigation: ['Investigate court records thoroughly', 'Meet with disputing parties', 'Consider mediation'],
    sourceLayer: 'community' as const,
    isActive: true
  }
];

const sampleGovernmentDesignations = [
  {
    sessionId: 1,
    designationType: 'road_reserve' as const,
    authority: 'Kenya National Highways Authority',
    designation: 'Planned road widening - A104 Highway expansion',
    restrictions: ['No permanent structures within 30m of current road edge', 'Compensation may be required for affected areas'],
    bufferZone: 30,
    riskLevel: 'medium' as const,
    affectedArea: {
      type: 'Polygon',
      coordinates: [[[36.8219, -1.2921], [36.8225, -1.2921], [36.8225, -1.2918], [36.8219, -1.2918], [36.8219, -1.2921]]]
    },
    plannedChanges: [
      {
        type: 'road_expansion',
        plannedDate: '2025-06-01',
        description: 'Highway widening from 2 to 4 lanes',
        compensationAvailable: true
      }
    ],
    validUntil: new Date('2025-12-31')
  },
  {
    sessionId: 3,
    designationType: 'riparian' as const,
    authority: 'Water Resources Authority',
    designation: 'Riparian reserve - Nairobi River tributary',
    restrictions: ['No development within 30m of water body', 'Environmental impact assessment required for any activities'],
    bufferZone: 30,
    riskLevel: 'high' as const,
    affectedArea: {
      type: 'LineString',
      coordinates: [[36.8200, -1.2930], [36.8210, -1.2925], [36.8220, -1.2920]]
    },
    plannedChanges: [],
    validUntil: null // Permanent designation
  }
];

const sampleCommunityFeedback = [
  {
    sessionId: 2,
    source: 'local_admin' as const,
    sourceName: 'John Mwangi',
    sourcePosition: 'Assistant Chief',
    yearsInArea: 15,
    ownershipHistory: 'Property has been owned by the Kamau family for over 20 years. No disputes or issues known.',
    knownDisputes: [],
    landUsePatterns: ['Residential', 'Small-scale farming'],
    recentChanges: ['New fence installed in 2023'],
    concerns: ['Increased traffic on access road'],
    reliability: 0.90,
    verifiedBy: 'Field Officer Mary Wanjiku',
    isConfidential: false
  },
  {
    sessionId: 2,
    source: 'neighbor' as const,
    sourceName: 'Grace Njeri',
    yearsInArea: 8,
    ownershipHistory: 'Current owner has lived there since I moved to the area. Very peaceful neighbor.',
    knownDisputes: [],
    landUsePatterns: ['Residential', 'Kitchen garden'],
    recentChanges: ['Solar panels installed last year'],
    concerns: [],
    reliability: 0.75,
    isConfidential: false
  },
  {
    sessionId: 3,
    source: 'community_leader' as const,
    sourceName: 'Elder Samuel Kiprotich',
    sourcePosition: 'Community Elder',
    yearsInArea: 35,
    ownershipHistory: 'This land has changed hands many times recently. Very unusual for this area.',
    knownDisputes: ['Boundary dispute with Wanjiku family ongoing since 2019'],
    landUsePatterns: ['Previously farming', 'Now mostly vacant'],
    recentChanges: ['Multiple ownership changes', 'Fencing removed and replaced several times'],
    concerns: ['Suspicious activity', 'Strangers claiming ownership', 'Community worried about land grabbing'],
    reliability: 0.85,
    verifiedBy: 'Community Liaison Officer',
    isConfidential: true
  }
];

const sampleExpertAssignments = [
  {
    sessionId: 1,
    layerId: 2, // Physical layer
    expertType: 'surveyor',
    expertName: 'David Mutua',
    expertCredentials: 'Licensed Land Surveyor (LSK/2018/0234)',
    contactInfo: '+254 722 123 456',
    specialization: 'Boundary surveys and land subdivision',
    expectedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'in_progress',
    cost: 45000.00,
    notes: 'Experienced surveyor with 12 years in Nairobi area. Specializes in disputed boundaries.'
  },
  {
    sessionId: 2,
    layerId: 5, // Physical layer for session 2
    expertType: 'surveyor',
    expertName: 'Sarah Wanjiku',
    expertCredentials: 'Licensed Land Surveyor (LSK/2020/0156)',
    contactInfo: '+254 733 987 654',
    specialization: 'Residential property surveys',
    assignedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    expectedCompletionDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    actualCompletionDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    status: 'completed',
    reportUrl: '/reports/survey_session2_layer5.pdf',
    cost: 38000.00,
    notes: 'Survey completed successfully with no issues identified.'
  },
  {
    sessionId: 3,
    expertType: 'lawyer',
    expertName: 'Advocate Peter Ochieng',
    expertCredentials: 'Advocate of the High Court of Kenya (LSK/A/2015/0892)',
    contactInfo: '+254 711 555 777',
    specialization: 'Property law and land disputes',
    expectedCompletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: 'assigned',
    cost: 75000.00,
    notes: 'Legal expert assigned to investigate ownership history and court records.'
  }
];

const samplePropertyMonitoring = [
  {
    propertyId: 1,
    sessionId: 1,
    userId: 1,
    monitoringType: 'government_changes',
    frequency: 'monthly',
    lastChecked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextCheck: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
    alertsGenerated: 1,
    isActive: true,
    configuration: {
      checkRoadPlans: true,
      checkZoningChanges: true,
      checkEnvironmentalDesignations: false,
      alertThreshold: 'medium'
    }
  },
  {
    propertyId: 2,
    sessionId: 2,
    userId: 2,
    monitoringType: 'legal_disputes',
    frequency: 'weekly',
    lastChecked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    nextCheck: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    alertsGenerated: 0,
    isActive: true,
    configuration: {
      checkCourtFilings: true,
      checkCaveats: true,
      checkOwnershipChanges: true,
      alertThreshold: 'low'
    }
  }
];

const sampleMonitoringAlerts = [
  {
    monitoringId: 1,
    propertyId: 1,
    userId: 1,
    alertType: 'government_plan_change',
    severity: 'medium' as const,
    title: 'Road Expansion Plan Updated',
    description: 'Kenya National Highways Authority has updated the timeline for A104 highway expansion. The project is now scheduled to begin in June 2025, 3 months earlier than originally planned.',
    actionRequired: true,
    actionTaken: false,
    isRead: false,
    isDismissed: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
];

// Main seeding function
export async function seedLandVerificationData() {
  try {
    console.log('Starting land verification data seeding...');

    // Insert verification sessions
    console.log('Inserting verification sessions...');
    const insertedSessions = await db.insert(landVerificationSessions)
      .values(sampleVerificationSessions)
      .returning();
    console.log(`Inserted ${insertedSessions.length} verification sessions`);

    // Insert verification layers
    console.log('Inserting verification layers...');
    const insertedLayers = await db.insert(verificationLayers)
      .values(sampleVerificationLayers)
      .returning();
    console.log(`Inserted ${insertedLayers.length} verification layers`);

    // Insert risk factors
    console.log('Inserting risk factors...');
    const insertedRiskFactors = await db.insert(riskFactors)
      .values(sampleRiskFactors)
      .returning();
    console.log(`Inserted ${insertedRiskFactors.length} risk factors`);

    // Insert government designations
    console.log('Inserting government designations...');
    const insertedDesignations = await db.insert(governmentDesignations)
      .values(sampleGovernmentDesignations)
      .returning();
    console.log(`Inserted ${insertedDesignations.length} government designations`);

    // Insert community feedback
    console.log('Inserting community feedback...');
    const insertedFeedback = await db.insert(communityFeedback)
      .values(sampleCommunityFeedback)
      .returning();
    console.log(`Inserted ${insertedFeedback.length} community feedback entries`);

    // Insert expert assignments
    console.log('Inserting expert assignments...');
    const insertedExperts = await db.insert(expertAssignments)
      .values(sampleExpertAssignments)
      .returning();
    console.log(`Inserted ${insertedExperts.length} expert assignments`);

    // Insert property monitoring
    console.log('Inserting property monitoring...');
    const insertedMonitoring = await db.insert(propertyMonitoring)
      .values(samplePropertyMonitoring)
      .returning();
    console.log(`Inserted ${insertedMonitoring.length} property monitoring entries`);

    // Insert monitoring alerts
    console.log('Inserting monitoring alerts...');
    const insertedAlerts = await db.insert(monitoringAlerts)
      .values(sampleMonitoringAlerts)
      .returning();
    console.log(`Inserted ${insertedAlerts.length} monitoring alerts`);

    console.log('Land verification data seeding completed successfully!');
    
    return {
      sessions: insertedSessions.length,
      layers: insertedLayers.length,
      riskFactors: insertedRiskFactors.length,
      designations: insertedDesignations.length,
      feedback: insertedFeedback.length,
      experts: insertedExperts.length,
      monitoring: insertedMonitoring.length,
      alerts: insertedAlerts.length
    };

  } catch (error) {
    console.error('Error seeding land verification data:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedLandVerificationData()
    .then((results) => {
      console.log('Seeding results:', results);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
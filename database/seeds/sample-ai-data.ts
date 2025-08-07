import { Property } from "../../src/shared/schema";

/**
 * Sample AI Verification Data Generator
 * Creates realistic AI verification results for testing
 */

export function generateSampleAIVerificationResults(): AIVerificationResults[] {
  return [
    // High-quality verified property
    {
      imageAnalysis: {
        qualityScore: 92,
        authenticityScore: 95,
        flaggedIssues: []
      },
      descriptionAnalysis: {
        accuracyScore: 88,
        completenessScore: 90,
        suggestedImprovements: ["Add more details about parking arrangements"]
      },
      overallScore: 91,
      verificationTimestamp: new Date().toISOString(),
      aiModel: "TripleCheck-AI-v2.1"
    },

    // Good quality with minor issues
    {
      imageAnalysis: {
        qualityScore: 78,
        authenticityScore: 85,
        flaggedIssues: ["Low resolution in bathroom photos"]
      },
      descriptionAnalysis: {
        accuracyScore: 82,
        completenessScore: 75,
        suggestedImprovements: [
          "Include information about utilities",
          "Add details about neighborhood amenities"
        ]
      },
      overallScore: 80,
      verificationTimestamp: new Date().toISOString(),
      aiModel: "TripleCheck-AI-v2.1"
    },

    // Luxury property with excellent verification
    {
      imageAnalysis: {
        qualityScore: 98,
        authenticityScore: 97,
        flaggedIssues: []
      },
      descriptionAnalysis: {
        accuracyScore: 95,
        completenessScore: 92,
        suggestedImprovements: []
      },
      overallScore: 96,
      verificationTimestamp: new Date().toISOString(),
      aiModel: "TripleCheck-AI-v2.1"
    },

    // Property with some concerns
    {
      imageAnalysis: {
        qualityScore: 65,
        authenticityScore: 70,
        flaggedIssues: [
          "Inconsistent lighting across photos",
          "Some images appear heavily filtered"
        ]
      },
      descriptionAnalysis: {
        accuracyScore: 68,
        completenessScore: 60,
        suggestedImprovements: [
          "Provide more accurate room dimensions",
          "Include information about building age",
          "Add details about security features"
        ]
      },
      overallScore: 66,
      verificationTimestamp: new Date().toISOString(),
      aiModel: "TripleCheck-AI-v2.1"
    },

    // Pending verification property
    {
      imageAnalysis: {
        qualityScore: 55,
        authenticityScore: 60,
        flaggedIssues: [
          "Limited number of photos",
          "Poor image quality",
          "Missing exterior shots"
        ]
      },
      descriptionAnalysis: {
        accuracyScore: 45,
        completenessScore: 40,
        suggestedImprovements: [
          "Add comprehensive property description",
          "Include accurate pricing information",
          "Provide complete contact details",
          "Add information about lease terms"
        ]
      },
      overallScore: 50,
      verificationTimestamp: new Date().toISOString(),
      aiModel: "TripleCheck-AI-v2.1"
    }
  ];
}

export function generateFraudDetectionResults() {
  return [
    {
      propertyId: 1,
      riskScore: 15,
      riskLevel: 'low',
      flaggedIndicators: [],
      verificationChecks: {
        priceAnalysis: { passed: true, score: 95 },
        imageAuthenticity: { passed: true, score: 92 },
        contactVerification: { passed: true, score: 88 },
        locationValidation: { passed: true, score: 90 }
      },
      recommendation: 'Property appears legitimate with low fraud risk',
      lastUpdated: new Date().toISOString()
    },
    {
      propertyId: 2,
      riskScore: 25,
      riskLevel: 'low',
      flaggedIndicators: ['Price slightly below market average'],
      verificationChecks: {
        priceAnalysis: { passed: true, score: 78 },
        imageAuthenticity: { passed: true, score: 85 },
        contactVerification: { passed: true, score: 92 },
        locationValidation: { passed: true, score: 88 }
      },
      recommendation: 'Property is likely legitimate, minor price discrepancy noted',
      lastUpdated: new Date().toISOString()
    },
    {
      propertyId: 5,
      riskScore: 65,
      riskLevel: 'medium',
      flaggedIndicators: [
        'Limited contact information',
        'Few property images',
        'Price significantly below market rate'
      ],
      verificationChecks: {
        priceAnalysis: { passed: false, score: 45 },
        imageAuthenticity: { passed: true, score: 70 },
        contactVerification: { passed: false, score: 40 },
        locationValidation: { passed: true, score: 75 }
      },
      recommendation: 'Exercise caution - multiple risk factors identified',
      lastUpdated: new Date().toISOString()
    }
  ];
}

export function generateDocumentVerificationResults() {
  return [
    {
      propertyId: 1,
      documentType: 'title_deed',
      verificationStatus: 'verified',
      confidence: 95,
      extractedData: {
        ownerName: 'Sarah Johnson',
        propertyAddress: 'Westlands, Nairobi',
        registrationNumber: 'LR/209/12345',
        issueDate: '2020-03-15'
      },
      flaggedIssues: [],
      verifiedAt: new Date().toISOString()
    },
    {
      propertyId: 2,
      documentType: 'lease_agreement',
      verificationStatus: 'verified',
      confidence: 88,
      extractedData: {
        landlordName: 'Mike Thompson',
        tenantName: 'Various',
        propertyAddress: 'Karen, Nairobi',
        leaseTerms: '12 months renewable'
      },
      flaggedIssues: ['Minor formatting inconsistencies'],
      verifiedAt: new Date().toISOString()
    },
    {
      propertyId: 3,
      documentType: 'occupancy_certificate',
      verificationStatus: 'verified',
      confidence: 92,
      extractedData: {
        buildingName: 'Kilimani Heights',
        approvalDate: '2021-01-20',
        certificateNumber: 'OC/2021/0156',
        validUntil: '2026-01-20'
      },
      flaggedIssues: [],
      verifiedAt: new Date().toISOString()
    }
  ];
}

export function generateTrustScoreData() {
  return [
    {
      userId: 1,
      currentScore: 750,
      previousScore: 720,
      scoreChange: 30,
      factors: {
        paymentHistory: 85,
        propertyMaintenance: 78,
        communicationRating: 82,
        verificationLevel: 90
      },
      recentActivities: [
        'Completed property verification',
        'Received positive tenant review',
        'Updated profile information'
      ],
      nextMilestone: {
        targetScore: 800,
        requiredActions: ['Complete 2 more successful transactions']
      }
    },
    {
      userId: 2,
      currentScore: 950,
      previousScore: 940,
      scoreChange: 10,
      factors: {
        paymentHistory: 98,
        propertyMaintenance: 95,
        communicationRating: 92,
        verificationLevel: 100
      },
      recentActivities: [
        'Verified agent certification renewed',
        'Completed advanced training module',
        'Maintained perfect response time'
      ],
      nextMilestone: {
        targetScore: 1000,
        requiredActions: ['Maintain current performance for 6 months']
      }
    }
  ];
}

export function generateMarketInsightData() {
  return {
    priceAnalysis: {
      averageRent: {
        studio: 35000,
        oneBedroom: 55000,
        twoBedroom: 85000,
        threeBedroom: 120000,
        fourBedroom: 180000
      },
      priceGrowth: {
        monthly: 2.5,
        quarterly: 7.8,
        yearly: 12.3
      },
      hotspots: [
        { area: 'Westlands', growth: 15.2, averagePrice: 95000 },
        { area: 'Kilimani', growth: 18.7, averagePrice: 110000 },
        { area: 'Karen', growth: 12.1, averagePrice: 165000 }
      ]
    },
    demandAnalysis: {
      highDemandAreas: ['CBD', 'Westlands', 'Kilimani'],
      emergingAreas: ['Kiambu', 'Ruaka', 'Kasarani'],
      propertyTypes: {
        mostDemanded: 'apartment',
        fastestGrowing: 'studio',
        premiumSegment: 'penthouse'
      }
    },
    investmentMetrics: {
      averageROI: 8.5,
      bestPerformingAreas: ['Kilimani', 'Lavington', 'Runda'],
      riskFactors: ['Market volatility', 'Regulatory changes']
    }
  };
}
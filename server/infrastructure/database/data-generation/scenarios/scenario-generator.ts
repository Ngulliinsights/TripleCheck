/**
 * Production Demo Scenario Generator
 * 
 * Generates realistic demonstration data based on predefined scenarios
 * with Kenyan market context and business logic.
 */

import { randomBytes } from 'crypto';
import { writeFile } from 'fs/promises';
import path from '../../../../../scripts/cleanup-redundancies';

import { DataScenario } from '../core/UnifiedDataGenerator';
import { PRODUCTION_DEMO_SCENARIOS } from './production-demo-scenarios';

/**
 * Kenyan regions with realistic market data
 */
const KENYAN_REGIONS = {
  'Nairobi': {
    population: 4500000,
    averagePropertyPrice: 8500000, // KES
    fraudRisk: 0.12,
    propertyTypes: ['residential', 'commercial', 'land', 'industrial'],
    popularAreas: ['Westlands', 'Karen', 'Kilimani', 'Lavington', 'Runda']
  },
  'Mombasa': {
    population: 1200000,
    averagePropertyPrice: 6200000,
    fraudRisk: 0.15,
    propertyTypes: ['residential', 'commercial', 'land', 'beachfront'],
    popularAreas: ['Nyali', 'Bamburi', 'Diani', 'Kilifi', 'Malindi']
  },
  'Kisumu': {
    population: 610000,
    averagePropertyPrice: 3800000,
    fraudRisk: 0.08,
    propertyTypes: ['residential', 'commercial', 'agricultural', 'land'],
    popularAreas: ['Milimani', 'Mamboleo', 'Kondele', 'Dunga', 'Nyamasaria']
  },
  'Nakuru': {
    population: 570000,
    averagePropertyPrice: 4200000,
    fraudRisk: 0.06,
    propertyTypes: ['residential', 'agricultural', 'commercial', 'land'],
    popularAreas: ['Milimani', 'Section 58', 'Bondeni', 'Shabab', 'London']
  },
  'Eldoret': {
    population: 475000,
    averagePropertyPrice: 3500000,
    fraudRisk: 0.05,
    propertyTypes: ['residential', 'agricultural', 'commercial', 'land'],
    popularAreas: ['Pioneer', 'Kapsoya', 'Langas', 'West Indies', 'Kimumu']
  }
};

/**
 * Property types with Kenyan market characteristics
 */
const PROPERTY_TYPES = {
  residential: {
    subtypes: ['apartment', 'bungalow', 'maisonette', 'townhouse', 'villa'],
    priceRange: [1500000, 25000000], // KES
    verificationComplexity: 'medium',
    commonIssues: ['title_disputes', 'boundary_issues', 'utility_connections']
  },
  commercial: {
    subtypes: ['office', 'retail', 'warehouse', 'mixed_use', 'hotel'],
    priceRange: [5000000, 100000000],
    verificationComplexity: 'high',
    commonIssues: ['zoning_compliance', 'environmental_clearance', 'business_permits']
  },
  land: {
    subtypes: ['residential_plot', 'commercial_plot', 'agricultural_land', 'industrial_land'],
    priceRange: [800000, 50000000],
    verificationComplexity: 'high',
    commonIssues: ['title_authenticity', 'survey_accuracy', 'access_rights']
  },
  agricultural: {
    subtypes: ['crop_farm', 'livestock_farm', 'mixed_farm', 'plantation'],
    priceRange: [2000000, 80000000],
    verificationComplexity: 'high',
    commonIssues: ['water_rights', 'soil_quality', 'access_roads']
  }
};

/**
 * User personas for realistic data generation
 */
const USER_PERSONAS = {
  individual_buyer: {
    weight: 0.4,
    characteristics: {
      budgetRange: [2000000, 15000000],
      preferredRegions: ['Nairobi', 'Mombasa', 'Kisumu'],
      propertyTypes: ['residential'],
      verificationNeeds: ['basic_checks', 'community_feedback']
    }
  },
  diaspora_investor: {
    weight: 0.25,
    characteristics: {
      budgetRange: [5000000, 50000000],
      preferredRegions: ['Nairobi', 'Mombasa'],
      propertyTypes: ['residential', 'commercial', 'land'],
      verificationNeeds: ['comprehensive_verification', 'expert_consultation', 'remote_validation']
    }
  },
  real_estate_company: {
    weight: 0.15,
    characteristics: {
      budgetRange: [10000000, 200000000],
      preferredRegions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
      propertyTypes: ['residential', 'commercial', 'land'],
      verificationNeeds: ['bulk_verification', 'due_diligence', 'market_analysis']
    }
  },
  government_entity: {
    weight: 0.1,
    characteristics: {
      budgetRange: [20000000, 500000000],
      preferredRegions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
      propertyTypes: ['commercial', 'land', 'industrial'],
      verificationNeeds: ['compliance_verification', 'audit_trails', 'regulatory_checks']
    }
  },
  financial_institution: {
    weight: 0.1,
    characteristics: {
      budgetRange: [5000000, 100000000],
      preferredRegions: ['Nairobi', 'Mombasa', 'Kisumu'],
      propertyTypes: ['residential', 'commercial'],
      verificationNeeds: ['collateral_verification', 'risk_assessment', 'valuation_confirmation']
    }
  }
};

/**
 * Fraud patterns for realistic demonstration
 */
const FRAUD_PATTERNS = {
  document_forgery: {
    frequency: 0.35,
    severity: 'high',
    detectionMethods: ['document_analysis', 'signature_verification', 'watermark_check'],
    commonTargets: ['title_deeds', 'sale_agreements', 'survey_maps']
  },
  identity_theft: {
    frequency: 0.25,
    severity: 'high',
    detectionMethods: ['identity_verification', 'biometric_check', 'background_verification'],
    commonTargets: ['seller_identity', 'buyer_identity', 'witness_identity']
  },
  double_selling: {
    frequency: 0.20,
    severity: 'critical',
    detectionMethods: ['ownership_verification', 'transaction_history', 'registry_check'],
    commonTargets: ['high_value_properties', 'prime_locations', 'disputed_lands']
  },
  boundary_manipulation: {
    frequency: 0.15,
    severity: 'medium',
    detectionMethods: ['survey_verification', 'gps_mapping', 'neighbor_confirmation'],
    commonTargets: ['large_plots', 'corner_properties', 'irregular_shapes']
  },
  price_manipulation: {
    frequency: 0.05,
    severity: 'medium',
    detectionMethods: ['market_analysis', 'valuation_check', 'comparable_sales'],
    commonTargets: ['distressed_sales', 'quick_sales', 'family_transfers']
  }
};

/**
 * Generate scenario-specific data
 */
export class ScenarioGenerator {
  private scenario: DataScenario;
  private outputDir: string;

  constructor(scenarioName: string, outputDir: string = './output') {
    const scenario = PRODUCTION_DEMO_SCENARIOS[scenarioName];
    if (!scenario) {
      throw new Error(`Scenario '${scenarioName}' not found`);
    }
    this.scenario = scenario;
    this.outputDir = outputDir;
  }

  /**
   * Generate complete scenario data
   */
  async generateScenarioData(): Promise<{
    users: any[];
    properties: any[];
    reviews: any[];
    professionals: any[];
    verificationSessions: any[];
    fraudCases: any[];
    analytics: any;
  }> {
    console.log(`🎬 Generating scenario: ${this.scenario.name}`);
    console.log(`📊 Target data: ${this.scenario.users} users, ${this.scenario.properties} properties`);

    const users = await this.generateUsers();
    const properties = await this.generateProperties();
    const professionals = await this.generateProfessionals();
    const reviews = await this.generateReviews(users, properties);
    const verificationSessions = await this.generateVerificationSessions(users, properties, professionals);
    const fraudCases = await this.generateFraudCases(properties, users);
    const analytics = await this.generateAnalytics(users, properties, reviews, verificationSessions, fraudCases);

    // Save data to files
    await this.saveScenarioData({
      users,
      properties,
      reviews,
      professionals,
      verificationSessions,
      fraudCases,
      analytics
    });

    return {
      users,
      properties,
      reviews,
      professionals,
      verificationSessions,
      fraudCases,
      analytics
    };
  }

  /**
   * Generate realistic users based on personas
   */
  private async generateUsers(): Promise<any[]> {
    const users = [];
    const kenyanNames = await this.getKenyanNames();

    for (let i = 0; i < this.scenario.users; i++) {
      const persona = this.selectPersona();
      const region = this.selectRegion(persona.characteristics.preferredRegions);
      const name = this.selectRandomName(kenyanNames);

      const user = {
        id: `user_${i + 1}`,
        name: name.full,
        firstName: name.first,
        lastName: name.last,
        email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@example.com`,
        phone: this.generateKenyanPhone(),
        persona: persona.type,
        region: region,
        registrationDate: this.randomDateInRange(),
        verificationStatus: Math.random() > 0.1 ? 'verified' : 'pending',
        trustScore: Math.random() * 0.3 + 0.7, // 0.7 - 1.0
        budget: this.randomInRange(persona.characteristics.budgetRange),
        preferredPropertyTypes: persona.characteristics.propertyTypes,
        verificationNeeds: persona.characteristics.verificationNeeds,
        isActive: Math.random() > 0.15,
        lastLoginDate: this.randomRecentDate(),
        profileCompleteness: Math.random() * 0.3 + 0.7,
        communicationPreferences: {
          email: true,
          sms: Math.random() > 0.3,
          whatsapp: Math.random() > 0.2,
          inApp: true
        }
      };

      users.push(user);
    }

    return users;
  }

  /**
   * Generate realistic properties
   */
  private async generateProperties(): Promise<any[]> {
    const properties = [];

    for (let i = 0; i < this.scenario.properties; i++) {
      const region = this.selectRegion();
      const propertyType = this.selectPropertyType();
      const area = this.selectArea(region);

      const property = {
        id: `property_${i + 1}`,
        title: this.generatePropertyTitle(propertyType, area, region),
        description: this.generatePropertyDescription(propertyType, region),
        type: propertyType.type,
        subtype: propertyType.subtype,
        region: region,
        area: area,
        price: this.generatePropertyPrice(propertyType, region),
        size: this.generatePropertySize(propertyType),
        bedrooms: propertyType.type === 'residential' ? Math.floor(Math.random() * 5) + 1 : null,
        bathrooms: propertyType.type === 'residential' ? Math.floor(Math.random() * 4) + 1 : null,
        coordinates: this.generateCoordinates(region),
        listingDate: this.randomDateInRange(),
        status: this.selectPropertyStatus(),
        verificationStatus: this.selectVerificationStatus(),
        trustScore: Math.random() * 0.4 + 0.6, // 0.6 - 1.0
        features: this.generatePropertyFeatures(propertyType),
        documents: this.generatePropertyDocuments(),
        images: this.generatePropertyImages(),
        owner: {
          type: Math.random() > 0.7 ? 'company' : 'individual',
          verified: Math.random() > 0.2,
          trustScore: Math.random() * 0.3 + 0.7
        },
        marketAnalysis: {
          pricePerSqm: 0,
          marketTrend: Math.random() > 0.5 ? 'rising' : 'stable',
          comparableProperties: Math.floor(Math.random() * 10) + 5,
          daysOnMarket: Math.floor(Math.random() * 180) + 1
        }
      };

      // Calculate price per square meter
      if (property.size > 0) {
        property.marketAnalysis.pricePerSqm = Math.round(property.price / property.size);
      }

      properties.push(property);
    }

    return properties;
  }

  /**
   * Generate professionals (experts)
   */
  private async generateProfessionals(): Promise<any[]> {
    const professionals = [];
    const professionTypes = ['lawyer', 'surveyor', 'valuer', 'architect', 'engineer'];

    for (let i = 0; i < this.scenario.professionals; i++) {
      const profession = professionTypes[Math.floor(Math.random() * professionTypes.length)];
      const region = this.selectRegion();

      const professional = {
        id: `professional_${i + 1}`,
        name: this.generateProfessionalName(),
        profession: profession,
        specialization: this.generateSpecialization(profession),
        region: region,
        experience: Math.floor(Math.random() * 20) + 5, // 5-25 years
        rating: Math.random() * 1.5 + 3.5, // 3.5 - 5.0
        completedJobs: Math.floor(Math.random() * 500) + 50,
        certifications: this.generateCertifications(profession),
        availability: Math.random() > 0.3 ? 'available' : 'busy',
        hourlyRate: this.generateHourlyRate(profession),
        languages: ['English', 'Swahili'],
        contactInfo: {
          email: `professional${i + 1}@example.com`,
          phone: this.generateKenyanPhone(),
          office: this.generateOfficeAddress(region)
        },
        verificationStatus: 'verified',
        trustScore: Math.random() * 0.2 + 0.8, // 0.8 - 1.0
        responseTime: Math.floor(Math.random() * 24) + 1, // 1-24 hours
        successRate: Math.random() * 0.15 + 0.85 // 0.85 - 1.0
      };

      professionals.push(professional);
    }

    return professionals;
  }

  /**
   * Generate reviews
   */
  private async generateReviews(users: any[], properties: any[]): Promise<any[]> {
    const reviews = [];

    for (let i = 0; i < this.scenario.reviews; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const property = properties[Math.floor(Math.random() * properties.length)];

      const review = {
        id: `review_${i + 1}`,
        userId: user.id,
        propertyId: property.id,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars mostly positive
        title: this.generateReviewTitle(),
        content: this.generateReviewContent(property.type),
        date: this.randomDateInRange(),
        verified: Math.random() > 0.1, // 90% verified
        helpful: Math.floor(Math.random() * 20),
        category: this.selectReviewCategory(),
        sentiment: Math.random() > 0.2 ? 'positive' : 'neutral',
        tags: this.generateReviewTags(property.type),
        response: Math.random() > 0.7 ? this.generateOwnerResponse() : null
      };

      reviews.push(review);
    }

    return reviews;
  }

  /**
   * Generate verification sessions
   */
  private async generateVerificationSessions(users: any[], properties: any[], professionals: any[]): Promise<any[]> {
    const sessions = [];

    for (let i = 0; i < this.scenario.verificationSessions; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const property = properties[Math.floor(Math.random() * properties.length)];
      const professional = professionals[Math.floor(Math.random() * professionals.length)];

      const session = {
        id: `verification_${i + 1}`,
        userId: user.id,
        propertyId: property.id,
        professionalId: professional.id,
        type: this.selectVerificationType(),
        status: this.selectVerificationSessionStatus(),
        priority: this.selectPriority(),
        startDate: this.randomDateInRange(),
        completionDate: Math.random() > 0.3 ? this.randomRecentDate() : null,
        estimatedDuration: Math.floor(Math.random() * 168) + 24, // 1-7 days in hours
        actualDuration: null,
        cost: this.generateVerificationCost(),
        findings: this.generateVerificationFindings(),
        riskLevel: this.selectRiskLevel(),
        confidence: Math.random() * 0.3 + 0.7, // 0.7 - 1.0
        documents: this.generateVerificationDocuments(),
        checkpoints: this.generateVerificationCheckpoints(),
        notes: this.generateVerificationNotes(),
        recommendations: this.generateRecommendations()
      };

      // Set actual duration if completed
      if (session.completionDate && session.startDate) {
        const start = new Date(session.startDate).getTime();
        const end = new Date(session.completionDate).getTime();
        session.actualDuration = Math.round((end - start) / (1000 * 60 * 60)); // hours
      }

      sessions.push(session);
    }

    return sessions;
  }

  /**
   * Generate fraud cases
   */
  private async generateFraudCases(properties: any[], users: any[]): Promise<any[]> {
    const fraudCases = [];
    const fraudCount = Math.floor(this.scenario.properties * this.scenario.fraudRate);

    for (let i = 0; i < fraudCount; i++) {
      const property = properties[Math.floor(Math.random() * properties.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const fraudType = this.selectFraudType();

      const fraudCase = {
        id: `fraud_${i + 1}`,
        propertyId: property.id,
        reportedBy: user.id,
        type: fraudType.type,
        severity: fraudType.severity,
        status: this.selectFraudStatus(),
        detectionMethod: fraudType.detectionMethods[Math.floor(Math.random() * fraudType.detectionMethods.length)],
        reportDate: this.randomDateInRange(),
        investigationStartDate: this.randomRecentDate(),
        resolutionDate: Math.random() > 0.4 ? this.randomRecentDate() : null,
        description: this.generateFraudDescription(fraudType.type),
        evidence: this.generateFraudEvidence(fraudType.type),
        impact: {
          financial: Math.floor(Math.random() * 10000000) + 100000, // KES
          users: Math.floor(Math.random() * 10) + 1,
          reputation: Math.random() * 0.5 + 0.3 // 0.3 - 0.8
        },
        investigation: {
          assignedTo: `investigator_${Math.floor(Math.random() * 5) + 1}`,
          progress: Math.random(),
          findings: this.generateInvestigationFindings(),
          actions: this.generateInvestigationActions()
        },
        prevention: {
          measures: this.generatePreventionMeasures(fraudType.type),
          effectiveness: Math.random() * 0.3 + 0.7
        }
      };

      fraudCases.push(fraudCase);
    }

    return fraudCases;
  }

  /**
   * Generate analytics data
   */
  private async generateAnalytics(users: any[], properties: any[], reviews: any[], verificationSessions: any[], fraudCases: any[]): Promise<any> {
    return {
      summary: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        totalProperties: properties.length,
        verifiedProperties: properties.filter(p => p.verificationStatus === 'verified').length,
        totalReviews: reviews.length,
        averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
        totalVerifications: verificationSessions.length,
        completedVerifications: verificationSessions.filter(v => v.status === 'completed').length,
        fraudCasesDetected: fraudCases.length,
        fraudPreventionRate: fraudCases.filter(f => f.status === 'resolved').length / fraudCases.length
      },
      performance: {
        averageVerificationTime: this.calculateAverageVerificationTime(verificationSessions),
        systemUptime: 99.95,
        responseTime: 45, // ms
        throughput: 8500, // queries per second
        cacheHitRate: 0.94
      },
      business: {
        revenueGenerated: this.calculateRevenue(verificationSessions),
        customerSatisfaction: 4.6,
        marketGrowth: 0.23, // 23% growth
        regionDistribution: this.calculateRegionDistribution(properties),
        propertyTypeDistribution: this.calculatePropertyTypeDistribution(properties)
      },
      security: {
        fraudDetectionAccuracy: 0.96,
        falsePositiveRate: 0.04,
        averageDetectionTime: 2.3, // hours
        securityIncidents: Math.floor(Math.random() * 5),
        complianceScore: 0.98
      }
    };
  }

  /**
   * Save scenario data to files
   */
  private async saveScenarioData(data: any): Promise<void> {
    const scenarioDir = path.join(this.outputDir, this.scenario.name.toLowerCase().replace(/\s+/g, '_'));
    
    // Create scenario metadata
    const metadata = {
      scenario: this.scenario,
      generatedAt: new Date().toISOString(),
      dataStats: {
        users: data.users.length,
        properties: data.properties.length,
        reviews: data.reviews.length,
        professionals: data.professionals.length,
        verificationSessions: data.verificationSessions.length,
        fraudCases: data.fraudCases.length
      }
    };

    // Save all data files
    await writeFile(path.join(scenarioDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
    await writeFile(path.join(scenarioDir, 'users.json'), JSON.stringify(data.users, null, 2));
    await writeFile(path.join(scenarioDir, 'properties.json'), JSON.stringify(data.properties, null, 2));
    await writeFile(path.join(scenarioDir, 'reviews.json'), JSON.stringify(data.reviews, null, 2));
    await writeFile(path.join(scenarioDir, 'professionals.json'), JSON.stringify(data.professionals, null, 2));
    await writeFile(path.join(scenarioDir, 'verification_sessions.json'), JSON.stringify(data.verificationSessions, null, 2));
    await writeFile(path.join(scenarioDir, 'fraud_cases.json'), JSON.stringify(data.fraudCases, null, 2));
    await writeFile(path.join(scenarioDir, 'analytics.json'), JSON.stringify(data.analytics, null, 2));

    console.log(`✅ Scenario data saved to: ${scenarioDir}`);
  }

  // Helper methods for data generation
  private selectPersona(): { type: string; characteristics: any } {
    const personas = Object.keys(USER_PERSONAS);
    const weights = personas.map(p => USER_PERSONAS[p].weight);
    const selectedPersona = this.weightedRandom(personas, weights);
    
    return {
      type: selectedPersona,
      characteristics: USER_PERSONAS[selectedPersona].characteristics
    };
  }

  private selectRegion(preferredRegions?: string[]): string {
    const regions = preferredRegions || Object.keys(KENYAN_REGIONS);
    return regions[Math.floor(Math.random() * regions.length)];
  }

  private selectPropertyType(): { type: string; subtype: string } {
    const types = Object.keys(PROPERTY_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const subtypes = PROPERTY_TYPES[type].subtypes;
    const subtype = subtypes[Math.floor(Math.random() * subtypes.length)];
    
    return { type, subtype };
  }

  private selectArea(region: string): string {
    const areas = KENYAN_REGIONS[region]?.popularAreas || ['Central', 'North', 'South', 'East', 'West'];
    return areas[Math.floor(Math.random() * areas.length)];
  }

  private generatePropertyPrice(propertyType: { type: string }, region: string): number {
    const basePrice = PROPERTY_TYPES[propertyType.type].priceRange;
    const regionMultiplier = KENYAN_REGIONS[region]?.averagePropertyPrice / 5000000 || 1;
    const min = basePrice[0] * regionMultiplier;
    const max = basePrice[1] * regionMultiplier;
    
    return Math.floor(Math.random() * (max - min) + min);
  }

  private generatePropertySize(propertyType: { type: string }): number {
    const sizeRanges = {
      residential: [50, 500], // sqm
      commercial: [100, 2000],
      land: [500, 50000],
      agricultural: [5000, 500000]
    };
    
    const range = sizeRanges[propertyType.type] || [100, 1000];
    return Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
  }

  private generateCoordinates(region: string): { lat: number; lng: number } {
    const regionCoords = {
      'Nairobi': { lat: -1.2921, lng: 36.8219 },
      'Mombasa': { lat: -4.0435, lng: 39.6682 },
      'Kisumu': { lat: -0.0917, lng: 34.7680 },
      'Nakuru': { lat: -0.3031, lng: 36.0800 },
      'Eldoret': { lat: 0.5143, lng: 35.2698 }
    };
    
    const base = regionCoords[region] || regionCoords['Nairobi'];
    return {
      lat: base.lat + (Math.random() - 0.5) * 0.1,
      lng: base.lng + (Math.random() - 0.5) * 0.1
    };
  }

  private generateKenyanPhone(): string {
    const prefixes = ['0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}${suffix}`;
  }

  private randomDateInRange(): Date {
    const start = this.scenario.timeRange.startDate.getTime();
    const end = this.scenario.timeRange.endDate.getTime();
    return new Date(start + Math.random() * (end - start));
  }

  private randomRecentDate(): Date {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    return new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
  }

  private randomInRange(range: [number, number]): number {
    return Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
  }

  private weightedRandom(items: string[], weights: number[]): string {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  // Additional helper methods would be implemented here for generating:
  // - Kenyan names
  // - Property titles and descriptions
  // - Professional details
  // - Review content
  // - Verification details
  // - Fraud case details
  // - Analytics calculations

  private async getKenyanNames(): Promise<{ first: string[]; last: string[] }> {
    // This would typically load from a data file
    return {
      first: ['John', 'Mary', 'Peter', 'Grace', 'David', 'Sarah', 'James', 'Ruth', 'Samuel', 'Faith'],
      last: ['Kamau', 'Wanjiku', 'Mwangi', 'Njeri', 'Kiprotich', 'Achieng', 'Maina', 'Wambui', 'Kiprop', 'Atieno']
    };
  }

  private selectRandomName(names: { first: string[]; last: string[] }): { first: string; last: string; full: string } {
    const first = names.first[Math.floor(Math.random() * names.first.length)];
    const last = names.last[Math.floor(Math.random() * names.last.length)];
    return { first, last, full: `${first} ${last}` };
  }

  // Placeholder implementations for other helper methods
  private generatePropertyTitle(propertyType: any, area: string, region: string): string {
    return `${propertyType.subtype} in ${area}, ${region}`;
  }

  private generatePropertyDescription(propertyType: any, region: string): string {
    return `Beautiful ${propertyType.subtype} located in ${region}. Perfect for modern living.`;
  }

  private selectPropertyStatus(): string {
    const statuses = ['available', 'under_offer', 'sold', 'withdrawn'];
    const weights = [0.6, 0.2, 0.15, 0.05];
    return this.weightedRandom(statuses, weights);
  }

  private selectVerificationStatus(): string {
    const statuses = ['verified', 'pending', 'failed', 'not_started'];
    const weights = [0.7, 0.2, 0.05, 0.05];
    return this.weightedRandom(statuses, weights);
  }

  private generatePropertyFeatures(propertyType: any): string[] {
    const features = ['parking', 'garden', 'security', 'water', 'electricity', 'internet'];
    return features.filter(() => Math.random() > 0.4);
  }

  private generatePropertyDocuments(): string[] {
    return ['title_deed', 'survey_map', 'valuation_report'].filter(() => Math.random() > 0.3);
  }

  private generatePropertyImages(): string[] {
    const count = Math.floor(Math.random() * 8) + 2;
    return Array.from({ length: count }, (_, i) => `image_${i + 1}.jpg`);
  }

  private generateProfessionalName(): string {
    const names = ['Dr. John Kamau', 'Eng. Mary Wanjiku', 'Arch. Peter Mwangi', 'Surv. Grace Njeri'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private generateSpecialization(profession: string): string {
    const specializations = {
      lawyer: ['Property Law', 'Commercial Law', 'Land Law'],
      surveyor: ['Land Surveying', 'Engineering Surveying', 'Cadastral Surveying'],
      valuer: ['Property Valuation', 'Asset Valuation', 'Insurance Valuation'],
      architect: ['Residential Design', 'Commercial Design', 'Urban Planning'],
      engineer: ['Structural Engineering', 'Civil Engineering', 'Environmental Engineering']
    };
    
    const specs = specializations[profession] || ['General Practice'];
    return specs[Math.floor(Math.random() * specs.length)];
  }

  private generateCertifications(profession: string): string[] {
    const certs = {
      lawyer: ['LSK Member', 'CLE Certified'],
      surveyor: ['ISK Member', 'Licensed Surveyor'],
      valuer: ['IVK Member', 'RICS Member'],
      architect: ['BAK Member', 'RIBA Member'],
      engineer: ['IEK Member', 'PE License']
    };
    
    return certs[profession] || ['Professional License'];
  }

  private generateHourlyRate(profession: string): number {
    const rates = {
      lawyer: [5000, 15000],
      surveyor: [3000, 8000],
      valuer: [4000, 10000],
      architect: [4000, 12000],
      engineer: [3500, 9000]
    };
    
    const range = rates[profession] || [3000, 8000];
    return Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
  }

  private generateOfficeAddress(region: string): string {
    return `Office Address in ${region}`;
  }

  private generateReviewTitle(): string {
    const titles = ['Great property!', 'Excellent service', 'Highly recommended', 'Professional service'];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateReviewContent(propertyType: string): string {
    return `This ${propertyType} exceeded my expectations. The verification process was thorough and professional.`;
  }

  private selectReviewCategory(): string {
    const categories = ['property_quality', 'service_quality', 'value_for_money', 'location'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  private generateReviewTags(propertyType: string): string[] {
    const tags = ['verified', 'recommended', 'good_value', 'professional'];
    return tags.filter(() => Math.random() > 0.5);
  }

  private generateOwnerResponse(): string {
    return 'Thank you for your positive feedback. We appreciate your business.';
  }

  private selectVerificationType(): string {
    const types = ['basic', 'comprehensive', 'expert', 'urgent'];
    const weights = [0.4, 0.3, 0.2, 0.1];
    return this.weightedRandom(types, weights);
  }

  private selectVerificationSessionStatus(): string {
    const statuses = ['completed', 'in_progress', 'pending', 'cancelled'];
    const weights = [0.6, 0.2, 0.15, 0.05];
    return this.weightedRandom(statuses, weights);
  }

  private selectPriority(): string {
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const weights = [0.3, 0.4, 0.2, 0.1];
    return this.weightedRandom(priorities, weights);
  }

  private generateVerificationCost(): number {
    return Math.floor(Math.random() * 50000) + 10000; // KES 10,000 - 60,000
  }

  private generateVerificationFindings(): string[] {
    const findings = ['title_verified', 'boundaries_confirmed', 'no_disputes', 'documents_authentic'];
    return findings.filter(() => Math.random() > 0.3);
  }

  private selectRiskLevel(): string {
    const levels = ['low', 'medium', 'high'];
    const weights = [0.6, 0.3, 0.1];
    return this.weightedRandom(levels, weights);
  }

  private generateVerificationDocuments(): string[] {
    return ['verification_report', 'site_photos', 'document_analysis'].filter(() => Math.random() > 0.2);
  }

  private generateVerificationCheckpoints(): string[] {
    return ['document_check', 'site_visit', 'registry_verification', 'community_feedback'];
  }

  private generateVerificationNotes(): string {
    return 'Verification completed successfully. All documents verified and property confirmed.';
  }

  private generateRecommendations(): string[] {
    return ['proceed_with_purchase', 'request_additional_documents', 'conduct_survey'];
  }

  private selectFraudType(): any {
    const types = Object.keys(FRAUD_PATTERNS);
    const weights = types.map(t => FRAUD_PATTERNS[t].frequency);
    const selectedType = this.weightedRandom(types, weights);
    
    return {
      type: selectedType,
      ...FRAUD_PATTERNS[selectedType]
    };
  }

  private selectFraudStatus(): string {
    const statuses = ['investigating', 'resolved', 'closed', 'escalated'];
    const weights = [0.3, 0.4, 0.2, 0.1];
    return this.weightedRandom(statuses, weights);
  }

  private generateFraudDescription(type: string): string {
    const descriptions = {
      document_forgery: 'Suspected forged title deed detected during verification process.',
      identity_theft: 'Identity verification failed - suspected identity theft.',
      double_selling: 'Property appears to be listed by multiple sellers simultaneously.',
      boundary_manipulation: 'Survey discrepancies suggest boundary manipulation.',
      price_manipulation: 'Property price significantly below market value - potential manipulation.'
    };
    
    return descriptions[type] || 'Fraud case under investigation.';
  }

  private generateFraudEvidence(type: string): string[] {
    const evidence = {
      document_forgery: ['document_analysis', 'signature_comparison', 'watermark_analysis'],
      identity_theft: ['id_verification_failure', 'biometric_mismatch', 'background_check'],
      double_selling: ['multiple_listings', 'ownership_conflicts', 'registry_discrepancies'],
      boundary_manipulation: ['survey_discrepancies', 'gps_mismatch', 'neighbor_complaints'],
      price_manipulation: ['market_analysis', 'valuation_report', 'comparable_sales']
    };
    
    return evidence[type] || ['investigation_report'];
  }

  private generateInvestigationFindings(): string[] {
    return ['evidence_collected', 'witnesses_interviewed', 'documents_analyzed'];
  }

  private generateInvestigationActions(): string[] {
    return ['notify_authorities', 'freeze_listing', 'contact_owner', 'update_records'];
  }

  private generatePreventionMeasures(type: string): string[] {
    const measures = {
      document_forgery: ['enhanced_document_verification', 'ai_analysis', 'expert_review'],
      identity_theft: ['biometric_verification', 'multi_factor_authentication', 'background_checks'],
      double_selling: ['ownership_verification', 'registry_monitoring', 'seller_verification'],
      boundary_manipulation: ['gps_verification', 'survey_validation', 'neighbor_confirmation'],
      price_manipulation: ['market_analysis', 'automated_valuation', 'price_alerts']
    };
    
    return measures[type] || ['enhanced_monitoring'];
  }

  private calculateAverageVerificationTime(sessions: any[]): number {
    const completed = sessions.filter(s => s.actualDuration);
    if (completed.length === 0) return 0;
    
    const total = completed.reduce((sum, s) => sum + s.actualDuration, 0);
    return Math.round(total / completed.length);
  }

  private calculateRevenue(sessions: any[]): number {
    return sessions.reduce((sum, s) => sum + (s.cost || 0), 0);
  }

  private calculateRegionDistribution(properties: any[]): Record<string, number> {
    const distribution = {};
    properties.forEach(p => {
      distribution[p.region] = (distribution[p.region] || 0) + 1;
    });
    return distribution;
  }

  private calculatePropertyTypeDistribution(properties: any[]): Record<string, number> {
    const distribution = {};
    properties.forEach(p => {
      distribution[p.type] = (distribution[p.type] || 0) + 1;
    });
    return distribution;
  }
}

export default ScenarioGenerator;
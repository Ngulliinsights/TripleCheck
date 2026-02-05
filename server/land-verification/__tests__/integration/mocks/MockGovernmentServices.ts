export class MockGovernmentServices {
  private serviceStates: Map<string, 'up' | 'down' | 'timeout' | 'intermittent'> = new Map();
  private failureCounters: Map<string, number> = new Map();
  private fallbackMode = false;
  private rateLimitCounters: Map<string, number> = new Map();

  constructor() {
    this.resetServices();
  }

  resetServices() {
    this.serviceStates.set('lands-registry', 'up');
    this.serviceStates.set('court-records', 'up');
    this.serviceStates.set('water-authority', 'up');
    this.serviceStates.set('highways-authority', 'up');
    this.serviceStates.set('forest-service', 'up');
    this.serviceStates.set('nema', 'up');
    this.failureCounters.clear();
    this.rateLimitCounters.clear();
  }

  getEndpoints() {
    return {
      landsRegistry: 'http://mock-lands-registry.gov.ke/api',
      courtRecords: 'http://mock-court-records.gov.ke/api',
      waterAuthority: 'http://mock-water-authority.gov.ke/api',
      highwaysAuthority: 'http://mock-highways.gov.ke/api',
      forestService: 'http://mock-forest-service.gov.ke/api',
      nema: 'http://mock-nema.gov.ke/api'
    };
  }

  simulateTimeout(service: string) {
    this.serviceStates.set(service, 'timeout');
  }

  simulateServiceDown(service: string) {
    this.serviceStates.set(service, 'down');
  }

  simulateIntermittentFailure(service: string, failureCount: number) {
    this.serviceStates.set(service, 'intermittent');
    this.failureCounters.set(service, failureCount);
  }

  simulatePartialFailure(services: string[]) {
    services.forEach(service => this.serviceStates.set(service, 'down'));
  }

  enableFallbackMode() {
    this.fallbackMode = true;
  }

  simulateSuspiciousOwnership() {
    // This will be used to return suspicious ownership patterns
  }

  private checkRateLimit(service: string): boolean {
    const current = this.rateLimitCounters.get(service) || 0;
    if (current >= 5) {
      return false; // Rate limited
    }
    this.rateLimitCounters.set(service, current + 1);
    return true;
  }

  private simulateDelay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async callLandsRegistry(titleNumber: string, location: string) {
    await this.simulateDelay();

    if (!this.checkRateLimit('lands-registry')) {
      throw new Error('Rate limit exceeded for lands registry service');
    }

    const state = this.serviceStates.get('lands-registry');

    if (state === 'timeout') {
      throw new Error('Registry service timeout');
    }

    if (state === 'down') {
      if (this.fallbackMode) {
        return this.getFallbackLandsData(titleNumber);
      }
      throw new Error('Lands registry service unavailable');
    }

    if (state === 'intermittent') {
      const failureCount = this.failureCounters.get('lands-registry') || 0;
      if (failureCount > 0) {
        this.failureCounters.set('lands-registry', failureCount - 1);
        throw new Error('Temporary service failure');
      }
    }

    if (titleNumber === 'INVALID/TITLE/000') {
      throw new Error('Title number not found in registry');
    }

    if (titleNumber === 'SUSPICIOUS/TITLE/001') {
      return this.getSuspiciousLandsData(titleNumber);
    }

    return this.getMockLandsData(titleNumber, location);
  }

  async callCourtRecords(propertyId: string, ownerNames: string[]) {
    await this.simulateDelay();

    if (!this.checkRateLimit('court-records')) {
      throw new Error('Rate limit exceeded for court records service');
    }

    const state = this.serviceStates.get('court-records');

    if (state === 'down') {
      throw new Error('Court records service unavailable');
    }

    return this.getMockCourtRecords(propertyId, ownerNames);
  }

  async callWaterAuthority(coordinates: any, bounds: any[]) {
    await this.simulateDelay();
    return this.getMockWaterDesignations(coordinates, bounds);
  }

  async callHighwaysAuthority(coordinates: any, bounds: any[]) {
    await this.simulateDelay();
    return this.getMockRoadReserves(coordinates, bounds);
  }

  async callForestService(coordinates: any, bounds: any[]) {
    await this.simulateDelay();
    return this.getMockForestDesignations(coordinates, bounds);
  }

  async callNEMA(coordinates: any, bounds: any[]) {
    await this.simulateDelay();
    return this.getMockEnvironmentalDesignations(coordinates, bounds);
  }

  private getMockLandsData(titleNumber: string, location: string) {
    return {
      titleNumber,
      currentOwner: {
        name: 'John Doe',
        idNumber: '12345678',
        registrationDate: new Date('2020-01-01')
      },
      ownershipHistory: [
        {
          fromOwner: 'Previous Owner',
          toOwner: 'John Doe',
          transferDate: new Date('2020-01-01'),
          transferType: 'sale',
          registrationNumber: 'REG001',
          transferValue: 5000000
        }
      ],
      legalInstruments: [
        {
          type: 'mortgage',
          institution: 'Kenya Commercial Bank',
          amount: 3000000,
          registrationDate: new Date('2020-01-15'),
          status: 'active'
        }
      ],
      surveyDetails: {
        coordinates: { lat: -1.2921, lng: 36.8219 },
        area: 1000,
        boundaries: [
          { id: 'BM001', coordinates: { lat: -1.2920, lng: 36.8218 } },
          { id: 'BM002', coordinates: { lat: -1.2922, lng: 36.8220 } }
        ]
      },
      restrictions: [],
      lastUpdated: new Date(),
      verificationStatus: 'verified'
    };
  }

  private getSuspiciousLandsData(titleNumber: string) {
    const baseData = this.getMockLandsData(titleNumber, 'Nairobi');
    return {
      ...baseData,
      ownershipHistory: [
        {
          fromOwner: 'Owner A',
          toOwner: 'Owner B',
          transferDate: new Date('2023-01-01'),
          transferType: 'sale',
          registrationNumber: 'REG001',
          transferValue: 1000000
        },
        {
          fromOwner: 'Owner B',
          toOwner: 'Owner C',
          transferDate: new Date('2023-01-15'),
          transferType: 'sale',
          registrationNumber: 'REG002',
          transferValue: 1200000
        },
        {
          fromOwner: 'Owner C',
          toOwner: 'Current Owner',
          transferDate: new Date('2023-02-01'),
          transferType: 'sale',
          registrationNumber: 'REG003',
          transferValue: 1500000
        }
      ],
      suspiciousPatterns: ['rapid_transfers', 'below_market_value']
    };
  }

  private getFallbackLandsData(titleNumber: string) {
    return {
      ...this.getMockLandsData(titleNumber, 'Nairobi'),
      verificationStatus: 'fallback',
      dataSource: 'cached',
      lastUpdated: new Date(Date.now() - 86400000) // 1 day old
    };
  }

  private getMockCourtRecords(propertyId: string, ownerNames: string[]) {
    return [
      {
        caseNumber: 'HC001/2023',
        court: 'High Court of Kenya',
        parties: ['John Doe', 'Jane Smith'],
        caseType: 'Land Dispute',
        status: 'active',
        filingDate: new Date('2023-01-01'),
        lastActivity: new Date('2023-12-01'),
        summary: 'Dispute over property boundaries and ownership rights',
        relevanceScore: 0.8,
        riskImplication: 'Active boundary dispute may affect ownership'
      },
      {
        caseNumber: 'MAG002/2022',
        court: 'Magistrate Court',
        parties: ['John Doe', 'Local Council'],
        caseType: 'Planning Dispute',
        status: 'settled',
        filingDate: new Date('2022-06-01'),
        lastActivity: new Date('2022-12-01'),
        summary: 'Dispute over building permits and land use',
        relevanceScore: 0.6,
        riskImplication: 'Previous planning issues resolved'
      }
    ];
  }

  private getMockWaterDesignations(coordinates: any, bounds: any[]) {
    return [
      {
        type: 'riparian',
        authority: 'Water Resources Authority',
        designation: 'Riparian Reserve - 30m buffer',
        restrictions: ['No construction within 30m of water body'],
        bufferZone: 30,
        riskLevel: 'medium',
        lastVerified: new Date()
      }
    ];
  }

  private getMockRoadReserves(coordinates: any, bounds: any[]) {
    return [
      {
        type: 'road_reserve',
        authority: 'Kenya National Highways Authority',
        designation: 'Road Reserve - Class A Road',
        restrictions: ['No construction within road reserve'],
        plannedChanges: [
          {
            projectName: 'Highway Expansion Project',
            plannedStartDate: new Date('2024-06-01'),
            estimatedCompletion: new Date('2026-12-01'),
            impactRadius: 200
          }
        ],
        riskLevel: 'high',
        lastVerified: new Date()
      }
    ];
  }

  private getMockForestDesignations(coordinates: any, bounds: any[]) {
    return [
      {
        type: 'environmental',
        authority: 'Kenya Forest Service',
        designation: 'Forest Reserve Buffer Zone',
        restrictions: ['Limited development allowed', 'Environmental impact assessment required'],
        riskLevel: 'low',
        lastVerified: new Date()
      }
    ];
  }

  private getMockEnvironmentalDesignations(coordinates: any, bounds: any[]) {
    return [
      {
        type: 'environmental',
        authority: 'NEMA',
        designation: 'Environmentally Sensitive Area',
        restrictions: ['Environmental impact assessment required for any development'],
        riskLevel: 'medium',
        lastVerified: new Date()
      }
    ];
  }
}
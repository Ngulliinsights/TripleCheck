import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { testUtils } from '../../tests/setup';

describe('Land Verification User Acceptance Tests - Realistic Scenarios', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = testUtils.createTestUser();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Scenario 1: Urban Property in Nairobi with Clean Title', () => {
    it('should successfully verify a legitimate urban property', async () => {
      const property = {
        id: 'PROP_NAIROBI_001',
        title: '3-bedroom house in Kilimani',
        location: 'Kilimani, Nairobi',
        coordinates: { lat: -1.2921, lng: 36.7856 },
        titleNumber: 'NAIROBI/BLOCK21/567',
        area: 800, // square meters
        propertyType: 'residential'
      };

      // Mock clean government responses
      vi.doMock('../GovernmentIntegrationService', () => ({
        GovernmentIntegrationService: vi.fn().mockImplementation(() => ({
          searchLandRegistry: vi.fn().mockResolvedValue({
            titleNumber: property.titleNumber,
            currentOwner: {
              name: 'Mary Wanjiku',
              idNumber: '12345678',
              registrationDate: new Date('2018-03-15')
            },
            ownershipHistory: [
              {
                fromOwner: 'Original Developer',
                toOwner: 'Mary Wanjiku',
                transferDate: new Date('2018-03-15'),
                transferType: 'first_registration',
                registrationNumber: 'REG001',
                transferValue: 8500000
              }
            ],
            legalInstruments: [
              {
                type: 'mortgage',
                institution: 'Equity Bank',
                amount: 6000000,
                registrationDate: new Date('2018-03-20'),
                status: 'active'
              }
            ],
            surveyDetails: {
              coordinates: property.coordinates,
              area: property.area,
              boundaries: [
                { id: 'BM001', coordinates: { lat: -1.2920, lng: 36.7855 } },
                { id: 'BM002', coordinates: { lat: -1.2922, lng: 36.7857 } }
              ]
            },
            restrictions: [],
            lastUpdated: new Date(),
            verificationStatus: 'verified'
          }),
          checkCourtRecords: vi.fn().mockResolvedValue([]),
          verifyGovernmentDesignations: vi.fn().mockResolvedValue([
            {
              type: 'utility_corridor',
              authority: 'Kenya Power',
              designation: 'Power line easement - 5m',
              restrictions: ['No construction within 5m of power line'],
              riskLevel: 'low',
              lastVerified: new Date()
            }
          ]),
          checkInfrastructurePlans: vi.fn().mockResolvedValue([])
        }))
      }));

      // User Story: As a property buyer, I want to verify a clean urban property
      
      // Step 1: Initiate verification
      const initiateResponse = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: property.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      const sessionId = initiateResponse.body.sessionId;

      // Step 2: Execute registry verification
      const registryResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/registry`)
        .send({
          titleNumber: property.titleNumber,
          location: property.location
        })
        .expect(200);

      expect(registryResponse.body.results.registryResult.verificationStatus).toBe('verified');
      expect(registryResponse.body.results.registryResult.currentOwner.name).toBe('Mary Wanjiku');

      // Step 3: Physical verification
      const physicalResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/physical`)
        .send({
          gpsCoordinates: property.coordinates,
          boundaryMarkers: [
            { id: 'BM001', coordinates: { lat: -1.2920, lng: 36.7855 }, verified: true },
            { id: 'BM002', coordinates: { lat: -1.2922, lng: 36.7857 }, verified: true }
          ],
          measurements: {
            area: 800,
            perimeter: 113
          },
          physicalFeatures: {
            buildingPresent: true,
            fencing: 'complete',
            accessRoad: 'paved',
            utilities: ['electricity', 'water', 'sewer']
          }
        })
        .expect(200);

      expect(physicalResponse.body.status).toBe('completed');

      // Step 4: Community intelligence
      const communityResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/community`)
        .send({
          interviews: [
            {
              source: 'neighbor',
              sourceDetails: {
                name: 'John Kamau',
                yearsInArea: 10
              },
              feedback: {
                ownershipHistory: 'Mary has lived here for 6 years, no disputes',
                knownDisputes: [],
                landUsePatterns: ['residential'],
                recentChanges: [],
                concerns: []
              },
              reliability: 0.8
            }
          ]
        })
        .expect(200);

      // Step 5: Generate risk assessment
      const riskResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/risk-assessment`)
        .expect(200);

      expect(riskResponse.body.riskLevel).toBe('low');
      expect(riskResponse.body.overallRiskScore).toBeLessThan(30);
      expect(riskResponse.body.recommendations).toContain('Property shows low risk indicators');

      // Step 6: Generate final report
      const reportResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/report`)
        .expect(200);

      expect(reportResponse.body.executiveSummary).toContain('low risk');
      expect(reportResponse.body.verificationResults.registry.status).toBe('verified');
      expect(reportResponse.body.verificationResults.physical.status).toBe('verified');
    });
  });

  describe('Scenario 2: Rural Property with Customary Land Rights', () => {
    it('should handle verification of rural property with customary tenure', async () => {
      const property = {
        id: 'PROP_RURAL_001',
        title: 'Agricultural land in Kiambu',
        location: 'Kiambu County',
        coordinates: { lat: -1.1743, lng: 36.8356 },
        titleNumber: 'KIAMBU/BLOCK5/234',
        area: 5000, // 5000 square meters (0.5 hectares)
        propertyType: 'agricultural'
      };

      // Mock rural property responses
      vi.doMock('../GovernmentIntegrationService', () => ({
        GovernmentIntegrationService: vi.fn().mockImplementation(() => ({
          searchLandRegistry: vi.fn().mockResolvedValue({
            titleNumber: property.titleNumber,
            currentOwner: {
              name: 'Samuel Mwangi',
              idNumber: '87654321',
              registrationDate: new Date('2015-08-10')
            },
            ownershipHistory: [
              {
                fromOwner: 'Customary Community',
                toOwner: 'Samuel Mwangi',
                transferDate: new Date('2015-08-10'),
                transferType: 'customary_conversion',
                registrationNumber: 'CUSTOM001',
                transferValue: 2500000
              }
            ],
            legalInstruments: [],
            surveyDetails: {
              coordinates: property.coordinates,
              area: property.area,
              boundaries: [
                { id: 'NATURAL_001', type: 'river', description: 'Seasonal stream' },
                { id: 'FENCE_001', type: 'fence', description: 'Stone fence' }
              ]
            },
            restrictions: [
              {
                type: 'customary_rights',
                description: 'Community grazing rights during dry season',
                authority: 'Local Council'
              }
            ],
            lastUpdated: new Date(),
            verificationStatus: 'verified'
          }),
          checkCourtRecords: vi.fn().mockResolvedValue([]),
          verifyGovernmentDesignations: vi.fn().mockResolvedValue([
            {
              type: 'riparian',
              authority: 'Water Resources Authority',
              designation: 'Riparian reserve - seasonal stream',
              restrictions: ['No construction within 6m of stream'],
              riskLevel: 'medium',
              lastVerified: new Date()
            }
          ]),
          checkInfrastructurePlans: vi.fn().mockResolvedValue([])
        }))
      }));

      // User Story: As a buyer of rural land, I want to understand customary rights implications

      const initiateResponse = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: property.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      const sessionId = initiateResponse.body.sessionId;

      // Registry verification
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/registry`)
        .send({
          titleNumber: property.titleNumber,
          location: property.location
        })
        .expect(200);

      // Physical verification with natural boundaries
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/physical`)
        .send({
          gpsCoordinates: property.coordinates,
          boundaryMarkers: [],
          naturalBoundaries: [
            { type: 'river', description: 'Seasonal stream on eastern boundary' },
            { type: 'ridge', description: 'Hill ridge on northern boundary' }
          ],
          measurements: {
            area: 5000,
            perimeter: 283
          },
          landUse: {
            current: 'agriculture',
            crops: ['maize', 'beans'],
            irrigation: false
          }
        })
        .expect(200);

      // Community intelligence - crucial for rural properties
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/community`)
        .send({
          interviews: [
            {
              source: 'local_admin',
              sourceDetails: {
                name: 'Chief Wanjiku',
                position: 'Assistant Chief',
                yearsInArea: 20
              },
              feedback: {
                ownershipHistory: 'Land belonged to Mwangi family for generations, properly converted to title',
                knownDisputes: [],
                landUsePatterns: ['agriculture', 'seasonal_grazing'],
                recentChanges: [],
                concerns: ['Community expects continued access for cattle during dry season']
              },
              reliability: 0.9
            },
            {
              source: 'community_leader',
              sourceDetails: {
                name: 'Elder Kamau',
                position: 'Council of Elders',
                yearsInArea: 45
              },
              feedback: {
                ownershipHistory: 'Mwangi family traditional owners, no disputes',
                knownDisputes: [],
                landUsePatterns: ['agriculture', 'traditional_ceremonies'],
                recentChanges: [],
                concerns: ['Sacred tree on property should be preserved']
              },
              reliability: 0.95
            }
          ]
        })
        .expect(200);

      // Risk assessment
      const riskResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/risk-assessment`)
        .expect(200);

      expect(riskResponse.body.riskLevel).toBe('medium');
      expect(riskResponse.body.riskFactors).toContainEqual(
        expect.objectContaining({
          category: 'community',
          description: expect.stringContaining('customary rights')
        })
      );

      // Final report should address customary rights
      const reportResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/report`)
        .expect(200);

      expect(reportResponse.body.executiveSummary).toContain('customary rights');
      expect(reportResponse.body.recommendations).toContain('community agreement');
    });
  });

  describe('Scenario 3: Property with Active Legal Dispute', () => {
    it('should identify and assess high-risk property with ongoing litigation', async () => {
      const property = {
        id: 'PROP_DISPUTE_001',
        title: 'Commercial plot in Mombasa',
        location: 'Mombasa, Kenya',
        coordinates: { lat: -4.0435, lng: 39.6682 },
        titleNumber: 'MOMBASA/BLOCK10/89',
        area: 2000,
        propertyType: 'commercial'
      };

      // Mock disputed property responses
      vi.doMock('../GovernmentIntegrationService', () => ({
        GovernmentIntegrationService: vi.fn().mockImplementation(() => ({
          searchLandRegistry: vi.fn().mockResolvedValue({
            titleNumber: property.titleNumber,
            currentOwner: {
              name: 'ABC Investments Ltd',
              idNumber: 'C.123/2020',
              registrationDate: new Date('2022-01-15')
            },
            ownershipHistory: [
              {
                fromOwner: 'Estate of John Ochieng',
                toOwner: 'ABC Investments Ltd',
                transferDate: new Date('2022-01-15'),
                transferType: 'sale',
                registrationNumber: 'REG789',
                transferValue: 15000000
              },
              {
                fromOwner: 'John Ochieng',
                toOwner: 'Estate of John Ochieng',
                transferDate: new Date('2021-06-10'),
                transferType: 'succession',
                registrationNumber: 'SUCC001',
                transferValue: 0
              }
            ],
            legalInstruments: [
              {
                type: 'caveat',
                institution: 'Family of John Ochieng',
                registrationDate: new Date('2022-02-01'),
                status: 'active',
                description: 'Caveat lodged by family members disputing succession'
              }
            ],
            surveyDetails: {
              coordinates: property.coordinates,
              area: property.area,
              boundaries: []
            },
            restrictions: [
              {
                type: 'legal_caveat',
                description: 'Property transfer disputed by deceased family',
                authority: 'High Court'
              }
            ],
            lastUpdated: new Date(),
            verificationStatus: 'disputed'
          }),
          checkCourtRecords: vi.fn().mockResolvedValue([
            {
              caseNumber: 'HCCC No. 45/2022',
              court: 'High Court of Kenya at Mombasa',
              parties: ['Family of John Ochieng', 'ABC Investments Ltd', 'Estate of John Ochieng'],
              caseType: 'Succession Dispute',
              status: 'active',
              filingDate: new Date('2022-02-15'),
              lastActivity: new Date('2024-01-10'),
              summary: 'Family members contest the validity of the will and subsequent sale',
              relevanceScore: 0.95,
              riskImplication: 'Active succession dispute may invalidate current ownership'
            },
            {
              caseNumber: 'HCCC No. 67/2022',
              court: 'High Court of Kenya at Mombasa',
              parties: ['Mary Ochieng', 'ABC Investments Ltd'],
              caseType: 'Injunction Application',
              status: 'active',
              filingDate: new Date('2022-03-01'),
              lastActivity: new Date('2024-01-05'),
              summary: 'Application to stop any development on the property',
              relevanceScore: 0.9,
              riskImplication: 'Injunction may prevent property use or development'
            }
          ]),
          verifyGovernmentDesignations: vi.fn().mockResolvedValue([]),
          checkInfrastructurePlans: vi.fn().mockResolvedValue([])
        }))
      }));

      // User Story: As a potential buyer, I want to be warned about high-risk properties

      const initiateResponse = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: property.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      const sessionId = initiateResponse.body.sessionId;

      // Registry verification should reveal disputes
      const registryResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/registry`)
        .send({
          titleNumber: property.titleNumber,
          location: property.location
        })
        .expect(200);

      expect(registryResponse.body.results.registryResult.verificationStatus).toBe('disputed');
      expect(registryResponse.body.results.registryResult.legalInstruments).toContainEqual(
        expect.objectContaining({
          type: 'caveat',
          status: 'active'
        })
      );

      // Legal layer should reveal court cases
      const legalResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/legal`)
        .send({
          ownerNames: ['ABC Investments Ltd', 'John Ochieng'],
          propertyId: property.id
        })
        .expect(200);

      expect(legalResponse.body.results.courtRecords).toHaveLength(2);
      expect(legalResponse.body.results.courtRecords[0].status).toBe('active');

      // Community intelligence might reveal local knowledge of dispute
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/community`)
        .send({
          interviews: [
            {
              source: 'neighbor',
              sourceDetails: {
                name: 'Business Owner Next Door',
                yearsInArea: 8
              },
              feedback: {
                ownershipHistory: 'John Ochieng owned this for years, family fighting over inheritance',
                knownDisputes: ['Family members claim will was forged'],
                landUsePatterns: ['commercial'],
                recentChanges: ['New company claimed ownership', 'Family protests'],
                concerns: ['Ongoing court case', 'Property may be seized']
              },
              reliability: 0.7
            }
          ]
        })
        .expect(200);

      // Risk assessment should show high risk
      const riskResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/risk-assessment`)
        .expect(200);

      expect(riskResponse.body.riskLevel).toBe('critical');
      expect(riskResponse.body.overallRiskScore).toBeGreaterThan(80);
      expect(riskResponse.body.riskFactors).toContainEqual(
        expect.objectContaining({
          category: 'legal',
          severity: 'critical'
        })
      );

      // Recommendations should strongly advise against purchase
      expect(riskResponse.body.recommendations).toContain('DO NOT PROCEED with purchase');
      expect(riskResponse.body.recommendations).toContain('legal counsel');

      // Final report should clearly highlight risks
      const reportResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/report`)
        .expect(200);

      expect(reportResponse.body.executiveSummary).toContain('CRITICAL RISK');
      expect(reportResponse.body.executiveSummary).toContain('active litigation');
    });
  });

  describe('Scenario 4: Property Affected by Government Development Plans', () => {
    it('should identify property at risk from planned government infrastructure', async () => {
      const property = {
        id: 'PROP_INFRASTRUCTURE_001',
        title: 'Residential house near planned highway',
        location: 'Thika, Kenya',
        coordinates: { lat: -1.0332, lng: 37.0692 },
        titleNumber: 'THIKA/BLOCK15/456',
        area: 1200,
        propertyType: 'residential'
      };

      // Mock infrastructure conflict responses
      vi.doMock('../GovernmentIntegrationService', () => ({
        GovernmentIntegrationService: vi.fn().mockImplementation(() => ({
          searchLandRegistry: vi.fn().mockResolvedValue({
            titleNumber: property.titleNumber,
            currentOwner: {
              name: 'Peter Kariuki',
              idNumber: '98765432',
              registrationDate: new Date('2019-05-20')
            },
            ownershipHistory: [
              {
                fromOwner: 'Previous Owner',
                toOwner: 'Peter Kariuki',
                transferDate: new Date('2019-05-20'),
                transferType: 'sale',
                registrationNumber: 'REG456',
                transferValue: 4500000
              }
            ],
            legalInstruments: [],
            surveyDetails: {
              coordinates: property.coordinates,
              area: property.area,
              boundaries: []
            },
            restrictions: [],
            lastUpdated: new Date(),
            verificationStatus: 'verified'
          }),
          checkCourtRecords: vi.fn().mockResolvedValue([]),
          verifyGovernmentDesignations: vi.fn().mockResolvedValue([
            {
              type: 'road_reserve',
              authority: 'Kenya National Highways Authority',
              designation: 'Planned highway expansion - 60m corridor',
              restrictions: ['Property may be subject to compulsory acquisition'],
              plannedChanges: [
                {
                  projectName: 'Thika-Garissa Highway Expansion',
                  plannedStartDate: new Date('2025-01-01'),
                  estimatedCompletion: new Date('2027-12-31'),
                  impactRadius: 100
                }
              ],
              riskLevel: 'high',
              lastVerified: new Date()
            }
          ]),
          checkInfrastructurePlans: vi.fn().mockResolvedValue([
            {
              projectName: 'Thika-Garissa Highway Expansion',
              authority: 'Kenya National Highways Authority',
              projectType: 'road',
              plannedStartDate: new Date('2025-01-01'),
              estimatedCompletion: new Date('2027-12-31'),
              impactRadius: 100,
              riskLevel: 'high',
              description: 'Highway expansion will require land acquisition',
              compensationFramework: 'Market value plus 15% disturbance allowance'
            }
          ])
        }))
      }));

      // User Story: As a property buyer, I want to know about planned government projects

      const initiateResponse = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: property.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      const sessionId = initiateResponse.body.sessionId;

      // Registry verification
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/registry`)
        .send({
          titleNumber: property.titleNumber,
          location: property.location
        })
        .expect(200);

      // Government designation check should reveal highway plans
      const governmentResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/government`)
        .send({
          coordinates: property.coordinates,
          propertyBounds: []
        })
        .expect(200);

      expect(governmentResponse.body.results.designations).toContainEqual(
        expect.objectContaining({
          type: 'road_reserve',
          riskLevel: 'high'
        })
      );

      // Community intelligence might reveal local knowledge
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/community`)
        .send({
          interviews: [
            {
              source: 'local_admin',
              sourceDetails: {
                name: 'Area Chief',
                position: 'Chief',
                yearsInArea: 12
              },
              feedback: {
                ownershipHistory: 'Peter is legitimate owner',
                knownDisputes: [],
                landUsePatterns: ['residential'],
                recentChanges: ['Government surveyors seen in area'],
                concerns: ['Highway expansion rumors', 'Property values uncertain']
              },
              reliability: 0.85
            }
          ]
        })
        .expect(200);

      // Risk assessment should show high infrastructure risk
      const riskResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/risk-assessment`)
        .expect(200);

      expect(riskResponse.body.riskLevel).toBe('high');
      expect(riskResponse.body.riskFactors).toContainEqual(
        expect.objectContaining({
          category: 'government',
          severity: 'high',
          description: expect.stringContaining('highway')
        })
      );

      // Recommendations should address infrastructure risk
      expect(riskResponse.body.recommendations).toContain('government acquisition');
      expect(riskResponse.body.recommendations).toContain('compensation framework');

      // Final report should detail infrastructure implications
      const reportResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/report`)
        .expect(200);

      expect(reportResponse.body.executiveSummary).toContain('infrastructure development');
      expect(reportResponse.body.riskAssessment.governmentRisks).toBeDefined();
    });
  });

  describe('Scenario 5: Coastal Property with Environmental Restrictions', () => {
    it('should handle coastal property with environmental and riparian concerns', async () => {
      const property = {
        id: 'PROP_COASTAL_001',
        title: 'Beachfront plot in Malindi',
        location: 'Malindi, Kenya',
        coordinates: { lat: -3.2194, lng: 40.1169 },
        titleNumber: 'MALINDI/BLOCK2/123',
        area: 3000,
        propertyType: 'residential'
      };

      // Mock coastal property responses
      vi.doMock('../GovernmentIntegrationService', () => ({
        GovernmentIntegrationService: vi.fn().mockImplementation(() => ({
          searchLandRegistry: vi.fn().mockResolvedValue({
            titleNumber: property.titleNumber,
            currentOwner: {
              name: 'Coastal Developers Ltd',
              idNumber: 'C.456/2021',
              registrationDate: new Date('2021-03-10')
            },
            ownershipHistory: [
              {
                fromOwner: 'Local Community Trust',
                toOwner: 'Coastal Developers Ltd',
                transferDate: new Date('2021-03-10'),
                transferType: 'sale',
                registrationNumber: 'COAST001',
                transferValue: 12000000
              }
            ],
            legalInstruments: [],
            surveyDetails: {
              coordinates: property.coordinates,
              area: property.area,
              boundaries: [
                { id: 'OCEAN', type: 'natural', description: 'Indian Ocean high tide mark' }
              ]
            },
            restrictions: [
              {
                type: 'environmental',
                description: 'Coastal zone management restrictions apply',
                authority: 'NEMA'
              }
            ],
            lastUpdated: new Date(),
            verificationStatus: 'verified'
          }),
          checkCourtRecords: vi.fn().mockResolvedValue([]),
          verifyGovernmentDesignations: vi.fn().mockResolvedValue([
            {
              type: 'environmental',
              authority: 'NEMA',
              designation: 'Coastal Zone - High Tide Mark + 60m',
              restrictions: [
                'No construction within 60m of high tide mark',
                'Environmental Impact Assessment required',
                'Coastal development permit required'
              ],
              riskLevel: 'high',
              lastVerified: new Date()
            },
            {
              type: 'riparian',
              authority: 'Water Resources Authority',
              designation: 'Marine Reserve Buffer Zone',
              restrictions: ['No discharge of effluent to ocean'],
              riskLevel: 'medium',
              lastVerified: new Date()
            }
          ]),
          checkInfrastructurePlans: vi.fn().mockResolvedValue([])
        }))
      }));

      // User Story: As a coastal property buyer, I want to understand environmental restrictions

      const initiateResponse = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: property.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      const sessionId = initiateResponse.body.sessionId;

      // Registry verification
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/registry`)
        .send({
          titleNumber: property.titleNumber,
          location: property.location
        })
        .expect(200);

      // Government designation should reveal environmental restrictions
      const governmentResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/government`)
        .send({
          coordinates: property.coordinates,
          propertyBounds: []
        })
        .expect(200);

      expect(governmentResponse.body.results.designations).toContainEqual(
        expect.objectContaining({
          type: 'environmental',
          authority: 'NEMA',
          riskLevel: 'high'
        })
      );

      // Physical verification with coastal considerations
      await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/layers/physical`)
        .send({
          gpsCoordinates: property.coordinates,
          boundaryMarkers: [],
          naturalBoundaries: [
            { type: 'ocean', description: 'Indian Ocean forms eastern boundary' }
          ],
          measurements: {
            area: 3000,
            distanceFromHighTideMark: 45 // Less than 60m requirement
          },
          environmentalFeatures: {
            vegetation: 'coastal_forest',
            wildlifePresent: true,
            erosionRisk: 'moderate'
          }
        })
        .expect(200);

      // Risk assessment should highlight environmental compliance issues
      const riskResponse = await request(app)
        .post(`/api/land-verification/sessions/${sessionId}/risk-assessment`)
        .expect(200);

      expect(riskResponse.body.riskLevel).toBe('high');
      expect(riskResponse.body.riskFactors).toContainEqual(
        expect.objectContaining({
          category: 'government',
          description: expect.stringContaining('coastal zone')
        })
      );

      // Recommendations should address environmental compliance
      expect(riskResponse.body.recommendations).toContain('Environmental Impact Assessment');
      expect(riskResponse.body.recommendations).toContain('NEMA approval');

      // Final report should detail environmental requirements
      const reportResponse = await request(app)
        .get(`/api/land-verification/sessions/${sessionId}/report`)
        .expect(200);

      expect(reportResponse.body.executiveSummary).toContain('environmental restrictions');
      expect(reportResponse.body.verificationResults.government.environmentalCompliance).toBeDefined();
    });
  });
});
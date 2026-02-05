import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { testUtils } from '../../tests/setup';
import { LandVerificationService } from '../LandVerificationService';
import { GovernmentIntegrationService } from '../GovernmentIntegrationService';
import { RiskAssessmentService } from '../RiskAssessmentService';

describe('Land Verification E2E Workflows', () => {
  let testUser: any;
  let testProperty: any;
  let verificationSession: any;

  beforeEach(async () => {
    // Create test user and property
    testUser = testUtils.createTestUser();
    testProperty = testUtils.createTestProperty();
    
    // Mock external services
    vi.spyOn(GovernmentIntegrationService.prototype, 'searchLandRegistry').mockResolvedValue({
      titleNumber: 'TEST123456',
      currentOwner: {
        name: 'John Doe',
        idNumber: '12345678',
        registrationDate: new Date('2020-01-01')
      },
      ownershipHistory: [],
      legalInstruments: [],
      surveyDetails: {
        coordinates: { lat: -1.2921, lng: 36.8219 },
        area: 1000,
        boundaries: []
      },
      restrictions: [],
      lastUpdated: new Date(),
      verificationStatus: 'verified'
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  describe('Complete Verification Workflow', () => {
    it('should complete full verification process from initiation to final report', async () => {
      // Step 1: Initiate verification
      const initiateResponse = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      expect(initiateResponse.body).toHaveProperty('sessionId');
      verificationSession = initiateResponse.body;

      // Step 2: Execute registry verification layer
      const registryResponse = await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/layers/registry`)
        .send({
          titleNumber: 'TEST123456',
          location: 'Nairobi, Kenya'
        })
        .expect(200);

      expect(registryResponse.body.status).toBe('completed');
      expect(registryResponse.body.results).toHaveProperty('registryResult');

      // Step 3: Execute physical verification layer
      const physicalResponse = await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/layers/physical`)
        .send({
          gpsCoordinates: { lat: -1.2921, lng: 36.8219 },
          boundaryMarkers: [
            { id: 'BM001', coordinates: { lat: -1.2920, lng: 36.8218 } },
            { id: 'BM002', coordinates: { lat: -1.2922, lng: 36.8220 } }
          ],
          measurements: {
            area: 1000,
            perimeter: 126
          }
        })
        .expect(200);

      expect(physicalResponse.body.status).toBe('completed');

      // Step 4: Execute community intelligence layer
      const communityResponse = await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/layers/community`)
        .send({
          interviews: [
            {
              source: 'local_admin',
              sourceDetails: {
                name: 'Chief Mwangi',
                position: 'Assistant Chief',
                yearsInArea: 15
              },
              feedback: {
                ownershipHistory: 'Property has been with the same family for 20 years',
                knownDisputes: [],
                landUsePatterns: ['residential'],
                recentChanges: [],
                concerns: []
              },
              reliability: 0.9
            }
          ]
        })
        .expect(200);

      expect(communityResponse.body.status).toBe('completed');

      // Step 5: Execute government designation check
      const governmentResponse = await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/layers/government`)
        .send({
          coordinates: { lat: -1.2921, lng: 36.8219 },
          propertyBounds: []
        })
        .expect(200);

      expect(governmentResponse.body.status).toBe('completed');

      // Step 6: Generate risk assessment
      const riskResponse = await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/risk-assessment`)
        .expect(200);

      expect(riskResponse.body).toHaveProperty('overallRiskScore');
      expect(riskResponse.body).toHaveProperty('riskLevel');
      expect(riskResponse.body).toHaveProperty('recommendations');

      // Step 7: Generate final report
      const reportResponse = await request(app)
        .get(`/api/land-verification/sessions/${verificationSession.sessionId}/report`)
        .expect(200);

      expect(reportResponse.body).toHaveProperty('executiveSummary');
      expect(reportResponse.body).toHaveProperty('verificationResults');
      expect(reportResponse.body).toHaveProperty('riskAssessment');
      expect(reportResponse.body).toHaveProperty('recommendations');

      // Step 8: Verify session completion
      const statusResponse = await request(app)
        .get(`/api/land-verification/sessions/${verificationSession.sessionId}/status`)
        .expect(200);

      expect(statusResponse.body.status).toBe('completed');
      expect(statusResponse.body.completedLayers).toHaveLength(4);
    });

    it('should handle partial verification workflow with missing layers', async () => {
      // Initiate verification
      const initiateResponse = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'basic'
        })
        .expect(201);

      verificationSession = initiateResponse.body;

      // Execute only registry and physical layers
      await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/layers/registry`)
        .send({ titleNumber: 'TEST123456', location: 'Nairobi, Kenya' })
        .expect(200);

      await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/layers/physical`)
        .send({
          gpsCoordinates: { lat: -1.2921, lng: 36.8219 },
          boundaryMarkers: [],
          measurements: { area: 1000, perimeter: 126 }
        })
        .expect(200);

      // Generate risk assessment with partial data
      const riskResponse = await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/risk-assessment`)
        .expect(200);

      expect(riskResponse.body.confidence).toBeLessThan(1.0);
      expect(riskResponse.body.recommendations).toContain('Complete community intelligence gathering');
    });

    it('should handle verification workflow with high-risk findings', async () => {
      // Mock high-risk scenario
      vi.spyOn(GovernmentIntegrationService.prototype, 'checkCourtRecords').mockResolvedValue([
        {
          caseNumber: 'HC001/2023',
          court: 'High Court of Kenya',
          parties: ['John Doe', 'Jane Smith'],
          caseType: 'Land Dispute',
          status: 'active',
          filingDate: new Date('2023-01-01'),
          lastActivity: new Date('2023-12-01'),
          summary: 'Dispute over property boundaries',
          relevanceScore: 0.9,
          riskImplication: 'Active boundary dispute may affect ownership'
        }
      ]);

      // Initiate and execute verification
      const initiateResponse = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      verificationSession = initiateResponse.body;

      // Execute legal layer
      await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/layers/legal`)
        .send({
          ownerNames: ['John Doe'],
          propertyId: testProperty.id
        })
        .expect(200);

      // Generate risk assessment
      const riskResponse = await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/risk-assessment`)
        .expect(200);

      expect(riskResponse.body.riskLevel).toBe('high');
      expect(riskResponse.body.riskFactors).toContainEqual(
        expect.objectContaining({
          category: 'legal',
          severity: 'high'
        })
      );
    });
  });

  describe('Expert Coordination Workflow', () => {
    it('should coordinate expert verification workflow', async () => {
      // Initiate verification requiring expert coordination
      const initiateResponse = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'expert-assisted'
        })
        .expect(201);

      verificationSession = initiateResponse.body;

      // Request surveyor assignment
      const surveyorResponse = await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/experts/surveyor`)
        .send({
          requirements: ['boundary_verification', 'coordinate_validation'],
          location: 'Nairobi',
          urgency: 'normal'
        })
        .expect(200);

      expect(surveyorResponse.body).toHaveProperty('expertId');
      expect(surveyorResponse.body).toHaveProperty('estimatedCompletion');

      // Request legal counsel assignment
      const legalResponse = await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/experts/legal`)
        .send({
          requirements: ['title_review', 'dispute_analysis'],
          specialization: 'property_law',
          urgency: 'normal'
        })
        .expect(200);

      expect(legalResponse.body).toHaveProperty('expertId');

      // Submit expert reports
      await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/experts/reports`)
        .send({
          expertId: surveyorResponse.body.expertId,
          reportType: 'survey',
          findings: {
            boundaryAccuracy: 'verified',
            coordinateValidation: 'accurate',
            recommendations: ['No boundary issues identified']
          }
        })
        .expect(200);

      // Generate final assessment with expert input
      const finalResponse = await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/risk-assessment`)
        .expect(200);

      expect(finalResponse.body.expertValidation).toBe(true);
    });
  });

  describe('Monitoring Workflow', () => {
    it('should set up and execute ongoing monitoring', async () => {
      // Complete initial verification
      const initiateResponse = await request(app)
        .post('/api/land-verification/initiate')
        .send({
          propertyId: testProperty.id,
          userId: testUser.id,
          verificationType: 'comprehensive'
        })
        .expect(201);

      verificationSession = initiateResponse.body;

      // Set up monitoring
      const monitoringResponse = await request(app)
        .post(`/api/land-verification/sessions/${verificationSession.sessionId}/monitoring`)
        .send({
          monitoringConfig: {
            frequency: 'monthly',
            alertThreshold: 'medium',
            monitoredAspects: ['government_plans', 'legal_disputes', 'ownership_changes']
          }
        })
        .expect(200);

      expect(monitoringResponse.body).toHaveProperty('monitoringId');

      // Simulate monitoring check
      const checkResponse = await request(app)
        .post(`/api/land-verification/monitoring/${monitoringResponse.body.monitoringId}/check`)
        .expect(200);

      expect(checkResponse.body).toHaveProperty('updates');
      expect(checkResponse.body).toHaveProperty('alerts');
    });
  });
});
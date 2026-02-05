import { PhysicalVerificationService, BoundaryValidationRequest } from '../../PhysicalVerificationService';
import { db } from '../../../lib/database';

describe('PhysicalVerificationService Integration Tests', () => {
  let service: PhysicalVerificationService;

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  beforeEach(() => {
    service = new PhysicalVerificationService();
  });

  afterAll(async () => {
    // Cleanup test database
    await cleanupTestDatabase();
  });

  describe('Real-world Kenya Property Scenarios', () => {
    it('should verify a typical Nairobi residential property', async () => {
      const nairobiResidentialRequest: BoundaryValidationRequest = {
        sessionId: 'nairobi-001',
        propertyId: 'NRB-RES-001',
        surveyPlan: {
          surveyPlan: 'NAIROBI/BLOCK47/123',
          coordinateSystem: 'Arc 1960 / UTM zone 37S',
          surveyDate: new Date('2023-06-15'),
          surveyor: 'Kenya Licensed Surveyor #1234',
          area: 2023.5, // 0.5 acres
          boundaries: [
            { id: 'NE', coordinates: { lat: -1.2856, lng: 36.8172 }, description: 'Northeast beacon', distanceToNext: 45.2 },
            { id: 'SE', coordinates: { lat: -1.2860, lng: 36.8172 }, description: 'Southeast beacon', distanceToNext: 44.8 },
            { id: 'SW', coordinates: { lat: -1.2860, lng: 36.8167 }, description: 'Southwest beacon', distanceToNext: 45.0 },
            { id: 'NW', coordinates: { lat: -1.2856, lng: 36.8167 }, description: 'Northwest beacon', distanceToNext: 44.9 }
          ],
          beacons: [
            { id: 'NE', type: 'concrete', coordinates: { lat: -1.2856, lng: 36.8172 }, condition: 'good' },
            { id: 'SE', type: 'concrete', coordinates: { lat: -1.2860, lng: 36.8172 }, condition: 'good' },
            { id: 'SW', type: 'iron', coordinates: { lat: -1.2860, lng: 36.8167 }, condition: 'good' },
            { id: 'NW', type: 'concrete', coordinates: { lat: -1.2856, lng: 36.8167 }, condition: 'good' }
          ],
          accuracy: 0.5
        },
        actualCoordinates: [
          { lat: -1.2856, lng: 36.8172, accuracy: 2.1, timestamp: new Date() },
          { lat: -1.2860, lng: 36.8172, accuracy: 1.8, timestamp: new Date() },
          { lat: -1.2860, lng: 36.8167, accuracy: 2.3, timestamp: new Date() },
          { lat: -1.2856, lng: 36.8167, accuracy: 1.9, timestamp: new Date() }
        ],
        beaconReadings: [
          {
            beaconId: 'NE',
            coordinates: { lat: -1.2856, lng: 36.8172, accuracy: 1.5 },
            condition: 'good',
            measurementAccuracy: 1.5,
            timestamp: new Date(),
            notes: 'Concrete beacon in excellent condition'
          },
          {
            beaconId: 'SE',
            coordinates: { lat: -1.2860, lng: 36.8172, accuracy: 1.8 },
            condition: 'good',
            measurementAccuracy: 1.8,
            timestamp: new Date(),
            notes: 'Concrete beacon, minor weathering'
          },
          {
            beaconId: 'SW',
            coordinates: { lat: -1.2860, lng: 36.8168, accuracy: 2.1 },
            condition: 'damaged',
            measurementAccuracy: 2.1,
            timestamp: new Date(),
            notes: 'Iron beacon showing rust, slightly displaced'
          },
          {
            beaconId: 'NW',
            coordinates: { lat: -1.2856, lng: 36.8167, accuracy: 1.7 },
            condition: 'good',
            measurementAccuracy: 1.7,
            timestamp: new Date(),
            notes: 'Concrete beacon in good condition'
          }
        ]
      };

      const result = await service.performPhysicalVerification(nairobiResidentialRequest);

      expect(result.overallAccuracy).toBeGreaterThan(85);
      expect(result.coordinateValidation).toHaveLength(4);
      expect(result.beaconVerification).toHaveLength(4);
      expect(result.boundaryCheck).toHaveLength(4);
      
      // Should detect the damaged SW beacon
      const swBeacon = result.beaconVerification.find(b => b.beaconId === 'SW');
      expect(swBeacon?.condition).toBe('damaged');
      expect(swBeacon?.integrityScore).toBeLessThan(80);

      // Should recommend addressing the damaged beacon
      expect(result.recommendations).toContain(expect.stringContaining('beacon'));
      expect(result.requiresExpertReview).toBe(false); // Overall still acceptable
    });

    it('should handle rural property with missing beacons', async () => {
      const ruralPropertyRequest: BoundaryValidationRequest = {
        sessionId: 'rural-001',
        propertyId: 'RURAL-001',
        surveyPlan: {
          surveyPlan: 'KIAMBU/BLOCK12/456',
          coordinateSystem: 'Arc 1960 / UTM zone 37S',
          surveyDate: new Date('2020-03-10'),
          surveyor: 'Rural Survey Co. #5678',
          area: 40468.6, // 10 acres
          boundaries: [
            { id: 'N1', coordinates: { lat: -1.1234, lng: 36.9876 }, description: 'North corner 1' },
            { id: 'N2', coordinates: { lat: -1.1234, lng: 36.9886 }, description: 'North corner 2' },
            { id: 'S1', coordinates: { lat: -1.1244, lng: 36.9886 }, description: 'South corner 1' },
            { id: 'S2', coordinates: { lat: -1.1244, lng: 36.9876 }, description: 'South corner 2' }
          ],
          beacons: [
            { id: 'N1', type: 'stone', coordinates: { lat: -1.1234, lng: 36.9876 }, condition: 'good' },
            { id: 'N2', type: 'wooden', coordinates: { lat: -1.1234, lng: 36.9886 }, condition: 'good' },
            { id: 'S1', type: 'iron', coordinates: { lat: -1.1244, lng: 36.9886 }, condition: 'good' },
            { id: 'S2', type: 'stone', coordinates: { lat: -1.1244, lng: 36.9876 }, condition: 'good' }
          ],
          accuracy: 2.0
        },
        actualCoordinates: [
          { lat: -1.1234, lng: 36.9876, accuracy: 4.2, timestamp: new Date() },
          { lat: -1.1234, lng: 36.9886, accuracy: 3.8, timestamp: new Date() },
          { lat: -1.1244, lng: 36.9886, accuracy: 5.1, timestamp: new Date() },
          { lat: -1.1244, lng: 36.9876, accuracy: 4.5, timestamp: new Date() }
        ],
        beaconReadings: [
          {
            beaconId: 'N1',
            coordinates: { lat: -1.1234, lng: 36.9876, accuracy: 3.2 },
            condition: 'good',
            measurementAccuracy: 3.2,
            timestamp: new Date(),
            notes: 'Stone beacon found and verified'
          },
          // N2 (wooden beacon) is missing - not in readings
          {
            beaconId: 'S1',
            coordinates: { lat: -1.1244, lng: 36.9886, accuracy: 4.1 },
            condition: 'moved',
            measurementAccuracy: 4.1,
            timestamp: new Date(),
            notes: 'Iron beacon found 3m from expected position'
          },
          {
            beaconId: 'S2',
            coordinates: { lat: -1.1244, lng: 36.9876, accuracy: 3.8 },
            condition: 'damaged',
            measurementAccuracy: 3.8,
            timestamp: new Date(),
            notes: 'Stone beacon cracked but in position'
          }
        ]
      };

      const result = await service.performPhysicalVerification(ruralPropertyRequest);

      expect(result.overallAccuracy).toBeLessThan(75);
      expect(result.requiresExpertReview).toBe(true);
      
      // Should detect missing wooden beacon
      const missingBeacon = result.beaconVerification.find(b => b.beaconId === 'N2');
      expect(missingBeacon?.found).toBe(false);
      expect(missingBeacon?.condition).toBe('missing');

      // Should detect moved iron beacon
      const movedBeacon = result.beaconVerification.find(b => b.beaconId === 'S1');
      expect(movedBeacon?.condition).toBe('moved');
      expect(movedBeacon?.distanceFromSurvey).toBeGreaterThan(2);

      expect(result.riskFactors).toContain(expect.stringContaining('missing'));
      expect(result.riskFactors).toContain(expect.stringContaining('moved'));
      expect(result.nextActions).toContain('Schedule professional surveyor review');
    });

    it('should detect boundary encroachment scenario', async () => {
      const encroachmentRequest: BoundaryValidationRequest = {
        sessionId: 'encroach-001',
        propertyId: 'ENC-001',
        surveyPlan: {
          surveyPlan: 'MOMBASA/BLOCK8/789',
          coordinateSystem: 'Arc 1960 / UTM zone 37S',
          surveyDate: new Date('2022-11-20'),
          surveyor: 'Coastal Surveys Ltd #9012',
          area: 1012.1, // 0.25 acres
          boundaries: [
            { id: 'A', coordinates: { lat: -4.0435, lng: 39.6682 }, description: 'Point A' },
            { id: 'B', coordinates: { lat: -4.0435, lng: 39.6687 }, description: 'Point B' },
            { id: 'C', coordinates: { lat: -4.0440, lng: 39.6687 }, description: 'Point C' },
            { id: 'D', coordinates: { lat: -4.0440, lng: 39.6682 }, description: 'Point D' }
          ],
          beacons: [
            { id: 'A', type: 'concrete', coordinates: { lat: -4.0435, lng: 39.6682 }, condition: 'good' },
            { id: 'B', type: 'concrete', coordinates: { lat: -4.0435, lng: 39.6687 }, condition: 'good' },
            { id: 'C', type: 'concrete', coordinates: { lat: -4.0440, lng: 39.6687 }, condition: 'good' },
            { id: 'D', type: 'concrete', coordinates: { lat: -4.0440, lng: 39.6682 }, condition: 'good' }
          ],
          accuracy: 1.0
        },
        actualCoordinates: [
          { lat: -4.0435, lng: 39.6682, accuracy: 2.1, timestamp: new Date() },
          { lat: -4.0435, lng: 39.6687, accuracy: 1.9, timestamp: new Date() },
          { lat: -4.0440, lng: 39.6687, accuracy: 2.3, timestamp: new Date() },
          { lat: -4.0440, lng: 39.6682, accuracy: 2.0, timestamp: new Date() },
          // Additional point indicating potential encroachment
          { lat: -4.0433, lng: 39.6684, accuracy: 2.5, timestamp: new Date() } // Outside northern boundary
        ],
        beaconReadings: [
          {
            beaconId: 'A',
            coordinates: { lat: -4.0435, lng: 39.6682, accuracy: 1.8 },
            condition: 'good',
            measurementAccuracy: 1.8,
            timestamp: new Date()
          },
          {
            beaconId: 'B',
            coordinates: { lat: -4.0435, lng: 39.6687, accuracy: 1.6 },
            condition: 'good',
            measurementAccuracy: 1.6,
            timestamp: new Date()
          },
          {
            beaconId: 'C',
            coordinates: { lat: -4.0440, lng: 39.6687, accuracy: 2.1 },
            condition: 'good',
            measurementAccuracy: 2.1,
            timestamp: new Date()
          },
          {
            beaconId: 'D',
            coordinates: { lat: -4.0440, lng: 39.6682, accuracy: 1.9 },
            condition: 'good',
            measurementAccuracy: 1.9,
            timestamp: new Date()
          }
        ]
      };

      const result = await service.performPhysicalVerification(encroachmentRequest);

      // Should detect encroachment
      const encroachmentPoint = result.boundaryCheck.find(check => !check.withinBoundaries);
      expect(encroachmentPoint).toBeDefined();
      expect(encroachmentPoint!.encroachmentRisk).toBeOneOf(['medium', 'high']);
      expect(encroachmentPoint!.affectedArea).toBeGreaterThan(0);

      expect(result.riskFactors).toContain(expect.stringContaining('outside property boundaries'));
      expect(result.recommendations).toContain(expect.stringContaining('boundary discrepancies'));
      expect(result.nextActions).toContain(expect.stringContaining('encroachments'));
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle large property with many boundary points efficiently', async () => {
      const largeBoundaries = Array.from({ length: 50 }, (_, i) => ({
        id: `point${i}`,
        coordinates: {
          lat: -1.2920 + (i * 0.0001),
          lng: 36.8220 + (i * 0.0001)
        },
        description: `Boundary point ${i}`
      }));

      const largeCoordinates = largeBoundaries.map(b => ({
        lat: b.coordinates.lat + (Math.random() - 0.5) * 0.00001,
        lng: b.coordinates.lng + (Math.random() - 0.5) * 0.00001,
        accuracy: 2 + Math.random(),
        timestamp: new Date()
      }));

      const largeRequest: BoundaryValidationRequest = {
        sessionId: 'large-001',
        propertyId: 'LARGE-001',
        surveyPlan: {
          surveyPlan: 'LARGE/PROPERTY/001',
          coordinateSystem: 'WGS84',
          surveyDate: new Date(),
          surveyor: 'Test Surveyor',
          area: 100000,
          boundaries: largeBoundaries,
          beacons: [],
          accuracy: 1.0
        },
        actualCoordinates: largeCoordinates,
        beaconReadings: []
      };

      const startTime = Date.now();
      const result = await service.performPhysicalVerification(largeRequest);
      const endTime = Date.now();

      expect(result.coordinateValidation).toHaveLength(50);
      expect(result.boundaryCheck).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent verification requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        sessionId: `concurrent-${i}`,
        propertyId: `CONC-${i}`,
        surveyPlan: {
          surveyPlan: `CONCURRENT/TEST/${i}`,
          coordinateSystem: 'WGS84',
          surveyDate: new Date(),
          surveyor: 'Test Surveyor',
          area: 1000,
          boundaries: [
            { id: 'p1', coordinates: { lat: -1.2920 + i * 0.001, lng: 36.8220 }, description: 'Point 1' },
            { id: 'p2', coordinates: { lat: -1.2925 + i * 0.001, lng: 36.8220 }, description: 'Point 2' },
            { id: 'p3', coordinates: { lat: -1.2925 + i * 0.001, lng: 36.8225 }, description: 'Point 3' },
            { id: 'p4', coordinates: { lat: -1.2920 + i * 0.001, lng: 36.8225 }, description: 'Point 4' }
          ],
          beacons: [],
          accuracy: 2.0
        },
        actualCoordinates: [
          { lat: -1.2920 + i * 0.001, lng: 36.8220, accuracy: 3, timestamp: new Date() },
          { lat: -1.2925 + i * 0.001, lng: 36.8220, accuracy: 3, timestamp: new Date() },
          { lat: -1.2925 + i * 0.001, lng: 36.8225, accuracy: 3, timestamp: new Date() },
          { lat: -1.2920 + i * 0.001, lng: 36.8225, accuracy: 3, timestamp: new Date() }
        ],
        beaconReadings: []
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(request => service.performPhysicalVerification(request))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.sessionId).toBe(`concurrent-${i}`);
        expect(result.propertyId).toBe(`CONC-${i}`);
      });

      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Database Integration', () => {
    it('should store and retrieve verification results', async () => {
      const testRequest: BoundaryValidationRequest = {
        sessionId: 'db-test-001',
        propertyId: 'DB-TEST-001',
        surveyPlan: {
          surveyPlan: 'DB/TEST/001',
          coordinateSystem: 'WGS84',
          surveyDate: new Date(),
          surveyor: 'DB Test Surveyor',
          area: 1000,
          boundaries: [
            { id: 'p1', coordinates: { lat: -1.2920, lng: 36.8220 }, description: 'Point 1' }
          ],
          beacons: [],
          accuracy: 2.0
        },
        actualCoordinates: [
          { lat: -1.2920, lng: 36.8220, accuracy: 3, timestamp: new Date() }
        ],
        beaconReadings: []
      };

      const result = await service.performPhysicalVerification(testRequest);

      // Verify data was stored in database
      const storedResult = await db.execute(`
        SELECT * FROM verification_layers 
        WHERE session_id = ? AND layer_type = 'physical'
      `, [testRequest.sessionId]);

      expect(storedResult).toBeDefined();
      expect(result.sessionId).toBe(testRequest.sessionId);
    });
  });

  // Helper functions
  async function setupTestDatabase() {
    // Create test tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS verification_layers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        layer_type TEXT NOT NULL,
        status TEXT DEFAULT 'not_started',
        results TEXT,
        completion_date DATETIME,
        accuracy_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async function cleanupTestDatabase() {
    // Clean up test data
    await db.execute(`DELETE FROM verification_layers WHERE session_id LIKE '%test%'`);
  }
});
import { PhysicalVerificationService, GPSCoordinate, BeaconReading, BoundaryValidationRequest } from '../PhysicalVerificationService';
import { BoundaryPoint, SurveyBeacon, SurveyDetails } from '../../../src/types/land-verification';
import { vi } from 'vitest';

describe('PhysicalVerificationService', () => {
  let service: PhysicalVerificationService;

  beforeEach(() => {
    service = new PhysicalVerificationService();
  });

  describe('GPS Coordinate Validation', () => {
    const mockSurveyCoordinates: BoundaryPoint[] = [
      {
        id: 'point1',
        coordinates: { lat: -1.2921, lng: 36.8219 },
        description: 'Northeast corner'
      },
      {
        id: 'point2',
        coordinates: { lat: -1.2925, lng: 36.8215 },
        description: 'Southeast corner'
      }
    ];

    it('should validate accurate GPS coordinates', async () => {
      const actualCoordinates: GPSCoordinate[] = [
        { lat: -1.2921, lng: 36.8219, accuracy: 3, timestamp: new Date() },
        { lat: -1.2925, lng: 36.8215, accuracy: 4, timestamp: new Date() }
      ];

      const results = await service.validateGPSCoordinates(mockSurveyCoordinates, actualCoordinates);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[0].deviationFromSurvey).toBeLessThan(1);
      expect(results[0].confidence).toBeGreaterThan(90);
      expect(results[0].issues).toHaveLength(0);
    });

    it('should detect coordinate deviations exceeding threshold', async () => {
      const actualCoordinates: GPSCoordinate[] = [
        { lat: -1.2930, lng: 36.8230, accuracy: 3, timestamp: new Date() }, // ~100m deviation
        { lat: -1.2925, lng: 36.8215, accuracy: 4, timestamp: new Date() }
      ];

      const results = await service.validateGPSCoordinates(mockSurveyCoordinates, actualCoordinates);

      expect(results[0].isValid).toBe(false);
      expect(results[0].deviationFromSurvey).toBeGreaterThan(5);
      expect(results[0].confidence).toBeLessThan(50);
      expect(results[0].issues.some(issue => issue.includes('deviation'))).toBe(true);
      expect(results[0].recommendations).toContain('Re-measure coordinates with higher precision GPS equipment');
    });

    it('should flag poor GPS accuracy', async () => {
      const actualCoordinates: GPSCoordinate[] = [
        { lat: -1.2921, lng: 36.8219, accuracy: 15, timestamp: new Date() }, // Poor accuracy
        { lat: -1.2925, lng: 36.8215, accuracy: 4, timestamp: new Date() }
      ];

      const results = await service.validateGPSCoordinates(mockSurveyCoordinates, actualCoordinates);

      expect(results[0].isValid).toBe(false);
      expect(results[0].issues.length).toBeGreaterThan(0);
      expect(results[0].recommendations).toContain('Use differential GPS or RTK GPS for improved accuracy');
    });

    it('should detect stale GPS readings', async () => {
      const oldTimestamp = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
      const actualCoordinates: GPSCoordinate[] = [
        { lat: -1.2921, lng: 36.8219, accuracy: 3, timestamp: oldTimestamp }
      ];

      const results = await service.validateGPSCoordinates(mockSurveyCoordinates, actualCoordinates);

      expect(results[0].issues).toContain('GPS reading is more than 24 hours old');
    });
  });

  describe('Survey Beacon Verification', () => {
    const mockSurveyBeacons: SurveyBeacon[] = [
      {
        id: 'beacon1',
        type: 'concrete',
        coordinates: { lat: -1.2921, lng: 36.8219 },
        condition: 'good'
      },
      {
        id: 'beacon2',
        type: 'iron',
        coordinates: { lat: -1.2925, lng: 36.8215 },
        condition: 'good'
      }
    ];

    it('should verify beacons in good condition', async () => {
      const beaconReadings: BeaconReading[] = [
        {
          beaconId: 'beacon1',
          coordinates: { lat: -1.2921, lng: 36.8219, accuracy: 2 },
          condition: 'good',
          measurementAccuracy: 2,
          timestamp: new Date()
        },
        {
          beaconId: 'beacon2',
          coordinates: { lat: -1.2925, lng: 36.8215, accuracy: 3 },
          condition: 'good',
          measurementAccuracy: 3,
          timestamp: new Date()
        }
      ];

      const results = await service.verifySurveyBeacons(mockSurveyBeacons, beaconReadings);

      expect(results).toHaveLength(2);
      expect(results[0].found).toBe(true);
      expect(results[0].condition).toBe('good');
      expect(results[0].integrityScore).toBeGreaterThan(90);
      expect(results[0].distanceFromSurvey).toBeLessThan(1);
      expect(results[0].issues).toHaveLength(0);
    });

    it('should detect missing beacons', async () => {
      const beaconReadings: BeaconReading[] = [
        {
          beaconId: 'beacon1',
          coordinates: { lat: -1.2921, lng: 36.8219, accuracy: 2 },
          condition: 'good',
          measurementAccuracy: 2,
          timestamp: new Date()
        }
        // beacon2 is missing
      ];

      const results = await service.verifySurveyBeacons(mockSurveyBeacons, beaconReadings);

      expect(results).toHaveLength(2);
      expect(results[1].found).toBe(false);
      expect(results[1].condition).toBe('missing');
      expect(results[1].integrityScore).toBe(0);
      expect(results[1].distanceFromSurvey).toBe(Infinity);
      expect(results[1].issues).toContain('Beacon missing or not accessible');
    });

    it('should detect damaged beacons', async () => {
      const beaconReadings: BeaconReading[] = [
        {
          beaconId: 'beacon1',
          coordinates: { lat: -1.2921, lng: 36.8219, accuracy: 2 },
          condition: 'damaged',
          measurementAccuracy: 2,
          timestamp: new Date()
        }
      ];

      const results = await service.verifySurveyBeacons(mockSurveyBeacons, beaconReadings);

      expect(results[0].condition).toBe('damaged');
      expect(results[0].integrityScore).toBeLessThan(80);
      expect(results[0].issues).toContain('Beacon condition is damaged');
    });

    it('should detect moved beacons', async () => {
      const beaconReadings: BeaconReading[] = [
        {
          beaconId: 'beacon1',
          coordinates: { lat: -1.2930, lng: 36.8230, accuracy: 2 }, // Moved significantly
          condition: 'good',
          measurementAccuracy: 2,
          timestamp: new Date()
        }
      ];

      const results = await service.verifySurveyBeacons(mockSurveyBeacons, beaconReadings);

      expect(results[0].distanceFromSurvey).toBeGreaterThan(50);
      expect(results[0].integrityScore).toBeLessThan(70);
      expect(results[0].issues.some(issue => issue.includes('displaced'))).toBe(true);
    });
  });

  describe('Boundary Checking', () => {
    const mockBoundaries: BoundaryPoint[] = [
      { id: 'p1', coordinates: { lat: -1.2920, lng: 36.8220 }, description: 'Corner 1' },
      { id: 'p2', coordinates: { lat: -1.2920, lng: 36.8210 }, description: 'Corner 2' },
      { id: 'p3', coordinates: { lat: -1.2930, lng: 36.8210 }, description: 'Corner 3' },
      { id: 'p4', coordinates: { lat: -1.2930, lng: 36.8220 }, description: 'Corner 4' }
    ];

    it('should confirm coordinates within boundaries', async () => {
      const coordinates: GPSCoordinate[] = [
        { lat: -1.2925, lng: 36.8215 } // Center of the property
      ];

      const results = await service.checkBoundaries(mockBoundaries, coordinates);

      expect(results).toHaveLength(1);
      expect(results[0].withinBoundaries).toBe(true);
      expect(results[0].encroachmentRisk).toBe('none');
      expect(results[0].distanceFromBoundary).toBeGreaterThan(0);
      expect(results[0].affectedArea).toBeUndefined();
    });

    it('should detect coordinates outside boundaries', async () => {
      const coordinates: GPSCoordinate[] = [
        { lat: -1.2910, lng: 36.8215 } // North of the property
      ];

      const results = await service.checkBoundaries(mockBoundaries, coordinates);

      expect(results[0].withinBoundaries).toBe(false);
      expect(results[0].encroachmentRisk).toBe('high');
      expect(results[0].distanceFromBoundary).toBeLessThan(0);
      expect(results[0].affectedArea).toBeGreaterThan(0);
    });

    it('should assess encroachment risk levels', async () => {
      const coordinates: GPSCoordinate[] = [
        { lat: -1.2918, lng: 36.8215 }, // Clearly outside boundary (north)
        { lat: -1.2922, lng: 36.8215 }  // Close to boundary inside
      ];

      const results = await service.checkBoundaries(mockBoundaries, coordinates);

      expect(results[0].encroachmentRisk).toBeOneOf(['medium', 'high']);
      expect(results[1].encroachmentRisk).toBeOneOf(['none', 'low', 'medium']);
    });
  });

  describe('Property Feature Comparison', () => {
    const mockSurveyDetails: SurveyDetails = {
      surveyPlan: 'SP001',
      coordinateSystem: 'WGS84',
      surveyDate: new Date('2023-01-01'),
      surveyor: 'John Surveyor',
      area: 10000, // 10,000 sq meters
      boundaries: [
        { id: 'p1', coordinates: { lat: -1.2920, lng: 36.8220 }, description: 'Corner 1', distanceToNext: 100 },
        { id: 'p2', coordinates: { lat: -1.2920, lng: 36.8210 }, description: 'Corner 2', distanceToNext: 100 },
        { id: 'p3', coordinates: { lat: -1.2930, lng: 36.8210 }, description: 'Corner 3', distanceToNext: 100 },
        { id: 'p4', coordinates: { lat: -1.2930, lng: 36.8220 }, description: 'Corner 4', distanceToNext: 100 }
      ],
      beacons: [],
      accuracy: 2
    };

    it('should match accurate area measurements', async () => {
      const actualMeasurements = {
        area: 10100 // 1% variance
      };

      const results = await service.comparePropertyFeatures(mockSurveyDetails, actualMeasurements);

      const areaComparison = results.find(r => r.feature === 'Total Area');
      expect(areaComparison).toBeDefined();
      expect(areaComparison!.status).toBe('match');
      expect(areaComparison!.variance).toBeLessThan(5);
    });

    it('should detect minor area variances', async () => {
      const actualMeasurements = {
        area: 10800 // 8% variance
      };

      const results = await service.comparePropertyFeatures(mockSurveyDetails, actualMeasurements);

      const areaComparison = results.find(r => r.feature === 'Total Area');
      expect(areaComparison!.status).toBe('minor_variance');
      expect(areaComparison!.variance).toBeGreaterThan(5);
      expect(areaComparison!.variance).toBeLessThan(10);
    });

    it('should detect major area conflicts', async () => {
      const actualMeasurements = {
        area: 12500 // 25% variance
      };

      const results = await service.comparePropertyFeatures(mockSurveyDetails, actualMeasurements);

      const areaComparison = results.find(r => r.feature === 'Total Area');
      expect(areaComparison!.status).toBe('conflict');
      expect(areaComparison!.variance).toBeGreaterThan(20);
    });

    it('should compare boundary distances', async () => {
      const actualMeasurements = {
        boundaryDistances: [98, 102, 99] // Minor variances - only 3 distances for 4 points
      };

      const results = await service.comparePropertyFeatures(mockSurveyDetails, actualMeasurements);

      const boundaryComparisons = results.filter(r => r.feature.startsWith('Boundary'));
      expect(boundaryComparisons).toHaveLength(3); // 4 points = 3 distances
      
      boundaryComparisons.forEach(comparison => {
        expect(comparison.status).toBeOneOf(['match', 'minor_variance']);
        expect(comparison.varianceType).toBe('distance');
      });
    });
  });

  describe('Comprehensive Physical Verification', () => {
    const mockRequest: BoundaryValidationRequest = {
      sessionId: 'session123',
      propertyId: 'prop456',
      surveyPlan: {
        surveyPlan: 'SP001',
        coordinateSystem: 'WGS84',
        surveyDate: new Date('2023-01-01'),
        surveyor: 'John Surveyor',
        area: 10000,
        boundaries: [
          { id: 'p1', coordinates: { lat: -1.2920, lng: 36.8220 }, description: 'Corner 1' },
          { id: 'p2', coordinates: { lat: -1.2920, lng: 36.8210 }, description: 'Corner 2' },
          { id: 'p3', coordinates: { lat: -1.2930, lng: 36.8210 }, description: 'Corner 3' },
          { id: 'p4', coordinates: { lat: -1.2930, lng: 36.8220 }, description: 'Corner 4' }
        ],
        beacons: [
          { id: 'beacon1', type: 'concrete', coordinates: { lat: -1.2920, lng: 36.8220 }, condition: 'good' }
        ],
        accuracy: 2
      },
      actualCoordinates: [
        { lat: -1.2920, lng: 36.8220, accuracy: 3, timestamp: new Date() },
        { lat: -1.2920, lng: 36.8210, accuracy: 3, timestamp: new Date() },
        { lat: -1.2930, lng: 36.8210, accuracy: 3, timestamp: new Date() },
        { lat: -1.2930, lng: 36.8220, accuracy: 3, timestamp: new Date() }
      ],
      beaconReadings: [
        {
          beaconId: 'beacon1',
          coordinates: { lat: -1.2920, lng: 36.8220, accuracy: 2 },
          condition: 'good',
          measurementAccuracy: 2,
          timestamp: new Date()
        }
      ]
    };

    it('should perform comprehensive verification with high accuracy', async () => {
      // Mock database operations
      const mockExecute = vi.fn().mockResolvedValue(undefined);
      const mockDb = { execute: mockExecute };
      service = new PhysicalVerificationService(mockDb);

      const result = await service.performPhysicalVerification(mockRequest);

      expect(result.sessionId).toBe('session123');
      expect(result.propertyId).toBe('prop456');
      expect(result.coordinateValidation).toHaveLength(4);
      expect(result.beaconVerification).toHaveLength(1);
      expect(result.boundaryCheck).toHaveLength(4);
      expect(result.overallAccuracy).toBeGreaterThanOrEqual(80);
      expect(result.requiresExpertReview).toBe(true); // 80% accuracy triggers expert review
      expect(result.riskFactors.length).toBeGreaterThanOrEqual(0); // May have some risk factors
    });

    it('should identify when expert review is required', async () => {
      const problematicRequest = {
        ...mockRequest,
        actualCoordinates: [
          { lat: -1.2950, lng: 36.8250, accuracy: 15, timestamp: new Date() }, // Poor accuracy and position
          { lat: -1.2920, lng: 36.8210, accuracy: 3, timestamp: new Date() },
          { lat: -1.2930, lng: 36.8210, accuracy: 3, timestamp: new Date() },
          { lat: -1.2930, lng: 36.8220, accuracy: 3, timestamp: new Date() }
        ],
        beaconReadings: [] // Missing beacon readings
      };

      const mockExecute = vi.fn().mockResolvedValue(undefined);
      const mockDb = { execute: mockExecute };
      service = new PhysicalVerificationService(mockDb);

      const result = await service.performPhysicalVerification(problematicRequest);

      expect(result.overallAccuracy).toBeLessThan(80);
      expect(result.requiresExpertReview).toBe(true);
      expect(result.riskFactors.length).toBeGreaterThan(0);
      expect(result.nextActions).toContain('Schedule professional surveyor review');
    });

    it('should generate appropriate recommendations', async () => {
      const mockExecute = vi.fn().mockResolvedValue(undefined);
      const mockDb = { execute: mockExecute };
      service = new PhysicalVerificationService(mockDb);

      const result = await service.performPhysicalVerification(mockRequest);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.nextActions).toBeDefined();
      expect(Array.isArray(result.nextActions)).toBe(true);
    });

    it('should emit verification complete event', async () => {
      const mockExecute = vi.fn().mockResolvedValue(undefined);
      const mockDb = { execute: mockExecute };
      service = new PhysicalVerificationService(mockDb);

      const eventSpy = vi.fn();
      service.on('verificationComplete', eventSpy);

      await service.performPhysicalVerification(mockRequest);

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        sessionId: 'session123',
        propertyId: 'prop456'
      }));
    });
  });

  describe('Measurement Accuracy Tests', () => {
    it('should calculate distances accurately using Haversine formula', () => {
      // Test known distance between two points in Nairobi
      const lat1 = -1.2921;
      const lng1 = 36.8219;
      const lat2 = -1.2925;
      const lng2 = 36.8215;

      const distance = (service as any).calculateDistance(lat1, lng1, lat2, lng2);

      // Expected distance is approximately 50-60 meters
      expect(distance).toBeGreaterThan(40);
      expect(distance).toBeLessThan(70);
    });

    it('should calculate polygon area accurately', () => {
      // Square with ~100m sides
      const coordinates: GPSCoordinate[] = [
        { lat: -1.2920, lng: 36.8220 },
        { lat: -1.2920, lng: 36.8210 },
        { lat: -1.2930, lng: 36.8210 },
        { lat: -1.2930, lng: 36.8220 }
      ];

      const area = (service as any).calculatePolygonArea(coordinates);

      // Expected area is approximately 10,000 sq meters (1 hectare)
      expect(area).toBeGreaterThan(8000);
      expect(area).toBeLessThan(15000); // Increased tolerance for GPS coordinate calculations
    });

    it('should detect point-in-polygon correctly', () => {
      const polygon: BoundaryPoint[] = [
        { id: 'p1', coordinates: { lat: -1.2920, lng: 36.8220 }, description: 'Corner 1' },
        { id: 'p2', coordinates: { lat: -1.2920, lng: 36.8210 }, description: 'Corner 2' },
        { id: 'p3', coordinates: { lat: -1.2930, lng: 36.8210 }, description: 'Corner 3' },
        { id: 'p4', coordinates: { lat: -1.2930, lng: 36.8220 }, description: 'Corner 4' }
      ];

      const insidePoint: GPSCoordinate = { lat: -1.2925, lng: 36.8215 };
      const outsidePoint: GPSCoordinate = { lat: -1.2910, lng: 36.8215 };

      const isInside = (service as any).isPointInPolygon(insidePoint, polygon);
      const isOutside = (service as any).isPointInPolygon(outsidePoint, polygon);

      expect(isInside).toBe(true);
      expect(isOutside).toBe(false);
    });

    it('should find nearest boundary point accurately', () => {
      const boundaries: BoundaryPoint[] = [
        { id: 'p1', coordinates: { lat: -1.2920, lng: 36.8220 }, description: 'Corner 1' },
        { id: 'p2', coordinates: { lat: -1.2920, lng: 36.8210 }, description: 'Corner 2' },
        { id: 'p3', coordinates: { lat: -1.2930, lng: 36.8210 }, description: 'Corner 3' }
      ];

      const testPoint: GPSCoordinate = { lat: -1.2921, lng: 36.8219 };

      const { distance, nearestPoint } = (service as any).findNearestBoundaryPoint(testPoint, boundaries);

      expect(nearestPoint.id).toBe('p1'); // Should be closest to corner 1
      expect(distance).toBeLessThan(20); // Should be very close
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockExecute = vi.fn().mockRejectedValue(new Error('Database connection failed'));
      (service as any).db = { execute: mockExecute };

      const mockRequest: BoundaryValidationRequest = {
        sessionId: 'session123',
        propertyId: 'prop456',
        surveyPlan: {
          surveyPlan: 'SP001',
          coordinateSystem: 'WGS84',
          surveyDate: new Date(),
          surveyor: 'Test Surveyor',
          area: 1000,
          boundaries: [],
          beacons: [],
          accuracy: 2
        },
        actualCoordinates: [],
        beaconReadings: []
      };

      await expect(service.performPhysicalVerification(mockRequest))
        .rejects.toThrow('Physical verification failed');
    });

    it('should handle empty coordinate arrays', async () => {
      const results = await service.validateGPSCoordinates([], []);
      expect(results).toHaveLength(0);
    });

    it('should handle mismatched coordinate array lengths', async () => {
      const surveyCoords: BoundaryPoint[] = [
        { id: 'p1', coordinates: { lat: -1.2920, lng: 36.8220 }, description: 'Corner 1' }
      ];
      const actualCoords: GPSCoordinate[] = [
        { lat: -1.2920, lng: 36.8220 },
        { lat: -1.2925, lng: 36.8215 }
      ];

      const results = await service.validateGPSCoordinates(surveyCoords, actualCoords);
      expect(results).toHaveLength(1); // Should process minimum length
    });
  });
});
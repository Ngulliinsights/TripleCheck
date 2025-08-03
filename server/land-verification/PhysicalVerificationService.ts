import { EventEmitter } from "events";

import {
  BoundaryPoint,
  SurveyBeacon,
  SurveyDetails,
  LayerExecutionResult,
} from "../../src/types/land-verification";
import { db } from "../infrastructure/database/connection";
import { logger } from "../infrastructure/monitoring/logger";

import * as gpsUtils from "./utils/gps-calculations";

export interface GPSCoordinate {
  lat: number;
  lng: number;
  altitude?: number;
  accuracy?: number; // in meters
  timestamp?: Date;
}

export interface BoundaryValidationRequest {
  sessionId: string;
  propertyId: string;
  surveyPlan: SurveyDetails;
  actualCoordinates: GPSCoordinate[];
  beaconReadings: BeaconReading[];
}

export interface BeaconReading {
  beaconId: string;
  coordinates: GPSCoordinate;
  condition: "good" | "damaged" | "missing" | "moved";
  measurementAccuracy: number;
  timestamp: Date;
  notes?: string;
}

export interface CoordinateValidationResult {
  isValid: boolean;
  accuracy: number;
  deviationFromSurvey: number; // in meters
  confidence: number; // 0-100
  issues: string[];
  recommendations: string[];
}

export interface BoundaryCheckResult {
  withinBoundaries: boolean;
  distanceFromBoundary: number; // in meters, negative if outside
  nearestBoundaryPoint: BoundaryPoint;
  encroachmentRisk: "none" | "low" | "medium" | "high";
  affectedArea?: number; // square meters if encroachment detected
}

export interface PropertyFeatureComparison {
  feature: string;
  surveyValue: number;
  actualValue: number;
  variance: number;
  varianceType: "area" | "distance" | "angle" | "elevation";
  acceptableRange: { min: number; max: number };
  status: "match" | "minor_variance" | "major_variance" | "conflict";
}

export interface PhysicalVerificationResult {
  sessionId: string;
  propertyId: string;
  verificationDate: Date;
  coordinateValidation: CoordinateValidationResult[];
  beaconVerification: BeaconVerificationResult[];
  boundaryCheck: BoundaryCheckResult[];
  featureComparison: PropertyFeatureComparison[];
  overallAccuracy: number;
  riskFactors: string[];
  recommendations: string[];
  requiresExpertReview: boolean;
  nextActions: string[];
}

export interface BeaconVerificationResult {
  beaconId: string;
  found: boolean;
  condition: "good" | "damaged" | "missing" | "moved";
  coordinateAccuracy: CoordinateValidationResult;
  distanceFromSurvey: number;
  integrityScore: number; // 0-100
  issues: string[];
}

export class PhysicalVerificationService extends EventEmitter {
  private readonly COORDINATE_ACCURACY_THRESHOLD = 5; // meters
  private readonly BOUNDARY_TOLERANCE = 2; // meters
  private readonly BEACON_TOLERANCE = 1; // meters
  private readonly MIN_GPS_ACCURACY = 10; // meters
  private db: any;

  constructor(database?: unknown) {
    super();
    this.db = database || db;
  }

  /**
   * Validates GPS coordinates against survey plan
   */
  async validateGPSCoordinates(
    surveyCoordinates: BoundaryPoint[],
    actualCoordinates: GPSCoordinate[]
  ): Promise<CoordinateValidationResult[]> {
    const results: CoordinateValidationResult[] = [];

    for (
      let i = 0;
      i < Math.min(surveyCoordinates.length, actualCoordinates.length);
      i++
    ) {
      const survey = surveyCoordinates[i];
      const actual = actualCoordinates[i];

      const deviation = this.calculateDistance(
        survey.coordinates.lat,
        survey.coordinates.lng,
        actual.lat,
        actual.lng
      );

      const accuracy = actual.accuracy || this.MIN_GPS_ACCURACY;
      const isValid =
        deviation <= this.COORDINATE_ACCURACY_THRESHOLD &&
        accuracy <= this.MIN_GPS_ACCURACY;

      const confidence = this.calculateCoordinateConfidence(
        deviation,
        accuracy
      );
      const issues = this.identifyCoordinateIssues(deviation, accuracy, actual);
      const recommendations = this.generateCoordinateRecommendations(
        deviation,
        accuracy,
        isValid
      );

      results.push({
        isValid,
        accuracy,
        deviationFromSurvey: deviation,
        confidence,
        issues,
        recommendations,
      });
    }

    return results;
  }

  /**
   * Verifies survey beacons against actual field readings
   */
  async verifySurveyBeacons(
    surveyBeacons: SurveyBeacon[],
    beaconReadings: BeaconReading[]
  ): Promise<BeaconVerificationResult[]> {
    const results: BeaconVerificationResult[] = [];

    for (const surveyBeacon of surveyBeacons) {
      const reading = beaconReadings.find(
        (r) => r.beaconId === surveyBeacon.id
      );

      if (!reading) {
        results.push({
          beaconId: surveyBeacon.id,
          found: false,
          condition: "missing",
          coordinateAccuracy: {
            isValid: false,
            accuracy: 0,
            deviationFromSurvey: Infinity,
            confidence: 0,
            issues: ["Beacon not found during field verification"],
            recommendations: [
              "Conduct thorough search of beacon area",
              "Consider beacon replacement",
            ],
          },
          distanceFromSurvey: Infinity,
          integrityScore: 0,
          issues: ["Beacon missing or not accessible"],
        });
        continue;
      }

      const distance = this.calculateDistance(
        surveyBeacon.coordinates.lat,
        surveyBeacon.coordinates.lng,
        reading.coordinates.lat,
        reading.coordinates.lng
      );

      const coordinateAccuracy = await this.validateGPSCoordinates(
        [
          {
            id: surveyBeacon.id,
            coordinates: surveyBeacon.coordinates,
            description: "Survey beacon",
          },
        ],
        [reading.coordinates]
      );

      const integrityScore = this.calculateBeaconIntegrity(reading, distance);
      const issues = this.identifyBeaconIssues(reading, distance);

      results.push({
        beaconId: surveyBeacon.id,
        found: true,
        condition: reading.condition,
        coordinateAccuracy: coordinateAccuracy[0],
        distanceFromSurvey: distance,
        integrityScore,
        issues,
      });
    }

    return results;
  }

  /**
   * Checks if coordinates are within property boundaries
   */
  async checkBoundaries(
    boundaries: BoundaryPoint[],
    coordinates: GPSCoordinate[]
  ): Promise<BoundaryCheckResult[]> {
    const results: BoundaryCheckResult[] = [];

    for (const coord of coordinates) {
      const withinBoundaries = this.isPointInPolygon(coord, boundaries);
      const { distance, nearestPoint } = this.findNearestBoundaryPoint(
        coord,
        boundaries
      );

      const encroachmentRisk = this.assessEncroachmentRisk(
        distance,
        withinBoundaries
      );
      const affectedArea =
        !withinBoundaries ?
          this.calculateEncroachmentArea(coord, boundaries)
        : undefined;

      results.push({
        withinBoundaries,
        distanceFromBoundary: withinBoundaries ? distance : -distance,
        nearestBoundaryPoint: nearestPoint,
        encroachmentRisk,
        affectedArea,
      });
    }

    return results;
  }

  /**
   * Compares property features between survey and actual measurements
   */
  async comparePropertyFeatures(
    surveyDetails: SurveyDetails,
    actualMeasurements: Record<string, number | number[]>
  ): Promise<PropertyFeatureComparison[]> {
    const comparisons: PropertyFeatureComparison[] = [];

    // Compare area
    if (typeof actualMeasurements.area === 'number') {
      const actualArea = actualMeasurements.area;
      const areaVariance = Math.abs(surveyDetails.area - actualArea);
      const areaVariancePercent = (areaVariance / surveyDetails.area) * 100;

      comparisons.push({
        feature: "Total Area",
        surveyValue: surveyDetails.area,
        actualValue: actualArea,
        variance: areaVariancePercent,
        varianceType: "area",
        acceptableRange: { min: -5, max: 5 }, // 5% tolerance
        status:
          areaVariancePercent <= 5 ? "match"
          : areaVariancePercent <= 10 ? "minor_variance"
          : areaVariancePercent <= 20 ? "major_variance"
          : "conflict",
      });
    }

    // Compare boundary distances
    if (Array.isArray(actualMeasurements.boundaryDistances) && surveyDetails.boundaries) {
      const {boundaryDistances} = actualMeasurements;
      for (let i = 0; i < surveyDetails.boundaries.length - 1; i++) {
        const surveyDistance = surveyDetails.boundaries[i].distanceToNext || 0;
        const actualDistance = boundaryDistances[i] || 0;

        if (surveyDistance > 0 && actualDistance > 0) {
          const distanceVariance = Math.abs(surveyDistance - actualDistance);
          const distanceVariancePercent =
            (distanceVariance / surveyDistance) * 100;

          comparisons.push({
            feature: `Boundary ${i + 1} to ${i + 2}`,
            surveyValue: surveyDistance,
            actualValue: actualDistance,
            variance: distanceVariancePercent,
            varianceType: "distance",
            acceptableRange: { min: -3, max: 3 }, // 3% tolerance
            status:
              distanceVariancePercent <= 3 ? "match"
              : distanceVariancePercent <= 7 ? "minor_variance"
              : distanceVariancePercent <= 15 ? "major_variance"
              : "conflict",
          });
        }
      }
    }

    return comparisons;
  }

  /**
   * Performs comprehensive physical verification
   */
  async performPhysicalVerification(
    request: BoundaryValidationRequest
  ): Promise<PhysicalVerificationResult> {
    try {
      logger.info(
        `Starting physical verification for property ${request.propertyId}`
      );

      const coordinateValidation = await this.validateGPSCoordinates(
        request.surveyPlan.boundaries,
        request.actualCoordinates
      );

      const beaconVerification = await this.verifySurveyBeacons(
        request.surveyPlan.beacons,
        request.beaconReadings
      );

      const boundaryCheck = await this.checkBoundaries(
        request.surveyPlan.boundaries,
        request.actualCoordinates
      );

      const featureComparison = await this.comparePropertyFeatures(
        request.surveyPlan,
        { area: this.calculatePolygonArea(request.actualCoordinates) }
      );

      const overallAccuracy = this.calculateOverallAccuracy(
        coordinateValidation,
        beaconVerification,
        boundaryCheck,
        featureComparison
      );

      const riskFactors = this.identifyRiskFactors(
        coordinateValidation,
        beaconVerification,
        boundaryCheck,
        featureComparison
      );

      const recommendations = this.generateRecommendations(
        coordinateValidation,
        beaconVerification,
        boundaryCheck,
        featureComparison,
        overallAccuracy
      );

      const requiresExpertReview = this.determineExpertReviewRequirement(
        overallAccuracy,
        riskFactors,
        featureComparison
      );

      const nextActions = this.generateNextActions(
        coordinateValidation,
        beaconVerification,
        boundaryCheck,
        requiresExpertReview
      );

      const result: PhysicalVerificationResult = {
        sessionId: request.sessionId,
        propertyId: request.propertyId,
        verificationDate: new Date(),
        coordinateValidation,
        beaconVerification,
        boundaryCheck,
        featureComparison,
        overallAccuracy,
        riskFactors,
        recommendations,
        requiresExpertReview,
        nextActions,
      };

      // Store results in database
      await this.storeVerificationResults(result);

      // Emit completion event
      this.emit("verificationComplete", result);

      logger.info(
        `Physical verification completed for property ${request.propertyId} with accuracy ${overallAccuracy}%`
      );

      return result;
    } catch (error) {
      logger.error("Physical verification failed:", error);
      throw new Error(`Physical verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculates distance between two GPS coordinates using utility functions
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    return gpsUtils.calculateDistance(
      { lat: lat1, lng: lng1 },
      { lat: lat2, lng: lng2 }
    );
  }



  /**
   * Calculates confidence score for coordinate validation
   */
  private calculateCoordinateConfidence(
    deviation: number,
    accuracy: number
  ): number {
    const deviationScore = Math.max(
      0,
      100 - (deviation / this.COORDINATE_ACCURACY_THRESHOLD) * 50
    );
    const accuracyScore = Math.max(
      0,
      100 - (accuracy / this.MIN_GPS_ACCURACY) * 50
    );
    return Math.round((deviationScore + accuracyScore) / 2);
  }

  /**
   * Identifies issues with GPS coordinates
   */
  private identifyCoordinateIssues(
    deviation: number,
    accuracy: number,
    coordinate: GPSCoordinate
  ): string[] {
    const issues: string[] = [];

    if (deviation > this.COORDINATE_ACCURACY_THRESHOLD) {
      issues.push(
        `Coordinate deviation of ${deviation.toFixed(2)}m exceeds threshold`
      );
    }

    if (accuracy > this.MIN_GPS_ACCURACY) {
      issues.push(
        `GPS accuracy of ${accuracy.toFixed(2)}m is below minimum standard`
      );
    }

    if (
      !coordinate.timestamp ||
      Date.now() - coordinate.timestamp.getTime() > 24 * 60 * 60 * 1000
    ) {
      issues.push("GPS reading is more than 24 hours old");
    }

    return issues;
  }

  /**
   * Generates recommendations for coordinate validation
   */
  private generateCoordinateRecommendations(
    deviation: number,
    accuracy: number,
    isValid: boolean
  ): string[] {
    const recommendations: string[] = [];

    if (!isValid) {
      recommendations.push(
        "Re-measure coordinates with higher precision GPS equipment"
      );
    }

    if (deviation > this.COORDINATE_ACCURACY_THRESHOLD) {
      recommendations.push(
        "Verify survey markers and re-establish boundary points"
      );
    }

    if (accuracy > this.MIN_GPS_ACCURACY) {
      recommendations.push(
        "Use differential GPS or RTK GPS for improved accuracy"
      );
      recommendations.push("Take multiple readings and average the results");
    }

    return recommendations;
  }

  /**
   * Calculates beacon integrity score
   */
  private calculateBeaconIntegrity(
    reading: BeaconReading,
    distance: number
  ): number {
    let score = 100;

    // Deduct points for condition
    switch (reading.condition) {
      case "damaged":
        score -= 30;
        break;
      case "moved":
        score -= 50;
        break;
      case "missing":
        score = 0;
        break;
    }

    // Deduct points for distance from survey position
    if (distance > this.BEACON_TOLERANCE) {
      score -= Math.min(40, (distance / this.BEACON_TOLERANCE) * 20);
    }

    // Deduct points for measurement accuracy
    if (reading.measurementAccuracy > this.MIN_GPS_ACCURACY) {
      score -= Math.min(
        20,
        (reading.measurementAccuracy / this.MIN_GPS_ACCURACY) * 10
      );
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Identifies issues with beacon readings
   */
  private identifyBeaconIssues(
    reading: BeaconReading,
    distance: number
  ): string[] {
    const issues: string[] = [];

    if (reading.condition !== "good") {
      issues.push(`Beacon condition is ${reading.condition}`);
    }

    if (distance > this.BEACON_TOLERANCE) {
      issues.push(
        `Beacon displaced by ${distance.toFixed(2)}m from survey position`
      );
    }

    if (reading.measurementAccuracy > this.MIN_GPS_ACCURACY) {
      issues.push(
        `Measurement accuracy of ${reading.measurementAccuracy.toFixed(2)}m is below standard`
      );
    }

    return issues;
  }

  /**
   * Checks if a point is inside a polygon using ray casting algorithm
   */
  private isPointInPolygon(
    point: GPSCoordinate,
    polygon: BoundaryPoint[]
  ): boolean {
    let inside = false;
    const x = point.lng;
    const y = point.lat;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].coordinates.lng;
      const yi = polygon[i].coordinates.lat;
      const xj = polygon[j].coordinates.lng;
      const yj = polygon[j].coordinates.lat;

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Finds the nearest boundary point to a coordinate
   */
  private findNearestBoundaryPoint(
    coord: GPSCoordinate,
    boundaries: BoundaryPoint[]
  ): { distance: number; nearestPoint: BoundaryPoint } {
    let minDistance = Infinity;
    let nearestPoint = boundaries[0];

    for (const boundary of boundaries) {
      const distance = this.calculateDistance(
        coord.lat,
        coord.lng,
        boundary.coordinates.lat,
        boundary.coordinates.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = boundary;
      }
    }

    return { distance: minDistance, nearestPoint };
  }

  /**
   * Assesses encroachment risk based on distance from boundary
   */
  private assessEncroachmentRisk(
    distance: number,
    withinBoundaries: boolean
  ): "none" | "low" | "medium" | "high" {
    if (withinBoundaries && distance > this.BOUNDARY_TOLERANCE * 2) {
      return "none";
    }

    if (withinBoundaries && distance > this.BOUNDARY_TOLERANCE) {
      return "low";
    }

    if (!withinBoundaries && distance <= this.BOUNDARY_TOLERANCE) {
      return "medium";
    }

    return "high";
  }

  /**
   * Calculates encroachment area (simplified estimation)
   */
  private calculateEncroachmentArea(
    coord: GPSCoordinate,
    boundaries: BoundaryPoint[]
  ): number {
    // Simplified calculation - in practice, this would be more complex
    const { distance } = this.findNearestBoundaryPoint(coord, boundaries);
    return Math.PI * Math.pow(distance, 2); // Circular approximation
  }

  /**
   * Calculates polygon area using shoelace formula
   */
  private calculatePolygonArea(coordinates: GPSCoordinate[]): number {
    if (coordinates.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      area += coordinates[i].lng * coordinates[j].lat;
      area -= coordinates[j].lng * coordinates[i].lat;
    }

    // Convert to square meters (approximate)
    const earthRadius = 6371000;
    return (Math.abs(area) * Math.pow((earthRadius * Math.PI) / 180, 2)) / 2;
  }

  /**
   * Calculates overall accuracy score
   */
  private calculateOverallAccuracy(
    coordinateValidation: CoordinateValidationResult[],
    beaconVerification: BeaconVerificationResult[],
    boundaryCheck: BoundaryCheckResult[],
    featureComparison: PropertyFeatureComparison[]
  ): number {
    const coordScore =
      coordinateValidation.reduce((sum, result) => sum + result.confidence, 0) /
        coordinateValidation.length || 0;
    const beaconScore =
      beaconVerification.reduce(
        (sum, result) => sum + result.integrityScore,
        0
      ) / beaconVerification.length || 0;
    const boundaryScore =
      (boundaryCheck.filter((result) => result.withinBoundaries).length /
        boundaryCheck.length) *
        100 || 0;
    const featureScore =
      (featureComparison.filter(
        (comp) => comp.status === "match" || comp.status === "minor_variance"
      ).length /
        featureComparison.length) *
        100 || 100;

    return Math.round(
      (coordScore + beaconScore + boundaryScore + featureScore) / 4
    );
  }

  /**
   * Identifies risk factors from verification results
   */
  private identifyRiskFactors(
    coordinateValidation: CoordinateValidationResult[],
    beaconVerification: BeaconVerificationResult[],
    boundaryCheck: BoundaryCheckResult[],
    featureComparison: PropertyFeatureComparison[]
  ): string[] {
    const risks: string[] = [];

    // Coordinate risks
    const invalidCoords = coordinateValidation.filter(
      (result) => !result.isValid
    ).length;
    if (invalidCoords > 0) {
      risks.push(`${invalidCoords} coordinate(s) failed validation`);
    }

    // Beacon risks
    const missingBeacons = beaconVerification.filter(
      (result) => !result.found
    ).length;
    const damagedBeacons = beaconVerification.filter(
      (result) => result.condition !== "good"
    ).length;

    if (missingBeacons > 0) {
      risks.push(`${missingBeacons} survey beacon(s) missing`);
    }
    if (damagedBeacons > 0) {
      risks.push(`${damagedBeacons} survey beacon(s) damaged or moved`);
    }

    // Boundary risks
    const encroachments = boundaryCheck.filter(
      (result) => !result.withinBoundaries
    ).length;
    if (encroachments > 0) {
      risks.push(`${encroachments} point(s) outside property boundaries`);
    }

    // Feature risks
    const majorVariances = featureComparison.filter(
      (comp) => comp.status === "major_variance" || comp.status === "conflict"
    ).length;
    if (majorVariances > 0) {
      risks.push(`${majorVariances} major variance(s) in property features`);
    }

    return risks;
  }

  /**
   * Generates recommendations based on verification results
   */
  private generateRecommendations(
    coordinateValidation: CoordinateValidationResult[],
    beaconVerification: BeaconVerificationResult[],
    boundaryCheck: BoundaryCheckResult[],
    featureComparison: PropertyFeatureComparison[],
    overallAccuracy: number
  ): string[] {
    const recommendations: string[] = [];

    if (overallAccuracy < 70) {
      recommendations.push("Consider professional surveyor re-measurement");
    }

    if (beaconVerification.some((result) => !result.found)) {
      recommendations.push(
        "Replace missing survey beacons before finalizing verification"
      );
    }

    if (boundaryCheck.some((result) => !result.withinBoundaries)) {
      recommendations.push(
        "Investigate boundary discrepancies with neighboring properties"
      );
    }

    if (featureComparison.some((comp) => comp.status === "conflict")) {
      recommendations.push(
        "Conduct detailed property survey to resolve measurement conflicts"
      );
    }

    if (coordinateValidation.some((result) => result.confidence < 50)) {
      recommendations.push(
        "Use high-precision GPS equipment for coordinate verification"
      );
    }

    return recommendations;
  }

  /**
   * Determines if expert review is required
   */
  private determineExpertReviewRequirement(
    overallAccuracy: number,
    riskFactors: string[],
    featureComparison: PropertyFeatureComparison[]
  ): boolean {
    return (
      overallAccuracy < 80 ||
      riskFactors.length > 2 ||
      featureComparison.some((comp) => comp.status === "conflict")
    );
  }

  /**
   * Generates next action items
   */
  private generateNextActions(
    coordinateValidation: CoordinateValidationResult[],
    beaconVerification: BeaconVerificationResult[],
    boundaryCheck: BoundaryCheckResult[],
    requiresExpertReview: boolean
  ): string[] {
    const actions: string[] = [];

    if (requiresExpertReview) {
      actions.push("Schedule professional surveyor review");
    }

    if (beaconVerification.some((result) => !result.found)) {
      actions.push("Locate and verify missing survey beacons");
    }

    if (coordinateValidation.some((result) => !result.isValid)) {
      actions.push("Re-measure coordinates with improved GPS accuracy");
    }

    if (boundaryCheck.some((result) => result.encroachmentRisk === "high")) {
      actions.push("Investigate potential boundary encroachments");
    }

    return actions;
  }

  /**
   * Stores verification results in database
   */
  private async storeVerificationResults(
    result: PhysicalVerificationResult
  ): Promise<void> {
    try {
      // Store in verification layers table
      await this.db.execute(
        `
        UPDATE verification_layers 
        SET 
          status = 'completed',
          results = ?,
          completion_date = ?,
          accuracy_score = ?
        WHERE session_id = ? AND layer_type = 'physical'
      `,
        JSON.stringify(result),
        result.verificationDate.toISOString(),
        result.overallAccuracy,
        result.sessionId
      );

      logger.info(
        `Stored physical verification results for session ${result.sessionId}`
      );
    } catch (error) {
      logger.error("Failed to store verification results:", error);
      throw error;
    }
  }

  /**
   * Converts verification result to layer execution result format
   */
  toLayerExecutionResult(
    result: PhysicalVerificationResult
  ): LayerExecutionResult {
    return {
      layerId: parseInt(result.sessionId), // Assuming session ID maps to layer ID
      status:
        result.overallAccuracy >= 80 ? "completed"
        : result.requiresExpertReview ? "requires_attention"
        : "failed",
      results: {
        overallAccuracy: result.overallAccuracy,
        coordinateValidation: result.coordinateValidation,
        beaconVerification: result.beaconVerification,
        boundaryCheck: result.boundaryCheck,
        featureComparison: result.featureComparison,
      },
      duration: 0, // Would be calculated based on actual execution time
      findings: [
        `Overall accuracy: ${result.overallAccuracy}%`,
        ...result.riskFactors,
      ],
      recommendations: result.recommendations,
      nextActions: result.nextActions,
    };
  }
}

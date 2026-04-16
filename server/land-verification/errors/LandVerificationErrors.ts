/**
 * Land Verification specific error types and handling
 * Extends the base error system with domain-specific errors
 */

import {
  AppError,
  ErrorCode,
  ErrorCategory,
  HttpStatusCode,
  ExternalServiceError,
  BusinessLogicError,
  ValidationError
} from '../../../src/local/error-handling';

// Land verification specific error codes
export enum LandVerificationErrorCode {
  // Government API errors
  GOVERNMENT_API_UNAVAILABLE = 'GOVERNMENT_API_UNAVAILABLE',
  GOVERNMENT_API_TIMEOUT = 'GOVERNMENT_API_TIMEOUT',
  GOVERNMENT_API_RATE_LIMITED = 'GOVERNMENT_API_RATE_LIMITED',
  GOVERNMENT_API_AUTHENTICATION_FAILED = 'GOVERNMENT_API_AUTHENTICATION_FAILED',
  GOVERNMENT_DATA_INCOMPLETE = 'GOVERNMENT_DATA_INCOMPLETE',
  GOVERNMENT_DATA_INCONSISTENT = 'GOVERNMENT_DATA_INCONSISTENT',

  // Registry specific errors
  LAND_REGISTRY_UNAVAILABLE = 'LAND_REGISTRY_UNAVAILABLE',
  TITLE_DEED_NOT_FOUND = 'TITLE_DEED_NOT_FOUND',
  OWNERSHIP_CHAIN_BROKEN = 'OWNERSHIP_CHAIN_BROKEN',
  REGISTRY_DATA_CORRUPTED = 'REGISTRY_DATA_CORRUPTED',

  // Court records errors
  COURT_SYSTEM_UNAVAILABLE = 'COURT_SYSTEM_UNAVAILABLE',
  COURT_RECORDS_INCOMPLETE = 'COURT_RECORDS_INCOMPLETE',
  COURT_DATA_ACCESS_DENIED = 'COURT_DATA_ACCESS_DENIED',

  // Physical verification errors
  GPS_ACCURACY_INSUFFICIENT = 'GPS_ACCURACY_INSUFFICIENT',
  BOUNDARY_MARKERS_MISSING = 'BOUNDARY_MARKERS_MISSING',
  SURVEY_DATA_INCONSISTENT = 'SURVEY_DATA_INCONSISTENT',
  PHYSICAL_ACCESS_DENIED = 'PHYSICAL_ACCESS_DENIED',

  // Community intelligence errors
  COMMUNITY_FEEDBACK_INSUFFICIENT = 'COMMUNITY_FEEDBACK_INSUFFICIENT',
  COMMUNITY_SOURCE_UNRELIABLE = 'COMMUNITY_SOURCE_UNRELIABLE',
  COMMUNITY_DATA_CONFLICTING = 'COMMUNITY_DATA_CONFLICTING',

  // Expert coordination errors
  EXPERT_UNAVAILABLE = 'EXPERT_UNAVAILABLE',
  EXPERT_CREDENTIALS_INVALID = 'EXPERT_CREDENTIALS_INVALID',
  EXPERT_REPORT_DELAYED = 'EXPERT_REPORT_DELAYED',
  EXPERT_REPORT_INCOMPLETE = 'EXPERT_REPORT_INCOMPLETE',

  // Verification session errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_ALREADY_COMPLETED = 'SESSION_ALREADY_COMPLETED',
  SESSION_SUSPENDED = 'SESSION_SUSPENDED',
  LAYER_EXECUTION_FAILED = 'LAYER_EXECUTION_FAILED',
  VERIFICATION_TIMEOUT = 'VERIFICATION_TIMEOUT',

  // Risk assessment errors
  INSUFFICIENT_DATA_FOR_ASSESSMENT = 'INSUFFICIENT_DATA_FOR_ASSESSMENT',
  RISK_CALCULATION_FAILED = 'RISK_CALCULATION_FAILED',
  RISK_THRESHOLD_EXCEEDED = 'RISK_THRESHOLD_EXCEEDED',

  // Monitoring errors
  MONITORING_SERVICE_UNAVAILABLE = 'MONITORING_SERVICE_UNAVAILABLE',
  MONITORING_DATA_STALE = 'MONITORING_DATA_STALE',
  ALERT_DELIVERY_FAILED = 'ALERT_DELIVERY_FAILED'
}

// Government API specific error
export class GovernmentAPIError extends ExternalServiceError {
  public readonly apiEndpoint: string;
  public readonly responseCode?: number;
  public readonly retryAfter?: number;

  constructor(
    message: string,
    apiEndpoint: string,
    code: LandVerificationErrorCode = LandVerificationErrorCode.GOVERNMENT_API_UNAVAILABLE,
    responseCode?: number,
    retryAfter?: number,
    correlationId?: string
  ) {
    super(
      message,
      code as any,
      HttpStatusCode.BAD_GATEWAY,
      {
        apiEndpoint,
        responseCode,
        retryAfter
      },
      correlationId
    );

    this.apiEndpoint = apiEndpoint;
    this.responseCode = responseCode;
    this.retryAfter = retryAfter;
  }
}

// Land Registry specific error
export class LandRegistryError extends GovernmentAPIError {
  public readonly titleNumber?: string;
  public readonly registryType: string;

  constructor(
    message: string,
    registryType: string,
    titleNumber?: string,
    code: LandVerificationErrorCode = LandVerificationErrorCode.LAND_REGISTRY_UNAVAILABLE,
    correlationId?: string
  ) {
    super(
      message,
      `land-registry/${registryType}`,
      code,
      undefined,
      undefined,
      correlationId
    );

    this.titleNumber = titleNumber;
    this.registryType = registryType;
  }
}

// Physical verification error
export class PhysicalVerificationError extends BusinessLogicError {
  public readonly coordinates?: { lat: number; lng: number };
  public readonly accuracy?: number;
  public readonly verificationStep: string;

  constructor(
    message: string,
    verificationStep: string,
    code: LandVerificationErrorCode = LandVerificationErrorCode.GPS_ACCURACY_INSUFFICIENT,
    coordinates?: { lat: number; lng: number },
    accuracy?: number,
    correlationId?: string
  ) {
    super(
      message,
      code as any,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      {
        verificationStep,
        coordinates,
        accuracy
      },
      correlationId
    );

    this.coordinates = coordinates;
    this.accuracy = accuracy;
    this.verificationStep = verificationStep;
  }
}

// Community intelligence error
export class CommunityIntelligenceError extends BusinessLogicError {
  public readonly feedbackCount: number;
  public readonly reliabilityScore: number;
  public readonly sourceTypes: string[];

  constructor(
    message: string,
    feedbackCount: number,
    reliabilityScore: number,
    sourceTypes: string[],
    code: LandVerificationErrorCode = LandVerificationErrorCode.COMMUNITY_FEEDBACK_INSUFFICIENT,
    correlationId?: string
  ) {
    super(
      message,
      code as any,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      {
        feedbackCount,
        reliabilityScore,
        sourceTypes
      },
      correlationId
    );

    this.feedbackCount = feedbackCount;
    this.reliabilityScore = reliabilityScore;
    this.sourceTypes = sourceTypes;
  }
}

// Verification session error
export class VerificationSessionError extends BusinessLogicError {
  public readonly sessionId: string;
  public readonly sessionStatus: string;
  public readonly currentLayer?: string;

  constructor(
    message: string,
    sessionId: string,
    sessionStatus: string,
    code: LandVerificationErrorCode = LandVerificationErrorCode.SESSION_NOT_FOUND,
    currentLayer?: string,
    correlationId?: string
  ) {
    super(
      message,
      code as any,
      HttpStatusCode.BAD_REQUEST,
      {
        sessionId,
        sessionStatus,
        currentLayer
      },
      correlationId
    );

    this.sessionId = sessionId;
    this.sessionStatus = sessionStatus;
    this.currentLayer = currentLayer;
  }
}

// Expert coordination error
export class ExpertCoordinationError extends BusinessLogicError {
  public readonly expertType: string;
  public readonly expertId?: string;
  public readonly availabilityDate?: Date;

  constructor(
    message: string,
    expertType: string,
    code: LandVerificationErrorCode = LandVerificationErrorCode.EXPERT_UNAVAILABLE,
    expertId?: string,
    availabilityDate?: Date,
    correlationId?: string
  ) {
    super(
      message,
      code as any,
      HttpStatusCode.SERVICE_UNAVAILABLE,
      {
        expertType,
        expertId,
        availabilityDate
      },
      correlationId
    );

    this.expertType = expertType;
    this.expertId = expertId;
    this.availabilityDate = availabilityDate;
  }
}

// Risk assessment error
export class RiskAssessmentError extends BusinessLogicError {
  public readonly dataPoints: number;
  public readonly missingLayers: string[];
  public readonly confidenceLevel: number;

  constructor(
    message: string,
    dataPoints: number,
    missingLayers: string[],
    confidenceLevel: number,
    code: LandVerificationErrorCode = LandVerificationErrorCode.INSUFFICIENT_DATA_FOR_ASSESSMENT,
    correlationId?: string
  ) {
    super(
      message,
      code as any,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      {
        dataPoints,
        missingLayers,
        confidenceLevel
      },
      correlationId
    );

    this.dataPoints = dataPoints;
    this.missingLayers = missingLayers;
    this.confidenceLevel = confidenceLevel;
  }
}

// Error factory for land verification specific errors
export class LandVerificationErrorFactory {
  static createGovernmentAPIError(
    apiEndpoint: string,
    error: any,
    correlationId?: string
  ): GovernmentAPIError {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new GovernmentAPIError(
        `Government API unavailable: ${apiEndpoint}`,
        apiEndpoint,
        LandVerificationErrorCode.GOVERNMENT_API_UNAVAILABLE,
        undefined,
        undefined,
        correlationId
      );
    }

    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return new GovernmentAPIError(
        `Government API timeout: ${apiEndpoint}`,
        apiEndpoint,
        LandVerificationErrorCode.GOVERNMENT_API_TIMEOUT,
        undefined,
        30, // Retry after 30 seconds
        correlationId
      );
    }

    if (error.status === 429 || error.message?.includes('rate limit')) {
      const retryAfter = error.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) : 60;
      return new GovernmentAPIError(
        `Government API rate limited: ${apiEndpoint}`,
        apiEndpoint,
        LandVerificationErrorCode.GOVERNMENT_API_RATE_LIMITED,
        429,
        retryAfter,
        correlationId
      );
    }

    if (error.status === 401 || error.status === 403) {
      return new GovernmentAPIError(
        `Government API authentication failed: ${apiEndpoint}`,
        apiEndpoint,
        LandVerificationErrorCode.GOVERNMENT_API_AUTHENTICATION_FAILED,
        error.status,
        undefined,
        correlationId
      );
    }

    return new GovernmentAPIError(
      `Government API error: ${error.message || 'Unknown error'}`,
      apiEndpoint,
      LandVerificationErrorCode.GOVERNMENT_API_UNAVAILABLE,
      error.status,
      undefined,
      correlationId
    );
  }

  static createLandRegistryError(
    registryType: string,
    error: any,
    titleNumber?: string,
    correlationId?: string
  ): LandRegistryError {
    if (error.message?.includes('not found') || error.status === 404) {
      return new LandRegistryError(
        `Title deed not found: ${titleNumber || 'unknown'}`,
        registryType,
        titleNumber,
        LandVerificationErrorCode.TITLE_DEED_NOT_FOUND,
        correlationId
      );
    }

    if (error.message?.includes('ownership chain') || error.message?.includes('broken chain')) {
      return new LandRegistryError(
        `Ownership chain broken for title: ${titleNumber || 'unknown'}`,
        registryType,
        titleNumber,
        LandVerificationErrorCode.OWNERSHIP_CHAIN_BROKEN,
        correlationId
      );
    }

    return new LandRegistryError(
      `Land registry error: ${error.message || 'Registry unavailable'}`,
      registryType,
      titleNumber,
      LandVerificationErrorCode.LAND_REGISTRY_UNAVAILABLE,
      correlationId
    );
  }

  static createPhysicalVerificationError(
    verificationStep: string,
    error: any,
    coordinates?: { lat: number; lng: number },
    accuracy?: number,
    correlationId?: string
  ): PhysicalVerificationError {
    if (error.message?.includes('GPS') || error.message?.includes('accuracy')) {
      return new PhysicalVerificationError(
        `GPS accuracy insufficient for ${verificationStep}: ${accuracy}m`,
        verificationStep,
        LandVerificationErrorCode.GPS_ACCURACY_INSUFFICIENT,
        coordinates,
        accuracy,
        correlationId
      );
    }

    if (error.message?.includes('boundary') || error.message?.includes('markers')) {
      return new PhysicalVerificationError(
        `Boundary markers missing or damaged in ${verificationStep}`,
        verificationStep,
        LandVerificationErrorCode.BOUNDARY_MARKERS_MISSING,
        coordinates,
        accuracy,
        correlationId
      );
    }

    if (error.message?.includes('access') || error.message?.includes('denied')) {
      return new PhysicalVerificationError(
        `Physical access denied for ${verificationStep}`,
        verificationStep,
        LandVerificationErrorCode.PHYSICAL_ACCESS_DENIED,
        coordinates,
        accuracy,
        correlationId
      );
    }

    return new PhysicalVerificationError(
      `Physical verification failed in ${verificationStep}: ${error.message}`,
      verificationStep,
      LandVerificationErrorCode.SURVEY_DATA_INCONSISTENT,
      coordinates,
      accuracy,
      correlationId
    );
  }

  static createVerificationSessionError(
    sessionId: string,
    sessionStatus: string,
    error: any,
    currentLayer?: string,
    correlationId?: string
  ): VerificationSessionError {
    if (error.message?.includes('not found') || error.status === 404) {
      return new VerificationSessionError(
        `Verification session not found: ${sessionId}`,
        sessionId,
        sessionStatus,
        LandVerificationErrorCode.SESSION_NOT_FOUND,
        currentLayer,
        correlationId
      );
    }

    if (error.message?.includes('completed') || sessionStatus === 'completed') {
      return new VerificationSessionError(
        `Verification session already completed: ${sessionId}`,
        sessionId,
        sessionStatus,
        LandVerificationErrorCode.SESSION_ALREADY_COMPLETED,
        currentLayer,
        correlationId
      );
    }

    if (error.message?.includes('suspended') || sessionStatus === 'suspended') {
      return new VerificationSessionError(
        `Verification session suspended: ${sessionId}`,
        sessionId,
        sessionStatus,
        LandVerificationErrorCode.SESSION_SUSPENDED,
        currentLayer,
        correlationId
      );
    }

    if (error.message?.includes('timeout')) {
      return new VerificationSessionError(
        `Verification session timeout: ${sessionId}`,
        sessionId,
        sessionStatus,
        LandVerificationErrorCode.VERIFICATION_TIMEOUT,
        currentLayer,
        correlationId
      );
    }

    return new VerificationSessionError(
      `Verification session error: ${error.message}`,
      sessionId,
      sessionStatus,
      LandVerificationErrorCode.LAYER_EXECUTION_FAILED,
      currentLayer,
      correlationId
    );
  }
}
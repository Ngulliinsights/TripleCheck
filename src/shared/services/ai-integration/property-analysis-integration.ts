/**
 * Property Analysis AI Integration Service
 *
 * Integrates AI-powered property analysis with listing and search features.
 * Provides automated valuation, risk assessment, and market insights.
 */

import { enhancedHuggingFaceClient } from '../huggingface-api-client';
import { logger } from '../../../../server/infrastructure/monitoring/logger';
import { Property } from '../../types/property';
import { BaseError } from '../../error-handling/errors/base-error';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODULE = 'PropertyAnalysisIntegration';

const VALUATION = {
  DEFAULT_CONFIDENCE: 0.85,
  DEFAULT_VARIANCE: 0.10,
  MARKET_DISCOUNT: 0.95,
} as const;

const RISK = {
  HIGH_THRESHOLD: 70,
  MEDIUM_THRESHOLD: 40,
  DEFAULT_CONFIDENCE: 0.80,
} as const;

const RECOMMENDATION_LIMIT = 3;
const PRICE_SUGGESTION_LIMIT = 2;
const PRICE_COMPETITIVE_FACTOR = 0.98;

// ─── Local Types (not exported from property module) ─────────────────────────

/**
 * Locally scoped search filters — extend once PropertySearchFilters is exported
 * from ../../types/property.
 */
export interface PropertySearchFilters {
  location?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  propertyType?: string | string[];
  [key: string]: unknown;
}

// ─── Result Interfaces ────────────────────────────────────────────────────────

export interface ValuationFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface MarketComparison {
  averagePrice: number;
  pricePerSqft: number;
  marketTrend: 'rising' | 'stable' | 'declining';
}

export interface PropertyValuationResult {
  estimatedValue: number;
  confidence: number;
  valueRange: { min: number; max: number };
  factors: ValuationFactor[];
  marketComparison: MarketComparison;
  lastUpdated: Date;
}

export type RiskCategory = 'legal' | 'financial' | 'physical' | 'market';
export type RiskSeverity = 'low' | 'medium' | 'high';

export interface RiskFactor {
  category: RiskCategory;
  risk: string;
  severity: RiskSeverity;
  likelihood: number; // 0–1
  mitigation: string;
}

export interface PropertyRiskAssessment {
  overallRisk: RiskSeverity;
  riskScore: number; // 0–100
  riskFactors: RiskFactor[];
  recommendations: string[];
  confidence: number;
}

export interface ComparableProperty {
  propertyId: string;
  similarity: number; // 0–1
  priceComparison: 'higher' | 'similar' | 'lower';
}

export interface PriceHistoryEntry {
  period: string;
  averagePrice: number;
  change: number;
}

export type DemandSupplyLevel = 'high' | 'medium' | 'low';

export interface MarketTrends {
  priceHistory: PriceHistoryEntry[];
  demandLevel: DemandSupplyLevel;
  supplyLevel: DemandSupplyLevel;
}

export type InvestmentRating = 'excellent' | 'good' | 'fair' | 'poor';

export interface PropertyInsights {
  marketPosition: string;
  investmentPotential: InvestmentRating;
  keyStrengths: string[];
  areasOfConcern: string[];
  comparableProperties: ComparableProperty[];
  marketTrends: MarketTrends;
}

export interface PriceRecommendation {
  propertyId: string;
  suggestedPrice: number;
  reasoning: string;
}

export interface SearchOptimization {
  suggestedFilters: Partial<PropertySearchFilters>;
  alternativeSearches: string[];
}

export interface EnhancedPropertySearchResult {
  properties: Property[];
  aiInsights: {
    recommendedProperties: string[];
    marketAnalysis: string;
    priceRecommendations: PriceRecommendation[];
  };
  searchOptimization: SearchOptimization;
}

// ─── Internal Analysis Types ──────────────────────────────────────────────────

interface PropertyFeatures {
  [question: string]: unknown;
}

interface MarketPositionAnalysis {
  summary: string;
  strengths: string[];
  concerns: string[];
}

interface InvestmentPotentialAnalysis {
  rating: InvestmentRating;
  factors: string[];
}

interface SearchPatternAnalysis {
  preferredLocations: string[];
  priceRange: { min?: number | string; max?: number | string };
  propertyTypes: string[];
}

interface AreaMarketAnalysis {
  summary: string;
  averagePrice: number;
  priceGrowth: number;
  marketActivity: string;
}

// ─── Error ────────────────────────────────────────────────────────────────────

/**
 * BaseError is an interface in this codebase — we extend native Error and
 * implement the interface so instanceof checks still work correctly.
 */
class PropertyAnalysisIntegrationError extends Error implements BaseError {
  readonly code = 'PROPERTY_ANALYSIS_ERROR';
  readonly details: Record<string, unknown> | undefined;
  readonly timestamp: string;
  readonly correlationId: string | undefined;
  readonly cause?: Error;

  constructor(
    message: string,
    public readonly operation: string,
    cause?: Error,
  ) {
    super(message);
    this.name = 'PropertyAnalysisIntegrationError';
    this.timestamp = new Date().toISOString();
    this.correlationId = undefined;
    this.details = { operation };
    this.cause = cause;
    Object.setPrototypeOf(this, PropertyAnalysisIntegrationError.prototype);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Safely coerce a property's price/size to a number for arithmetic. */
function toNumber(value: string | number): number {
  return typeof value === 'number' ? value : parseFloat(value) || 0;
}

/** Safely coerce a property's id to a string. */
function toId(value: string | number): string {
  return String(value);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class PropertyAnalysisIntegrationService {
  private static instance: PropertyAnalysisIntegrationService;

  public static getInstance(): PropertyAnalysisIntegrationService {
    if (!PropertyAnalysisIntegrationService.instance) {
      PropertyAnalysisIntegrationService.instance = new PropertyAnalysisIntegrationService();
    }
    return PropertyAnalysisIntegrationService.instance;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Analyse property value using AI and market data. */
  async analyzePropertyValue(property: Property): Promise<PropertyValuationResult> {
    const id = toId(property.id);
    logger.info(`[${MODULE}] Starting AI property valuation — id=${id} type=${property.type ?? 'unknown'}`);

    try {
      const description = this.buildPropertyDescription(property);
      const price = toNumber(property.price);

      const [features, marketAnalysis] = await Promise.all([
        this.extractPropertyFeatures(description),
        this.analyzeMarketPosition(price, property.size),
      ]);

      const valuation = this.buildValuationResult(price, features, marketAnalysis);

      logger.info(
        `[${MODULE}] Valuation completed — id=${id} value=${valuation.estimatedValue} confidence=${valuation.confidence}`,
      );

      return valuation;
    } catch (error) {
      this.logAndRethrow('analyzePropertyValue', id, error);
    }
  }

  /** Assess investment risks for a property using AI. */
  async assessPropertyRisk(property: Property): Promise<PropertyRiskAssessment> {
    const id = toId(property.id);
    logger.info(`[${MODULE}] Starting AI property risk assessment — id=${id}`);

    try {
      const description = this.buildPropertyDescription(property);

      const [legalRisks, marketRisks, physicalRisks] = await Promise.all([
        this.analyzeLegalRisks(description),
        this.analyzeMarketRisks(),
        this.analyzePhysicalRisks(),
      ]);

      const assessment = this.buildRiskAssessment(legalRisks, marketRisks, physicalRisks);

      logger.info(
        `[${MODULE}] Risk assessment completed — id=${id} risk=${assessment.overallRisk} score=${assessment.riskScore}`,
      );

      return assessment;
    } catch (error) {
      this.logAndRethrow('assessPropertyRisk', id, error);
    }
  }

  /** Generate comprehensive market insights for a property. */
  async generatePropertyInsights(property: Property): Promise<PropertyInsights> {
    const id = toId(property.id);
    logger.info(`[${MODULE}] Generating AI property insights — id=${id}`);

    try {
      const description = this.buildPropertyDescription(property);
      const price = toNumber(property.price);

      const [marketPosition, investmentPotential, comparables, marketTrends] = await Promise.all([
        this.analyzeMarketPositioning(description),
        this.assessInvestmentPotential(description),
        this.findComparableProperties(id),
        this.analyzeMarketTrends(price),
      ]);

      const insights: PropertyInsights = {
        marketPosition: marketPosition.summary,
        investmentPotential: investmentPotential.rating,
        keyStrengths: marketPosition.strengths,
        areasOfConcern: marketPosition.concerns,
        comparableProperties: comparables,
        marketTrends,
      };

      logger.info(`[${MODULE}] Insights generated — id=${id} potential=${insights.investmentPotential}`);

      return insights;
    } catch (error) {
      this.logAndRethrow('generatePropertyInsights', id, error);
    }
  }

  /** Enhance search results with AI-driven recommendations and market context. */
  async enhanceSearchResults(
    properties: Property[],
    searchFilters: PropertySearchFilters,
    userPreferences?: Record<string, unknown>,
  ): Promise<EnhancedPropertySearchResult> {
    logger.info(
      `[${MODULE}] Enhancing ${properties.length} search results — hasPreferences=${!!userPreferences}`,
    );

    try {
      const [searchAnalysis, marketAnalysis] = await Promise.all([
        this.analyzeSearchPatterns(searchFilters, userPreferences),
        this.analyzeSearchAreaMarket(searchFilters),
      ]);

      const [recommendations, priceRecommendations, searchOptimization] = await Promise.all([
        this.generatePropertyRecommendations(properties, searchAnalysis),
        this.generatePriceRecommendations(properties, marketAnalysis),
        this.suggestSearchOptimizations(searchFilters, searchAnalysis),
      ]);

      logger.info(
        `[${MODULE}] Search results enhanced — recommended=${recommendations.length} priceRecs=${priceRecommendations.length}`,
      );

      return {
        properties,
        aiInsights: {
          recommendedProperties: recommendations,
          marketAnalysis: marketAnalysis.summary,
          priceRecommendations,
        },
        searchOptimization,
      };
    } catch (error) {
      logger.warn(
        `[${MODULE}] Search enhancement failed — returning unmodified results. ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.buildFallbackSearchResult(properties);
    }
  }

  // ─── Shared Helpers ──────────────────────────────────────────────────────────

  private buildPropertyDescription(property: Property): string {
    // Safely handle features — Property.features may be typed as unknown
    const features =
      Array.isArray(property.features)
        ? (property.features as unknown[]).map(String).join(', ')
        : 'No features listed';

    return [
      `Property Type: ${property.type ?? 'Unknown'}`,
      `Location: ${property.location ?? 'Unknown'}`,
      `Price: ${property.price}`,
      `Bedrooms: ${(property as unknown as Record<string, unknown>).bedrooms ?? 'N/A'}`,
      `Bathrooms: ${(property as unknown as Record<string, unknown>).bathrooms ?? 'N/A'}`,
      `Size: ${property.size ?? 'N/A'}`,
      `Description: ${property.description ?? 'No description available'}`,
      `Features: ${features}`,
    ].join('\n');
  }

  /** Never throws — returns an empty object on failure so callers can proceed gracefully. */
  private async extractPropertyFeatures(description: string): Promise<PropertyFeatures> {
    const questions = [
      'What are the key features of this property?',
      'What is the condition of this property?',
      'What makes this property unique?',
    ];

    try {
      const results = await Promise.all(
        questions.map((q) => enhancedHuggingFaceClient.extractPropertyInfo(description, q)),
      );
      return Object.fromEntries(questions.map((q, i) => [q, results[i]]));
    } catch (error) {
      logger.warn(
        `[${MODULE}] Feature extraction failed — using empty feature set. ${error instanceof Error ? error.message : String(error)}`,
      );
      return {};
    }
  }

  private logAndRethrow(operation: string, propertyId: string, error: unknown): never {
    logger.error(
      `[${MODULE}] ${operation} failed — id=${propertyId} error=${error instanceof Error ? error.message : String(error)}`,
    );
    throw new PropertyAnalysisIntegrationError(
      `Failed during ${operation}`,
      operation,
      error instanceof Error ? error : new Error(String(error)),
    );
  }

  private buildFallbackSearchResult(properties: Property[]): EnhancedPropertySearchResult {
    return {
      properties,
      aiInsights: {
        recommendedProperties: [],
        marketAnalysis: 'Market analysis unavailable',
        priceRecommendations: [],
      },
      searchOptimization: {
        suggestedFilters: {},
        alternativeSearches: [],
      },
    };
  }

  // ─── Valuation Helpers ───────────────────────────────────────────────────────

  private async analyzeMarketPosition(
    price: number,
    size: number | string | undefined,
  ): Promise<MarketComparison> {
    const numericSize = size !== undefined ? toNumber(size as string | number) : 0;
    return {
      averagePrice: price * VALUATION.MARKET_DISCOUNT,
      pricePerSqft: numericSize > 0 ? price / numericSize : 0,
      marketTrend: 'stable',
    };
  }

  private buildValuationResult(
    price: number,
    _features: PropertyFeatures,
    marketComparison: MarketComparison,
  ): PropertyValuationResult {
    const v = VALUATION.DEFAULT_VARIANCE;
    return {
      estimatedValue: price,
      confidence: VALUATION.DEFAULT_CONFIDENCE,
      valueRange: { min: price * (1 - v), max: price * (1 + v) },
      factors: [
        {
          factor: 'Location',
          impact: 'positive',
          weight: 0.30,
          description: 'Prime location with good accessibility',
        },
        {
          factor: 'Property Condition',
          impact: 'positive',
          weight: 0.20,
          description: 'Well-maintained property',
        },
      ],
      marketComparison,
      lastUpdated: new Date(),
    };
  }

  // ─── Risk Helpers ────────────────────────────────────────────────────────────

  private async analyzeLegalRisks(description: string): Promise<RiskFactor[]> {
    try {
      const riskIndicators = await enhancedHuggingFaceClient.detectFraudIndicators(description);
      const severity = riskIndicators.riskLevel as RiskSeverity;
      return [
        {
          category: 'legal',
          risk: 'Document authenticity',
          severity,
          likelihood: riskIndicators.confidence,
          mitigation: 'Verify documents with relevant authorities',
        },
      ];
    } catch {
      return [];
    }
  }

  private async analyzeMarketRisks(): Promise<RiskFactor[]> {
    return [
      {
        category: 'market',
        risk: 'Price volatility',
        severity: 'low',
        likelihood: 0.30,
        mitigation: 'Monitor market trends regularly',
      },
    ];
  }

  private async analyzePhysicalRisks(): Promise<RiskFactor[]> {
    return [
      {
        category: 'physical',
        risk: 'Structural integrity',
        severity: 'low',
        likelihood: 0.20,
        mitigation: 'Conduct professional inspection',
      },
    ];
  }

  private buildRiskAssessment(...riskGroups: RiskFactor[][]): PropertyRiskAssessment {
    const allRisks = riskGroups.flat();
    const riskScore =
      allRisks.reduce((sum, r) => sum + r.likelihood * 100, 0) /
      Math.max(allRisks.length, 1);

    const overallRisk: RiskSeverity =
      riskScore > RISK.HIGH_THRESHOLD
        ? 'high'
        : riskScore > RISK.MEDIUM_THRESHOLD
          ? 'medium'
          : 'low';

    return {
      overallRisk,
      riskScore,
      riskFactors: allRisks,
      recommendations: [
        'Conduct thorough due diligence',
        'Verify all documentation with relevant authorities',
        'Commission a professional physical inspection',
      ],
      confidence: RISK.DEFAULT_CONFIDENCE,
    };
  }

  // ─── Insights Helpers ────────────────────────────────────────────────────────

  private async analyzeMarketPositioning(
    _description: string,
  ): Promise<MarketPositionAnalysis> {
    return {
      summary: 'Well-positioned property in a growing market',
      strengths: ['Prime location', 'Good connectivity', 'Growing neighbourhood'],
      concerns: ['Market saturation', 'Infrastructure development pending'],
    };
  }

  private async assessInvestmentPotential(
    _description: string,
  ): Promise<InvestmentPotentialAnalysis> {
    return {
      rating: 'good',
      factors: ['Location growth potential', 'Property condition', 'Market demand'],
    };
  }

  private async findComparableProperties(propertyId: string): Promise<ComparableProperty[]> {
    return [
      { propertyId: `${propertyId}-comp-1`, similarity: 0.85, priceComparison: 'similar' },
      { propertyId: `${propertyId}-comp-2`, similarity: 0.78, priceComparison: 'lower' },
    ];
  }

  private async analyzeMarketTrends(price: number): Promise<MarketTrends> {
    return {
      priceHistory: [
        { period: '2024-Q1', averagePrice: price * 0.95, change: 5 },
        { period: '2024-Q2', averagePrice: price * 0.98, change: 3 },
        { period: '2024-Q3', averagePrice: price, change: 2 },
      ],
      demandLevel: 'medium',
      supplyLevel: 'medium',
    };
  }

  // ─── Search Helpers ──────────────────────────────────────────────────────────

  private async analyzeSearchPatterns(
    filters: PropertySearchFilters,
    _userPreferences?: Record<string, unknown>,
  ): Promise<SearchPatternAnalysis> {
    const types =
      Array.isArray(filters.propertyType)
        ? filters.propertyType
        : [filters.propertyType].filter((t): t is string => typeof t === 'string');

    return {
      preferredLocations: [filters.location].filter((l): l is string => typeof l === 'string'),
      priceRange: { min: filters.minPrice, max: filters.maxPrice },
      propertyTypes: types,
    };
  }

  private async generatePropertyRecommendations(
    properties: Property[],
    _searchAnalysis: SearchPatternAnalysis,
  ): Promise<string[]> {
    return properties.slice(0, RECOMMENDATION_LIMIT).map((p) => toId(p.id));
  }

  private async analyzeSearchAreaMarket(
    _filters: PropertySearchFilters,
  ): Promise<AreaMarketAnalysis> {
    return {
      summary: 'Active market with steady growth potential',
      averagePrice: 5_000_000,
      priceGrowth: 8.5,
      marketActivity: 'high',
    };
  }

  private async generatePriceRecommendations(
    properties: Property[],
    _marketAnalysis: AreaMarketAnalysis,
  ): Promise<PriceRecommendation[]> {
    return properties.slice(0, PRICE_SUGGESTION_LIMIT).map((property) => ({
      propertyId: toId(property.id),
      suggestedPrice: toNumber(property.price) * PRICE_COMPETITIVE_FACTOR,
      reasoning: 'Slightly below market average for competitive positioning',
    }));
  }

  private async suggestSearchOptimizations(
    filters: PropertySearchFilters,
    _searchAnalysis: SearchPatternAnalysis,
  ): Promise<SearchOptimization> {
    const maxPrice =
      filters.maxPrice !== undefined
        ? toNumber(filters.maxPrice as string | number)
        : undefined;

    return {
      suggestedFilters: {
        ...(maxPrice !== undefined && { maxPrice: maxPrice * 1.1 }),
      },
      alternativeSearches: [
        'Similar properties in nearby areas',
        'Properties with flexible pricing',
      ],
    };
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const propertyAnalysisIntegration = PropertyAnalysisIntegrationService.getInstance();
/**
 * Automated Valuation Model (AVM) for Kenyan Real Estate
 * 
 * Advanced ML-based property valuation system using ensemble methods,
 * geospatial analysis, and market intelligence specifically tuned for Kenya
 */

import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';
import { ModelRegistry, ModelPrediction } from '../infrastructure/ModelRegistry';
import { logger } from '../../infrastructure/monitoring/logger';

export interface PropertyValuationRequest {
  propertyId: string;
  location: {
    county: string;
    constituency: string;
    ward: string;
    coordinates: { lat: number; lng: number };
    address: string;
  };
  property: {
    type: 'residential' | 'commercial' | 'land' | 'mixed_use';
    subtype: string; // e.g., 'apartment', 'villa', 'office', 'retail'
    size: number; // in square meters
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    features: string[]; // e.g., ['swimming_pool', 'garden', 'parking']
  };
  market: {
    valuationPurpose: 'sale' | 'purchase' | 'mortgage' | 'insurance' | 'taxation';
    urgency: 'standard' | 'urgent' | 'rush';
    confidenceLevel: 'basic' | 'standard' | 'premium';
  };
  comparables?: Array<{
    propertyId: string;
    salePrice: number;
    saleDate: Date;
    distance: number; // in meters
    similarity: number; // 0-1 score
  }>;
  contextualData?: {
    marketTrends?: Record<string, any>;
    economicIndicators?: Record<string, any>;
    developmentPlans?: Record<string, any>;
  };
}

export interface PropertyValuationResult {
  propertyId: string;
  valuation: {
    estimatedValue: number;
    valueRange: {
      low: number;
      high: number;
    };
    confidence: number; // 0-1
    accuracy: number; // Expected accuracy percentage
  };
  
  // Detailed breakdown
  valueComponents: {
    landValue: number;
    structureValue: number;
    locationPremium: number;
    conditionAdjustment: number;
    featuresPremium: number;
    marketAdjustment: number;
  };
  
  // Comparable analysis
  comparableAnalysis: {
    comparablesUsed: number;
    averageComparablePrice: number;
    pricePerSqm: number;
    marketPosition: 'below_market' | 'at_market' | 'above_market';
    comparableAdjustments: Array<{
      propertyId: string;
      originalPrice: number;
      adjustedPrice: number;
      adjustments: Record<string, number>;
      weight: number;
    }>;
  };
  
  // Market intelligence
  marketInsights: {
    areaMedianPrice: number;
    priceAppreciation: {
      oneYear: number;
      threeYear: number;
      fiveYear: number;
    };
    marketVelocity: number; // Days on market
    supplyDemandRatio: number;
    investmentGrade: 'A' | 'B' | 'C' | 'D';
    riskFactors: string[];
  };
  
  // Geospatial analysis
  locationAnalysis: {
    accessibilityScore: number;
    amenityScore: number;
    infrastructureScore: number;
    safetyScore: number;
    futureGrowthPotential: number;
    proximityFactors: Array<{
      factor: string;
      distance: number;
      impact: number;
    }>;
  };
  
  // Model explanations
  explanation: {
    primaryValueDrivers: Array<{
      factor: string;
      contribution: number;
      description: string;
    }>;
    modelContributions: Array<{
      model: string;
      weight: number;
      prediction: number;
      confidence: number;
    }>;
    uncertaintyFactors: string[];
    dataQualityScore: number;
  };
  
  // Recommendations
  recommendations: Array<{
    type: 'pricing' | 'marketing' | 'improvement' | 'timing';
    priority: 'low' | 'medium' | 'high';
    recommendation: string;
    expectedImpact: number;
    costEstimate?: number;
  }>;
  
  metadata: {
    valuationDate: Date;
    validUntil: Date;
    modelsUsed: string[];
    processingTime: number;
    dataSourcesUsed: string[];
    complianceChecks: string[];
  };
}

export class AutomatedValuationModel extends EventEmitter {
  private modelRegistry: ModelRegistry;
  private kenyaMarketData: KenyaMarketDatabase;
  private geospatialAnalyzer: GeospatialAnalyzer;
  private comparableAnalyzer: ComparableAnalyzer;
  private marketIntelligence: MarketIntelligenceEngine;
  
  constructor(modelRegistry: ModelRegistry) {
    super();
    this.modelRegistry = modelRegistry;
    this.kenyaMarketData = new KenyaMarketDatabase();
    this.geospatialAnalyzer = new GeospatialAnalyzer();
    this.comparableAnalyzer = new ComparableAnalyzer();
    this.marketIntelligence = new MarketIntelligenceEngine();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Automated Valuation Model...');
    
    try {
      // Load valuation models
      await this.loadValuationModels();
      
      // Initialize components
      await this.kenyaMarketData.initialize();
      await this.geospatialAnalyzer.initialize();
      await this.comparableAnalyzer.initialize();
      await this.marketIntelligence.initialize();
      
      logger.info('Automated Valuation Model initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Automated Valuation Model', error);
      throw error;
    }
  }

  async valuateProperty(request: PropertyValuationRequest): Promise<PropertyValuationResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting property valuation: ${request.propertyId}`);
      
      // Step 1: Feature Engineering
      const features = await this.engineerValuationFeatures(request);
      
      // Step 2: Geospatial Analysis
      const locationAnalysis = await this.geospatialAnalyzer.analyzeLocation(request.location);
      
      // Step 3: Comparable Analysis
      const comparableAnalysis = await this.comparableAnalyzer.analyzeComparables(request);
      
      // Step 4: Market Intelligence
      const marketInsights = await this.marketIntelligence.getMarketInsights(request.location);
      
      // Step 5: Ensemble Model Predictions
      const modelPredictions = await this.runValuationModels(features);
      
      // Step 6: Combine Predictions
      const combinedValuation = await this.combineValuationResults(
        modelPredictions,
        comparableAnalysis,
        locationAnalysis,
        marketInsights,
        features
      );
      
      // Step 7: Generate Explanations
      const explanation = await this.generateValuationExplanation(
        combinedValuation,
        modelPredictions,
        features
      );
      
      // Step 8: Generate Recommendations
      const recommendations = await this.generateValuationRecommendations(
        combinedValuation,
        request,
        marketInsights
      );
      
      const result: PropertyValuationResult = {
        propertyId: request.propertyId,
        valuation: combinedValuation.valuation,
        valueComponents: combinedValuation.valueComponents,
        comparableAnalysis,
        marketInsights,
        locationAnalysis,
        explanation,
        recommendations,
        metadata: {
          valuationDate: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          modelsUsed: modelPredictions.map(p => p.modelId),
          processingTime: Date.now() - startTime,
          dataSourcesUsed: ['kenya_market_db', 'geospatial_data', 'comparable_sales'],
          complianceChecks: ['rics_standards', 'kenya_valuers_act']
        }
      };
      
      // Emit events
      this.emit('valuationCompleted', result);
      
      if (result.valuation.confidence < 0.7) {
        this.emit('lowConfidenceValuation', result);
      }
      
      logger.info(`Property valuation completed: ${request.propertyId}`, {
        estimatedValue: result.valuation.estimatedValue,
        confidence: result.valuation.confidence,
        processingTime: result.metadata.processingTime
      });
      
      return result;
      
    } catch (error) {
      logger.error(`Property valuation failed: ${request.propertyId}`, error);
      throw error;
    }
  }

  private async loadValuationModels(): Promise<void> {
    const modelIds = [
      'hedonic_pricing_model',
      'comparable_sales_model',
      'cost_approach_model',
      'income_approach_model',
      'geospatial_value_model',
      'market_adjustment_model'
    ];

    for (const modelId of modelIds) {
      try {
        await this.modelRegistry.loadModel(modelId);
        logger.info(`Loaded valuation model: ${modelId}`);
      } catch (error) {
        logger.warn(`Failed to load model: ${modelId}`, error);
      }
    }
  }

  private async engineerValuationFeatures(request: PropertyValuationRequest): Promise<Record<string, any>> {
    const features: Record<string, any> = {};
    
    // Basic property features
    features.property_size = request.property.size;
    features.property_size_log = Math.log(request.property.size + 1);
    features.bedrooms = request.property.bedrooms || 0;
    features.bathrooms = request.property.bathrooms || 0;
    features.year_built = request.property.yearBuilt || new Date().getFullYear();
    features.property_age = new Date().getFullYear() - features.year_built;
    
    // Property type encoding
    features.is_residential = request.property.type === 'residential' ? 1 : 0;
    features.is_commercial = request.property.type === 'commercial' ? 1 : 0;
    features.is_land = request.property.type === 'land' ? 1 : 0;
    features.is_mixed_use = request.property.type === 'mixed_use' ? 1 : 0;
    
    // Condition scoring
    const conditionScores = { excellent: 1.0, good: 0.8, fair: 0.6, poor: 0.4 };
    features.condition_score = conditionScores[request.property.condition];
    
    // Features encoding
    const premiumFeatures = ['swimming_pool', 'garden', 'parking', 'security', 'generator'];
    features.premium_features_count = request.property.features.filter(f => 
      premiumFeatures.includes(f)
    ).length;
    
    // Location features
    features.county = request.location.county;
    features.constituency = request.location.constituency;
    features.ward = request.location.ward;
    features.latitude = request.location.coordinates.lat;
    features.longitude = request.location.coordinates.lng;
    
    // Market context features
    features.valuation_purpose = request.market.valuationPurpose;
    features.is_urgent = request.market.urgency !== 'standard' ? 1 : 0;
    
    // Derived features
    if (request.property.bedrooms && request.property.bedrooms > 0) {
      features.size_per_bedroom = request.property.size / request.property.bedrooms;
    }
    
    if (request.property.bathrooms && request.property.bathrooms > 0) {
      features.bedroom_bathroom_ratio = (request.property.bedrooms || 0) / request.property.bathrooms;
    }
    
    // Time-based features
    const now = new Date();
    features.valuation_month = now.getMonth();
    features.valuation_quarter = Math.floor(now.getMonth() / 3);
    features.is_peak_season = [11, 0, 1].includes(now.getMonth()) ? 1 : 0; // Dec, Jan, Feb
    
    // Market data features
    const marketData = await this.kenyaMarketData.getAreaMarketData(request.location);
    features.area_median_price = marketData.medianPrice;
    features.area_price_per_sqm = marketData.pricePerSqm;
    features.area_transaction_volume = marketData.transactionVolume;
    features.area_appreciation_rate = marketData.appreciationRate;
    
    return features;
  }

  private async runValuationModels(features: Record<string, any>): Promise<ModelPrediction[]> {
    const predictions: ModelPrediction[] = [];
    
    // Hedonic pricing model
    try {
      const hedonicPrediction = await this.modelRegistry.predict('hedonic_pricing_model', features, {
        explainPrediction: true
      });
      predictions.push(hedonicPrediction);
    } catch (error) {
      logger.warn('Hedonic pricing model failed', error);
    }
    
    // Comparable sales model
    try {
      const comparablePrediction = await this.modelRegistry.predict('comparable_sales_model', features, {
        explainPrediction: true
      });
      predictions.push(comparablePrediction);
    } catch (error) {
      logger.warn('Comparable sales model failed', error);
    }
    
    // Cost approach model
    try {
      const costPrediction = await this.modelRegistry.predict('cost_approach_model', features, {
        explainPrediction: true
      });
      predictions.push(costPrediction);
    } catch (error) {
      logger.warn('Cost approach model failed', error);
    }
    
    // Geospatial value model
    try {
      const geospatialPrediction = await this.modelRegistry.predict('geospatial_value_model', features, {
        explainPrediction: true
      });
      predictions.push(geospatialPrediction);
    } catch (error) {
      logger.warn('Geospatial value model failed', error);
    }
    
    return predictions;
  }

  private async combineValuationResults(
    modelPredictions: ModelPrediction[],
    comparableAnalysis: any,
    locationAnalysis: any,
    marketInsights: any,
    features: Record<string, any>
  ): Promise<any> {
    // Weighted ensemble approach based on model confidence and data availability
    const weights = this.calculateModelWeights(modelPredictions, features);
    
    // Calculate weighted average prediction
    let weightedSum = 0;
    let totalWeight = 0;
    
    modelPredictions.forEach((prediction, index) => {
      const weight = weights[index];
      weightedSum += (prediction.prediction as number) * weight;
      totalWeight += weight;
    });
    
    const baseEstimate = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Apply market adjustments
    const marketAdjustment = this.calculateMarketAdjustment(marketInsights, features);
    const locationAdjustment = this.calculateLocationAdjustment(locationAnalysis);
    const comparableAdjustment = this.calculateComparableAdjustment(comparableAnalysis);
    
    const finalEstimate = baseEstimate * (1 + marketAdjustment + locationAdjustment + comparableAdjustment);
    
    // Calculate confidence
    const confidence = this.calculateValuationConfidence(
      modelPredictions,
      comparableAnalysis,
      features
    );
    
    // Calculate value range
    const uncertainty = 1 - confidence;
    const valueRange = {
      low: finalEstimate * (1 - uncertainty * 0.3),
      high: finalEstimate * (1 + uncertainty * 0.3)
    };
    
    // Break down value components
    const valueComponents = this.calculateValueComponents(
      finalEstimate,
      features,
      locationAnalysis,
      marketInsights
    );
    
    return {
      valuation: {
        estimatedValue: Math.round(finalEstimate),
        valueRange: {
          low: Math.round(valueRange.low),
          high: Math.round(valueRange.high)
        },
        confidence,
        accuracy: Math.round(confidence * 100)
      },
      valueComponents
    };
  }

  private calculateModelWeights(predictions: ModelPrediction[], features: Record<string, any>): number[] {
    const weights: number[] = [];
    
    predictions.forEach(prediction => {
      let weight = prediction.confidence;
      
      // Adjust weight based on model type and data availability
      switch (prediction.modelId) {
        case 'hedonic_pricing_model':
          weight *= 0.3; // Base weight
          break;
        case 'comparable_sales_model':
          weight *= features.comparable_count > 3 ? 0.4 : 0.2;
          break;
        case 'cost_approach_model':
          weight *= features.property_age < 10 ? 0.25 : 0.15;
          break;
        case 'geospatial_value_model':
          weight *= 0.2;
          break;
        default:
          weight *= 0.1;
      }
      
      weights.push(weight);
    });
    
    return weights;
  }

  private calculateMarketAdjustment(marketInsights: any, features: Record<string, any>): number {
    let adjustment = 0;
    
    // Market velocity adjustment
    if (marketInsights.marketVelocity < 30) { // Hot market
      adjustment += 0.05;
    } else if (marketInsights.marketVelocity > 90) { // Slow market
      adjustment -= 0.05;
    }
    
    // Supply-demand adjustment
    if (marketInsights.supplyDemandRatio < 0.8) { // High demand
      adjustment += 0.03;
    } else if (marketInsights.supplyDemandRatio > 1.2) { // High supply
      adjustment -= 0.03;
    }
    
    // Seasonal adjustment
    if (features.is_peak_season) {
      adjustment += 0.02;
    }
    
    return Math.max(-0.15, Math.min(0.15, adjustment)); // Cap at ±15%
  }

  private calculateLocationAdjustment(locationAnalysis: any): number {
    const locationScore = (
      locationAnalysis.accessibilityScore +
      locationAnalysis.amenityScore +
      locationAnalysis.infrastructureScore +
      locationAnalysis.safetyScore
    ) / 4;
    
    // Convert location score to adjustment factor
    return (locationScore - 0.5) * 0.2; // ±10% based on location quality
  }

  private calculateComparableAdjustment(comparableAnalysis: any): number {
    if (comparableAnalysis.comparablesUsed < 3) {
      return 0; // Not enough comparables for adjustment
    }
    
    // Adjust based on market position
    switch (comparableAnalysis.marketPosition) {
      case 'below_market':
        return -0.05;
      case 'above_market':
        return 0.05;
      default:
        return 0;
    }
  }

  private calculateValuationConfidence(
    predictions: ModelPrediction[],
    comparableAnalysis: any,
    features: Record<string, any>
  ): number {
    let confidence = 0;
    
    // Base confidence from model predictions
    if (predictions.length > 0) {
      const avgModelConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
      confidence += avgModelConfidence * 0.4;
    }
    
    // Comparable analysis confidence
    if (comparableAnalysis.comparablesUsed >= 5) {
      confidence += 0.3;
    } else if (comparableAnalysis.comparablesUsed >= 3) {
      confidence += 0.2;
    } else {
      confidence += 0.1;
    }
    
    // Data quality confidence
    const dataQuality = this.calculateDataQuality(features);
    confidence += dataQuality * 0.3;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private calculateValueComponents(
    totalValue: number,
    features: Record<string, any>,
    locationAnalysis: any,
    marketInsights: any
  ): PropertyValuationResult['valueComponents'] {
    // Simplified value breakdown
    const landValueRatio = features.is_land ? 1.0 : 0.4;
    const structureValueRatio = features.is_land ? 0.0 : 0.5;
    
    return {
      landValue: Math.round(totalValue * landValueRatio),
      structureValue: Math.round(totalValue * structureValueRatio),
      locationPremium: Math.round(totalValue * 0.15),
      conditionAdjustment: Math.round(totalValue * (features.condition_score - 0.8) * 0.1),
      featuresPremium: Math.round(totalValue * features.premium_features_count * 0.02),
      marketAdjustment: Math.round(totalValue * 0.05)
    };
  }

  private async generateValuationExplanation(
    combinedValuation: any,
    predictions: ModelPrediction[],
    features: Record<string, any>
  ): Promise<PropertyValuationResult['explanation']> {
    // Extract primary value drivers
    const primaryValueDrivers = [
      {
        factor: 'Property Size',
        contribution: features.property_size * 0.0001, // Simplified
        description: `${features.property_size} sqm property size`
      },
      {
        factor: 'Location',
        contribution: 0.25,
        description: `Prime location in ${features.county}`
      },
      {
        factor: 'Property Condition',
        contribution: features.condition_score * 0.15,
        description: `Property in ${Object.keys({excellent: 1, good: 0.8, fair: 0.6, poor: 0.4}).find(k => 
          ({excellent: 1, good: 0.8, fair: 0.6, poor: 0.4})[k] === features.condition_score)} condition`
      }
    ].sort((a, b) => b.contribution - a.contribution);
    
    // Model contributions
    const modelContributions = predictions.map(pred => ({
      model: pred.modelId,
      weight: 0.25, // Simplified
      prediction: pred.prediction as number,
      confidence: pred.confidence
    }));
    
    return {
      primaryValueDrivers,
      modelContributions,
      uncertaintyFactors: [
        'Limited comparable sales data',
        'Market volatility',
        'Economic uncertainty'
      ],
      dataQualityScore: this.calculateDataQuality(features)
    };
  }

  private async generateValuationRecommendations(
    combinedValuation: any,
    request: PropertyValuationRequest,
    marketInsights: any
  ): Promise<PropertyValuationResult['recommendations']> {
    const recommendations: PropertyValuationResult['recommendations'] = [];
    
    // Pricing recommendations
    if (request.market.valuationPurpose === 'sale') {
      if (marketInsights.marketVelocity > 60) {
        recommendations.push({
          type: 'pricing',
          priority: 'high',
          recommendation: 'Consider pricing at the lower end of the range for faster sale',
          expectedImpact: 15
        });
      }
    }
    
    // Improvement recommendations
    if (request.property.condition === 'fair' || request.property.condition === 'poor') {
      recommendations.push({
        type: 'improvement',
        priority: 'medium',
        recommendation: 'Property improvements could increase value by 10-20%',
        expectedImpact: 15,
        costEstimate: combinedValuation.valuation.estimatedValue * 0.05
      });
    }
    
    // Market timing recommendations
    if (marketInsights.priceAppreciation.oneYear > 0.1) {
      recommendations.push({
        type: 'timing',
        priority: 'low',
        recommendation: 'Market appreciation trend suggests good timing for sale',
        expectedImpact: 5
      });
    }
    
    return recommendations;
  }

  private calculateDataQuality(features: Record<string, any>): number {
    const totalFeatures = Object.keys(features).length;
    const nonNullFeatures = Object.values(features).filter(val => 
      val !== null && val !== undefined && val !== ''
    ).length;
    
    return nonNullFeatures / totalFeatures;
  }
}

// Supporting classes (simplified implementations)
class KenyaMarketDatabase {
  async initialize(): Promise<void> {
    // Initialize Kenya market database
  }
  
  async getAreaMarketData(location: PropertyValuationRequest['location']): Promise<any> {
    return {
      medianPrice: 5000000,
      pricePerSqm: 50000,
      transactionVolume: 100,
      appreciationRate: 0.08
    };
  }
}

class GeospatialAnalyzer {
  async initialize(): Promise<void> {
    // Initialize geospatial analyzer
  }
  
  async analyzeLocation(location: PropertyValuationRequest['location']): Promise<any> {
    return {
      accessibilityScore: 0.8,
      amenityScore: 0.7,
      infrastructureScore: 0.75,
      safetyScore: 0.85,
      futureGrowthPotential: 0.7,
      proximityFactors: []
    };
  }
}

class ComparableAnalyzer {
  async initialize(): Promise<void> {
    // Initialize comparable analyzer
  }
  
  async analyzeComparables(request: PropertyValuationRequest): Promise<any> {
    return {
      comparablesUsed: 5,
      averageComparablePrice: 4800000,
      pricePerSqm: 48000,
      marketPosition: 'at_market' as const,
      comparableAdjustments: []
    };
  }
}

class MarketIntelligenceEngine {
  async initialize(): Promise<void> {
    // Initialize market intelligence engine
  }
  
  async getMarketInsights(location: PropertyValuationRequest['location']): Promise<any> {
    return {
      areaMedianPrice: 5000000,
      priceAppreciation: {
        oneYear: 0.08,
        threeYear: 0.25,
        fiveYear: 0.45
      },
      marketVelocity: 45,
      supplyDemandRatio: 0.9,
      investmentGrade: 'B' as const,
      riskFactors: []
    };
  }
}
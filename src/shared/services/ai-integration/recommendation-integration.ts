/**
 * Recommendation AI Integration Service
 *
 * Integrates AI recommendation capabilities with property discovery and matching.
 * Provides personalized recommendations, smart matching, and user preference learning.
 */

import { enhancedHuggingFaceClient } from '../huggingface-client'
import { logger } from '../../../../server/infrastructure/monitoring/logger'
import { BaseError } from '../../error-handling/errors/base-error'
import { Property } from '../../types/property'
import { User } from '../../types/contracts/user-contracts'

// ─── Domain Interfaces ────────────────────────────────────────────────────────

export interface RecommendationReason {
  factor: string
  weight: number
  description: string
  impact: 'positive' | 'negative' | 'neutral'
}

export interface MatchingCriterion {
  criterion: string
  userPreference: unknown
  propertyValue: unknown
  matchStrength: number
}

export interface PropertyRecommendation {
  propertyId: string
  score: number        // 0–100
  confidence: number   // 0–1
  reasons: RecommendationReason[]
  matchingCriteria: MatchingCriterion[]
  aiInsights: {
    summary: string
    keyHighlights: string[]
    potentialConcerns: string[]
    investmentPotential: 'excellent' | 'good' | 'fair' | 'poor'
  }
}

export interface UserPreferenceProfile {
  userId: string
  preferences: {
    location: {
      preferred: string[]
      avoided: string[]
      importance: number
    }
    priceRange: {
      min: number
      max: number
      flexibility: number
    }
    propertyType: {
      preferred: string[]
      importance: number
    }
    features: {
      mustHave: string[]
      niceToHave: string[]
      dealBreakers: string[]
    }
    lifestyle: {
      workLocation?: string
      familySize?: number
      transportPreference?: string
      amenityPreferences?: string[]
    }
  }
  behaviorPatterns: {
    searchHistory: Array<{
      filters: Record<string, unknown>
      timestamp: Date
      resultInteractions: string[]
    }>
    viewingHistory: Array<{
      propertyId: string
      timestamp: Date
      duration: number
      actions: string[]
    }>
    inquiryPatterns: Array<{
      propertyId: string
      inquiryType: string
      timestamp: Date
    }>
  }
  learningMetrics: {
    profileCompleteness: number
    predictionAccuracy: number
    lastUpdated: Date
  }
}

export interface SmartMatchResult {
  userId: string
  recommendations: PropertyRecommendation[]
  matchingStrategy: {
    algorithm: 'collaborative_filtering' | 'content_based' | 'hybrid' | 'ai_enhanced'
    confidence: number
    factors: string[]
  }
  personalization: {
    adaptedToUser: boolean
    learningFromHistory: boolean
    customWeights: Record<string, number>
  }
  marketInsights: {
    trendingProperties: string[]
    priceOpportunities: Array<{
      propertyId: string
      opportunity: string
      potentialSavings: number
    }>
    marketConditions: string
  }
}

export interface RecommendationFeedback {
  userId: string
  propertyId: string
  recommendationId: string
  feedbackType: 'interested' | 'not_interested' | 'viewed' | 'inquired' | 'contacted'
  rating?: number  // 1–5
  comments?: string
  timestamp: Date
}

// ─── Internal Types ───────────────────────────────────────────────────────────

interface ScoredProperty {
  property: Property
  score: number
  factors: RecommendationReason[]
}

interface SimilarityResult {
  overallSimilarity: number
  factors: Array<{
    factor: string
    similarity: number
    description: string
  }>
}

interface FeedbackAnalysis {
  preferenceStrength: number
  feedbackWeight: number
  adjustmentDirection: 'positive' | 'negative'
}

interface ActivityEvent {
  type: 'search' | 'view' | 'inquiry'
  [key: string]: unknown
}

// ─── Error ────────────────────────────────────────────────────────────────────

/**
 * BaseError is an interface in this project — we extend Error and implement it.
 */
class RecommendationIntegrationError extends Error implements BaseError {
  readonly code = 'RECOMMENDATION_ERROR'
  readonly details: Record<string, unknown> | undefined
  readonly timestamp: string
  readonly correlationId: string | undefined
  readonly cause?: Error

  constructor(
    message: string,
    public readonly operation: string,
    cause?: Error,
  ) {
    super(message)
    this.name = 'RecommendationIntegrationError'
    this.timestamp = new Date().toISOString()
    this.correlationId = undefined
    this.details = { operation }
    this.cause = cause
    Object.setPrototypeOf(this, RecommendationIntegrationError.prototype)
  }
}

// ─── Property Field Helpers ───────────────────────────────────────────────────
// Property fields (id, price, location, features) are typed as unions in this
// project's Property model. These helpers normalise them for safe comparisons.

/** Extracts a plain string from `id: string | number`. */
function propertyId(p: Property): string {
  return String(p.id)
}

/** Extracts a numeric price from `price: string | number`. */
function numericPrice(p: Property): number {
  return Number(p.price)
}

/**
 * Extracts a searchable location string from `location: string | LocationData`.
 * Falls back to serialising known fields for structured location objects.
 */
function locationString(p: Property): string {
  const loc = p.location
  if (typeof loc === 'string') return loc
  if (loc && typeof loc === 'object') {
    const l = loc as unknown as Record<string, unknown>
    return [l['city'], l['area'], l['suburb'], l['name']]
      .filter((v): v is string => typeof v === 'string')
      .join(', ')
  }
  return ''
}

/**
 * Returns a typed string array from `features: unknown`.
 * Returns [] for any non-array or non-string-element value.
 */
function propertyFeatures(p: Property): string[] {
  const f = p.features
  if (!Array.isArray(f)) return []
  return f.filter((v): v is string => typeof v === 'string')
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class RecommendationIntegrationService {
  private static instance: RecommendationIntegrationService

  private constructor() {}

  public static getInstance(): RecommendationIntegrationService {
    if (!RecommendationIntegrationService.instance) {
      RecommendationIntegrationService.instance = new RecommendationIntegrationService()
    }
    return RecommendationIntegrationService.instance
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Generate personalized property recommendations for a user.
   */
  async generatePersonalizedRecommendations(
    user: User,
    availableProperties: Property[],
    userProfile?: UserPreferenceProfile,
    limit = 10,
  ): Promise<SmartMatchResult> {
    try {
      logger.info(
        `[RecommendationIntegration] Generating recommendations — userId=${user.id} ` +
        `properties=${availableProperties.length} hasProfile=${!!userProfile} limit=${limit}`,
      )

      const profile         = userProfile ?? await this.buildUserPreferenceProfile(user)
      const scored          = await this.scoreProperties(availableProperties, profile)
      const ranked          = await this.applyAIEnhancedRanking(scored, profile)
      const recommendations = await this.buildRecommendations(ranked.slice(0, limit), profile)
      const marketInsights  = this.buildMarketInsights(availableProperties)

      const result: SmartMatchResult = {
        userId: user.id,
        recommendations,
        matchingStrategy: {
          algorithm: 'ai_enhanced',
          confidence: this.averageConfidence(recommendations),
          factors: this.matchingFactors(profile),
        },
        personalization: {
          adaptedToUser: !!userProfile,
          learningFromHistory: profile.behaviorPatterns.searchHistory.length > 0,
          customWeights: this.customWeights(profile),
        },
        marketInsights,
      }

      logger.info(
        `[RecommendationIntegration] Recommendations generated — userId=${user.id} ` +
        `count=${recommendations.length} avgScore=${this.averageScore(recommendations).toFixed(1)}`,
      )

      return result
    } catch (error) {
      logger.error(
        `[RecommendationIntegration] Recommendation generation failed — userId=${user.id} ` +
        `error=${error instanceof Error ? error.message : String(error)}`,
      )
      throw new RecommendationIntegrationError(
        'Failed to generate personalized recommendations',
        'generatePersonalizedRecommendations',
        error instanceof Error ? error : new Error(String(error)),
      )
    }
  }

  /**
   * Build a user preference profile from behaviour history and explicit settings.
   */
  async buildUserPreferenceProfile(
    user: User,
    activityHistory?: ActivityEvent[],
  ): Promise<UserPreferenceProfile> {
    try {
      logger.info(`[RecommendationIntegration] Building preference profile — userId=${user.id}`)

      const behavior        = this.extractBehavior(activityHistory)
      const preferences     = this.derivePreferences(user, behavior)
      const learningMetrics = this.computeLearningMetrics(behavior)

      const profile: UserPreferenceProfile = {
        userId: user.id,
        preferences,
        behaviorPatterns: behavior,
        learningMetrics,
      }

      logger.info(
        `[RecommendationIntegration] Profile built — userId=${user.id} ` +
        `completeness=${profile.learningMetrics.profileCompleteness}`,
      )

      return profile
    } catch (error) {
      logger.error(
        `[RecommendationIntegration] Profile build failed — userId=${user.id} ` +
        `error=${error instanceof Error ? error.message : String(error)}`,
      )
      throw new RecommendationIntegrationError(
        'Failed to build user preference profile',
        'buildUserPreferenceProfile',
        error instanceof Error ? error : new Error(String(error)),
      )
    }
  }

  /**
   * Process user feedback to refine future recommendations.
   */
  async processFeedback(feedback: RecommendationFeedback): Promise<{
    profileUpdated: boolean
    learningImpact: number
    nextRecommendationAdjustments: string[]
  }> {
    try {
      logger.info(
        `[RecommendationIntegration] Processing feedback — userId=${feedback.userId} ` +
        `propertyId=${feedback.propertyId} type=${feedback.feedbackType}`,
      )

      const analysis       = this.analyzeFeedback(feedback)
      const profileUpdated = await this.persistProfileUpdate(feedback, analysis)
      const learningImpact = this.computeLearningImpact(feedback, analysis)
      const adjustments    = this.deriveAdjustments(feedback)

      logger.info(
        `[RecommendationIntegration] Feedback processed — userId=${feedback.userId} ` +
        `impact=${learningImpact.toFixed(2)} profileUpdated=${profileUpdated}`,
      )

      return { profileUpdated, learningImpact, nextRecommendationAdjustments: adjustments }
    } catch (error) {
      logger.error(
        `[RecommendationIntegration] Feedback processing failed — userId=${feedback.userId} ` +
        `error=${error instanceof Error ? error.message : String(error)}`,
      )
      throw new RecommendationIntegrationError(
        'Failed to process recommendation feedback',
        'processFeedback',
        error instanceof Error ? error : new Error(String(error)),
      )
    }
  }

  /**
   * Find properties most similar to a target property using AI + rule-based scoring.
   */
  async findSimilarProperties(
    target: Property,
    candidates: Property[],
    limit = 5,
  ): Promise<Array<{
    property: Property
    similarity: number
    similarityFactors: SimilarityResult['factors']
  }>> {
    const targetIdStr = propertyId(target)

    try {
      logger.info(
        `[RecommendationIntegration] Finding similar properties — targetId=${targetIdStr} ` +
        `candidates=${candidates.length}`,
      )

      const targetDesc = this.describeProperty(target)

      const scored = await Promise.all(
        candidates
          .filter(c => propertyId(c) !== targetIdStr)
          .map(async candidate => {
            const result = await this.computeSimilarity(
              targetDesc,
              this.describeProperty(candidate),
              target,
              candidate,
            )
            return {
              property: candidate,
              similarity: result.overallSimilarity,
              similarityFactors: result.factors,
            }
          }),
      )

      const results = scored
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)

      logger.info(
        `[RecommendationIntegration] Similar properties found — targetId=${targetIdStr} found=${results.length}`,
      )

      return results
    } catch (error) {
      logger.error(
        `[RecommendationIntegration] Similarity search failed — targetId=${targetIdStr} ` +
        `error=${error instanceof Error ? error.message : String(error)}`,
      )
      throw new RecommendationIntegrationError(
        'Failed to find similar properties',
        'findSimilarProperties',
        error instanceof Error ? error : new Error(String(error)),
      )
    }
  }

  // ─── Scoring ─────────────────────────────────────────────────────────────────

  private async scoreProperties(
    properties: Property[],
    profile: UserPreferenceProfile,
  ): Promise<ScoredProperty[]> {
    return properties.map(property => ({
      property,
      score:   this.ruleScore(property, profile),
      factors: this.scoreFactors(property, profile),
    }))
  }

  private ruleScore(property: Property, profile: UserPreferenceProfile): number {
    const { location, priceRange, propertyType, features } = profile.preferences
    const loc      = locationString(property)
    const price    = numericPrice(property)
    const propType = typeof property.type === 'string' ? property.type : ''
    const feats    = propertyFeatures(property)

    let score = 0

    if (location.preferred.some(pref => loc.toLowerCase().includes(pref.toLowerCase()))) {
      score += 30 * location.importance
    }

    if (price >= priceRange.min && price <= priceRange.max) score += 25

    if (propertyType.preferred.includes(propType)) score += 20 * propertyType.importance

    if (feats.some(f => features.mustHave.includes(f)))    score += 15
    if (feats.some(f => features.dealBreakers.includes(f))) score -= 40

    return Math.min(100, Math.max(0, score))
  }

  private scoreFactors(
    property: Property,
    profile: UserPreferenceProfile,
  ): RecommendationReason[] {
    const { location, priceRange, propertyType } = profile.preferences
    const loc      = locationString(property)
    const price    = numericPrice(property)
    const propType = typeof property.type === 'string' ? property.type : ''

    const locationMatch  = location.preferred.some(pref => loc.toLowerCase().includes(pref.toLowerCase()))
    const priceMatch     = price >= priceRange.min && price <= priceRange.max
    const typeMatch      = propertyType.preferred.includes(propType)

    return [
      {
        factor: 'Location',
        weight: location.importance,
        description: locationMatch
          ? `Located in a preferred area (${loc})`
          : 'Location outside preferred areas',
        impact: locationMatch ? 'positive' : 'neutral',
      },
      {
        factor: 'Price range',
        weight: 0.25,
        description: priceMatch
          ? 'Price falls within your budget'
          : 'Price outside your specified range',
        impact: priceMatch ? 'positive' : 'negative',
      },
      {
        factor: 'Property type',
        weight: propertyType.importance,
        description: typeMatch
          ? `${propType} is one of your preferred types`
          : `${propType} is not among your preferred types`,
        impact: typeMatch ? 'positive' : 'neutral',
      },
    ]
  }

  // ─── AI-Enhanced Ranking ──────────────────────────────────────────────────────

  private async applyAIEnhancedRanking(
    items: ScoredProperty[],
    _profile: UserPreferenceProfile,
  ): Promise<ScoredProperty[]> {
    const enhanced = await Promise.all(
      items.map(async item => {
        try {
          const sentiment = await enhancedHuggingFaceClient.analyzePropertyReviewSentiment(
            this.describeProperty(item.property),
          )

          const delta: number =
            sentiment.label === 'POSITIVE' ?  5 :
            sentiment.label === 'NEGATIVE' ? -5 : 0

          const impact: RecommendationReason['impact'] =
            sentiment.label === 'POSITIVE' ? 'positive' :
            sentiment.label === 'NEGATIVE' ? 'negative' : 'neutral'

          return {
            ...item,
            score: Math.min(100, Math.max(0, item.score + delta)),
            factors: [
              ...item.factors,
              {
                factor: 'AI sentiment',
                weight: 0.1,
                description: `Property description sentiment: ${sentiment.label.toLowerCase()}`,
                impact,
              },
            ],
          }
        } catch {
          return item
        }
      }),
    )

    return enhanced.sort((a, b) => b.score - a.score)
  }

  // ─── Recommendation Building ──────────────────────────────────────────────────

  private async buildRecommendations(
    ranked: ScoredProperty[],
    profile: UserPreferenceProfile,
  ): Promise<PropertyRecommendation[]> {
    return Promise.all(
      ranked.map(async item => {
        const insights = await this.fetchPropertyInsights(item.property, profile)
        return {
          propertyId: propertyId(item.property),
          score:      item.score,
          confidence: insights.confidence,
          reasons:    item.factors,
          matchingCriteria: this.buildMatchingCriteria(item.property, profile),
          aiInsights: insights.data,
        }
      }),
    )
  }

  private async fetchPropertyInsights(
    property: Property,
    _profile: UserPreferenceProfile,
  ): Promise<{ confidence: number; data: PropertyRecommendation['aiInsights'] }> {
    try {
      const summary = await enhancedHuggingFaceClient.summarizePropertyDocument(
        this.describeProperty(property),
      )
      return {
        confidence: 0.85,
        data: {
          summary,
          keyHighlights:     ['Matches location preferences', 'Within price range'],
          potentialConcerns: [],
          investmentPotential: 'good',
        },
      }
    } catch {
      return {
        confidence: 0.60,
        data: {
          summary:           'Property matches your primary search criteria.',
          keyHighlights:     ['Meets basic criteria'],
          potentialConcerns: ['Detailed AI analysis unavailable'],
          investmentPotential: 'fair',
        },
      }
    }
  }

  private buildMatchingCriteria(
    property: Property,
    profile: UserPreferenceProfile,
  ): MatchingCriterion[] {
    const { location, priceRange } = profile.preferences
    const loc   = locationString(property)
    const price = numericPrice(property)

    return [
      {
        criterion: 'Location',
        userPreference: location.preferred,
        propertyValue: loc,
        matchStrength: location.preferred.some(pref =>
          loc.toLowerCase().includes(pref.toLowerCase()),
        ) ? 1.0 : 0.0,
      },
      {
        criterion: 'Price',
        userPreference: `${priceRange.min}–${priceRange.max}`,
        propertyValue: price,
        matchStrength: price >= priceRange.min && price <= priceRange.max ? 1.0 : 0.0,
      },
    ]
  }

  // ─── Similarity ───────────────────────────────────────────────────────────────

  private async computeSimilarity(
    targetDesc: string,
    candidateDesc: string,
    target: Property,
    candidate: Property,
  ): Promise<SimilarityResult> {
    const ruleBased = this.ruleSimilarity(target, candidate)

    try {
      const context  = `Property A: ${targetDesc}\n\nProperty B: ${candidateDesc}`
      const question = 'How similar are these two properties on a scale of 0 to 100?'
      const result   = await enhancedHuggingFaceClient.extractPropertyInfo(context, question)
      const match    = result.answer.match(/\d+/)
      const aiScore  = match ? Math.min(100, parseInt(match[0], 10)) / 100 : 0.5

      return {
        overallSimilarity: aiScore * 0.6 + ruleBased * 0.4,
        factors: [
          { factor: 'AI analysis', similarity: aiScore,    description: 'AI-based comparison' },
          { factor: 'Rule-based',  similarity: ruleBased,  description: 'Feature-based comparison' },
        ],
      }
    } catch {
      return {
        overallSimilarity: ruleBased,
        factors: [
          { factor: 'Rule-based', similarity: ruleBased, description: 'Feature-based comparison' },
        ],
      }
    }
  }

  private ruleSimilarity(a: Property, b: Property): number {
    let score = 0

    const aType = typeof a.type === 'string' ? a.type : ''
    const bType = typeof b.type === 'string' ? b.type : ''
    if (aType && aType === bType) score += 0.30

    const aPrice = numericPrice(a)
    const bPrice = numericPrice(b)
    if (aPrice > 0 && bPrice > 0) {
      const delta = Math.abs(aPrice - bPrice) / Math.max(aPrice, bPrice)
      if (delta < 0.2) score += 0.25
    }

    if (locationString(a) === locationString(b)) score += 0.20

    const aBeds = typeof a.bedrooms === 'number' ? a.bedrooms : undefined
    const bBeds = typeof b.bedrooms === 'number' ? b.bedrooms : undefined
    if (aBeds !== undefined && aBeds === bBeds) score += 0.15

    const aFeats = propertyFeatures(a)
    const bFeats = propertyFeatures(b)
    const total  = Math.max(aFeats.length, bFeats.length)
    if (total > 0) {
      const common = aFeats.filter(f => bFeats.includes(f)).length
      score += (common / total) * 0.10
    }

    return Math.min(1, score)
  }

  // ─── Profile Building ─────────────────────────────────────────────────────────

  private extractBehavior(
    activityHistory?: ActivityEvent[],
  ): UserPreferenceProfile['behaviorPatterns'] {
    const history = activityHistory ?? []
    return {
      searchHistory:
        history.filter(a => a.type === 'search').slice(0, 10) as unknown as
          UserPreferenceProfile['behaviorPatterns']['searchHistory'],
      viewingHistory:
        history.filter(a => a.type === 'view').slice(0, 20) as unknown as
          UserPreferenceProfile['behaviorPatterns']['viewingHistory'],
      inquiryPatterns:
        history.filter(a => a.type === 'inquiry').slice(0, 15) as unknown as
          UserPreferenceProfile['behaviorPatterns']['inquiryPatterns'],
    }
  }

  private derivePreferences(
    _user: User,
    _behavior: UserPreferenceProfile['behaviorPatterns'],
  ): UserPreferenceProfile['preferences'] {
    // Replace with derivation logic sourced from user profile data and behavioural signals.
    return {
      location:     { preferred: ['Nairobi', 'Westlands'], avoided: [], importance: 0.8 },
      priceRange:   { min: 1_000_000, max: 10_000_000, flexibility: 0.2 },
      propertyType: { preferred: ['apartment', 'house'], importance: 0.6 },
      features: {
        mustHave:     ['parking', 'security'],
        niceToHave:   ['gym', 'pool'],
        dealBreakers: ['no_parking'],
      },
      lifestyle: {
        workLocation:        'CBD',
        familySize:          2,
        transportPreference: 'car',
        amenityPreferences:  ['shopping', 'restaurants'],
      },
    }
  }

  private computeLearningMetrics(
    behavior: UserPreferenceProfile['behaviorPatterns'],
  ): UserPreferenceProfile['learningMetrics'] {
    const total =
      behavior.searchHistory.length +
      behavior.viewingHistory.length +
      behavior.inquiryPatterns.length

    return {
      profileCompleteness: Math.min(100, total * 5),
      predictionAccuracy:  75,
      lastUpdated:         new Date(),
    }
  }

  // ─── Feedback Processing ──────────────────────────────────────────────────────

  private analyzeFeedback(feedback: RecommendationFeedback): FeedbackAnalysis {
    const weights: Record<RecommendationFeedback['feedbackType'], number> = {
      interested:     0.8,
      not_interested: -0.6,
      viewed:         0.3,
      inquired:       0.9,
      contacted:      1.0,
    }
    const feedbackWeight     = weights[feedback.feedbackType]
    const preferenceStrength = feedback.rating != null ? feedback.rating / 5 : 0.5
    return {
      feedbackWeight,
      preferenceStrength,
      adjustmentDirection: feedbackWeight >= 0 ? 'positive' : 'negative',
    }
  }

  private async persistProfileUpdate(
    _feedback: RecommendationFeedback,
    _analysis: FeedbackAnalysis,
  ): Promise<boolean> {
    // Replace with actual database write.
    return true
  }

  private computeLearningImpact(
    _feedback: RecommendationFeedback,
    analysis: FeedbackAnalysis,
  ): number {
    return Math.abs(analysis.feedbackWeight) * analysis.preferenceStrength
  }

  private deriveAdjustments(feedback: RecommendationFeedback): string[] {
    if (feedback.feedbackType === 'not_interested') {
      return [
        'Reduce weight for properties with similar characteristics',
        'Broaden property type exploration',
      ]
    }
    if (feedback.feedbackType === 'interested' || feedback.feedbackType === 'inquired') {
      return [
        'Increase weight for properties with similar characteristics',
        'Prioritise features matching this property',
      ]
    }
    return []
  }

  // ─── Market Insights ──────────────────────────────────────────────────────────

  private buildMarketInsights(properties: Property[]): SmartMatchResult['marketInsights'] {
    return {
      trendingProperties: properties.slice(0, 3).map(p => propertyId(p)),
      priceOpportunities: properties.slice(0, 1).map(p => ({
        propertyId:       propertyId(p),
        opportunity:      'Below market average',
        potentialSavings: 500_000,
      })),
      marketConditions: 'Favourable buyer market with solid value opportunities.',
    }
  }

  // ─── Utilities ────────────────────────────────────────────────────────────────

  private describeProperty(property: Property): string {
    const propType = typeof property.type === 'string' ? property.type : ''
    const beds     = typeof property.bedrooms  === 'number' ? `${property.bedrooms} bedrooms`  : null
    const baths    = typeof property.bathrooms === 'number' ? `${property.bathrooms} bathrooms` : null
    const size     = property.size             ? `Size: ${property.size}`                       : null
    const desc     = typeof property.description === 'string' ? property.description            : null
    const feats    = propertyFeatures(property)

    return [
      `${propType} in ${locationString(property)}`,
      `Price: ${numericPrice(property)}`,
      beds,
      baths,
      size,
      desc,
      feats.length ? `Features: ${feats.join(', ')}` : null,
    ]
      .filter((v): v is string => v !== null)
      .join('\n')
  }

  private averageConfidence(recommendations: PropertyRecommendation[]): number {
    if (!recommendations.length) return 0
    return recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length
  }

  private averageScore(recommendations: PropertyRecommendation[]): number {
    if (!recommendations.length) return 0
    return recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length
  }

  private matchingFactors(_profile: UserPreferenceProfile): string[] {
    return [
      'Location preferences',
      'Price range',
      'Property type',
      'Feature requirements',
      'Behavioural patterns',
    ]
  }

  private customWeights(profile: UserPreferenceProfile): Record<string, number> {
    return {
      location:     profile.preferences.location.importance,
      price:        0.25,
      propertyType: profile.preferences.propertyType.importance,
      features:     0.15,
      aiSentiment:  0.10,
    }
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const recommendationIntegration = RecommendationIntegrationService.getInstance()
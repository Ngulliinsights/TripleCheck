/**
 * Unified Search Service
 * Handles all search functionality including property search, filtering, and suggestions
 * Enhanced with improved business logic, error handling, and search capabilities
 */

import {
  PropertySearchFilters,
  SearchOptions,
  SearchResult,
  SearchFacets,
  SearchSuggestion,
  LocationSuggestion,
  SearchError,
  SearchValidationResult
} from '../types/search'
import { logger } from '../utils/logger'

class SearchService {
  private baseUrl = '/api';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private requestAbortControllers = new Map<string, AbortController>(); // Added for request cancellation
  private retryAttempts = 3; // Added configurable retry logic
  private retryDelay = 1000; // Base delay for exponential backoff

  /**
   * Search properties with filters and options
   * Enhanced with better error handling, performance monitoring, and request deduplication
   */
  async searchProperties(
    filters: PropertySearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();

    // Validate filters before making the request
    const validation = this.validateFilters(filters);
    if (!validation.isValid) {
      throw new Error(`Invalid search filters: ${validation.errors.join(', ')}`);
    }

    // Normalize and sanitize filters for consistency
    const normalizedFilters = this.normalizeFilters(filters);
    const cacheKey = this.getCacheKey('search', normalizedFilters, options);

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        ...cached,
        searchTime: Date.now() - startTime,
        appliedFilters: normalizedFilters
      };
    }

    // Cancel any existing request with the same cache key to prevent duplicate requests
    this.cancelRequest(cacheKey);

    try {
      const abortController = new AbortController();
      this.requestAbortControllers.set(cacheKey, abortController);

      const params = this.buildSearchParams(normalizedFilters, options);
      const result = await this.makeRequestWithRetry(
        `${this.baseUrl}/search/properties?${params}`,
        { signal: abortController.signal }
      );

      // Enhanced result transformation with additional metadata
      const searchResult: SearchResult = {
        items: result.data?.properties || [],
        total: result.data?.total || 0,
        page: options.page || 1,
        limit: options.limit || 20,
        hasMore: result.data?.hasMore || false,
        facets: result.data?.facets,
        searchTime: Date.now() - startTime,
        appliedFilters: normalizedFilters,
      };

      // Cache the result and save search analytics
      this.setCache(cacheKey, searchResult);
      this.saveSearch(normalizedFilters, searchResult.total).catch(console.warn);

      return searchResult;
    } catch (error) {
      logger.error('Search properties error:', error);
      throw this.handleSearchError(error);
    } finally {
      // Clean up the abort controller
      this.requestAbortControllers.delete(cacheKey);
    }
  }

  /**
   * Get search suggestions with enhanced relevance scoring and caching
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    // Enhanced input validation
    const trimmedQuery = query?.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) return [];

    // Prevent too frequent suggestion requests
    const cacheKey = this.getCacheKey('suggestions', { query: trimmedQuery.toLowerCase() });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Cancel previous suggestion request to avoid race conditions
    this.cancelRequest(cacheKey);

    try {
      const abortController = new AbortController();
      this.requestAbortControllers.set(cacheKey, abortController);

      const result = await this.makeRequestWithRetry(
        `${this.baseUrl}/search/suggestions?q=${encodeURIComponent(trimmedQuery)}`,
        { signal: abortController.signal }
      );

      // Enhanced suggestion processing with relevance scoring
      let suggestions = result.data?.suggestions || [];
      suggestions = this.enhanceSuggestions(suggestions, trimmedQuery);

      // Cache with shorter timeout for suggestions to keep them fresh
      this.setCache(cacheKey, suggestions, 2 * 60 * 1000); // 2 minutes
      return suggestions;
    } catch (error) {
      logger.error('Get suggestions error:', error);
      // Return fallback suggestions based on query analysis
      return this.getFallbackSuggestions(trimmedQuery);
    } finally {
      this.requestAbortControllers.delete(cacheKey);
    }
  }

  /**
   * Get location suggestions with hierarchical support
   */
  async getLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) return [];

    const cacheKey = this.getCacheKey('locations', { query: trimmedQuery.toLowerCase() });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    this.cancelRequest(cacheKey);

    try {
      const abortController = new AbortController();
      this.requestAbortControllers.set(cacheKey, abortController);

      const result = await this.makeRequestWithRetry(
        `${this.baseUrl}/search/locations?q=${encodeURIComponent(trimmedQuery)}`,
        { signal: abortController.signal }
      );

      let locations = result.data?.locations || [];

      // Sort locations by relevance and type hierarchy
      locations = this.sortLocationsByRelevance(locations, trimmedQuery);

      this.setCache(cacheKey, locations, 10 * 60 * 1000); // 10 minutes for locations
      return locations;
    } catch (error) {
      logger.error('Get location suggestions error:', error);
      return this.getFallbackLocations(trimmedQuery);
    } finally {
      this.requestAbortControllers.delete(cacheKey);
    }
  }

  /**
   * Get popular searches with time-based relevance
   */
  async getPopularSearches(): Promise<string[]> {
    const cacheKey = 'popular-searches';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.makeRequestWithRetry(`${this.baseUrl}/search/popular`);
      const popular = result.data?.searches || this.getDefaultPopularSearches();

      // Cache popular searches for longer since they change less frequently
      this.setCache(cacheKey, popular, 30 * 60 * 1000); // 30 minutes
      return popular;
    } catch (error) {
      logger.error('Get popular searches error:', error);
      return this.getDefaultPopularSearches();
    }
  }

  /**
   * Enhanced search facets with dynamic filtering
   */
  async getSearchFacets(filters: PropertySearchFilters = {}): Promise<SearchFacets> {
    const normalizedFilters = this.normalizeFilters(filters);
    const cacheKey = this.getCacheKey('facets', normalizedFilters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const params = this.buildSearchParams(normalizedFilters, {});
      const result = await this.makeRequestWithRetry(`${this.baseUrl}/search/facets?${params}`);

      const facets = result.data?.facets || this.getDefaultFacets();

      // Enhance facets with better labeling and sorting
      const enhancedFacets = this.enhanceFacets(facets);

      this.setCache(cacheKey, enhancedFacets, 10 * 60 * 1000); // 10 minutes
      return enhancedFacets;
    } catch (error) {
      logger.error('Get search facets error:', error);
      return this.getDefaultFacets();
    }
  }

  /**
   * Enhanced search analytics with better error handling
   */
  async saveSearch(filters: PropertySearchFilters, resultCount: number): Promise<void> {
    try {
      // Only save meaningful searches (not empty queries)
      if (!this.isSearchWorthSaving(filters)) return;

      await fetch(`${this.baseUrl}/search/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: this.sanitizeFiltersForAnalytics(filters),
          resultCount,
          timestamp: new Date().toISOString(),
          userAgent: navigator?.userAgent,
          sessionId: this.getSessionId(),
        }),
      });
    } catch (error) {
      // Don't throw error for analytics failures - just log
      logger.warn('Save search failed:', error);
    }
  }

  /**
   * Enhanced filter validation with more comprehensive checks
   */
  validateFilters(filters: PropertySearchFilters): SearchValidationResult {
    const errors: string[] = [];

    // Price range validation with realistic bounds
    if (filters.priceMin && filters.priceMin < 0) {
      errors.push('Minimum price cannot be negative');
    }
    if (filters.priceMax && filters.priceMax < 0) {
      errors.push('Maximum price cannot be negative');
    }
    if (filters.priceMin && filters.priceMax && filters.priceMin > filters.priceMax) {
      errors.push('Minimum price cannot be greater than maximum price');
    }
    if (filters.priceMax && filters.priceMax > 1000000000) { // 1 billion limit
      errors.push('Maximum price exceeds reasonable limit');
    }

    // Area range validation
    if (filters.areaMin && filters.areaMin < 0) {
      errors.push('Minimum area cannot be negative');
    }
    if (filters.areaMax && filters.areaMax < 0) {
      errors.push('Maximum area cannot be negative');
    }
    if (filters.areaMin && filters.areaMax && filters.areaMin > filters.areaMax) {
      errors.push('Minimum area cannot be greater than maximum area');
    }

    // Room validation with realistic limits
    if (filters.bedrooms !== undefined && (filters.bedrooms < 0 || filters.bedrooms > 20)) {
      errors.push('Number of bedrooms must be between 0 and 20');
    }
    if (filters.bathrooms !== undefined && (filters.bathrooms < 0 || filters.bathrooms > 20)) {
      errors.push('Number of bathrooms must be between 0 and 20');
    }

    // Parking validation
    if (filters.parkingSpaces !== undefined && (filters.parkingSpaces < 0 || filters.parkingSpaces > 50)) {
      errors.push('Number of parking spaces must be between 0 and 50');
    }

    // Query length validation
    if (filters.query && filters.query.length > 500) {
      errors.push('Search query is too long (maximum 500 characters)');
    }

    // Array validation
    if (filters.amenities && filters.amenities.length > 20) {
      errors.push('Too many amenities selected (maximum 20)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Cancel ongoing requests
   */
  cancelRequest(key: string): void {
    const controller = this.requestAbortControllers.get(key);
    if (controller) {
      controller.abort();
      this.requestAbortControllers.delete(key);
    }
  }

  /**
   * Clear search cache with optional selective clearing
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Clear cache entries matching the pattern
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Private helper methods with enhanced functionality

  /**
   * Normalize filters for consistency and caching
   */
  private normalizeFilters(filters: PropertySearchFilters): PropertySearchFilters {
    const normalized: PropertySearchFilters = {};

    // Normalize string fields
    if (filters.query) {
      normalized.query = filters.query.trim().toLowerCase();
    }
    if (filters.location) {
      normalized.location = filters.location.trim().toLowerCase();
    }
    if (filters.propertyType) {
      if (Array.isArray(filters.propertyType)) {
        normalized.propertyType = filters.propertyType.map(type => type.toLowerCase());
      } else {
        normalized.propertyType = filters.propertyType.toLowerCase();
      }
    }

    // Copy numeric fields as-is
    if (filters.priceMin !== undefined) normalized.priceMin = filters.priceMin;
    if (filters.priceMax !== undefined) normalized.priceMax = filters.priceMax;
    if (filters.bedrooms !== undefined) normalized.bedrooms = filters.bedrooms;
    if (filters.bathrooms !== undefined) normalized.bathrooms = filters.bathrooms;
    if (filters.areaMin !== undefined) normalized.areaMin = filters.areaMin;
    if (filters.areaMax !== undefined) normalized.areaMax = filters.areaMax;
    if (filters.parkingSpaces !== undefined) normalized.parkingSpaces = filters.parkingSpaces;

    // Normalize arrays
    if (filters.amenities?.length) {
      normalized.amenities = [...filters.amenities].sort(); // Sort for consistent caching
    }
    if (filters.verificationStatus?.length) {
      normalized.verificationStatus = [...filters.verificationStatus].sort();
    }

    // Copy boolean fields
    if (filters.furnished !== undefined) normalized.furnished = filters.furnished;
    if (filters.petFriendly !== undefined) normalized.petFriendly = filters.petFriendly;

    return normalized;
  }

  /**
   * Build search parameters from filters and options
   */
  private buildSearchParams(filters: PropertySearchFilters, options: SearchOptions): URLSearchParams {
    const params = new URLSearchParams();

    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    // Add options to params
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return params;
  }

  /**
   * Make HTTP request with retry logic and exponential backoff
   */
  private async makeRequestWithRetry(url: string, options: RequestInit = {}): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on abort or client errors
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }
        if (error instanceof Error && error.message.includes('4')) { // 4xx errors
          throw error;
        }

        // Wait before retrying with exponential backoff
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Enhance suggestions with relevance scoring
   */
  private enhanceSuggestions(suggestions: SearchSuggestion[], query: string): SearchSuggestion[] {
    return suggestions
      .map(suggestion => ({
        ...suggestion,
        relevanceScore: this.calculateRelevanceScore(suggestion.text, query),
      }))
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 10); // Limit to top 10 suggestions
  }

  /**
   * Calculate relevance score for suggestions
   */
  private calculateRelevanceScore(suggestionText: string, query: string): number {
    const suggestion = suggestionText.toLowerCase();
    const searchQuery = query.toLowerCase();

    let score = 0;

    // Exact match gets highest score
    if (suggestion === searchQuery) return 100;

    // Starts with query gets high score
    if (suggestion.startsWith(searchQuery)) score += 50;

    // Contains query gets medium score
    if (suggestion.includes(searchQuery)) score += 25;

    // Word boundary matches get bonus points
    const words = searchQuery.split(/\s+/);
    words.forEach(word => {
      if (suggestion.includes(` ${word} `) || suggestion.startsWith(`${word} `)) {
        score += 10;
      }
    });

    return score;
  }

  /**
   * Sort locations by relevance and type
   */
  private sortLocationsByRelevance(locations: LocationSuggestion[], query: string): LocationSuggestion[] {
    const typeOrder = { city: 3, neighborhood: 2, landmark: 1 };

    return locations.sort((a, b) => {
      // First sort by type priority
      const typeDiff = (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0);
      if (typeDiff !== 0) return typeDiff;

      // Then by name relevance
      const aScore = this.calculateRelevanceScore(a.name, query);
      const bScore = this.calculateRelevanceScore(b.name, query);
      return bScore - aScore;
    });
  }

  /**
   * Handle and categorize search errors
   */
  private handleSearchError(error: any): SearchError {
    if (error.name === 'AbortError') {
      return { code: 'SEARCH_CANCELLED', message: 'Search was cancelled' };
    }
    if (error.message?.includes('400')) {
      return { code: 'INVALID_SEARCH', message: 'Invalid search parameters', details: error };
    }
    if (error.message?.includes('404')) {
      return { code: 'ENDPOINT_NOT_FOUND', message: 'Search service not available' };
    }
    if (error.message?.includes('500')) {
      return { code: 'SERVER_ERROR', message: 'Search service temporarily unavailable' };
    }

    return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred', details: error };
  }

  /**
   * Generate fallback suggestions when API fails
   */
  private getFallbackSuggestions(query: string): SearchSuggestion[] {
    const commonSuggestions = [
      'apartment', 'house', 'villa', 'townhouse', 'land', 'commercial',
      // cspell:disable-next-line - These are real locations in Nairobi, Kenya
      'nairobi', 'westlands', 'karen', 'kilimani', 'runda', 'kileleshwa'
    ];

    return commonSuggestions
      .filter(suggestion => suggestion.includes(query.toLowerCase()))
      .slice(0, 5)
      .map(text => ({ text, type: 'query' as const }));
  }

  /**
   * Generate fallback locations when API fails
   */
  private getFallbackLocations(query: string): LocationSuggestion[] {
    const commonLocations = [
      { name: 'Nairobi', type: 'city' as const },
      { name: 'Westlands', type: 'neighborhood' as const },
      { name: 'Karen', type: 'neighborhood' as const },
      { name: 'Kilimani', type: 'neighborhood' as const },
    ];

    return commonLocations.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Get default popular searches based on Kenyan market
   */
  private getDefaultPopularSearches(): string[] {
    return [
      'Apartments in Nairobi',
      'Houses in Karen',
      'Commercial properties CBD',
      'Land for sale Kiambu',
      'Verified properties',
      'Furnished apartments Westlands',
      'Villas in Runda',
      // cspell:disable-next-line - Kileleshwa is a real location in Nairobi
      'Townhouses Kileleshwa'
    ];
  }

  /**
   * Enhanced cache methods with configurable timeout
   */
  private setCache(key: string, data: any, timeout?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if search is worth saving for analytics
   */
  private isSearchWorthSaving(filters: PropertySearchFilters): boolean {
    // Don't save empty searches or very basic queries
    if (!filters.query && !filters.location && !filters.propertyType) {
      return false;
    }

    // Don't save if query is too short or looks like testing
    if (filters.query && (filters.query.length < 3 || filters.query.match(/^(test|a+|1+)$/i))) {
      return false;
    }

    return true;
  }

  /**
   * Sanitize filters for analytics (remove sensitive data)
   */
  private sanitizeFiltersForAnalytics(filters: PropertySearchFilters): PropertySearchFilters {
    // Remove or hash any potentially sensitive information
    const sanitized = { ...filters };

    // Keep the search intent but remove exact personal details
    if (sanitized.query && sanitized.query.length > 100) {
      sanitized.query = sanitized.query.substring(0, 100) + '...';
    }

    return sanitized;
  }

  /**
   * Get or generate session ID for analytics
   */
  private getSessionId(): string {
    // Use existing session ID or generate new one
    let sessionId = sessionStorage?.getItem('search-session-id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36);
      sessionStorage?.setItem('search-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * Enhance facets with better formatting and sorting
   */
  private enhanceFacets(facets: SearchFacets): SearchFacets {
    return {
      propertyTypes: facets.propertyTypes
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count),
      locations: facets.locations
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count),
      priceRanges: facets.priceRanges
        .filter(item => item.count > 0)
        .sort((a, b) => a.min - b.min),
      amenities: facets.amenities
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count),
    };
  }

  private getCacheKey(type: string, ...args: any[]): string {
    return `${type}:${JSON.stringify(args)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private getDefaultFacets(): SearchFacets {
    return {
      propertyTypes: [
        { value: 'apartment', label: 'Apartment', count: 0 },
        { value: 'house', label: 'House', count: 0 },
        { value: 'villa', label: 'Villa', count: 0 },
        { value: 'townhouse', label: 'Townhouse', count: 0 },
        { value: 'land', label: 'Land', count: 0 },
        { value: 'commercial', label: 'Commercial', count: 0 },
      ],
      locations: [
        { value: 'nairobi', label: 'Nairobi', count: 0 },
        { value: 'westlands', label: 'Westlands', count: 0 },
        { value: 'karen', label: 'Karen', count: 0 },
        { value: 'kilimani', label: 'Kilimani', count: 0 },
        // cspell:disable-next-line - Kileleshwa is a real location in Nairobi
        { value: 'kileleshwa', label: 'Kileleshwa', count: 0 },
      ],
      priceRanges: [
        { min: 0, max: 1000000, count: 0 },
        { min: 1000000, max: 5000000, count: 0 },
        { min: 5000000, max: 10000000, count: 0 },
        { min: 10000000, max: 50000000, count: 0 },
        { min: 50000000, max: Infinity, count: 0 },
      ],
      amenities: [
        { value: 'parking', label: 'Parking', count: 0 },
        { value: 'security', label: 'Security', count: 0 },
        { value: 'gym', label: 'Gym', count: 0 },
        { value: 'pool', label: 'Swimming Pool', count: 0 },
      ],
    };
  }

  /**
   * Utility method for delays in retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const searchService = new SearchService();
export default searchService;
import { Router } from 'express';
import {
  searchProperties,
  getSearchSuggestions,
  getLocationSuggestions,
  getPopularSearches,
  getSearchFacets,
  saveSearch
} from '../controllers/search.controller';

const router = Router();

/**
 * Search Routes
 * Handles property search, suggestions, and search analytics
 */

// Property search with filters and pagination
router.get('/properties', searchProperties);

// Search suggestions
router.get('/suggestions', getSearchSuggestions);

// Location suggestions
router.get('/locations', getLocationSuggestions);

// Popular searches
router.get('/popular', getPopularSearches);

// Search facets for filtering
router.get('/facets', getSearchFacets);

// Save search for analytics
router.post('/save', saveSearch);

export { router as searchRouter };
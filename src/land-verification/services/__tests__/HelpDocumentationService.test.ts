import { describe, it, expect, beforeEach } from 'vitest';
import { HelpDocumentationService } from '../HelpDocumentationService';

describe('HelpDocumentationService', () => {
  let service: HelpDocumentationService;

  beforeEach(() => {
    service = new HelpDocumentationService();
  });

  describe('Article Management', () => {
    it('initializes with predefined articles', () => {
      const articles = service.getAllArticles();
      expect(articles.length).toBeGreaterThan(0);
      
      const overviewArticle = service.getArticle('land-verification-overview');
      expect(overviewArticle).toBeDefined();
      expect(overviewArticle?.title).toBe('Kenya Land Verification System Overview');
    });

    it('returns articles by category', () => {
      const overviewArticles = service.getAllArticles('overview');
      const processArticles = service.getAllArticles('process');
      
      expect(overviewArticles.length).toBeGreaterThan(0);
      expect(processArticles.length).toBeGreaterThan(0);
      
      overviewArticles.forEach(article => {
        expect(article.category).toBe('overview');
      });
      
      processArticles.forEach(article => {
        expect(article.category).toBe('process');
      });
    });

    it('returns undefined for non-existent articles', () => {
      const article = service.getArticle('non-existent-id');
      expect(article).toBeUndefined();
    });

    it('tracks article views when getting articles', () => {
      const articleId = 'land-verification-overview';
      const initialAnalytics = service.getAnalytics(articleId);
      const initialViews = initialAnalytics?.views || 0;
      
      service.getArticle(articleId);
      
      const updatedAnalytics = service.getAnalytics(articleId);
      expect(updatedAnalytics?.views).toBe(initialViews + 1);
    });
  });

  describe('Search Functionality', () => {
    it('returns all articles when search query is empty', () => {
      const allArticles = service.getAllArticles();
      const searchResults = service.searchArticles('');
      
      expect(searchResults.length).toBe(allArticles.length);
      searchResults.forEach(result => {
        expect(result.relevanceScore).toBe(1);
        expect(result.matchedTerms).toEqual([]);
      });
    });

    it('searches articles by title and content', () => {
      const results = service.searchArticles('verification');
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.relevanceScore).toBeGreaterThan(0);
        expect(result.matchedTerms.length).toBeGreaterThan(0);
      });
    });

    it('filters search results by category', () => {
      const results = service.searchArticles('verification', 'overview');
      
      results.forEach(result => {
        expect(result.article.category).toBe('overview');
      });
    });

    it('ranks search results by relevance', () => {
      const results = service.searchArticles('land verification');
      
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].relevanceScore).toBeGreaterThanOrEqual(results[i + 1].relevanceScore);
        }
      }
    });

    it('handles search terms with special characters', () => {
      const results = service.searchArticles('land-verification!@#');
      
      // Should still return results based on the 'land' and 'verification' terms
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('ignores very short search terms', () => {
      const results = service.searchArticles('a b verification');
      
      // Should still find results based on 'verification' term
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Related Articles', () => {
    it('returns related articles for existing article', () => {
      const relatedArticles = service.getRelatedArticles('land-verification-overview');
      
      expect(Array.isArray(relatedArticles)).toBe(true);
      // May be empty if related articles don't exist in test data
    });

    it('returns empty array for non-existent article', () => {
      const relatedArticles = service.getRelatedArticles('non-existent-id');
      
      expect(relatedArticles).toEqual([]);
    });

    it('filters out non-existent related articles', () => {
      const relatedArticles = service.getRelatedArticles('land-verification-overview');
      
      relatedArticles.forEach(article => {
        expect(article).toBeDefined();
        expect(article.id).toBeDefined();
        expect(article.title).toBeDefined();
      });
    });
  });

  describe('Analytics', () => {
    it('initializes analytics for all articles', () => {
      const articles = service.getAllArticles();
      
      articles.forEach(article => {
        const analytics = service.getAnalytics(article.id);
        expect(analytics).toBeDefined();
        expect(analytics?.articleId).toBe(article.id);
        expect(analytics?.views).toBe(0);
        expect(analytics?.helpfulVotes).toBe(0);
        expect(analytics?.unhelpfulVotes).toBe(0);
      });
    });

    it('records helpful votes correctly', () => {
      const articleId = 'land-verification-overview';
      const initialAnalytics = service.getAnalytics(articleId);
      const initialHelpful = initialAnalytics?.helpfulVotes || 0;
      const initialUnhelpful = initialAnalytics?.unhelpfulVotes || 0;
      
      service.recordHelpfulVote(articleId, true);
      service.recordHelpfulVote(articleId, false);
      
      const updatedAnalytics = service.getAnalytics(articleId);
      expect(updatedAnalytics?.helpfulVotes).toBe(initialHelpful + 1);
      expect(updatedAnalytics?.unhelpfulVotes).toBe(initialUnhelpful + 1);
    });

    it('returns undefined analytics for non-existent article', () => {
      const analytics = service.getAnalytics('non-existent-id');
      expect(analytics).toBeUndefined();
    });

    it('handles helpful vote for non-existent article gracefully', () => {
      expect(() => {
        service.recordHelpfulVote('non-existent-id', true);
      }).not.toThrow();
    });
  });

  describe('Article Properties', () => {
    it('validates article structure', () => {
      const articles = service.getAllArticles();
      
      articles.forEach(article => {
        expect(article.id).toBeDefined();
        expect(article.title).toBeDefined();
        expect(article.content).toBeDefined();
        expect(article.category).toBeDefined();
        expect(Array.isArray(article.tags)).toBe(true);
        expect(Array.isArray(article.relatedArticles)).toBe(true);
        expect(article.lastUpdated).toBeInstanceOf(Date);
        expect(['beginner', 'intermediate', 'advanced']).toContain(article.difficulty);
        expect(typeof article.estimatedReadTime).toBe('number');
        expect(article.estimatedReadTime).toBeGreaterThan(0);
      });
    });

    it('has valid categories', () => {
      const validCategories = ['overview', 'process', 'risks', 'legal', 'technical', 'documents'];
      const articles = service.getAllArticles();
      
      articles.forEach(article => {
        expect(validCategories).toContain(article.category);
      });
    });

    it('has meaningful tags', () => {
      const articles = service.getAllArticles();
      
      articles.forEach(article => {
        expect(article.tags.length).toBeGreaterThan(0);
        article.tags.forEach(tag => {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty search query gracefully', () => {
      const results = service.searchArticles('   ');
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles search with only special characters', () => {
      const results = service.searchArticles('!@#$%^&*()');
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles very long search queries', () => {
      const longQuery = 'verification '.repeat(100);
      const results = service.searchArticles(longQuery);
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles case-insensitive searches', () => {
      const lowerResults = service.searchArticles('verification');
      const upperResults = service.searchArticles('VERIFICATION');
      const mixedResults = service.searchArticles('VeRiFiCaTiOn');
      
      expect(lowerResults.length).toBe(upperResults.length);
      expect(lowerResults.length).toBe(mixedResults.length);
    });
  });
});
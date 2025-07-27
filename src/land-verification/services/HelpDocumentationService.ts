export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: 'overview' | 'process' | 'risks' | 'legal' | 'technical' | 'documents';
  tags: string[];
  relatedArticles: string[];
  lastUpdated: Date;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // in minutes
}

export interface HelpSearchResult {
  article: HelpArticle;
  relevanceScore: number;
  matchedTerms: string[];
}

export interface HelpAnalytics {
  articleId: string;
  views: number;
  helpfulVotes: number;
  unhelpfulVotes: number;
  averageTimeSpent: number;
  commonSearchTerms: string[];
}

export class HelpDocumentationService {
  private articles: Map<string, HelpArticle> = new Map();
  private analytics: Map<string, HelpAnalytics> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeArticles();
    this.buildSearchIndex();
  }

  private initializeArticles(): void {
    const articles: HelpArticle[] = [
      {
        id: 'land-verification-overview',
        title: 'Kenya Land Verification System Overview',
        content: 'Comprehensive land verification system for Kenya...',
        category: 'overview',
        tags: ['introduction', 'multi-layer', 'verification', 'kenya', 'land-system'],
        relatedArticles: ['verification-process-guide', 'risk-assessment-explained', 'kenya-land-system'],
        lastUpdated: new Date('2024-01-15'),
        difficulty: 'beginner',
        estimatedReadTime: 5
      },
      {
        id: 'verification-process-guide',
        title: 'Step-by-Step Verification Process',
        content: 'Complete verification workflow guide...',
        category: 'process',
        tags: ['workflow', 'steps', 'timeline', 'phases', 'guide'],
        relatedArticles: ['land-verification-overview', 'document-requirements', 'risk-assessment-explained'],
        lastUpdated: new Date('2024-01-20'),
        difficulty: 'intermediate',
        estimatedReadTime: 12
      }
    ];

    articles.forEach(article => {
      this.articles.set(article.id, article);
      this.analytics.set(article.id, {
        articleId: article.id,
        views: 0,
        helpfulVotes: 0,
        unhelpfulVotes: 0,
        averageTimeSpent: 0,
        commonSearchTerms: []
      });
    });
  }

  private buildSearchIndex(): void {
    this.articles.forEach(article => {
      const searchableText = `${article.title} ${article.content} ${article.tags.join(' ')}`.toLowerCase();
      const words = searchableText.split(/\s+/);
      
      words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length > 2) {
          if (!this.searchIndex.has(cleanWord)) {
            this.searchIndex.set(cleanWord, new Set());
          }
          this.searchIndex.get(cleanWord)!.add(article.id);
        }
      });
    });
  }

  public searchArticles(query: string, category?: string): HelpSearchResult[] {
    if (!query.trim()) {
      return this.getAllArticles(category).map(article => ({
        article,
        relevanceScore: 1,
        matchedTerms: []
      }));
    }

    const searchTerms = query.toLowerCase().split(/\s+/).map(term => term.replace(/[^\w]/g, ''));
    const articleScores = new Map<string, { score: number; matchedTerms: string[] }>();

    searchTerms.forEach(term => {
      if (term.length > 2) {
        if (this.searchIndex.has(term)) {
          this.searchIndex.get(term)!.forEach(articleId => {
            if (!articleScores.has(articleId)) {
              articleScores.set(articleId, { score: 0, matchedTerms: [] });
            }
            const current = articleScores.get(articleId)!;
            current.score += 10;
            current.matchedTerms.push(term);
          });
        }
      }
    });

    const results: HelpSearchResult[] = [];
    articleScores.forEach((scoreData, articleId) => {
      const article = this.articles.get(articleId);
      if (article && (!category || article.category === category)) {
        results.push({
          article,
          relevanceScore: scoreData.score,
          matchedTerms: scoreData.matchedTerms
        });
      }
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  public getArticle(id: string): HelpArticle | undefined {
    const article = this.articles.get(id);
    if (article) {
      const analytics = this.analytics.get(id);
      if (analytics) {
        analytics.views++;
      }
    }
    return article;
  }

  public getAllArticles(category?: string): HelpArticle[] {
    const articles = Array.from(this.articles.values());
    return category ? articles.filter(article => article.category === category) : articles;
  }

  public getRelatedArticles(articleId: string): HelpArticle[] {
    const article = this.articles.get(articleId);
    if (!article) return [];

    return article.relatedArticles
      .map(id => this.articles.get(id))
      .filter((article): article is HelpArticle => article !== undefined);
  }

  public recordHelpfulVote(articleId: string, helpful: boolean): void {
    const analytics = this.analytics.get(articleId);
    if (analytics) {
      if (helpful) {
        analytics.helpfulVotes++;
      } else {
        analytics.unhelpfulVotes++;
      }
    }
  }

  public getAnalytics(articleId: string): HelpAnalytics | undefined {
    return this.analytics.get(articleId);
  }
}

export const helpDocumentationService = new HelpDocumentationService();
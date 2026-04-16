"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpDocumentationService = exports.HelpDocumentationService = void 0;
var HelpDocumentationService = /** @class */ (function () {
    function HelpDocumentationService() {
        this.articles = new Map();
        this.analytics = new Map();
        this.searchIndex = new Map();
        this.initializeArticles();
        this.buildSearchIndex();
    }
    HelpDocumentationService.prototype.initializeArticles = function () {
        var _this = this;
        var articles = [
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
        articles.forEach(function (article) {
            _this.articles.set(article.id, article);
            _this.analytics.set(article.id, {
                articleId: article.id,
                views: 0,
                helpfulVotes: 0,
                unhelpfulVotes: 0,
                averageTimeSpent: 0,
                commonSearchTerms: []
            });
        });
    };
    HelpDocumentationService.prototype.buildSearchIndex = function () {
        var _this = this;
        this.articles.forEach(function (article) {
            var searchableText = "".concat(article.title, " ").concat(article.content, " ").concat(article.tags.join(' ')).toLowerCase();
            var words = searchableText.split(/\s+/);
            words.forEach(function (word) {
                var cleanWord = word.replace(/[^\w]/g, '');
                if (cleanWord.length > 2) {
                    if (!_this.searchIndex.has(cleanWord)) {
                        _this.searchIndex.set(cleanWord, new Set());
                    }
                    _this.searchIndex.get(cleanWord).add(article.id);
                }
            });
        });
    };
    HelpDocumentationService.prototype.searchArticles = function (query, category) {
        var _this = this;
        if (!query.trim()) {
            return this.getAllArticles(category).map(function (article) { return ({
                article: article,
                relevanceScore: 1,
                matchedTerms: []
            }); });
        }
        var searchTerms = query.toLowerCase().split(/\s+/).map(function (term) { return term.replace(/[^\w]/g, ''); });
        var articleScores = new Map();
        searchTerms.forEach(function (term) {
            if (term.length > 2) {
                if (_this.searchIndex.has(term)) {
                    _this.searchIndex.get(term).forEach(function (articleId) {
                        if (!articleScores.has(articleId)) {
                            articleScores.set(articleId, { score: 0, matchedTerms: [] });
                        }
                        var current = articleScores.get(articleId);
                        current.score += 10;
                        current.matchedTerms.push(term);
                    });
                }
            }
        });
        var results = [];
        articleScores.forEach(function (scoreData, articleId) {
            var article = _this.articles.get(articleId);
            if (article && (!category || article.category === category)) {
                results.push({
                    article: article,
                    relevanceScore: scoreData.score,
                    matchedTerms: scoreData.matchedTerms
                });
            }
        });
        return results.sort(function (a, b) { return b.relevanceScore - a.relevanceScore; });
    };
    HelpDocumentationService.prototype.getArticle = function (id) {
        var article = this.articles.get(id);
        if (article) {
            var analytics = this.analytics.get(id);
            if (analytics) {
                analytics.views++;
            }
        }
        return article;
    };
    HelpDocumentationService.prototype.getAllArticles = function (category) {
        var articles = Array.from(this.articles.values());
        return category ? articles.filter(function (article) { return article.category === category; }) : articles;
    };
    HelpDocumentationService.prototype.getRelatedArticles = function (articleId) {
        var _this = this;
        var article = this.articles.get(articleId);
        if (!article)
            return [];
        return article.relatedArticles
            .map(function (id) { return _this.articles.get(id); })
            .filter(function (article) { return article !== undefined; });
    };
    HelpDocumentationService.prototype.recordHelpfulVote = function (articleId, helpful) {
        var analytics = this.analytics.get(articleId);
        if (analytics) {
            if (helpful) {
                analytics.helpfulVotes++;
            }
            else {
                analytics.unhelpfulVotes++;
            }
        }
    };
    HelpDocumentationService.prototype.getAnalytics = function (articleId) {
        return this.analytics.get(articleId);
    };
    return HelpDocumentationService;
}());
exports.HelpDocumentationService = HelpDocumentationService;
exports.helpDocumentationService = new HelpDocumentationService();

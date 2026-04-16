"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRecentPosts = useRecentPosts;
exports.useBlogPost = useBlogPost;
exports.useBlogPosts = useBlogPosts;
var react_query_1 = require("@tanstack/react-query");
var assets_1 = require("../config/assets");
// Transform BLOG_POSTS data to match BlogPost interface
var transformBlogPost = function (post) { return ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    content: "<div class=\"prose prose-lg\">\n    <p>".concat(post.excerpt, "</p>\n    <h2>Introduction</h2>\n    <p>In this comprehensive guide, we'll explore the key aspects that every real estate professional and investor should understand about ").concat(post.category.toLowerCase(), ".</p>\n    <h2>Key Insights</h2>\n    <p>The real estate market continues to evolve with new technologies and changing consumer behaviors. Understanding these trends is crucial for making informed decisions in today's competitive landscape.</p>\n    <blockquote>\n      <p>\"Understanding market trends and leveraging technology are essential for success in today's real estate landscape.\"</p>\n    </blockquote>\n    <h2>Best Practices</h2>\n    <ul>\n      <li>Always verify property documentation thoroughly</li>\n      <li>Use technology to streamline verification processes</li>\n      <li>Stay updated with market regulations and compliance requirements</li>\n      <li>Build strong relationships with trusted professionals</li>\n    </ul>\n    <h2>Looking Forward</h2>\n    <p>As we move forward, staying informed about market trends and leveraging technology will be key to success in the real estate industry. TripleCheck remains committed to providing the tools and insights you need.</p>\n  </div>"),
    author: {
        name: post.author,
        bio: 'Expert in real estate verification and fraud prevention'
    },
    publishedAt: post.date,
    image: {
        webp: post.image.webp,
        fallback: post.image.jpg
    },
    tags: [post.category, 'Real Estate', 'Verification'],
    featured: assets_1.BLOG_POSTS.indexOf(post) < 2, // First 2 posts are featured
    category: post.category,
    readTime: post.readTime,
    viewCount: Math.floor(Math.random() * 2000) + 500 // Random view count for demo
}); };
var mockPosts = assets_1.BLOG_POSTS.map(transformBlogPost);
function useRecentPosts(limit) {
    var _this = this;
    if (limit === void 0) { limit = 5; }
    return (0, react_query_1.useQuery)({
        queryKey: ['recent-posts', limit],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var sortedPosts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate API delay
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 1:
                        // Simulate API delay
                        _a.sent();
                        sortedPosts = __spreadArray([], mockPosts, true).sort(function (a, b) {
                            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                        });
                        return [2 /*return*/, sortedPosts.slice(0, limit)];
                }
            });
        }); },
        staleTime: 2 * 60 * 1000, // 2 minutes - shorter for home page freshness
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: true, // Refetch when user returns to tab
        refetchOnMount: true, // Always refetch on component mount
        refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    });
}
function useBlogPost(id) {
    var _this = this;
    return (0, react_query_1.useQuery)({
        queryKey: ['blog-post', id],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var post;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate API delay
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 300); })];
                    case 1:
                        // Simulate API delay
                        _a.sent();
                        post = mockPosts.find(function (p) { return p.id === id; });
                        if (!post) {
                            throw new Error('Post not found');
                        }
                        return [2 /*return*/, post];
                }
            });
        }); },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}
function useBlogPosts() {
    var _this = this;
    return (0, react_query_1.useQuery)({
        queryKey: ['blog-posts'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate API delay
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 1:
                        // Simulate API delay
                        _a.sent();
                        // Sort posts by publishedAt date (most recent first)
                        return [2 /*return*/, __spreadArray([], mockPosts, true).sort(function (a, b) {
                                return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                            })];
                }
            });
        }); },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });
}
// BlogPost interface is already exported above

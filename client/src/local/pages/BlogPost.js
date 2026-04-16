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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BlogPost;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var badge_1 = require("../components/ui/badge");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
var assets_1 = require("../config/assets");
var useNavigationSpacing_1 = require("../hooks/useNavigationSpacing");
var date_utils_1 = require("../utils/date-utils");
function BlogPost(_a) {
    var _this = this;
    var id = _a.id;
    var slug = (0, react_router_dom_1.useParams)().slug;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var pageClassName = (0, useNavigationSpacing_1.usePageSpacing)().pageClassName;
    // Use the id prop if provided, otherwise use the URL parameter (slug)
    var postId = id || slug;
    // Find the blog post by ID
    var post = assets_1.BLOG_POSTS.find(function (p) { return p.id === postId; });
    // If post not found, show 404
    if (!post) {
        return (<div className={"min-h-screen bg-dark-gradient-primary ".concat(pageClassName)}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-modal p-12">
              <h1 className="text-3xl font-bold mb-4 text-glass-light">Article Not Found</h1>
              <p className="text-glass-medium mb-8">
                The article you're looking for doesn't exist or may have been moved.
                <br />
                <small className="text-glass-medium">Looking for ID: {postId}</small>
              </p>
              <button_1.Button onClick={function () { return navigate("/blog"); }} size="lg" className="glass-btn-secondary">
                <lucide_react_1.ArrowLeft className="w-4 h-4 mr-2"/>
                Back to Blog
              </button_1.Button>
            </div>
          </div>
        </div>
      </div>);
    }
    var handleShare = function () { return __awaiter(_this, void 0, void 0, function () {
        var shareData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shareData = {
                        title: post.title,
                        text: post.excerpt,
                        url: window.location.href,
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!navigator.share) return [3 /*break*/, 3];
                    return [4 /*yield*/, navigator.share(shareData)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: 
                // Fallback to clipboard
                return [4 /*yield*/, navigator.clipboard.writeText(window.location.href)];
                case 4:
                    // Fallback to clipboard
                    _a.sent();
                    // You could add a toast notification here
                    alert('Link copied to clipboard!');
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error('Error sharing:', error_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    // Generate sample content based on the post data
    var generateContent = function (post) {
        return [
            {
                title: "Introduction",
                content: "".concat(post.excerpt, " In this comprehensive guide, we'll explore the key aspects that every real estate professional and investor should understand.")
            },
            {
                title: "Key Insights",
                content: "The real estate market continues to evolve with new technologies and changing consumer behaviors. Understanding these trends is crucial for making informed decisions in today's competitive landscape."
            },
            {
                title: "Best Practices",
                content: "Based on our extensive research and industry experience, we've identified several best practices that can help you navigate the complexities of modern real estate transactions."
            },
            {
                title: "Looking Forward",
                content: "As we move forward, staying informed about market trends and leveraging technology will be key to success in the real estate industry. TripleCheck remains committed to providing the tools and insights you need."
            }
        ];
    };
    var contentSections = generateContent(post);
    return (<div className={"min-h-screen bg-dark-gradient-primary ".concat(pageClassName)}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button_1.Button variant="ghost" onClick={function () { return navigate("/blog"); }} className="mb-6 hover:bg-secondary/10 hover:text-secondary transition-colors">
            <lucide_react_1.ArrowLeft className="w-4 h-4 mr-2"/>
            Back to Blog
          </button_1.Button>

          <article className="glass-modal overflow-hidden">
            {/* Hero image */}
            <div className="aspect-video relative">
              <picture>
                <source srcSet={post.image.webp} type="image/webp"/>
                <img src={post.image.jpg} alt={post.image.alt} className="w-full h-full object-cover"/>
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-4">
                  <badge_1.Badge variant="coral" className="text-secondary-foreground">
                    {post.category}
                  </badge_1.Badge>
                </div>
                <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                  {post.title}
                </h1>
              </div>
            </div>

            {/* Article metadata */}
            <div className="p-8 border-b">
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <lucide_react_1.User className="w-4 h-4"/>
                  <span className="font-medium">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <lucide_react_1.Calendar className="w-4 h-4"/>
                  <span>{(0, date_utils_1.formatDate)(post.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <lucide_react_1.Clock className="w-4 h-4"/>
                  <span>{post.readTime}</span>
                </div>
              </div>

              {/* Excerpt */}
              <p className="text-lg text-muted-foreground leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            {/* Article content */}
            <div className="p-8">
              <div className="prose prose-lg max-w-none prose-headings:text-secondary prose-links:text-primary hover:prose-links:text-primary/80 prose-blockquote:border-l-secondary prose-blockquote:bg-secondary/10 prose-blockquote:p-4 prose-blockquote:rounded-r-lg">
                {contentSections.map(function (section, index) { return (<div key={index} className="mb-8">
                    <h2 className="text-2xl font-bold text-secondary mb-4">{section.title}</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">{section.content}</p>
                    
                    {/* Add some variety to the content */}
                    {index === 1 && (<blockquote className="border-l-4 border-secondary bg-secondary/10 p-4 rounded-r-lg my-6">
                        <p className="text-gray-700 italic">
                          "Understanding market trends and leveraging technology are essential for success in today's real estate landscape."
                        </p>
                      </blockquote>)}
                    
                    {index === 2 && (<ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Always verify property documentation thoroughly</li>
                        <li>Use technology to streamline verification processes</li>
                        <li>Stay updated with market regulations and compliance requirements</li>
                        <li>Build strong relationships with trusted professionals</li>
                      </ul>)}
                  </div>); })}
              </div>
            </div>

            {/* Article footer */}
            <div className="p-8 bg-glass-secondary border-t border-glass-light">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-semibold text-secondary">{post.author}</h4>
                    <p className="text-sm text-muted-foreground">
                      Expert in real estate verification and fraud prevention
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button_1.Button size="sm" onClick={handleShare} className="glass-btn">
                    <lucide_react_1.Share2 className="w-4 h-4 mr-2"/>
                    Share
                  </button_1.Button>
                  <button_1.Button size="sm" onClick={function () { return navigate('/blog'); }} className="glass-btn-secondary">
                    More Articles
                  </button_1.Button>
                </div>
              </div>
            </div>
          </article>

          {/* Related articles section */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 text-glass-light">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assets_1.BLOG_POSTS.filter(function (p) { return p.id !== post.id; }).slice(0, 2).map(function (relatedPost) { return (<card_1.Card key={relatedPost.id} className="glass-property-card overflow-hidden group cursor-pointer" onClick={function () { return navigate("/blog/".concat(relatedPost.id)); }}>
                  <div className="aspect-video relative">
                    <picture>
                      <source srcSet={relatedPost.image.webp} type="image/webp"/>
                      <img src={relatedPost.image.jpg} alt={relatedPost.image.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
                    </picture>
                    <div className="absolute top-4 left-4">
                      <badge_1.Badge variant="coral" className="text-secondary-foreground">
                        {relatedPost.category}
                      </badge_1.Badge>
                    </div>
                  </div>
                  <card_1.CardContent className="p-4">
                    <h4 className="font-semibold mb-2 group-hover:text-secondary transition-colors">
                      {relatedPost.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                      <span>{relatedPost.author}</span>
                      <span>{relatedPost.readTime}</span>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>); })}
            </div>
          </div>
        </div>
      </div>
    </div>);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BlogTest;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
var assets_1 = require("../config/assets");
/**
 * Blog Navigation Test Page
 *
 * This page helps test and debug blog navigation functionality
 */
function BlogTest() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var handleNavigateToBlog = function (postId) {
        console.log('Navigating to blog post:', postId);
        navigate("/blog/".concat(postId));
    };
    var handleNavigateToBlogList = function () {
        console.log('Navigating to blog list');
        navigate('/blog');
    };
    return (<div className="min-h-screen bg-dark-gradient-primary py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-modal p-8 mb-8">
            <h1 className="text-3xl font-bold mb-6 text-glass-light">
              Blog Navigation Test
            </h1>
            <p className="text-glass-medium mb-6">
              This page helps test blog navigation functionality. Click the buttons below to test navigation to individual blog posts.
            </p>
            
            <div className="mb-6">
              <button_1.Button onClick={handleNavigateToBlogList} className="glass-btn-primary mr-4">
                <lucide_react_1.ExternalLink className="w-4 h-4 mr-2"/>
                Go to Blog List
              </button_1.Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets_1.BLOG_POSTS.map(function (post) { return (<card_1.Card key={post.id} className="glass-property-card">
                <div className="aspect-video relative overflow-hidden">
                  <img src={post.image.jpg} alt={post.image.alt} className="w-full h-full object-cover"/>
                </div>
                <card_1.CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2 text-glass-dark">
                    {post.title}
                  </h3>
                  <p className="text-sm text-glass-medium mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-glass-medium mb-4">
                    <span>By {post.author}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <div className="space-y-2">
                    <button_1.Button onClick={function () { return handleNavigateToBlog(post.id); }} className="glass-btn-secondary w-full" size="sm">
                      <lucide_react_1.ArrowRight className="w-4 h-4 mr-2"/>
                      Read Article
                    </button_1.Button>
                    <div className="text-xs text-glass-medium text-center">
                      ID: {post.id}
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>

          <div className="glass-modal p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4 text-glass-light">
              Debug Information
            </h2>
            <div className="text-sm text-glass-medium space-y-2">
              <p><strong>Available Blog Posts:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                {assets_1.BLOG_POSTS.map(function (post) { return (<li key={post.id}>
                    <code className="bg-glass-dark px-2 py-1 rounded text-xs">
                      {post.id}
                    </code> - {post.title}
                  </li>); })}
              </ul>
              <p className="mt-4">
                <strong>Expected URLs:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                {assets_1.BLOG_POSTS.map(function (post) { return (<li key={post.id}>
                    <code className="bg-glass-dark px-2 py-1 rounded text-xs">
                      /blog/{post.id}
                    </code>
                  </li>); })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>);
}

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, Share2, Tag } from 'lucide-react';
import { BLOG_POSTS } from '../config/assets';
import { formatDate } from '../utils/date-utils';

interface BlogPostProps {
  id?: string;
}

export default function BlogPost({ id }: BlogPostProps) {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use the id prop if provided, otherwise use the URL parameter
  const postId = id || paramId;
  
  // Find the blog post by ID
  const post = BLOG_POSTS.find(p => p.id === postId);

  // If post not found, show 404
  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The article you're looking for doesn't exist or may have been moved.
            </p>
            <Button onClick={() => navigate("/blog")} size="lg" variant="coral">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // You could add a toast notification here
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Generate sample content based on the post data
  const generateContent = (post: typeof BLOG_POSTS[number]) => {
    const sections = [
      {
        title: "Introduction",
        content: `${post.excerpt} In this comprehensive guide, we'll explore the key aspects that every real estate professional and investor should understand.`
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

    return sections;
  };

  const contentSections = generateContent(post);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/blog")}
            className="mb-6 hover:bg-secondary/10 hover:text-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>

          <article className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Hero image */}
            <div className="aspect-video relative">
              <picture>
                <source srcSet={post.image.webp} type="image/webp" />
                <img
                  src={post.image.jpg}
                  alt={post.image.alt}
                  className="w-full h-full object-cover"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="coral" className="text-secondary-foreground">
                    {post.category}
                  </Badge>
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
                  <User className="w-4 h-4" />
                  <span className="font-medium">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
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
                {contentSections.map((section, index) => (
                  <div key={index} className="mb-8">
                    <h2 className="text-2xl font-bold text-secondary mb-4">{section.title}</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">{section.content}</p>
                    
                    {/* Add some variety to the content */}
                    {index === 1 && (
                      <blockquote className="border-l-4 border-secondary bg-secondary/10 p-4 rounded-r-lg my-6">
                        <p className="text-gray-700 italic">
                          "Understanding market trends and leveraging technology are essential for success in today's real estate landscape."
                        </p>
                      </blockquote>
                    )}
                    
                    {index === 2 && (
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Always verify property documentation thoroughly</li>
                        <li>Use technology to streamline verification processes</li>
                        <li>Stay updated with market regulations and compliance requirements</li>
                        <li>Build strong relationships with trusted professionals</li>
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Article footer */}
            <div className="p-8 bg-secondary/10 border-t">
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
                  <Button
                    variant="coral-outline"
                    size="sm"
                    onClick={handleShare}
                    className="hover:bg-secondary/10"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="coral"
                    size="sm"
                    onClick={() => navigate('/blog')}
                    className="hover:bg-secondary/90"
                  >
                    More Articles
                  </Button>
                </div>
              </div>
            </div>
          </article>

          {/* Related articles section */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 text-secondary">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BLOG_POSTS.filter(p => p.id !== post.id).slice(0, 2).map((relatedPost) => (
                <Card 
                  key={relatedPost.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 group cursor-pointer"
                  onClick={() => navigate(`/blog/${relatedPost.id}`)}
                >
                  <div className="aspect-video relative">
                    <picture>
                      <source srcSet={relatedPost.image.webp} type="image/webp" />
                      <img
                        src={relatedPost.image.jpg}
                        alt={relatedPost.image.alt}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </picture>
                    <div className="absolute top-4 left-4">
                      <Badge variant="coral" className="text-secondary-foreground">
                        {relatedPost.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
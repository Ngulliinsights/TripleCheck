# Headless CMS Integration Guide

This guide explains how to integrate TripleCheck with various headless CMS providers for managing blog content.

## Overview

The blog system is designed to work with multiple headless CMS providers while maintaining a consistent interface. The system includes:

- **CMS Service Layer** (`client/src/services/cms.ts`) - Abstracts different CMS providers
- **React Hooks** (`client/src/hooks/useCMS.ts`) - Easy-to-use hooks for fetching content
- **Configuration** (`client/src/config/cms.ts`) - Centralized CMS configuration
- **Fallback System** - Local mock data when no CMS is configured

## Supported CMS Providers

### 1. Strapi (Recommended)
Open-source headless CMS with excellent customization options.

**Setup:**
```bash
# Install Strapi
npx create-strapi-app@latest my-blog-cms --quickstart

# Configure environment variables
VITE_CMS_PROVIDER="strapi"
VITE_CMS_API_URL="http://localhost:1337"
VITE_CMS_API_KEY="your-strapi-api-key"
```

**Content Type Structure:**
```json
{
  "collectionName": "blog_posts",
  "info": {
    "singularName": "blog-post",
    "pluralName": "blog-posts",
    "displayName": "Blog Post"
  },
  "attributes": {
    "title": { "type": "string", "required": true },
    "excerpt": { "type": "text", "required": true },
    "content": { "type": "richtext", "required": true },
    "image": { "type": "media", "allowedTypes": ["images"] },
    "publishedAt": { "type": "datetime" },
    "author": { "type": "relation", "relation": "manyToOne", "target": "api::author.author" },
    "readTime": { "type": "string", "default": "5 min read" },
    "category": { "type": "relation", "relation": "manyToOne", "target": "api::category.category" },
    "tags": { "type": "relation", "relation": "manyToMany", "target": "api::tag.tag" },
    "externalUrl": { "type": "string" },
    "featured": { "type": "boolean", "default": false },
    "viewCount": { "type": "integer", "default": 0 },
    "seoDescription": { "type": "text" },
    "seoKeywords": { "type": "json" }
  }
}
```

### 2. Contentful
Enterprise-grade headless CMS with powerful content modeling.

**Setup:**
```bash
# Configure environment variables
VITE_CMS_PROVIDER="contentful"
VITE_CMS_API_URL="https://cdn.contentful.com"
VITE_CONTENTFUL_SPACE_ID="your-space-id"
VITE_CMS_API_KEY="your-delivery-api-key"
```

**Content Model:**
- Content Type ID: `blogPost`
- Fields: title (Short text), excerpt (Long text), content (Rich text), image (Media), publishedAt (Date & time), author (Reference), category (Short text), tags (Short text, list), featured (Boolean), etc.

### 3. Sanity
Real-time collaborative headless CMS with powerful querying.

**Setup:**
```bash
# Install Sanity CLI
npm install -g @sanity/cli

# Create new project
sanity init

# Configure environment variables
VITE_CMS_PROVIDER="sanity"
VITE_SANITY_PROJECT_ID="your-project-id"
VITE_SANITY_DATASET="production"
```

### 4. Ghost
Publishing-focused headless CMS with built-in SEO features.

**Setup:**
```bash
# Configure environment variables
VITE_CMS_PROVIDER="ghost"
VITE_CMS_API_URL="https://your-ghost-site.com"
VITE_CMS_API_KEY="your-content-api-key"
```

### 5. Local/Mock Data (Default)
Uses local mock data for development and testing.

**Setup:**
```bash
# No additional setup required
VITE_CMS_PROVIDER="local"
```

## Usage Examples

### Basic Usage in Components

```tsx
import { useBlogPosts, useBlogPost } from '@/hooks/useCMS';

function BlogList() {
  const { data: posts, isLoading, error } = useBlogPosts();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading posts</div>;
  
  return (
    <div>
      {posts?.map(post => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </div>
      ))}
    </div>
  );
}

function BlogPost({ id }: { id: string }) {
  const { data: post, isLoading } = useBlogPost(id);
  
  if (isLoading) return <div>Loading...</div>;
  if (!post) return <div>Post not found</div>;
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

### Advanced Usage

```tsx
import { 
  useFeaturedPosts, 
  usePostsByCategory, 
  useSearchPosts,
  useCategories,
  useTags 
} from '@/hooks/useCMS';

// Featured posts
const { data: featuredPosts } = useFeaturedPosts();

// Posts by category
const { data: investmentPosts } = usePostsByCategory('Investment');

// Search posts
const { data: searchResults } = useSearchPosts('PropTech');

// Get all categories
const { data: categories } = useCategories();

// Get all tags
const { data: tags } = useTags();
```

## Content Structure

All CMS providers should follow this content structure:

```typescript
interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string; // HTML content
  image: {
    webp: string;
    fallback: string;
  };
  publishedAt: string; // ISO date string
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  readTime: string; // e.g., "5 min read"
  category: string;
  tags: string[];
  externalUrl?: string;
  featured?: boolean;
  viewCount?: number;
  seoMeta?: {
    description: string;
    keywords: string[];
  };
}
```

## Migration Guide

### From Static Content to CMS

1. **Choose your CMS provider** based on your needs:
   - **Strapi**: Best for custom requirements and self-hosting
   - **Contentful**: Best for enterprise and team collaboration
   - **Sanity**: Best for real-time collaboration and complex content
   - **Ghost**: Best for publishing-focused workflows

2. **Set up your CMS** following the provider-specific instructions above

3. **Configure environment variables** in your `.env` file

4. **Import existing content** to your CMS (most providers offer import tools)

5. **Test the integration** by switching the `VITE_CMS_PROVIDER` environment variable

### From One CMS to Another

The abstraction layer makes it easy to switch between CMS providers:

1. Set up the new CMS with the same content structure
2. Export content from the old CMS
3. Import content to the new CMS
4. Update environment variables
5. Test the integration

## Performance Optimization

The system includes several performance optimizations:

- **React Query caching** with 5-minute stale time
- **Lazy loading** of individual posts
- **Conditional fetching** based on route
- **Error boundaries** for graceful error handling
- **Loading skeletons** for better UX

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your CMS allows requests from your domain
2. **API Key Issues**: Verify your API keys have the correct permissions
3. **Content Structure Mismatch**: Ensure your CMS content matches the expected structure
4. **Network Errors**: Check your CMS URL and network connectivity

### Debug Mode

Enable debug mode by setting:
```bash
VITE_DEBUG_CMS="true"
```

This will log all CMS requests and responses to the console.

## Best Practices

1. **Content Modeling**: Design your content structure before implementation
2. **SEO**: Always include meta descriptions and keywords
3. **Images**: Use WebP format with fallbacks for better performance
4. **Caching**: Leverage React Query's caching for better performance
5. **Error Handling**: Always handle loading and error states
6. **Testing**: Test with different CMS providers to ensure compatibility

## Support

For issues specific to:
- **CMS Integration**: Check this guide and the code comments
- **Individual CMS Providers**: Refer to their respective documentation
- **React Query**: Check the React Query documentation
- **General Issues**: Create an issue in the project repository
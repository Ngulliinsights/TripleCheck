/**
 * Headless CMS Service Layer
 * Supports multiple CMS providers: Strapi, Contentful, Sanity, Ghost, etc.
 * Can be easily configured to work with any headless CMS
 */

// CMS Configuration Types
export interface CMSConfig {
  provider: 'strapi' | 'contentful' | 'sanity' | 'ghost' | 'directus' | 'local';
  apiUrl: string;
  apiKey?: string;
  spaceId?: string; // For Contentful
  projectId?: string; // For Sanity
  dataset?: string; // For Sanity
}

// Blog Post Interface (matches existing blog.tsx structure)
export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image: {
    webp: string;
    fallback: string;
  };
  publishedAt: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  readTime: string;
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

// CMS Response Types
interface StrapiResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface ContentfulResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  includes?: {
    Asset?: any[];
    Entry?: any[];
  };
}

// Abstract CMS Service
abstract class CMSService {
  protected config: CMSConfig;

  constructor(config: CMSConfig) {
    this.config = config;
  }

  abstract fetchPosts(): Promise<BlogPost[]>;
  abstract fetchPost(id: string): Promise<BlogPost | null>;
  abstract fetchFeaturedPosts(): Promise<BlogPost[]>;
  abstract fetchPostsByCategory(category: string): Promise<BlogPost[]>;
  abstract fetchPostsByTag(tag: string): Promise<BlogPost[]>;
}

// Strapi CMS Implementation
class StrapiCMSService extends CMSService {
  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.config.apiUrl}/api/${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.statusText}`);
    }
    return response.json();
  }

  private transformStrapiPost(strapiPost: any): BlogPost {
    const attributes = strapiPost.attributes;
    return {
      id: strapiPost.id,
      title: attributes.title,
      excerpt: attributes.excerpt,
      content: attributes.content,
      image: {
        webp: attributes.image?.data?.attributes?.formats?.webp?.url || attributes.image?.data?.attributes?.url,
        fallback: attributes.image?.data?.attributes?.url,
      },
      publishedAt: attributes.publishedAt || attributes.createdAt,
      author: {
        name: attributes.author?.data?.attributes?.name || 'Anonymous',
        avatar: attributes.author?.data?.attributes?.avatar?.data?.attributes?.url,
        bio: attributes.author?.data?.attributes?.bio,
      },
      readTime: attributes.readTime || '5 min read',
      category: attributes.category?.data?.attributes?.name || 'General',
      tags: attributes.tags?.data?.map((tag: any) => tag.attributes.name) || [],
      externalUrl: attributes.externalUrl,
      featured: attributes.featured || false,
      viewCount: attributes.viewCount || 0,
      seoMeta: {
        description: attributes.seoDescription || attributes.excerpt,
        keywords: attributes.seoKeywords || [],
      },
    };
  }

  async fetchPosts(): Promise<BlogPost[]> {
    const response: StrapiResponse<any> = await this.makeRequest(
      'blog-posts?populate=*&sort=publishedAt:desc'
    );
    return response.data.map(this.transformStrapiPost);
  }

  async fetchPost(id: string): Promise<BlogPost | null> {
    try {
      const response = await this.makeRequest(`blog-posts/${id}?populate=*`);
      return this.transformStrapiPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  }

  async fetchFeaturedPosts(): Promise<BlogPost[]> {
    const response: StrapiResponse<any> = await this.makeRequest(
      'blog-posts?populate=*&filters[featured][$eq]=true&sort=publishedAt:desc'
    );
    return response.data.map(this.transformStrapiPost);
  }

  async fetchPostsByCategory(category: string): Promise<BlogPost[]> {
    const response: StrapiResponse<any> = await this.makeRequest(
      `blog-posts?populate=*&filters[category][name][$eq]=${category}&sort=publishedAt:desc`
    );
    return response.data.map(this.transformStrapiPost);
  }

  async fetchPostsByTag(tag: string): Promise<BlogPost[]> {
    const response: StrapiResponse<any> = await this.makeRequest(
      `blog-posts?populate=*&filters[tags][name][$eq]=${tag}&sort=publishedAt:desc`
    );
    return response.data.map(this.transformStrapiPost);
  }
}

// Contentful CMS Implementation
class ContentfulCMSService extends CMSService {
  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.config.apiUrl}/spaces/${this.config.spaceId}/entries?${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Contentful API error: ${response.statusText}`);
    }
    return response.json();
  }

  private transformContentfulPost(contentfulPost: any, assets: any[] = []): BlogPost {
    const fields = contentfulPost.fields;
    const getAssetUrl = (assetId: string) => {
      const asset = assets.find(a => a.sys.id === assetId);
      return asset ? `https:${asset.fields.file.url}` : '';
    };

    return {
      id: parseInt(contentfulPost.sys.id, 36), // Convert Contentful ID to number
      title: fields.title,
      excerpt: fields.excerpt,
      content: fields.content,
      image: {
        webp: getAssetUrl(fields.image?.sys?.id),
        fallback: getAssetUrl(fields.image?.sys?.id),
      },
      publishedAt: fields.publishedAt || contentfulPost.sys.createdAt,
      author: {
        name: fields.author?.fields?.name || 'Anonymous',
        avatar: fields.author?.fields?.avatar ? getAssetUrl(fields.author.fields.avatar.sys.id) : undefined,
        bio: fields.author?.fields?.bio,
      },
      readTime: fields.readTime || '5 min read',
      category: fields.category || 'General',
      tags: fields.tags || [],
      externalUrl: fields.externalUrl,
      featured: fields.featured || false,
      viewCount: fields.viewCount || 0,
      seoMeta: {
        description: fields.seoDescription || fields.excerpt,
        keywords: fields.seoKeywords || [],
      },
    };
  }

  async fetchPosts(): Promise<BlogPost[]> {
    const response: ContentfulResponse<any> = await this.makeRequest(
      'content_type=blogPost&include=2&order=-fields.publishedAt'
    );
    return response.items.map(item => this.transformContentfulPost(item, response.includes?.Asset || []));
  }

  async fetchPost(id: string): Promise<BlogPost | null> {
    try {
      const response = await this.makeRequest(`sys.id=${id}&content_type=blogPost&include=2`);
      if (response.items.length === 0) return null;
      return this.transformContentfulPost(response.items[0], response.includes?.Asset || []);
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  }

  async fetchFeaturedPosts(): Promise<BlogPost[]> {
    const response: ContentfulResponse<any> = await this.makeRequest(
      'content_type=blogPost&fields.featured=true&include=2&order=-fields.publishedAt'
    );
    return response.items.map(item => this.transformContentfulPost(item, response.includes?.Asset || []));
  }

  async fetchPostsByCategory(category: string): Promise<BlogPost[]> {
    const response: ContentfulResponse<any> = await this.makeRequest(
      `content_type=blogPost&fields.category=${category}&include=2&order=-fields.publishedAt`
    );
    return response.items.map(item => this.transformContentfulPost(item, response.includes?.Asset || []));
  }

  async fetchPostsByTag(tag: string): Promise<BlogPost[]> {
    const response: ContentfulResponse<any> = await this.makeRequest(
      `content_type=blogPost&fields.tags[in]=${tag}&include=2&order=-fields.publishedAt`
    );
    return response.items.map(item => this.transformContentfulPost(item, response.includes?.Asset || []));
  }
}

// Local/Mock CMS Implementation (fallback)
class LocalCMSService extends CMSService {
  private mockPosts: BlogPost[] = [
    {
      id: 1,
      title: "The Future of African Real Estate Investment: Why Technology is the Game Changer",
      excerpt: "How cutting-edge PropTech is revolutionizing property investment across Africa, creating unprecedented opportunities for smart investors who understand the digital transformation.",
      content: `
        <h2>The Digital Revolution Reshaping African Real Estate</h2>
        <p>Africa's real estate landscape is undergoing a seismic shift that smart investors cannot afford to ignore. From the bustling streets of Lagos to the tech hubs of Nairobi, property technology is fundamentally transforming how we discover, evaluate, and invest in real estate opportunities.</p>
        
        <p>This transformation isn't just about convenience—it's about access, transparency, and the democratization of wealth-building opportunities that were previously reserved for the well-connected few.</p>
        
        <h3>Four Technology Trends Defining the New Reality</h3>
        
        <h4>1. PropTech Platforms: Your Investment Gateway</h4>
        <p>Mobile-first platforms are breaking down traditional barriers to property investment. Where once you needed insider connections and substantial capital, today's digital platforms provide instant access to verified opportunities, market data, and investment tools that level the playing field.</p>
        
        <h4>2. Blockchain: The Trust Revolution</h4>
        <p>Smart contracts are eliminating the age-old problems of fraud and opacity that have plagued African real estate markets. Every transaction becomes transparent, immutable, and automatically executed—removing the need for intermediaries who often add cost without adding value.</p>
        
        <h3>The Path Forward</h3>
        <p>As we look ahead, the integration of technology in African real estate will only accelerate. Platforms like TripleCheck are leading this transformation by bringing unprecedented transparency and trust to property transactions across the continent.</p>
      `,
      image: {
        webp: "/assets/blog1.webp",
        fallback: "/assets/blog1.jpg",
      },
      publishedAt: "2025-07-10",
      author: {
        name: "Dr. Kwame Asante",
        bio: "Senior Real Estate Economist and PropTech Advisor",
      },
      readTime: "8 min read",
      category: "Investment",
      tags: ["PropTech", "Africa", "Investment", "Technology", "Future Trends"],
      externalUrl: "https://medium.com/@triplecheck/future-african-real-estate",
      featured: true,
      viewCount: 2847,
      seoMeta: {
        description: "Discover how technology is revolutionizing African real estate investment, creating new opportunities for smart investors.",
        keywords: ["African real estate", "PropTech", "property investment", "blockchain", "AI valuation"],
      },
    },
    {
      id: 2,
      title: "The Complete Guide to Property Verification: Protecting Your Investment",
      excerpt: "Everything you need to know about our comprehensive property verification process and why it's essential for secure real estate transactions in Africa.",
      content: `
        <h2>Why Property Verification is Non-Negotiable</h2>
        <p>Property fraud costs investors over $50 million annually across Africa—money that could have funded legitimate developments and created real value. Our comprehensive verification process exists to protect you from becoming another statistic while ensuring your investments are built on solid foundations.</p>
        
        <h3>Our Five-Stage Verification Process</h3>
        
        <h4>Stage 1: Digital Document Authentication</h4>
        <p>Our proprietary AI system scans and analyzes all property documents, cross-referencing them against known fraud patterns and authentic document templates.</p>
        
        <h4>Stage 2: Government Database Cross-Reference</h4>
        <p>We verify ownership claims by cross-referencing submitted documents with official government land registries and property databases.</p>
        
        <h3>Your Protection, Our Guarantee</h3>
        <p>When you choose a verified property, you're not just buying real estate—you're buying peace of mind. Our verification process is backed by professional indemnity insurance.</p>
      `,
      image: {
        webp: "/assets/blog2.webp",
        fallback: "/assets/blog2.jpg",
      },
      publishedAt: "2025-07-08",
      author: {
        name: "Sarah Mwangi",
        bio: "Head of Property Verification & Risk Assessment",
      },
      readTime: "10 min read",
      category: "Verification",
      tags: ["Verification", "Security", "Process", "Trust", "Risk Management"],
      viewCount: 1923,
      seoMeta: {
        description: "Learn about our comprehensive property verification process and how it protects your real estate investments.",
        keywords: ["property verification", "real estate security", "investment protection", "due diligence"],
      },
    },
    {
      id: 3,
      title: "Africa's Hottest Property Markets: Where Smart Money is Moving in 2025",
      excerpt: "An insider's guide to the most promising real estate markets across Africa, with detailed analysis of growth drivers and investment opportunities.",
      content: `
        <h2>The Continental Property Boom: Understanding the Fundamentals</h2>
        <p>Africa's real estate markets are experiencing unprecedented growth, driven by urbanization, economic development, and demographic shifts that create compelling investment opportunities.</p>
        
        <h3>The Top 5 Markets Driving Continental Growth</h3>
        
        <h4>1. Lagos, Nigeria: The Megacity Opportunity</h4>
        <p>With over 21 million residents and growing at 3.2% annually, Lagos represents Africa's largest single market opportunity.</p>
        
        <h4>2. Nairobi, Kenya: The Regional Hub</h4>
        <p>Kenya's capital serves as East Africa's business center, with a stable political environment and growing technology sector.</p>
        
        <h3>The TripleCheck Advantage</h3>
        <p>Regardless of which market you choose, thorough due diligence is essential. Our verification process helps you identify legitimate opportunities while avoiding the pitfalls that trap inexperienced investors.</p>
      `,
      image: {
        webp: "/assets/blog3.webp",
        fallback: "/assets/blog3.jpg",
      },
      publishedAt: "2025-07-05",
      author: {
        name: "Michael Okonkwo",
        bio: "Senior Market Analyst & African Real Estate Specialist",
      },
      readTime: "12 min read",
      category: "Markets",
      tags: ["Markets", "Investment", "Africa", "Growth", "Analysis"],
      featured: true,
      viewCount: 3156,
      seoMeta: {
        description: "Comprehensive analysis of Africa's top property markets and investment opportunities for 2025.",
        keywords: ["African property markets", "real estate investment", "Lagos", "Nairobi", "Cape Town", "market analysis"],
      },
    },
  ];

  async fetchPosts(): Promise<BlogPost[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...this.mockPosts].sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  async fetchPost(id: string): Promise<BlogPost | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.mockPosts.find(post => post.id.toString() === id) || null;
  }

  async fetchFeaturedPosts(): Promise<BlogPost[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.mockPosts.filter(post => post.featured);
  }

  async fetchPostsByCategory(category: string): Promise<BlogPost[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.mockPosts.filter(post => 
      post.category.toLowerCase() === category.toLowerCase()
    );
  }

  async fetchPostsByTag(tag: string): Promise<BlogPost[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.mockPosts.filter(post => 
      post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }
}

// CMS Factory
export class CMSFactory {
  static createService(config: CMSConfig): CMSService {
    switch (config.provider) {
      case 'strapi':
        return new StrapiCMSService(config);
      case 'contentful':
        return new ContentfulCMSService(config);
      case 'local':
      default:
        return new LocalCMSService(config);
    }
  }
}

// Environment variables interface
interface ImportMetaEnv {
  readonly VITE_CMS_PROVIDER?: string;
  readonly VITE_CMS_API_URL?: string;
  readonly VITE_CMS_API_KEY?: string;
  readonly VITE_CMS_SPACE_ID?: string;
  readonly VITE_CMS_PROJECT_ID?: string;
  readonly VITE_CMS_DATASET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Default CMS Configuration
const defaultConfig: CMSConfig = {
  provider: (import.meta.env.VITE_CMS_PROVIDER as CMSConfig['provider']) || 'local',
  apiUrl: import.meta.env.VITE_CMS_API_URL || '',
  apiKey: import.meta.env.VITE_CMS_API_KEY,
  spaceId: import.meta.env.VITE_CMS_SPACE_ID,
  projectId: import.meta.env.VITE_CMS_PROJECT_ID,
  dataset: import.meta.env.VITE_CMS_DATASET,
};

// Export singleton CMS service
export const cmsService = CMSFactory.createService(defaultConfig);
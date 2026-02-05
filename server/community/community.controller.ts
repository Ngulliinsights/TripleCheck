import { Router, Request, Response } from 'express';

import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Type definitions
interface CommunityExperience {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  location?: string;
  rating: number;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  verified: boolean;
}

interface CommunityIntelligence {
  propertyId: string;
  location: {
    address: string;
    neighborhood: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  communityScore: number;
  insights: {
    safety: { score: number; description: string; sources: number };
    amenities: { score: number; description: string; nearby: string[] };
    transportation: { score: number; description: string; options: string[] };
    schools: { score: number; description: string; nearby: string[] };
    demographics: { score: number; description: string; summary: string };
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    impact: 'positive' | 'neutral' | 'negative';
  }>;
  userReviews: CommunityExperience[];
  marketTrends: {
    priceDirection: 'up' | 'down' | 'stable';
    demandLevel: 'high' | 'medium' | 'low';
    averagePrice: number;
    priceChange: number;
  };
}

// Helper functions
const generateMockExperiences = (count: number = 20): CommunityExperience[] => {
  const categories = ['Safety', 'Amenities', 'Transportation', 'Schools', 'Neighborhood', 'Services'];
  const locations = ['Downtown', 'Westside', 'Eastside', 'Northside', 'Southside', 'Suburbs'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `exp_${i}_${Date.now()}`,
    userId: `user_${Math.floor(Math.random() * 1000)}`,
    userName: `User${Math.floor(Math.random() * 1000)}`,
    userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
    title: `Community Experience #${i + 1}`,
    content: `This is a detailed community experience about ${categories[i % categories.length].toLowerCase()}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
    category: categories[i % categories.length],
    tags: ['community', 'experience', categories[i % categories.length].toLowerCase()],
    location: locations[i % locations.length],
    rating: Math.floor(Math.random() * 5) + 1,
    helpful: Math.floor(Math.random() * 50),
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
    verified: Math.random() > 0.3
  }));
};

const generateCommunityIntelligence = (propertyId: string): CommunityIntelligence => {
  const neighborhoods = ['Downtown District', 'Riverside', 'Oak Hills', 'Pine Valley', 'Sunset Heights'];
  const cities = ['Springfield', 'Riverside', 'Oakwood', 'Pine City', 'Sunset Valley'];
  
  return {
    propertyId,
    location: {
      address: `${Math.floor(Math.random() * 9999) + 1} Main Street`,
      neighborhood: neighborhoods[Math.floor(Math.random() * neighborhoods.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      coordinates: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.0060 + (Math.random() - 0.5) * 0.1
      }
    },
    communityScore: Math.floor(Math.random() * 30) + 70, // 70-100
    insights: {
      safety: {
        score: Math.floor(Math.random() * 30) + 70,
        description: 'Generally safe area with low crime rates and good lighting',
        sources: Math.floor(Math.random() * 20) + 10
      },
      amenities: {
        score: Math.floor(Math.random() * 40) + 60,
        description: 'Good selection of local amenities within walking distance',
        nearby: ['Grocery Store', 'Pharmacy', 'Coffee Shop', 'Park', 'Gym']
      },
      transportation: {
        score: Math.floor(Math.random() * 35) + 65,
        description: 'Well-connected with multiple transportation options',
        options: ['Bus Route', 'Metro Station', 'Bike Lanes', 'Highway Access']
      },
      schools: {
        score: Math.floor(Math.random() * 25) + 75,
        description: 'Excellent schools in the area with high ratings',
        nearby: ['Elementary School', 'Middle School', 'High School', 'Library']
      },
      demographics: {
        score: Math.floor(Math.random() * 20) + 80,
        description: 'Diverse, family-friendly community with stable population',
        summary: 'Mixed age groups, professionals and families, growing area'
      }
    },
    recentActivity: [
      {
        type: 'New Business',
        description: 'New coffee shop opened on Main Street',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        impact: 'positive'
      },
      {
        type: 'Infrastructure',
        description: 'Street lighting improvements completed',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        impact: 'positive'
      },
      {
        type: 'Community Event',
        description: 'Annual neighborhood festival held',
        timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        impact: 'positive'
      }
    ],
    userReviews: generateMockExperiences(5),
    marketTrends: {
      priceDirection: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
      demandLevel: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
      averagePrice: Math.floor(Math.random() * 200000) + 200000,
      priceChange: (Math.random() - 0.5) * 20 // -10% to +10%
    }
  };
};

// Get community experiences
router.get('/experiences', (req: Request, res: Response) => {
  const { 
    category, 
    location, 
    rating, 
    verified, 
    page = '1', 
    limit = '20',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  
  let experiences = generateMockExperiences(100);
  
  // Apply filters
  if (category) {
    experiences = experiences.filter(exp => 
      exp.category.toLowerCase() === (category as string).toLowerCase()
    );
  }
  
  if (location) {
    experiences = experiences.filter(exp => 
      exp.location?.toLowerCase().includes((location as string).toLowerCase())
    );
  }
  
  if (rating) {
    const minRating = parseInt(rating as string, 10);
    experiences = experiences.filter(exp => exp.rating >= minRating);
  }
  
  if (verified === 'true') {
    experiences = experiences.filter(exp => exp.verified);
  }
  
  // Sort
  experiences.sort((a, b) => {
    const aValue = a[sortBy as keyof CommunityExperience];
    const bValue = b[sortBy as keyof CommunityExperience];
    
    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });
  
  // Paginate
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedExperiences = experiences.slice(startIndex, startIndex + limitNum);
  
  res.json({
    success: true,
    data: paginatedExperiences,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: experiences.length,
      hasMore: startIndex + limitNum < experiences.length
    },
    filters: { category, location, rating, verified },
    sorting: { sortBy, sortOrder }
  });
});

// Share community experience
router.post('/experiences', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, content, category, tags, location, rating } = req.body;
  const userId = req.user?.id?.toString();
  
  const experience: CommunityExperience = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: userId || 'anonymous',
    userName: `User${userId}`,
    userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    title: title || 'Community Experience',
    content: content || 'No content provided',
    category: category || 'General',
    tags: tags || ['community'],
    location,
    rating: rating || 5,
    helpful: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verified: false
  };
  
  res.status(201).json({
    success: true,
    data: experience,
    message: 'Community experience shared successfully'
  });
});

// Get community categories
router.get('/categories', (req: Request, res: Response) => {
  const categories = [
    { id: 'safety', name: 'Safety', description: 'Crime rates, security, lighting', icon: '🛡️' },
    { id: 'amenities', name: 'Amenities', description: 'Shops, restaurants, services', icon: '🏪' },
    { id: 'transportation', name: 'Transportation', description: 'Public transit, roads, parking', icon: '🚌' },
    { id: 'schools', name: 'Schools', description: 'Education quality, nearby schools', icon: '🏫' },
    { id: 'neighborhood', name: 'Neighborhood', description: 'Community feel, neighbors', icon: '🏘️' },
    { id: 'services', name: 'Services', description: 'Healthcare, utilities, maintenance', icon: '🔧' }
  ];
  
  res.json({
    success: true,
    data: categories
  });
});

// Get community intelligence for a property
router.get('/intelligence/:propertyId', (req: Request, res: Response) => {
  const { propertyId } = req.params;
  
  const intelligence = generateCommunityIntelligence(propertyId);
  
  res.json({
    success: true,
    data: intelligence
  });
});

// Mark experience as helpful
router.post('/experiences/:id/helpful', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      experienceId: id,
      helpful: Math.floor(Math.random() * 50) + 1,
      markedAt: new Date().toISOString()
    },
    message: 'Experience marked as helpful'
  });
});

// Report experience
router.post('/experiences/:id/report', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason, description } = req.body;
  
  res.json({
    success: true,
    data: {
      reportId: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      experienceId: id,
      reason: reason || 'inappropriate_content',
      description: description || 'No description provided',
      reportedAt: new Date().toISOString(),
      status: 'pending'
    },
    message: 'Experience reported successfully'
  });
});

// Get community stats
router.get('/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalExperiences: Math.floor(Math.random() * 10000) + 5000,
      totalUsers: Math.floor(Math.random() * 2000) + 1000,
      verifiedExperiences: Math.floor(Math.random() * 3000) + 2000,
      categoriesCount: 6,
      averageRating: 4.2,
      thisMonth: {
        newExperiences: Math.floor(Math.random() * 500) + 200,
        newUsers: Math.floor(Math.random() * 100) + 50,
        helpfulMarks: Math.floor(Math.random() * 1000) + 500
      },
      topCategories: [
        { category: 'Safety', count: Math.floor(Math.random() * 1000) + 500 },
        { category: 'Amenities', count: Math.floor(Math.random() * 800) + 400 },
        { category: 'Transportation', count: Math.floor(Math.random() * 600) + 300 },
        { category: 'Schools', count: Math.floor(Math.random() * 700) + 350 },
        { category: 'Neighborhood', count: Math.floor(Math.random() * 500) + 250 }
      ]
    }
  });
});

export { router as communityRouter };
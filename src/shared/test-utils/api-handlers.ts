import { http, HttpResponse } from 'msw';

// Mock property data with comprehensive fields
export const mockProperties = [
  {
    id: '1',
    title: 'Modern 3-Bedroom Apartment in Westlands',
    description: 'Beautiful modern apartment with stunning city views',
    location: 'Westlands, Nairobi',
    price: 15000000,
    imageUrls: ['/placeholder-property.jpg', '/placeholder-property-2.jpg'],
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      parkingSpaces: 1,
      yearBuilt: 2020,
      amenities: ['Swimming Pool', 'Gym', '24/7 Security'],
      propertyType: 'Apartment',
    },
    status: 'verified',
    ownerId: 1,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    isActive: true,
    verificationStatus: 'verified',
    trustScore: 95,
  },
  {
    id: '2',
    title: 'Luxury Villa in Karen',
    description: 'Spacious family home with beautiful gardens',
    location: 'Karen, Nairobi',
    price: 45000000,
    imageUrls: ['/placeholder-villa.jpg', '/placeholder-villa-2.jpg'],
    features: {
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 3500,
      parkingSpaces: 3,
      yearBuilt: 2018,
      amenities: ['Swimming Pool', 'Garden', 'Staff Quarters'],
      propertyType: 'House',
    },
    status: 'verified',
    ownerId: 2,
    createdAt: '2024-01-10T08:30:00Z',
    updatedAt: '2024-01-10T08:30:00Z',
    isActive: true,
    verificationStatus: 'verified',
    trustScore: 88,
  },
  {
    id: '3',
    title: 'Cozy Studio in CBD',
    description: 'Perfect for young professionals',
    location: 'CBD, Nairobi',
    price: 8000000,
    imageUrls: ['/placeholder-studio.jpg'],
    features: {
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 600,
      parkingSpaces: 0,
      yearBuilt: 2022,
      amenities: ['Gym', '24/7 Security'],
      propertyType: 'Studio',
    },
    status: 'pending',
    ownerId: 1,
    createdAt: '2024-01-20T14:15:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
    isActive: true,
    verificationStatus: 'pending',
    trustScore: 0,
  },
];

// Mock user data with comprehensive fields
export const mockUsers = [
  {
    id: 1,
    username: 'johndoe',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    trustScore: 85,
    isVerifiedAgent: false,
    verificationLevel: 'basic',
    bio: 'Property enthusiast looking for the perfect home',
    joinedAt: '2023-06-15T09:00:00Z',
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: true,
      language: 'en',
      timezone: 'Africa/Nairobi',
      currency: 'KES',
    },
  },
  {
    id: 2,
    username: 'janedoe',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'agent',
    trustScore: 92,
    isVerifiedAgent: true,
    verificationLevel: 'verified',
    bio: 'Experienced real estate agent with 10+ years in Nairobi market',
    joinedAt: '2022-03-10T11:30:00Z',
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      marketingEmails: false,
      language: 'en',
      timezone: 'Africa/Nairobi',
      currency: 'KES',
    },
  },
  {
    id: 3,
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    trustScore: 100,
    isVerifiedAgent: false,
    verificationLevel: 'premium',
    bio: 'System administrator',
    joinedAt: '2022-01-01T00:00:00Z',
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      marketingEmails: false,
      language: 'en',
      timezone: 'Africa/Nairobi',
      currency: 'KES',
    },
  },
];

// Mock reviews data
export const mockReviews = [
  {
    id: 1,
    propertyId: '1',
    userId: 2,
    rating: 5,
    comment: 'Excellent property with great amenities. Highly recommended!',
    createdAt: '2024-01-16T12:00:00Z',
    helpfulCount: 3,
    user: mockUsers[1],
  },
  {
    id: 2,
    propertyId: '1',
    userId: 1,
    rating: 4,
    comment: 'Good location and well-maintained. Minor issues with parking.',
    createdAt: '2024-01-18T15:30:00Z',
    helpfulCount: 1,
    user: mockUsers[0],
  },
];

// Mock verification data
export const mockVerificationStatus = {
  propertyId: '1',
  status: 'verified',
  verifiedAt: '2024-01-15T12:00:00Z',
  verificationScore: 95,
  checks: {
    documentVerification: { status: 'passed', score: 100 },
    locationVerification: { status: 'passed', score: 95 },
    ownershipVerification: { status: 'passed', score: 90 },
    marketAnalysis: { status: 'passed', score: 92 },
  },
};

// Mock payment data
export const mockPayments = [
  {
    id: 'txn_123456',
    amount: 1000,
    currency: 'KES',
    status: 'completed',
    method: 'mpesa',
    createdAt: '2024-01-20T10:00:00Z',
    description: 'Property verification fee',
  },
];

// Define comprehensive API handlers
export const handlers = [
  // Properties endpoints
  http.get('/api/properties', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const location = url.searchParams.get('location');
    const priceMin = url.searchParams.get('priceMin');
    const priceMax = url.searchParams.get('priceMax');
    const propertyType = url.searchParams.get('propertyType');
    const verified = url.searchParams.get('verified');

    let filteredProperties = [...mockProperties];

    // Apply filters
    if (location) {
      filteredProperties = filteredProperties.filter(p => 
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    if (priceMin) {
      filteredProperties = filteredProperties.filter(p => p.price >= parseInt(priceMin));
    }
    if (priceMax) {
      filteredProperties = filteredProperties.filter(p => p.price <= parseInt(priceMax));
    }
    if (propertyType) {
      filteredProperties = filteredProperties.filter(p => 
        p.features.propertyType.toLowerCase() === propertyType.toLowerCase()
      );
    }
    if (verified === 'true') {
      filteredProperties = filteredProperties.filter(p => p.status === 'verified');
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      data: {
        properties: paginatedProperties,
        totalCount: filteredProperties.length,
        page,
        limit,
      },
    });
  }),
  
  http.get('/api/properties/:id', ({ params }) => {
    const { id } = params;
    const property = mockProperties.find(p => p.id === id);
    
    if (!property) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          error: 'Property not found',
        }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: property,
    });
  }),

  http.post('/api/properties', async ({ request }) => {
    const body = await request.json() as any;
    const newProperty = {
      id: String(mockProperties.length + 1),
      ...body,
      ownerId: 1, // Mock current user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      verificationStatus: 'pending',
      trustScore: 0,
    };
    
    mockProperties.push(newProperty);
    
    return HttpResponse.json({
      success: true,
      data: newProperty,
    }, { status: 201 });
  }),

  http.put('/api/properties/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;
    const propertyIndex = mockProperties.findIndex(p => p.id === id);
    
    if (propertyIndex === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          error: 'Property not found',
        }),
        { status: 404 }
      );
    }
    
    mockProperties[propertyIndex] = {
      ...mockProperties[propertyIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      data: mockProperties[propertyIndex],
    });
  }),

  http.delete('/api/properties/:id', ({ params }) => {
    const { id } = params;
    const propertyIndex = mockProperties.findIndex(p => p.id === id);
    
    if (propertyIndex === -1) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          error: 'Property not found',
        }),
        { status: 404 }
      );
    }
    
    if (mockProperties[propertyIndex]) {
      mockProperties[propertyIndex]!.isActive = false;
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Property deleted successfully',
    });
  }),

  // Property verification endpoints
  http.get('/api/properties/:id/verification', ({ params }) => {
    const { id } = params;
    const property = mockProperties.find(p => p.id === id);
    
    if (!property) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          error: 'Property not found',
        }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: { ...mockVerificationStatus, propertyId: id },
    });
  }),

  http.post('/api/properties/:id/verify', ({ params }) => {
    const { id } = params;
    const property = mockProperties.find(p => p.id === id);
    
    if (!property) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          error: 'Property not found',
        }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: { ...mockVerificationStatus, propertyId: id },
    });
  }),

  // Property search endpoints
  http.post('/api/properties/search', async ({ request }) => {
    const body = await request.json() as any;
    const { query, filters = {}, page = 1, limit = 20 } = body;

    let filteredProperties = [...mockProperties];

    // Apply text search
    if (query) {
      filteredProperties = filteredProperties.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.location.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply filters (similar to GET endpoint)
    if (filters.location) {
      filteredProperties = filteredProperties.filter(p => 
        p.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      data: {
        properties: paginatedProperties,
        totalCount: filteredProperties.length,
        page,
        limit,
      },
    });
  }),

  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUsers[0],
          token: 'mock-jwt-token',
        },
      });
    }

    if (body.email === 'admin@example.com' && body.password === 'admin123') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUsers[2],
          token: 'mock-admin-token',
        },
      });
    }
    
    return new HttpResponse(
      JSON.stringify({
        success: false,
        error: 'Invalid credentials',
      }),
      { status: 401 }
    );
  }),
  
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as any;
    const newUser = {
      id: mockUsers.length + 1,
      ...body,
      role: 'user',
      trustScore: 0,
      isVerifiedAgent: false,
      verificationLevel: 'unverified',
      joinedAt: new Date().toISOString(),
    };
    
    mockUsers.push(newUser);
    
    return HttpResponse.json({
      success: true,
      data: {
        user: newUser,
        token: 'mock-jwt-token',
      },
    }, { status: 201 });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      success: true,
      data: mockUsers[0],
    });
  }),

  http.get('/api/auth/validate-session', () => {
    return HttpResponse.json({
      success: true,
      data: { valid: true, user: mockUsers[0] },
    });
  }),

  // User endpoints
  http.get('/api/users/me', () => {
    return HttpResponse.json({
      success: true,
      data: mockUsers[0],
    });
  }),

  http.put('/api/users/me', async ({ request }) => {
    const body = await request.json() as any;
    const updatedUser = { ...mockUsers[0], ...body };
    mockUsers[0] = updatedUser;
    
    return HttpResponse.json({
      success: true,
      data: updatedUser,
    });
  }),

  http.get('/api/users/me/preferences', () => {
    return HttpResponse.json({
      success: true,
      data: mockUsers[0]?.preferences,
    });
  }),

  http.put('/api/users/me/preferences', async ({ request }) => {
    const body = await request.json() as any;
    if (mockUsers[0]?.preferences) {
      mockUsers[0].preferences = { ...mockUsers[0].preferences, ...body };
    }
    
    return HttpResponse.json({
      success: true,
      data: mockUsers[0]?.preferences,
    });
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    const user = mockUsers.find(u => u.id === parseInt(id as string));
    
    if (!user) {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          error: 'User not found',
        }),
        { status: 404 }
      );
    }
    
    // Return public profile
    const publicProfile = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      trustScore: user.trustScore,
      isVerifiedAgent: user.isVerifiedAgent,
      verificationLevel: user.verificationLevel,
      joinedAt: user.joinedAt,
    };
    
    return HttpResponse.json({
      success: true,
      data: publicProfile,
    });
  }),

  // Review endpoints
  http.get('/api/reviews/properties/:id/reviews', ({ params, request }) => {
    const { id } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const propertyReviews = mockReviews.filter(r => r.propertyId === id);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReviews = propertyReviews.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        totalCount: propertyReviews.length,
        page,
        limit,
      },
    });
  }),

  http.post('/api/reviews/properties/:id/reviews', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;
    
    const newReview = {
      id: mockReviews.length + 1,
      propertyId: Array.isArray(id) ? id[0] : id,
      userId: 1, // Mock current user
      rating: body.rating,
      comment: body.comment,
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
      user: mockUsers[0],
    };
    
    mockReviews.push(newReview);
    
    return HttpResponse.json({
      success: true,
      data: newReview,
    }, { status: 201 });
  }),

  // Payment endpoints
  http.post('/api/payments/mpesa/initiate', async ({ request }) => {
    const body = await request.json() as any;
    
    const payment = {
      id: `txn_${Date.now()}`,
      amount: body.amount,
      currency: 'KES',
      status: 'pending',
      method: 'mpesa',
      createdAt: new Date().toISOString(),
      description: body.description || 'Payment',
    };
    
    return HttpResponse.json({
      success: true,
      data: payment,
    });
  }),

  http.get('/api/payments/:transactionId/status', ({ params }) => {
    const { transactionId } = params;
    
    return HttpResponse.json({
      success: true,
      data: {
        id: transactionId,
        status: 'completed',
        amount: 1000,
        currency: 'KES',
      },
    });
  }),

  http.get('/api/payments/history', () => {
    return HttpResponse.json({
      success: true,
      data: mockPayments,
    });
  }),

  // Health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  }),

  // Error simulation endpoints for testing
  http.get('/api/test/error', () => {
    return new HttpResponse(
      JSON.stringify({
        success: false,
        error: 'Simulated server error',
      }),
      { status: 500 }
    );
  }),

  http.get('/api/test/timeout', () => {
    // Simulate timeout by delaying response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(HttpResponse.json({
          success: true,
          data: { message: 'Delayed response' },
        }));
      }, 5000);
    });
  }),
];
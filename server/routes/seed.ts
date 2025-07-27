import { Router } from 'express';
import { db } from '../infrastructure/database/connection';
import { properties, users } from '../../src/shared/schema';

const router = Router();

const sampleProperties = [
  {
    title: "Modern 3BR Apartment in Westlands",
    description: "Beautiful modern apartment with stunning city views, located in the heart of Westlands. Features include a spacious living room, modern kitchen, and secure parking.",
    price: "8500000", // 8.5M KES
    location: "Westlands, Nairobi",
    address: "Westlands Road, Nairobi, Kenya",
    coordinates: { lat: -1.2676, lng: 36.8108 },
    imageUrls: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"
    ],
    verificationStatus: "verified" as const,
    features: {
      propertyType: "apartment",
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      parking: true,
      furnished: false,
      petFriendly: true,
      amenities: ["gym", "swimming_pool", "security", "backup_generator"]
    },
    ownerId: 1,
    isActive: true,
    isFeatured: true
  },
  {
    title: "Spacious 4BR House in Karen",
    description: "Elegant family home in the prestigious Karen suburb. Features a large garden, modern amenities, and excellent security.",
    price: "25000000", // 25M KES
    location: "Karen, Nairobi",
    address: "Karen Road, Nairobi, Kenya",
    coordinates: { lat: -1.3197, lng: 36.7076 },
    imageUrls: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"
    ],
    verificationStatus: "verified" as const,
    features: {
      propertyType: "house",
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2500,
      parking: true,
      furnished: false,
      petFriendly: true,
      amenities: ["garden", "security", "backup_generator", "borehole"]
    },
    ownerId: 1,
    isActive: true,
    isFeatured: true
  },
  {
    title: "Affordable 2BR Apartment in Kasarani",
    description: "Well-maintained 2-bedroom apartment perfect for young professionals. Close to public transport and shopping centers.",
    price: "4200000", // 4.2M KES
    location: "Kasarani, Nairobi",
    address: "Thika Road, Kasarani, Nairobi, Kenya",
    coordinates: { lat: -1.2167, lng: 36.8833 },
    imageUrls: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800"
    ],
    verificationStatus: "pending" as const,
    features: {
      propertyType: "apartment",
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 800,
      parking: true,
      furnished: false,
      petFriendly: false,
      amenities: ["security", "water_backup"]
    },
    ownerId: 1,
    isActive: true,
    isFeatured: false
  },
  {
    title: "Luxury Penthouse in Kilimani",
    description: "Stunning penthouse with panoramic views of Nairobi skyline. Premium finishes and world-class amenities.",
    price: "45000000", // 45M KES
    location: "Kilimani, Nairobi",
    address: "Argwings Kodhek Road, Kilimani, Nairobi, Kenya",
    coordinates: { lat: -1.2921, lng: 36.7833 },
    imageUrls: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800"
    ],
    verificationStatus: "verified" as const,
    features: {
      propertyType: "apartment",
      bedrooms: 4,
      bathrooms: 4,
      squareFeet: 3000,
      parking: true,
      furnished: true,
      petFriendly: true,
      amenities: ["gym", "swimming_pool", "security", "backup_generator", "elevator", "balcony"]
    },
    ownerId: 1,
    isActive: true,
    isFeatured: true
  },
  {
    title: "Cozy Studio in CBD",
    description: "Perfect studio apartment for professionals working in the city center. Walking distance to offices and restaurants.",
    price: "3500000", // 3.5M KES
    location: "CBD, Nairobi",
    address: "Kenyatta Avenue, Nairobi, Kenya",
    coordinates: { lat: -1.2864, lng: 36.8172 },
    imageUrls: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800"
    ],
    verificationStatus: "verified" as const,
    features: {
      propertyType: "studio",
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 450,
      parking: false,
      furnished: true,
      petFriendly: false,
      amenities: ["security", "elevator", "backup_generator"]
    },
    ownerId: 1,
    isActive: true,
    isFeatured: false
  },
  {
    title: "Family Home in Runda",
    description: "Beautiful family home in the exclusive Runda estate. Quiet neighborhood with excellent schools nearby.",
    price: "35000000", // 35M KES
    location: "Runda, Nairobi",
    address: "Runda Estate, Nairobi, Kenya",
    coordinates: { lat: -1.2167, lng: 36.7833 },
    imageUrls: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800"
    ],
    verificationStatus: "pending" as const,
    features: {
      propertyType: "house",
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 3500,
      parking: true,
      furnished: false,
      petFriendly: true,
      amenities: ["garden", "security", "backup_generator", "borehole", "swimming_pool"]
    },
    ownerId: 1,
    isActive: true,
    isFeatured: true
  }
];

// Seed database endpoint
router.post('/seed', async (req, res) => {
  try {
    console.log('Starting database seeding...');
    
    // Check if we have any users
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('No users found. Creating a sample user first...');
      await db.insert(users).values({
        username: 'sample_user',
        email: 'sample@example.com',
        passwordHash: 'hashed_password', // In real app, this would be properly hashed
        role: 'user',
        isVerifiedAgent: false,
        trustScore: 85
      });
      console.log('Sample user created.');
    }
    
    // Check if properties already exist
    const existingProperties = await db.select().from(properties).limit(1);
    
    if (existingProperties.length > 0) {
      console.log('Properties already exist in database. Clearing existing properties...');
      await db.delete(properties);
    }
    
    // Insert sample properties
    console.log('Inserting sample properties...');
    await db.insert(properties).values(sampleProperties);
    
    console.log(`Successfully seeded ${sampleProperties.length} properties!`);
    
    res.json({
      success: true,
      message: `Successfully seeded ${sampleProperties.length} properties`,
      properties: sampleProperties.map(p => ({ title: p.title, price: p.price, location: p.location }))
    });
    
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get seeding status
router.get('/status', async (req, res) => {
  try {
    const userCount = await db.select().from(users);
    const propertyCount = await db.select().from(properties);
    
    res.json({
      success: true,
      data: {
        users: userCount.length,
        properties: propertyCount.length,
        seeded: propertyCount.length > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export { router as seedRouter };
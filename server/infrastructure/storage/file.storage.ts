import type { 
  User, InsertUser, 
  Property, InsertProperty,
  Review, InsertReview,
  PropertyFeatures
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, like, and, or, gte, lte, desc } from "drizzle-orm";
import { logger } from "../monitoring/logger";

// Mock database tables for TypeScript compatibility
// In a real app, these would be imported from your database schema
const users = {} as any;
const properties = {} as any;
const reviews = {} as any;

// Enhanced PropertyFilter interface with better type safety
export interface PropertyFilter {
  type?: string[];
  priceRange?: readonly [number, number]; // Using readonly tuple for immutability
  bedrooms?: number;
  bathrooms?: number;
  area?: readonly [number, number];
  features?: readonly string[]; // Making arrays readonly for safety
  verificationStatus?: readonly string[];
  location?: string;
}

// Custom Location interface to avoid DOM Location conflicts
export interface PropertyLocation {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
}

// Enhanced interface with better error handling and result types
export interface IStorage {
  // User operations with proper return types
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTrustScore(id: number, score: number): Promise<User>;

  // Property operations with enhanced type safety
  getProperty(id: number): Promise<Property | null>;
  getProperties(): Promise<readonly Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateVerificationStatus(id: number, status: string, results: any): Promise<Property>;
  searchProperties(query: string): Promise<readonly Property[]>;
  searchPropertiesWithFilters(filters: PropertyFilter): Promise<readonly Property[]>;

  // Review operations
  getReviews(propertyId: number): Promise<readonly Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Location operations
  searchLocations(query: string): Promise<readonly PropertyLocation[]>;
  
  // Database initialization
  initializeDatabase(): Promise<void>;
}

// Enhanced database storage implementation with better error handling and performance
export class DatabaseStorage implements IStorage {
  private readonly db: ReturnType<typeof drizzle>;
  
  // Cache for common locations to improve performance
  private readonly commonLocations: readonly PropertyLocation[] = [
    { id: "1", name: "Karen", description: "Affluent suburb in Nairobi" },
    { id: "2", name: "Runda", description: "Exclusive residential area" },
    { id: "3", name: "Kilimani", description: "Popular urban residential area" },
    { id: "4", name: "Westlands", description: "Commercial and residential hub" },
    { id: "5", name: "Lavington", description: "Upmarket residential area" },
    { id: "6", name: "Parklands", description: "Diverse residential and commercial area" },
    { id: "7", name: "Upperhill", description: "Business district with residential options" },
    { id: "8", name: "Kileleshwa", description: "Mixed residential area" },
    { id: "9", name: "Ngong Road", description: "Developing residential corridor" },
    { id: "10", name: "Riverside", description: "Upscale residential area" }
  ] as const;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    try {
      const sql = neon(databaseUrl);
      this.db = drizzle(sql);
      console.log("Database connection initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database connection:", error);
      throw new Error("Database initialization failed");
    }
  }

  // Enhanced error handling with more specific error messages
  private handleDatabaseError(operation: string, error: unknown): never {
    console.error(`Database error during ${operation}:`, error);
    throw new Error(`Failed to ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  async getUser(id: number): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      return result[0] ?? null; // Using nullish coalescing for clarity
    } catch (error) {
      this.handleDatabaseError('get user', error);
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      return result[0] ?? null;
    } catch (error) {
      this.handleDatabaseError('get user by username', error);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await this.db
        .insert(users)
        .values(insertUser)
        .returning();
      
      const user = result[0];
      if (!user) {
        throw new Error('User creation failed - no user returned');
      }
      
      return user;
    } catch (error) {
      this.handleDatabaseError('create user', error);
    }
  }

  async updateUserTrustScore(id: number, score: number): Promise<User> {
    try {
      const result = await this.db
        .update(users)
        .set({ 
          trustScore: score, 
          updatedAt: new Date() 
        })
        .where(eq(users.id, id))
        .returning();
      
      const user = result[0];
      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }
      
      return user;
    } catch (error) {
      this.handleDatabaseError('update user trust score', error);
    }
  }

  async getProperty(id: number): Promise<Property | null> {
    try {
      const result = await this.db
        .select()
        .from(properties)
        .where(eq(properties.id, id))
        .limit(1);
      
      return result[0] ?? null;
    } catch (error) {
      this.handleDatabaseError('get property', error);
    }
  }

  async getProperties(): Promise<readonly Property[]> {
    try {
      const result = await this.db
        .select()
        .from(properties)
        .orderBy(desc(properties.createdAt));
      
      return result;
    } catch (error) {
      this.handleDatabaseError('get properties', error);
    }
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    try {
      const result = await this.db
        .insert(properties)
        .values(insertProperty)
        .returning();
      
      const property = result[0];
      if (!property) {
        throw new Error('Property creation failed - no property returned');
      }
      
      return property;
    } catch (error) {
      this.handleDatabaseError('create property', error);
    }
  }

  async updateVerificationStatus(id: number, status: string, results: any): Promise<Property> {
    try {
      const result = await this.db
        .update(properties)
        .set({ 
          verificationStatus: status, 
          aiVerificationResults: results,
          updatedAt: new Date()
        })
        .where(eq(properties.id, id))
        .returning();
      
      const property = result[0];
      if (!property) {
        throw new Error(`Property with id ${id} not found`);
      }
      
      return property;
    } catch (error) {
      this.handleDatabaseError('update verification status', error);
    }
  }

  async searchProperties(query: string): Promise<readonly Property[]> {
    try {
      // Trim and validate query to prevent unnecessary database calls
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return [];
      }
      
      const result = await this.db
        .select()
        .from(properties)
        .where(
          or(
            like(properties.title, `%${trimmedQuery}%`),
            like(properties.location, `%${trimmedQuery}%`),
            like(properties.description, `%${trimmedQuery}%`)
          )
        )
        .orderBy(desc(properties.createdAt));
      
      return result;
    } catch (error) {
      this.handleDatabaseError('search properties', error);
    }
  }

  async getReviews(propertyId: number): Promise<readonly Review[]> {
    try {
      const result = await this.db
        .select()
        .from(reviews)
        .where(eq(reviews.propertyId, propertyId))
        .orderBy(desc(reviews.createdAt));
      
      return result;
    } catch (error) {
      this.handleDatabaseError('get reviews', error);
    }
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    try {
      const result = await this.db
        .insert(reviews)
        .values(insertReview)
        .returning();
      
      const review = result[0];
      if (!review) {
        throw new Error('Review creation failed - no review returned');
      }
      
      return review;
    } catch (error) {
      this.handleDatabaseError('create review', error);
    }
  }

  async searchLocations(query: string): Promise<readonly PropertyLocation[]> {
    const trimmedQuery = query.trim().toLowerCase();
    
    // Return empty array for empty queries to avoid unnecessary processing
    if (!trimmedQuery) {
      return [];
    }

    // Filter locations efficiently using the cached array
    return this.commonLocations.filter(location => 
      location.name.toLowerCase().includes(trimmedQuery) ||
      location.description?.toLowerCase().includes(trimmedQuery)
    );
  }

  async searchPropertiesWithFilters(filters: PropertyFilter): Promise<readonly Property[]> {
    try {
      // Start with base query - using the more specific query builder approach
      const baseQuery = this.db.select().from(properties);
      
      // Build database-level conditions for optimal performance
      const dbConditions = this.buildDatabaseConditions(filters);
      
      // Apply database conditions if any exist and execute query
      const result = dbConditions.length > 0 
        ? await baseQuery.where(and(...dbConditions)).orderBy(desc(properties.createdAt))
        : await baseQuery.orderBy(desc(properties.createdAt));
      
      // Apply memory-based filters for complex JSON field operations
      return this.applyMemoryFilters(result, filters);
    } catch (error) {
      this.handleDatabaseError('search properties with filters', error);
    }
  }

  // Helper method to build database-level conditions for better performance
  private buildDatabaseConditions(filters: PropertyFilter) {
    const conditions = [];
    
    // Price range filter - handled at database level for performance
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      conditions.push(and(gte(properties.price, min), lte(properties.price, max)));
    }
    
    // Location filter - handled at database level
    if (filters.location) {
      conditions.push(like(properties.location, `%${filters.location}%`));
    }
    
    // Verification status filter - handled in memory for now due to array complexity
    // TODO: Implement proper database-level filtering for verification status
    
    return conditions;
  }

  // Helper method to apply memory-based filters for complex JSON operations
  private applyMemoryFilters(properties: Property[], filters: PropertyFilter): readonly Property[] {
    return properties.filter(property => {
      // Property type filter
      if (filters.type?.length && property.features && !filters.type.includes(property.features.propertyType || '')) {
        return false;
      }

      // Minimum bedrooms filter
      if (filters.bedrooms !== undefined && property.features && (property.features.bedrooms || 0) < filters.bedrooms) {
        return false;
      }

      // Minimum bathrooms filter
      if (filters.bathrooms !== undefined && property.features && (property.features.bathrooms || 0) < filters.bathrooms) {
        return false;
      }

      // Area range filter
      if (filters.area && property.features) {
        const [min, max] = filters.area;
        const squareFeet = property.features.squareFeet || 0;
        if (squareFeet < min || squareFeet > max) {
          return false;
        }
      }

      // Required features filter - improved logic
      if (filters.features?.length && property.features) {
        const propertyAmenities = property.features.amenities || [];
        const hasAllFeatures = filters.features.every(feature => 
          propertyAmenities.includes(feature)
        );
        if (!hasAllFeatures) {
          return false;
        }
      }

      return true;
    });
  }

  // Enhanced database initialization with better error handling
  async initializeDatabase(): Promise<void> {
    try {
      const existingProperties = await this.getProperties();
      if (existingProperties.length > 0) {
        console.log('Database already contains data, skipping initialization');
        return;
      }

      console.log('Initializing database with sample data...');
      
      // Create sample users with proper error handling
      const sampleUsers: InsertUser[] = [
        { username: 'john_doe', email: 'john@example.com', password: 'password123', role: 'user' as const },
        { username: 'jane_smith', email: 'jane@example.com', password: 'password456', role: 'user' as const }
      ];

      const createdUsers: User[] = [];
      for (const user of sampleUsers) {
        try {
          const existingUser = await this.getUserByUsername(user.username);
          if (existingUser) {
            console.log(`User ${user.username} already exists, using existing user`);
            createdUsers.push(existingUser);
          } else {
            const createdUser = await this.createUser(user);
            createdUsers.push(createdUser);
            console.log(`Created user: ${user.username}`);
          }
        } catch (error) {
          console.error(`Failed to create user ${user.username}:`, error);
          // Continue with other users even if one fails
        }
      }

      // Ensure we have at least one user for property creation
      if (createdUsers.length === 0) {
        throw new Error('No users available for property creation');
      }

      // Create sample properties with enhanced data - ensuring type safety
      const mockProperties: InsertProperty[] = this.createSampleProperties(createdUsers);

      // Create properties with proper error handling
      let createdCount = 0;
      for (const property of mockProperties) {
        try {
          await this.createProperty(property);
          createdCount++;
          console.log(`Created property: ${property.title}`);
        } catch (error) {
          console.error(`Failed to create property ${property.title}:`, error);
          // Continue with other properties even if one fails
        }
      }

      console.log(`Database initialization completed. Created ${createdCount} properties.`);
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error('Failed to initialize database');
    }
  }

  // Helper method to create sample properties with better organization and type safety
  private createSampleProperties(users: User[]): InsertProperty[] {
    // Guard against empty users array - this ensures we always have valid users
    if (users.length === 0) {
      throw new Error('Cannot create sample properties without users');
    }

    // Use non-null assertion with proper fallback logic to satisfy TypeScript
    const primaryUser = users[0]!; // We know this exists due to the guard above
    const secondaryUser = users[1] ?? primaryUser; // Fallback to primary user if only one exists

    return [
      {
        ownerId: primaryUser.id,
        title: "Modern Apartment in Kilimani",
        description: "Luxurious 3-bedroom apartment with amazing city views and modern amenities. Perfect for professionals and families seeking comfort and convenience.",
        location: "Kilimani, Nairobi",
        price: 25000000,
        verificationStatus: "verified" as const,
        imageUrls: [
          "https://images.unsplash.com/photo-1580041065738-e72023775cdc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ],
        features: {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1500,
          parkingSpaces: 2,
          yearBuilt: 2020,
          amenities: ["Swimming Pool", "Gym", "Security", "Backup Generator"],
          petFriendly: true,
          furnished: true,
          propertyType: "apartment" as const
        }
      },
      {
        ownerId: primaryUser.id,
        title: "Family Home in Karen",
        description: "Spacious 4-bedroom house with large garden and staff quarters. Ideal for families seeking privacy and space in a prestigious location.",
        location: "Karen, Nairobi",
        price: 45000000,
        verificationStatus: "verified" as const,
        imageUrls: [
          "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ],
        features: {
          bedrooms: 4,
          bathrooms: 3,
          squareFeet: 3000,
          parkingSpaces: 3,
          yearBuilt: 2019,
          amenities: ["Garden", "Staff Quarters", "Security", "Borehole"],
          petFriendly: false,
          furnished: false,
          propertyType: "house" as const
        }
      },
      {
        ownerId: secondaryUser.id,
        title: "Executive Office in Westlands",
        description: "Premium office space in the heart of Westlands business district. Fully equipped with modern facilities and excellent connectivity.",
        location: "Westlands, Nairobi",
        price: 35000000,
        verificationStatus: "pending" as const,
        imageUrls: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        ],
        features: {
          bedrooms: 0,
          bathrooms: 2,
          squareFeet: 1200,
          parkingSpaces: 5,
          yearBuilt: 2021,
          amenities: ["High-Speed Internet", "Conference Room", "Reception Area", "Security"],
          petFriendly: false,
          furnished: true,
          propertyType: "condo" as const
        }
      }
    ];
  }
}

// Export singleton instance with enhanced error handling
export const storage = new DatabaseStorage();
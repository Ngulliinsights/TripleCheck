import { 
  User, InsertUser, 
  Property, InsertProperty,
  Review, InsertReview,
  BlockchainVerification
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTrustScore(id: number, score: number): Promise<User>;

  // Property operations
  getProperty(id: number): Promise<Property | undefined>;
  getProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<Property>): Promise<Property>;
  searchProperties(query: string): Promise<Property[]>;

  // Review operations
  getReviews(propertyId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Community post operations
  getCommunityPosts(): Promise<CommunityPost[]>;
  getCommunityPost(id: number): Promise<CommunityPost | undefined>;
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;

  // Legal resource operations
  getLegalResources(): Promise<LegalResource[]>;
  getLegalResource(id: number): Promise<LegalResource | undefined>;

  // User preferences
  getUserPreferences(userId: number): Promise<UserPreference | undefined>;
  updateUserPreferences(userId: number, preferences: Partial<UserPreference>): Promise<UserPreference>;

  // Property interactions
  getPropertyInteractions(propertyId: number, userId: number): Promise<PropertyInteraction[]>;
  recordPropertyInteraction(interaction: Omit<PropertyInteraction, 'id' | 'createdAt'>): Promise<PropertyInteraction>;
}

export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  location: string;
  isAnonymous: boolean;
  userId: number;
  category: string;
  verificationStatus: string;
  createdAt: Date;
}

export interface InsertCommunityPost {
  title: string;
  content: string;
  location: string;
  isAnonymous: boolean;
  userId: number;
  category: string;
}

export interface LegalResource {
  id: number;
  title: string;
  description: string;
  category: string;
  link: string;
  content: string;
  updatedAt: Date;
}

export interface InsertLegalResource {
  title: string;
  description: string;
  category: string;
  link: string;
  content: string;
}

export interface UserPreference {
  id: number;
  userId: number;
  preferredLanguage: string;
  notificationSettings: {
    email: boolean;
    sms: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyInteraction {
  id: number;
  userId: number;
  propertyId: number;
  interactionType: 'view' | 'favorite' | 'inquiry';
  createdAt: Date;
}


export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private reviews: Map<number, Review>;
  private communityPosts: Map<number, CommunityPost>;
  private legalResources: Map<number, LegalResource>;
  private userPreferences: Map<number, UserPreference>;
  private propertyInteractions: Map<number, PropertyInteraction>;
  private currentIds: {
    users: number;
    properties: number;
    reviews: number;
    communityPosts: number;
    legalResources: number;
    userPreferences: number;
    propertyInteractions: number;
  };

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.reviews = new Map();
    this.communityPosts = new Map();
    this.legalResources = new Map();
    this.userPreferences = new Map();
    this.propertyInteractions = new Map();
    this.currentIds = {
      users: 1,
      properties: 1,
      reviews: 1,
      communityPosts: 1,
      legalResources: 1,
      userPreferences: 1,
      propertyInteractions: 1
    };

    // Add mock data
    this.initializeMockData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = {
      ...insertUser,
      id,
      verificationStatus: 'pending',
      verificationDocuments: null,
      trustScore: 0,
      isVerifiedAgent: false,
      agentLicenseNumber: null,
      licenseExpiryDate: null,
      idNumber: null,
      kraPinNumber: null,
      phoneNumber: null,
      preferredLanguage: 'en'
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserTrustScore(id: number, score: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, trustScore: score };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentIds.properties++;
    const property: Property = {
      ...insertProperty,
      id,
      verificationStatus: 'pending',
      aiVerificationResults: null,
      verificationDocuments: null,
      surveyorVerification: null,
      landRegistryVerification: null,
      blockchainVerification: null,
      digitalTitleDeedHash: null,
      smartContractAddress: null,
      titleSwahili: null,
      descriptionSwahili: null,
      createdAt: new Date()
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: number, updates: Partial<Property>): Promise<Property> {
    const property = await this.getProperty(id);
    if (!property) throw new Error("Property not found");

    const updatedProperty = { ...property, ...updates };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async searchProperties(query: string): Promise<Property[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.properties.values()).filter(property =>
      property.title.toLowerCase().includes(lowercaseQuery) ||
      property.location.toLowerCase().includes(lowercaseQuery) ||
      property.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getReviews(propertyId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.propertyId === propertyId);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentIds.reviews++;
    const review: Review = {
      ...insertReview,
      id,
      createdAt: new Date()
    };
    this.reviews.set(id, review);
    return review;
  }

  async getCommunityPosts(): Promise<CommunityPost[]> {
    return Array.from(this.communityPosts.values());
  }

  async getCommunityPost(id: number): Promise<CommunityPost | undefined> {
    return this.communityPosts.get(id);
  }

  async createCommunityPost(insertPost: InsertCommunityPost): Promise<CommunityPost> {
    const id = this.currentIds.communityPosts++;
    const post: CommunityPost = {
      ...insertPost,
      id,
      verificationStatus: 'pending',
      createdAt: new Date()
    };
    this.communityPosts.set(id, post);
    return post;
  }

  async getLegalResources(): Promise<LegalResource[]> {
    return Array.from(this.legalResources.values());
  }

  async getLegalResource(id: number): Promise<LegalResource | undefined> {
    return this.legalResources.get(id);
  }

  async getUserPreferences(userId: number): Promise<UserPreference | undefined> {
    return Array.from(this.userPreferences.values())
      .find(pref => pref.userId === userId);
  }

  async updateUserPreferences(userId: number, preferences: Partial<UserPreference>): Promise<UserPreference> {
    const existing = await this.getUserPreferences(userId);
    const id = existing?.id || this.currentIds.userPreferences++;

    const updated: UserPreference = {
      ...existing,
      ...preferences,
      id,
      userId,
      updatedAt: new Date(),
      createdAt: existing?.createdAt || new Date()
    };

    this.userPreferences.set(id, updated);
    return updated;
  }

  async getPropertyInteractions(propertyId: number, userId: number): Promise<PropertyInteraction[]> {
    return Array.from(this.propertyInteractions.values())
      .filter(interaction => 
        interaction.propertyId === propertyId && 
        interaction.userId === userId
      );
  }

  async recordPropertyInteraction(
    interaction: Omit<PropertyInteraction, 'id' | 'createdAt'>
  ): Promise<PropertyInteraction> {
    const id = this.currentIds.propertyInteractions++;
    const newInteraction: PropertyInteraction = {
      ...interaction,
      id,
      createdAt: new Date()
    };

    this.propertyInteractions.set(id, newInteraction);
    return newInteraction;
  }

  private initializeMockData() {
    // Add mock properties with blockchain verification
    const mockProperties: InsertProperty[] = [
      {
        ownerId: 1,
        title: "Modern Apartment in Kilimani",
        titleSwahili: "Apartment ya Kisasa Kilimani",
        description: "Luxurious 3-bedroom apartment with amazing city views",
        descriptionSwahili: "Apartment nzuri yenye vyumba 3 na mandhari mazuri ya jiji",
        location: "Kilimani, Nairobi",
        price: 25000000,
        imageUrls: [
          "https://images.unsplash.com/photo-1580041065738-e72023775cdc"
        ],
        features: {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1500,
          parkingSpaces: 2,
          yearBuilt: 2020,
          amenities: ["Swimming Pool", "Gym", "Security"],
          waterSource: "borehole",
          powerBackup: true,
          security: ["gated", "security_guard"],
          nearbyFacilities: ["schools", "hospitals"]
        },
        propertyType: "residential",
        landReferenceNumber: "KLM123456",
        titleDeedNumber: "TD789012",
        plotNumber: "P345"
      },
      {
        ownerId: 1,
        title: "Commercial Space in CBD",
        titleSwahili: "Nafasi ya Biashara CBD",
        description: "Prime commercial space in Nairobi CBD",
        descriptionSwahili: "Nafasi bora ya biashara katikati ya Nairobi",
        location: "CBD, Nairobi",
        price: 45000000,
        imageUrls: [
          "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83"
        ],
        features: {
          bedrooms: 0,
          bathrooms: 2,
          squareFeet: 3000,
          parkingSpaces: 3,
          yearBuilt: 2019,
          amenities: ["Reception", "High-speed Internet", "24/7 Access"],
          waterSource: "county_water",
          powerBackup: true,
          security: ["CCTV", "security_guard", "electric_fence"],
          nearbyFacilities: ["banks", "restaurants"]
        },
        propertyType: "commercial",
        landReferenceNumber: "NRB789012",
        titleDeedNumber: "TD345678",
        plotNumber: "P789"
      }
    ];

    mockProperties.forEach(property => {
      this.createProperty(property);
    });

    // Add mock community posts
    const mockPosts: InsertCommunityPost[] = [
      {
        title: "Beware of Fake Title Deeds in Westlands",
        content: "I encountered a fraudster who presented fake title deeds for a property in Westlands. Here's how to identify the red flags...",
        location: "Westlands, Nairobi",
        isAnonymous: true,
        userId: 1,
        category: "fraud"
      },
      {
        title: "Successful Property Purchase Through Proper Verification",
        content: "I recently bought a property and here's how I verified everything to ensure it was legitimate...",
        location: "Kilimani, Nairobi",
        isAnonymous: false,
        userId: 2,
        category: "success_story"
      }
    ];

    const mockResources: InsertLegalResource[] = [
      {
        title: "Constitutional Protection of Property Rights",
        description: "Article 40 of the Kenyan Constitution on Protection of Right to Property",
        category: "constitutional",
        link: "http://www.kenyalaw.org/lex//actview.xql?actid=Const2010",
        content: "Every person has the right, either individually or in association with others, to acquire and own property..."
      },
      {
        title: "How to Report Real Estate Fraud",
        description: "Official channels for reporting real estate fraud in Kenya",
        category: "reporting",
        link: "https://www.lands.go.ke/report-fraud/",
        content: "Step by step guide on reporting suspected real estate fraud to relevant authorities..."
      },
      {
        title: "Land Registration Act",
        description: "Key provisions of the Land Registration Act relevant to property buyers",
        category: "statutory",
        link: "http://www.kenyalaw.org/lex//actview.xql?actid=No.%203%20of%202012",
        content: "Important sections of the Land Registration Act that protect property buyers..."
      }
    ];

    mockPosts.forEach(post => {
      const id = this.currentIds.communityPosts++;
      this.communityPosts.set(id, {
        ...post,
        id,
        verificationStatus: 'verified',
        createdAt: new Date()
      });
    });

    mockResources.forEach(resource => {
      const id = this.currentIds.legalResources++;
      this.legalResources.set(id, {
        ...resource,
        id,
        updatedAt: new Date()
      });
    });
  }
}

export const storage = new MemStorage();
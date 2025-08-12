/**
 * Kenyan-Specific Data Generator
 * 
 * Generates realistic Kenyan property data with authentic names, locations,
 * pricing, and cultural context for comprehensive application testing.
 * 
 * Consolidated from database/seeds/kenyan-data-generator.ts
 */

export interface KenyanLocation {
  name: string;
  county: string;
  coordinates: { lat: number; lng: number };
  averagePrice: number;
  propertyTypes: string[];
  description: string;
}

export interface KenyanName {
  firstName: string;
  lastName: string;
  tribe: string;
  gender: 'male' | 'female';
}

export interface GeneratedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  tribe: string;
  occupation: string;
  createdAt: Date;
}

export interface GeneratedProperty {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  coordinates: { lat: number; lng: number };
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  features: string[];
  createdAt: Date;
}

/**
 * Comprehensive Kenyan data generator with authentic cultural context
 */
export class KenyanDataGenerator {
  private locations: KenyanLocation[] = [];
  private names: KenyanName[] = [];
  private occupations: string[] = [];
  private propertyDescriptions: string[] = [];
  
  constructor() {
    this.initializeKenyanData();
  }
  
  /**
   * Generate realistic Kenyan users
   */
  async generateUsers(count: number): Promise<GeneratedUser[]> {
    const users: GeneratedUser[] = [];
    
    for (let i = 0; i < count; i++) {
      const name = this.getRandomName();
      const location = this.getRandomLocation();
      
      users.push({
        id: i + 1,
        firstName: name.firstName,
        lastName: name.lastName,
        email: this.generateEmail(name.firstName, name.lastName),
        phone: this.generateKenyanPhone(),
        location: location.name,
        tribe: name.tribe,
        occupation: this.getRandomOccupation(),
        createdAt: this.generateRandomDate()
      });
    }
    
    return users;
  }
  
  /**
   * Generate realistic Kenyan properties
   */
  async generateProperties(count: number): Promise<GeneratedProperty[]> {
    const properties: GeneratedProperty[] = [];
    
    for (let i = 0; i < count; i++) {
      const location = this.getRandomLocation();
      const propertyType = this.getRandomPropertyType(location);
      
      properties.push({
        id: i + 1,
        title: this.generatePropertyTitle(propertyType, location),
        description: this.generatePropertyDescription(propertyType),
        price: this.generatePrice(location, propertyType),
        location: location.name,
        coordinates: this.generateNearbyCoordinates(location.coordinates),
        propertyType,
        bedrooms: this.generateBedrooms(propertyType),
        bathrooms: this.generateBathrooms(propertyType),
        area: this.generateArea(propertyType),
        features: this.generateFeatures(propertyType),
        createdAt: this.generateRandomDate()
      });
    }
    
    return properties;
  }
  
  /**
   * Initialize authentic Kenyan data sets
   */
  private initializeKenyanData(): void {
    this.loadKenyanLocations();
    this.loadKenyanNames();
    this.loadKenyanOccupations();
    this.loadPropertyDescriptions();
  }
  
  /**
   * Load authentic Kenyan locations with realistic pricing
   */
  private loadKenyanLocations(): void {
    this.locations = [
      // Nairobi County
      {
        name: 'Westlands',
        county: 'Nairobi',
        coordinates: { lat: -1.2676, lng: 36.8108 },
        averagePrice: 15000000,
        propertyTypes: ['apartment', 'commercial', 'land'],
        description: 'Prime business district with modern amenities'
      },
      {
        name: 'Karen',
        county: 'Nairobi',
        coordinates: { lat: -1.3197, lng: 36.6859 },
        averagePrice: 25000000,
        propertyTypes: ['house', 'mansion', 'land'],
        description: 'Upscale residential area with large properties'
      },
      {
        name: 'Kibera',
        county: 'Nairobi',
        coordinates: { lat: -1.3133, lng: 36.7892 },
        averagePrice: 2000000,
        propertyTypes: ['apartment', 'house'],
        description: 'Affordable housing area undergoing development'
      },
      {
        name: 'Kilimani',
        county: 'Nairobi',
        coordinates: { lat: -1.2921, lng: 36.7809 },
        averagePrice: 12000000,
        propertyTypes: ['apartment', 'house'],
        description: 'Mixed residential and commercial area'
      },
      
      // Mombasa County
      {
        name: 'Nyali',
        county: 'Mombasa',
        coordinates: { lat: -4.0435, lng: 39.7348 },
        averagePrice: 8000000,
        propertyTypes: ['apartment', 'house', 'beachfront'],
        description: 'Coastal residential area with beach access'
      },
      {
        name: 'Diani',
        county: 'Kwale',
        coordinates: { lat: -4.3208, lng: 39.5842 },
        averagePrice: 18000000,
        propertyTypes: ['beachfront', 'house', 'resort'],
        description: 'Premium beach destination with luxury properties'
      },
      
      // Kisumu County
      {
        name: 'Milimani',
        county: 'Kisumu',
        coordinates: { lat: -0.0917, lng: 34.7680 },
        averagePrice: 6000000,
        propertyTypes: ['house', 'apartment'],
        description: 'Upscale residential area in Kisumu'
      },
      
      // Nakuru County
      {
        name: 'Milimani',
        county: 'Nakuru',
        coordinates: { lat: -0.3031, lng: 36.0800 },
        averagePrice: 5000000,
        propertyTypes: ['house', 'apartment', 'land'],
        description: 'Residential area with good infrastructure'
      }
    ];
  }
  
  /**
   * Load authentic Kenyan names by tribe
   */
  private loadKenyanNames(): void {
    this.names = [
      // Kikuyu names
      { firstName: 'Wanjiku', lastName: 'Kamau', tribe: 'Kikuyu', gender: 'female' },
      { firstName: 'Njoroge', lastName: 'Mwangi', tribe: 'Kikuyu', gender: 'male' },
      { firstName: 'Wanjiru', lastName: 'Kariuki', tribe: 'Kikuyu', gender: 'female' },
      { firstName: 'Kamau', lastName: 'Njuguna', tribe: 'Kikuyu', gender: 'male' },
      
      // Luo names
      { firstName: 'Akinyi', lastName: 'Ochieng', tribe: 'Luo', gender: 'female' },
      { firstName: 'Otieno', lastName: 'Ouma', tribe: 'Luo', gender: 'male' },
      { firstName: 'Adhiambo', lastName: 'Owino', tribe: 'Luo', gender: 'female' },
      { firstName: 'Ochieng', lastName: 'Onyango', tribe: 'Luo', gender: 'male' },
      
      // Luhya names
      { firstName: 'Nekesa', lastName: 'Wafula', tribe: 'Luhya', gender: 'female' },
      { firstName: 'Wekesa', lastName: 'Barasa', tribe: 'Luhya', gender: 'male' },
      { firstName: 'Nasike', lastName: 'Makokha', tribe: 'Luhya', gender: 'female' },
      { firstName: 'Wanjala', lastName: 'Simiyu', tribe: 'Luhya', gender: 'male' },
      
      // Kalenjin names
      { firstName: 'Chepkemoi', lastName: 'Kiprop', tribe: 'Kalenjin', gender: 'female' },
      { firstName: 'Kipchoge', lastName: 'Ruto', tribe: 'Kalenjin', gender: 'male' },
      { firstName: 'Jepkosgei', lastName: 'Kiptoo', tribe: 'Kalenjin', gender: 'female' },
      { firstName: 'Kiprotich', lastName: 'Sang', tribe: 'Kalenjin', gender: 'male' },
      
      // Kamba names
      { firstName: 'Kavata', lastName: 'Mutua', tribe: 'Kamba', gender: 'female' },
      { firstName: 'Mutua', lastName: 'Kioko', tribe: 'Kamba', gender: 'male' },
      { firstName: 'Nduku', lastName: 'Musyoka', tribe: 'Kamba', gender: 'female' },
      { firstName: 'Musyoka', lastName: 'Mwanzia', tribe: 'Kamba', gender: 'male' }
    ];
  }
  
  /**
   * Load common Kenyan occupations
   */
  private loadKenyanOccupations(): void {
    this.occupations = [
      'Teacher', 'Farmer', 'Business Owner', 'Civil Servant', 'Doctor',
      'Nurse', 'Engineer', 'Lawyer', 'Accountant', 'Driver',
      'Mechanic', 'Tailor', 'Shop Keeper', 'Security Guard', 'Chef',
      'Banker', 'IT Specialist', 'Journalist', 'Artist', 'Musician',
      'Construction Worker', 'Electrician', 'Plumber', 'Carpenter', 'Mason'
    ];
  }
  
  /**
   * Load property descriptions
   */
  private loadPropertyDescriptions(): void {
    this.propertyDescriptions = [
      'Modern family home with spacious rooms and beautiful garden',
      'Luxury apartment with stunning city views and premium finishes',
      'Charming house in quiet neighborhood with excellent security',
      'Contemporary design with open plan living and modern kitchen',
      'Traditional Kenyan architecture with modern amenities',
      'Beachfront property with direct ocean access and tropical gardens',
      'Commercial space in prime location with high foot traffic',
      'Investment property with excellent rental potential',
      'Newly renovated with energy-efficient features and solar power',
      'Gated community property with shared amenities and 24/7 security'
    ];
  }
  
  // Helper methods
  private getRandomName(): KenyanName {
    return this.names[Math.floor(Math.random() * this.names.length)];
  }
  
  private getRandomLocation(): KenyanLocation {
    return this.locations[Math.floor(Math.random() * this.locations.length)];
  }
  
  private getRandomOccupation(): string {
    return this.occupations[Math.floor(Math.random() * this.occupations.length)];
  }
  
  private getRandomPropertyType(location: KenyanLocation): string {
    return location.propertyTypes[Math.floor(Math.random() * location.propertyTypes.length)];
  }
  
  private generateEmail(firstName: string, lastName: string): string {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
  }
  
  private generateKenyanPhone(): string {
    const prefixes = ['0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `+254${prefix.substring(1)}${suffix}`;
  }
  
  private generatePropertyTitle(propertyType: string, location: KenyanLocation): string {
    const adjectives = ['Modern', 'Luxury', 'Spacious', 'Beautiful', 'Elegant', 'Contemporary'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    return `${adjective} ${propertyType} in ${location.name}`;
  }
  
  private generatePropertyDescription(propertyType: string): string {
    return this.propertyDescriptions[Math.floor(Math.random() * this.propertyDescriptions.length)];
  }
  
  private generatePrice(location: KenyanLocation, propertyType: string): number {
    const basePrice = location.averagePrice;
    const variation = 0.3; // 30% variation
    const multiplier = 1 + (Math.random() - 0.5) * variation;
    
    // Property type multipliers
    const typeMultipliers: Record<string, number> = {
      'apartment': 0.8,
      'house': 1.0,
      'mansion': 2.5,
      'commercial': 1.5,
      'land': 0.6,
      'beachfront': 2.0,
      'resort': 3.0
    };
    
    const typeMultiplier = typeMultipliers[propertyType] || 1.0;
    return Math.round(basePrice * multiplier * typeMultiplier);
  }
  
  private generateNearbyCoordinates(center: { lat: number; lng: number }): { lat: number; lng: number } {
    const variation = 0.01; // About 1km variation
    return {
      lat: center.lat + (Math.random() - 0.5) * variation,
      lng: center.lng + (Math.random() - 0.5) * variation
    };
  }
  
  private generateBedrooms(propertyType: string): number | undefined {
    if (['commercial', 'land'].includes(propertyType)) return undefined;
    
    const bedroomRanges: Record<string, [number, number]> = {
      'apartment': [1, 3],
      'house': [2, 5],
      'mansion': [4, 8],
      'beachfront': [2, 6],
      'resort': [1, 4]
    };
    
    const range = bedroomRanges[propertyType] || [2, 4];
    return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
  }
  
  private generateBathrooms(propertyType: string): number | undefined {
    if (['commercial', 'land'].includes(propertyType)) return undefined;
    
    const bathroomRanges: Record<string, [number, number]> = {
      'apartment': [1, 2],
      'house': [1, 4],
      'mansion': [3, 6],
      'beachfront': [2, 4],
      'resort': [1, 3]
    };
    
    const range = bathroomRanges[propertyType] || [1, 3];
    return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
  }
  
  private generateArea(propertyType: string): number {
    const areaRanges: Record<string, [number, number]> = {
      'apartment': [50, 150],
      'house': [100, 400],
      'mansion': [300, 1000],
      'commercial': [50, 500],
      'land': [500, 5000],
      'beachfront': [150, 600],
      'resort': [100, 300]
    };
    
    const range = areaRanges[propertyType] || [100, 300];
    return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
  }
  
  private generateFeatures(propertyType: string): string[] {
    const allFeatures = [
      'Swimming Pool', 'Garden', 'Parking', 'Security', 'Generator',
      'Solar Power', 'Borehole', 'CCTV', 'Gym', 'Balcony',
      'Fireplace', 'Study Room', 'Servant Quarter', 'Garage',
      'Modern Kitchen', 'Master En-suite', 'Walk-in Closet'
    ];
    
    const featureCount = Math.floor(Math.random() * 6) + 2; // 2-7 features
    const shuffled = allFeatures.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, featureCount);
  }
  
  private generateRandomDate(): Date {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }
}
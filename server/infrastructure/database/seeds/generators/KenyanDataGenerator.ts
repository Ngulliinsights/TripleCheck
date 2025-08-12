/**
 * Kenyan-Specific Realistic Data Generator
 * 
 * Generates authentic Kenyan data including names, locations, cultural data,
 * realistic property pricing, and culturally appropriate content.
 * 
 * Task 3.1: Create Kenyan-specific realistic data generator
 */

import { faker } from '@faker-js/faker';

export interface KenyanLocation {
  county: string;
  constituency: string;
  ward: string;
  town: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  averagePropertyPrice: {
    land: number;
    residential: number;
    commercial: number;
  };
}

export interface KenyanPersonProfile {
  firstName: string;
  lastName: string;
  tribe: string;
  occupation: string;
  phoneNumber: string;
  idNumber: string;
  county: string;
  town: string;
  education: string;
  income: number;
  languages: string[];
}

export interface KenyanPropertyData {
  title: string;
  description: string;
  location: KenyanLocation;
  price: number;
  pricePerUnit: number;
  size: number;
  features: Record<string, any>;
  culturalContext: string[];
  marketFactors: string[];
}

export class KenyanDataGenerator {
  // Kenyan counties with major towns and coordinates
  private static readonly KENYAN_LOCATIONS: KenyanLocation[] = [
    {
      county: 'Nairobi',
      constituency: 'Westlands',
      ward: 'Parklands/Highridge',
      town: 'Nairobi',
      coordinates: { lat: -1.2921, lng: 36.8219 },
      averagePropertyPrice: { land: 25000000, residential: 15000000, commercial: 35000000 }
    },
    {
      county: 'Nairobi',
      constituency: 'Dagoretti North',
      ward: 'Kilimani',
      town: 'Nairobi',
      coordinates: { lat: -1.2884, lng: 36.7856 },
      averagePropertyPrice: { land: 30000000, residential: 20000000, commercial: 45000000 }
    },
    {
      county: 'Kiambu',
      constituency: 'Kiambu',
      ward: 'Township',
      town: 'Kiambu',
      coordinates: { lat: -1.1719, lng: 36.8356 },
      averagePropertyPrice: { land: 8000000, residential: 6000000, commercial: 12000000 }
    },
    {
      county: 'Mombasa',
      constituency: 'Nyali',
      ward: 'Frere Town',
      town: 'Mombasa',
      coordinates: { lat: -4.0435, lng: 39.6682 },
      averagePropertyPrice: { land: 15000000, residential: 12000000, commercial: 25000000 }
    },
    {
      county: 'Kisumu',
      constituency: 'Kisumu East',
      ward: 'Market Milimani',
      town: 'Kisumu',
      coordinates: { lat: -0.0917, lng: 34.7680 },
      averagePropertyPrice: { land: 5000000, residential: 4000000, commercial: 8000000 }
    },
    {
      county: 'Nakuru',
      constituency: 'Nakuru Town West',
      ward: 'Kapkures',
      town: 'Nakuru',
      coordinates: { lat: -0.3031, lng: 36.0800 },
      averagePropertyPrice: { land: 6000000, residential: 4500000, commercial: 9000000 }
    },
    {
      county: 'Eldoret',
      constituency: 'Eldoret East',
      ward: 'Kapsoya',
      town: 'Eldoret',
      coordinates: { lat: 0.5143, lng: 35.2697 },
      averagePropertyPrice: { land: 4000000, residential: 3500000, commercial: 7000000 }
    },
    {
      county: 'Machakos',
      constituency: 'Machakos Town',
      ward: 'Machakos Central',
      town: 'Machakos',
      coordinates: { lat: -1.5177, lng: 37.2634 },
      averagePropertyPrice: { land: 3000000, residential: 2500000, commercial: 5000000 }
    },
    {
      county: 'Meru',
      constituency: 'Meru',
      ward: 'Meru Municipality',
      town: 'Meru',
      coordinates: { lat: 0.0469, lng: 37.6556 },
      averagePropertyPrice: { land: 3500000, residential: 2800000, commercial: 5500000 }
    },
    {
      county: 'Nyeri',
      constituency: 'Nyeri Town',
      ward: 'Rware',
      town: 'Nyeri',
      coordinates: { lat: -0.4167, lng: 36.9500 },
      averagePropertyPrice: { land: 4500000, residential: 3800000, commercial: 7500000 }
    }
  ];

  // Common Kenyan first names by gender and tribe
  private static readonly KENYAN_FIRST_NAMES = {
    male: {
      kikuyu: ['Kamau', 'Mwangi', 'Njoroge', 'Kariuki', 'Wanjiku', 'Githinji', 'Maina', 'Ndung\'u'],
      luo: ['Otieno', 'Ochieng', 'Owino', 'Omondi', 'Okoth', 'Odongo', 'Ouma', 'Onyango'],
      luhya: ['Wafula', 'Wanjala', 'Barasa', 'Shikuku', 'Mukhwana', 'Wekesa', 'Simiyu', 'Makokha'],
      kalenjin: ['Kipchoge', 'Kiprotich', 'Kemboi', 'Rotich', 'Cheruiyot', 'Lagat', 'Koech', 'Ruto'],
      kamba: ['Mutua', 'Musyoka', 'Muthama', 'Kilonzo', 'Ngilu', 'Kalonzo', 'Mwau', 'Kivutha']
    },
    female: {
      kikuyu: ['Wanjiku', 'Nyokabi', 'Wanjiru', 'Wangari', 'Njeri', 'Wambui', 'Wairimu', 'Nyambura'],
      luo: ['Akinyi', 'Atieno', 'Awino', 'Adhiambo', 'Akoth', 'Anyango', 'Auma', 'Apiyo'],
      luhya: ['Nekesa', 'Naliaka', 'Nasike', 'Nasimiyu', 'Nanjala', 'Namukose', 'Namaemba', 'Nafula'],
      kalenjin: ['Chepkemoi', 'Jebet', 'Chepkoech', 'Cherono', 'Cheptoo', 'Jepkosgei', 'Chepngetich', 'Rotich'],
      kamba: ['Kavata', 'Nduku', 'Mwende', 'Syombua', 'Mumbua', 'Ndinda', 'Katunge', 'Mutheu']
    }
  };

  // Common Kenyan surnames by tribe
  private static readonly KENYAN_SURNAMES = {
    kikuyu: ['Kamau', 'Mwangi', 'Njoroge', 'Kariuki', 'Githinji', 'Maina', 'Ndung\'u', 'Waweru'],
    luo: ['Otieno', 'Ochieng', 'Owino', 'Omondi', 'Okoth', 'Odongo', 'Ouma', 'Onyango'],
    luhya: ['Wafula', 'Wanjala', 'Barasa', 'Shikuku', 'Mukhwana', 'Wekesa', 'Simiyu', 'Makokha'],
    kalenjin: ['Kipchoge', 'Kiprotich', 'Kemboi', 'Rotich', 'Cheruiyot', 'Lagat', 'Koech', 'Ruto'],
    kamba: ['Mutua', 'Musyoka', 'Muthama', 'Kilonzo', 'Ngilu', 'Kalonzo', 'Mwau', 'Kivutha']
  };

  // Common Kenyan occupations with income ranges (KES per month)
  private static readonly KENYAN_OCCUPATIONS = [
    { title: 'Teacher', income: { min: 25000, max: 80000 } },
    { title: 'Nurse', income: { min: 30000, max: 90000 } },
    { title: 'Engineer', income: { min: 60000, max: 200000 } },
    { title: 'Accountant', income: { min: 40000, max: 150000 } },
    { title: 'Doctor', income: { min: 80000, max: 300000 } },
    { title: 'Lawyer', income: { min: 50000, max: 250000 } },
    { title: 'Business Owner', income: { min: 30000, max: 500000 } },
    { title: 'Farmer', income: { min: 15000, max: 100000 } },
    { title: 'Driver', income: { min: 20000, max: 60000 } },
    { title: 'Mechanic', income: { min: 25000, max: 70000 } },
    { title: 'Shopkeeper', income: { min: 20000, max: 80000 } },
    { title: 'Civil Servant', income: { min: 35000, max: 120000 } },
    { title: 'Bank Employee', income: { min: 40000, max: 150000 } },
    { title: 'IT Specialist', income: { min: 50000, max: 200000 } },
    { title: 'Construction Worker', income: { min: 18000, max: 50000 } }
  ];

  // Kenyan tribes
  private static readonly KENYAN_TRIBES = [
    'Kikuyu', 'Luo', 'Luhya', 'Kalenjin', 'Kamba', 'Kisii', 'Meru', 'Mijikenda',
    'Turkana', 'Maasai', 'Samburu', 'Taita', 'Embu', 'Pokot', 'Borana'
  ];

  // Education levels in Kenya
  private static readonly EDUCATION_LEVELS = [
    'Primary Education',
    'Secondary Education (KCSE)',
    'Certificate',
    'Diploma',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'PhD',
    'Professional Certification'
  ];

  // Common languages in Kenya
  private static readonly KENYAN_LANGUAGES = [
    'English', 'Kiswahili', 'Kikuyu', 'Luo', 'Luhya', 'Kalenjin', 'Kamba'
  ];

  // Property descriptions in Swahili and English
  private static readonly PROPERTY_DESCRIPTIONS = {
    residential: [
      'Nyumba nzuri ya kisasa katika eneo la amani',
      'Modern family home in a secure neighborhood',
      'Spacious bungalow with beautiful garden',
      'Nyumba ya familia na bustani nzuri',
      'Well-maintained property with excellent amenities',
      'Jengo la kisasa lenye vifaa vya hali ya juu'
    ],
    commercial: [
      'Prime commercial property in busy area',
      'Jengo la kibiashara katika eneo lenye shughuli nyingi',
      'Strategic location for business ventures',
      'Mahali pazuri pa biashara',
      'High-traffic commercial space',
      'Nafasi ya biashara katika eneo la kiuchumi'
    ],
    land: [
      'Shamba la rutuba lenye mazao mazuri',
      'Fertile agricultural land with good yields',
      'Prime plot ready for development',
      'Kiwanja cha maendeleo',
      'Excellent investment opportunity',
      'Nafasi nzuri ya uwekezaji'
    ]
  };

  /**
   * Generate a realistic Kenyan person profile
   */
  public static generateKenyanPerson(): KenyanPersonProfile {
    const tribe = faker.helpers.arrayElement(this.KENYAN_TRIBES).toLowerCase() as keyof typeof this.KENYAN_FIRST_NAMES.male;
    const gender = faker.helpers.arrayElement(['male', 'female']) as 'male' | 'female';
    const location = faker.helpers.arrayElement(this.KENYAN_LOCATIONS);
    const occupation = faker.helpers.arrayElement(this.KENYAN_OCCUPATIONS);
    
    // Generate names based on tribe and gender
    const firstName = this.KENYAN_FIRST_NAMES[gender][tribe] 
      ? faker.helpers.arrayElement(this.KENYAN_FIRST_NAMES[gender][tribe])
      : faker.person.firstName();
    
    const lastName = this.KENYAN_SURNAMES[tribe]
      ? faker.helpers.arrayElement(this.KENYAN_SURNAMES[tribe])
      : faker.person.lastName();

    // Generate Kenyan phone number (+254 format)
    const phoneNumber = `+254${faker.helpers.arrayElement(['7', '1'])}${faker.string.numeric(8)}`;
    
    // Generate Kenyan ID number (8 digits)
    const idNumber = faker.string.numeric(8);
    
    // Generate income within occupation range
    const income = faker.number.int({
      min: occupation.income.min,
      max: occupation.income.max
    });

    // Generate languages (always include English and Kiswahili)
    const languages = ['English', 'Kiswahili'];
    const tribalLanguage = tribe.charAt(0).toUpperCase() + tribe.slice(1);
    if (!languages.includes(tribalLanguage)) {
      languages.push(tribalLanguage);
    }
    
    // Add additional languages randomly
    const additionalLanguages = faker.helpers.arrayElements(
      this.KENYAN_LANGUAGES.filter(lang => !languages.includes(lang)),
      { min: 0, max: 2 }
    );
    languages.push(...additionalLanguages);

    return {
      firstName,
      lastName,
      tribe: tribe.charAt(0).toUpperCase() + tribe.slice(1),
      occupation: occupation.title,
      phoneNumber,
      idNumber,
      county: location.county,
      town: location.town,
      education: faker.helpers.arrayElement(this.EDUCATION_LEVELS),
      income,
      languages
    };
  }

  /**
   * Generate realistic Kenyan property data
   */
  public static generateKenyanProperty(
    type: 'residential' | 'commercial' | 'land' = 'residential'
  ): KenyanPropertyData {
    const location = faker.helpers.arrayElement(this.KENYAN_LOCATIONS);
    const basePrice = location.averagePropertyPrice[type];
    
    // Add price variation (-30% to +50%)
    const priceVariation = faker.number.float({ min: 0.7, max: 1.5 });
    const price = Math.round(basePrice * priceVariation);
    
    // Generate size based on property type
    let size: number;
    let pricePerUnit: number;
    let sizeUnit: string;
    
    switch (type) {
      case 'residential':
        size = faker.number.int({ min: 2, max: 6 }); // bedrooms
        pricePerUnit = Math.round(price / size);
        sizeUnit = 'bedrooms';
        break;
      case 'commercial':
        size = faker.number.int({ min: 100, max: 2000 }); // square meters
        pricePerUnit = Math.round(price / size);
        sizeUnit = 'sqm';
        break;
      case 'land':
        size = faker.number.float({ min: 0.25, max: 10, precision: 0.25 }); // acres
        pricePerUnit = Math.round(price / size);
        sizeUnit = 'acres';
        break;
    }

    // Generate culturally appropriate title and description
    const descriptions = this.PROPERTY_DESCRIPTIONS[type];
    const description = faker.helpers.arrayElement(descriptions);
    
    const title = this.generatePropertyTitle(type, location, size);
    
    // Generate features based on property type
    const features = this.generatePropertyFeatures(type, size);
    
    // Generate cultural context
    const culturalContext = this.generateCulturalContext(location);
    
    // Generate market factors
    const marketFactors = this.generateMarketFactors(location, type);

    return {
      title,
      description,
      location,
      price,
      pricePerUnit,
      size,
      features,
      culturalContext,
      marketFactors
    };
  }

  /**
   * Generate property title based on type and location
   */
  private static generatePropertyTitle(
    type: string, 
    location: KenyanLocation, 
    size: number
  ): string {
    const templates = {
      residential: [
        `${size} Bedroom House in ${location.ward}, ${location.county}`,
        `Spacious ${size}BR Home - ${location.town}`,
        `Family House ${size} Bedrooms - ${location.constituency}`,
        `Modern ${size} Bedroom Bungalow - ${location.county}`
      ],
      commercial: [
        `Commercial Space ${size}sqm - ${location.town}`,
        `Prime Office Space in ${location.ward}`,
        `Business Premises - ${location.constituency}`,
        `Commercial Building - ${location.county} CBD`
      ],
      land: [
        `${size} Acres Prime Land - ${location.county}`,
        `Development Plot ${size} Acres - ${location.town}`,
        `Agricultural Land ${size} Acres - ${location.ward}`,
        `Investment Land - ${location.constituency}`
      ]
    };

    return faker.helpers.arrayElement(templates[type as keyof typeof templates]);
  }

  /**
   * Generate property features based on type
   */
  private static generatePropertyFeatures(type: string, size: number): Record<string, any> {
    const baseFeatures = {
      hasElectricity: faker.datatype.boolean(0.9),
      hasWater: faker.datatype.boolean(0.85),
      hasInternet: faker.datatype.boolean(0.7),
      securityFeatures: faker.helpers.arrayElements([
        'Perimeter Wall', 'Security Guard', 'CCTV', 'Electric Fence', 'Alarm System'
      ], { min: 1, max: 3 })
    };

    switch (type) {
      case 'residential':
        return {
          ...baseFeatures,
          bedrooms: size,
          bathrooms: faker.number.int({ min: 1, max: Math.max(1, size - 1) }),
          hasGarden: faker.datatype.boolean(0.6),
          hasParking: faker.datatype.boolean(0.7),
          hasDomesticQuarters: faker.datatype.boolean(0.4),
          roofType: faker.helpers.arrayElement(['Iron Sheets', 'Tiles', 'Concrete']),
          floorType: faker.helpers.arrayElement(['Tiles', 'Concrete', 'Terrazzo'])
        };
        
      case 'commercial':
        return {
          ...baseFeatures,
          floorArea: size,
          floors: faker.number.int({ min: 1, max: 5 }),
          hasLift: size > 500 ? faker.datatype.boolean(0.8) : false,
          hasBackupPower: faker.datatype.boolean(0.6),
          hasAirConditioning: faker.datatype.boolean(0.5),
          parkingSpaces: faker.number.int({ min: 2, max: 20 })
        };
        
      case 'land':
        return {
          ...baseFeatures,
          acreage: size,
          soilType: faker.helpers.arrayElement(['Loam', 'Clay', 'Sandy', 'Black Cotton']),
          topography: faker.helpers.arrayElement(['Flat', 'Gently Sloping', 'Hilly']),
          hasTitle: faker.datatype.boolean(0.8),
          roadAccess: faker.helpers.arrayElement(['Tarmac', 'Murram', 'Earth Road']),
          nearbyAmenities: faker.helpers.arrayElements([
            'School', 'Hospital', 'Market', 'Church', 'Mosque', 'Shopping Center'
          ], { min: 1, max: 4 })
        };
        
      default:
        return baseFeatures;
    }
  }

  /**
   * Generate cultural context for the property
   */
  private static generateCulturalContext(location: KenyanLocation): string[] {
    const contexts = [
      `Located in ${location.county} County, known for its vibrant community`,
      `Close to local markets and traditional meeting places`,
      `In an area with rich cultural heritage`,
      `Near community centers and social facilities`,
      `Part of a diverse neighborhood with multiple tribes`,
      `Close to religious centers (churches and mosques)`,
      `In an area with good community security networks`,
      `Near schools with good academic reputation`
    ];

    return faker.helpers.arrayElements(contexts, { min: 2, max: 4 });
  }

  /**
   * Generate market factors affecting the property
   */
  private static generateMarketFactors(
    location: KenyanLocation, 
    type: string
  ): string[] {
    const factors = [
      `Growing demand in ${location.county}`,
      'Good infrastructure development in the area',
      'Proximity to major transport routes',
      'Upcoming development projects nearby',
      'Stable property values in the region',
      'Good rental yields for investors',
      'Appreciation potential due to location',
      'Government development plans for the area'
    ];

    // Add type-specific factors
    if (type === 'commercial') {
      factors.push(
        'High foot traffic area',
        'Business-friendly environment',
        'Growing commercial activity'
      );
    } else if (type === 'land') {
      factors.push(
        'Suitable for agricultural activities',
        'Good for future development',
        'Investment potential'
      );
    }

    return faker.helpers.arrayElements(factors, { min: 2, max: 5 });
  }

  /**
   * Generate a realistic Kenyan address
   */
  public static generateKenyanAddress(): string {
    const location = faker.helpers.arrayElement(this.KENYAN_LOCATIONS);
    const plotNumber = faker.number.int({ min: 1, max: 9999 });
    const roadNames = [
      'Kenyatta Avenue', 'Uhuru Highway', 'Moi Avenue', 'Harambee Avenue',
      'University Way', 'Tom Mboya Street', 'Kimathi Street', 'Mama Ngina Street'
    ];
    const roadName = faker.helpers.arrayElement(roadNames);
    
    return `Plot ${plotNumber}, ${roadName}, ${location.ward} Ward, ${location.constituency}, ${location.county} County`;
  }

  /**
   * Generate realistic Kenyan business data
   */
  public static generateKenyanBusiness(): {
    name: string;
    type: string;
    location: KenyanLocation;
    services: string[];
    languages: string[];
  } {
    const businessTypes = [
      'Hardware Store', 'Grocery Shop', 'Pharmacy', 'Restaurant', 'Salon',
      'Cyber Cafe', 'M-Pesa Shop', 'Butchery', 'Electronics Shop', 'Clothing Store'
    ];
    
    const businessNames = [
      'Harambee', 'Uhuru', 'Amani', 'Baraka', 'Tumaini', 'Upendo',
      'Mwanga', 'Furaha', 'Umoja', 'Maendeleo'
    ];
    
    const type = faker.helpers.arrayElement(businessTypes);
    const name = `${faker.helpers.arrayElement(businessNames)} ${type}`;
    const location = faker.helpers.arrayElement(this.KENYAN_LOCATIONS);
    
    const services = this.generateBusinessServices(type);
    const languages = ['English', 'Kiswahili'];
    
    return {
      name,
      type,
      location,
      services,
      languages
    };
  }

  /**
   * Generate services based on business type
   */
  private static generateBusinessServices(businessType: string): string[] {
    const serviceMap: Record<string, string[]> = {
      'Hardware Store': ['Construction materials', 'Tools rental', 'Plumbing supplies', 'Electrical supplies'],
      'Grocery Shop': ['Fresh produce', 'Household items', 'Mobile money services', 'Airtime'],
      'Pharmacy': ['Prescription drugs', 'Over-counter medicine', 'Health consultation', 'Medical supplies'],
      'Restaurant': ['Local cuisine', 'Continental dishes', 'Catering services', 'Takeaway'],
      'Salon': ['Hair styling', 'Beauty treatments', 'Manicure/Pedicure', 'Makeup services']
    };
    
    return serviceMap[businessType] || ['General services', 'Customer support'];
  }

  /**
   * Generate batch of Kenyan people
   */
  public static generateKenyanPeople(count: number): KenyanPersonProfile[] {
    return Array.from({ length: count }, () => this.generateKenyanPerson());
  }

  /**
   * Generate batch of Kenyan properties
   */
  public static generateKenyanProperties(
    count: number,
    type?: 'residential' | 'commercial' | 'land'
  ): KenyanPropertyData[] {
    return Array.from({ length: count }, () => {
      const propertyType = type || faker.helpers.arrayElement(['residential', 'commercial', 'land']);
      return this.generateKenyanProperty(propertyType);
    });
  }

  /**
   * Get all Kenyan locations
   */
  public static getKenyanLocations(): KenyanLocation[] {
    return [...this.KENYAN_LOCATIONS];
  }

  /**
   * Get location by county
   */
  public static getLocationsByCounty(county: string): KenyanLocation[] {
    return this.KENYAN_LOCATIONS.filter(loc => 
      loc.county.toLowerCase() === county.toLowerCase()
    );
  }

  /**
   * Generate realistic Kenyan phone number
   */
  public static generateKenyanPhoneNumber(): string {
    const prefixes = ['701', '702', '703', '704', '705', '706', '707', '708', '709', '710', '711', '712', '713', '714', '715', '716', '717', '718', '719', '720', '721', '722', '723', '724', '725', '726', '727', '728', '729', '730', '731', '732', '733', '734', '735', '736', '737', '738', '739', '740', '741', '742', '743', '744', '745', '746', '747', '748', '749', '750', '751', '752', '753', '754', '755', '756', '757', '758', '759', '760', '761', '762', '763', '764', '765', '766', '767', '768', '769', '770', '771', '772', '773', '774', '775', '776', '777', '778', '779', '780', '781', '782', '783', '784', '785', '786', '787', '788', '789', '790', '791', '792', '793', '794', '795', '796', '797', '798', '799'];
    const prefix = faker.helpers.arrayElement(prefixes);
    const suffix = faker.string.numeric(6);
    return `+254${prefix}${suffix}`;
  }

  /**
   * Generate Kenyan ID number
   */
  public static generateKenyanIdNumber(): string {
    return faker.string.numeric(8);
  }
}

export default KenyanDataGenerator;
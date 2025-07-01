/**
 * TripleCheck Data Generation Script
 * 
 * Generates realistic property and user data based on Kenyan real estate market patterns
 * Includes fraud patterns, seasonal trends, and market variations
 */

// Import storage after compiling or use direct API calls
// For now, we'll use API calls to the running server
import fs from 'fs';

// Kenyan cities and regions with realistic market data
const KENYAN_LOCATIONS = [
  { city: 'Nairobi', region: 'Kilimani', avgPrice: 25000000, priceVariance: 0.4 },
  { city: 'Nairobi', region: 'Karen', avgPrice: 45000000, priceVariance: 0.6 },
  { city: 'Nairobi', region: 'Westlands', avgPrice: 35000000, priceVariance: 0.5 },
  { city: 'Nairobi', region: 'Runda', avgPrice: 65000000, priceVariance: 0.8 },
  { city: 'Nairobi', region: 'Lavington', avgPrice: 40000000, priceVariance: 0.5 },
  { city: 'Nairobi', region: 'Kileleshwa', avgPrice: 30000000, priceVariance: 0.4 },
  { city: 'Nairobi', region: 'Spring Valley', avgPrice: 55000000, priceVariance: 0.7 },
  { city: 'Mombasa', region: 'Nyali', avgPrice: 20000000, priceVariance: 0.4 },
  { city: 'Mombasa', region: 'Diani', avgPrice: 18000000, priceVariance: 0.5 },
  { city: 'Kisumu', region: 'Milimani', avgPrice: 8000000, priceVariance: 0.3 },
  { city: 'Nakuru', region: 'Milimani', avgPrice: 12000000, priceVariance: 0.3 },
  { city: 'Eldoret', region: 'Elgon View', avgPrice: 9000000, priceVariance: 0.3 }
];

const PROPERTY_TYPES = [
  { type: 'apartment', weight: 0.4, bedroomRange: [1, 4], avgSqft: 1200 },
  { type: 'villa', weight: 0.25, bedroomRange: [3, 6], avgSqft: 3000 },
  { type: 'townhouse', weight: 0.2, bedroomRange: [2, 4], avgSqft: 1800 },
  { type: 'bungalow', weight: 0.1, bedroomRange: [2, 5], avgSqft: 2200 },
  { type: 'commercial', weight: 0.05, bedroomRange: [0, 0], avgSqft: 2500 }
];

const AMENITIES = [
  'Swimming Pool', 'Gym', 'Security', 'Parking', 'Garden', 'Balcony',
  'Elevator', 'Generator', 'Borehole', 'Staff Quarters', 'CCTV',
  'Electric Fence', 'Clubhouse', 'Children Play Area', 'Backup Water'
];

const KENYAN_NAMES = {
  first: [
    'James', 'Mary', 'John', 'Margaret', 'David', 'Grace', 'Peter', 'Jane',
    'Michael', 'Catherine', 'Samuel', 'Elizabeth', 'Daniel', 'Sarah', 'Joseph',
    'Faith', 'Paul', 'Joyce', 'Francis', 'Rose', 'Anthony', 'Agnes',
    'Wanjiku', 'Kamau', 'Njeri', 'Mwangi', 'Akinyi', 'Ochieng', 'Chebet', 'Kiprop'
  ],
  last: [
    'Mwangi', 'Wanjiku', 'Kamau', 'Njeri', 'Ochieng', 'Akinyi', 'Kiprop', 'Chebet',
    'Mutua', 'Wambui', 'Kiprotich', 'Jeptoo', 'Otieno', 'Adhiambo', 'Rotich', 'Komen',
    'Ndungu', 'Nyongo', 'Karanja', 'Wairimu', 'Macharia', 'Waweru', 'Gitonga', 'Muthoni'
  ]
};

// Utility functions
function randomChoice(array, weights = null) {
  if (weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < array.length; i++) {
      random -= weights[i];
      if (random <= 0) return array[i];
    }
  }
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function generateRandomDate(startYear = 2015, endYear = 2024) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateKenyanPhoneNumber() {
  const prefixes = ['0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709', 
                   '0710', '0711', '0712', '0713', '0714', '0715', '0716', '0717', '0718', '0719',
                   '0720', '0721', '0722', '0723', '0724', '0725', '0726', '0727', '0728', '0729'];
  const prefix = randomChoice(prefixes);
  const suffix = randomInt(100000, 999999);
  return `${prefix}${suffix}`;
}

function generateEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
  const separators = ['', '.', '_'];
  const separator = randomChoice(separators);
  const domain = randomChoice(domains);
  const number = Math.random() > 0.7 ? randomInt(1, 999) : '';
  
  return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${number}@${domain}`;
}

// Fraud pattern generators
function generateFraudulentPrice(basePrice, fraudType) {
  switch (fraudType) {
    case 'undervalued':
      return Math.floor(basePrice * randomFloat(0.3, 0.6)); // 30-60% below market
    case 'overvalued':
      return Math.floor(basePrice * randomFloat(1.8, 3.0)); // 80-200% above market
    case 'flipping':
      return Math.floor(basePrice * randomFloat(0.7, 0.9)); // Quick flip pricing
    default:
      return basePrice;
  }
}

function isFraudulent() {
  return Math.random() < 0.03; // 3% fraud rate
}

function getFraudType() {
  const types = ['undervalued', 'overvalued', 'flipping', 'identity', 'straw_buyer'];
  return randomChoice(types);
}

// Main generation functions
function generateUser(id) {
  const firstName = randomChoice(KENYAN_NAMES.first);
  const lastName = randomChoice(KENYAN_NAMES.last);
  const fraudulent = isFraudulent();
  const userType = randomChoice(['buyer', 'seller', 'agent', 'investor'], [0.4, 0.3, 0.2, 0.1]);
  
  // Fraudulent users have suspicious patterns
  const birthYear = fraudulent ? 
    randomInt(1990, 2005) : // Younger for identity theft
    randomInt(1960, 1995);
  
  const accountCreationDate = fraudulent ?
    generateRandomDate(2024, 2024) : // Recent accounts for fraud
    generateRandomDate(2020, 2024);

  return {
    username: `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${id}`,
    password: 'password123', // Will be hashed
    profile: {
      firstName,
      lastName,
      email: generateEmail(firstName, lastName),
      phone: generateKenyanPhoneNumber(),
      dateOfBirth: new Date(birthYear, randomInt(0, 11), randomInt(1, 28)),
      accountCreated: accountCreationDate,
      userType,
      location: randomChoice(KENYAN_LOCATIONS).city,
      fraudPattern: fraudulent ? getFraudType() : null,
      transactionCount: fraudulent ? randomInt(15, 50) : randomInt(1, 10) // Suspicious activity
    }
  };
}

function generateProperty(id, ownerId) {
  const location = randomChoice(KENYAN_LOCATIONS);
  const propertyType = randomChoice(PROPERTY_TYPES, PROPERTY_TYPES.map(p => p.weight));
  const fraudulent = isFraudulent();
  const fraudType = fraudulent ? getFraudType() : null;
  
  // Base property characteristics
  const bedrooms = propertyType.type === 'commercial' ? 0 : 
    randomInt(propertyType.bedroomRange[0], propertyType.bedroomRange[1]);
  const bathrooms = propertyType.type === 'commercial' ? 0 : 
    Math.max(1, Math.floor(bedrooms * randomFloat(0.5, 1.0)));
  
  // Square footage with variance
  const squareFeet = Math.floor(propertyType.avgSqft * randomFloat(0.7, 1.4));
  
  // Year built with regional patterns
  const yearBuilt = location.city === 'Nairobi' ? 
    randomInt(1980, 2024) : randomInt(1990, 2024);
  
  // Price calculation with market factors
  let basePrice = location.avgPrice;
  
  // Adjust for property type
  if (propertyType.type === 'apartment') basePrice *= 0.7;
  if (propertyType.type === 'villa') basePrice *= 1.3;
  if (propertyType.type === 'commercial') basePrice *= 1.5;
  
  // Adjust for size and age
  const sizeMultiplier = squareFeet / propertyType.avgSqft;
  const ageMultiplier = yearBuilt > 2015 ? 1.1 : yearBuilt > 2000 ? 1.0 : 0.85;
  
  basePrice = Math.floor(basePrice * sizeMultiplier * ageMultiplier);
  
  // Apply seasonal variance (simulate market conditions)
  const seasonalMultiplier = randomFloat(0.9, 1.1);
  basePrice = Math.floor(basePrice * seasonalMultiplier);
  
  // Apply fraud patterns
  const finalPrice = fraudulent ? generateFraudulentPrice(basePrice, fraudType) : basePrice;
  
  // Generate amenities
  const numAmenities = randomInt(3, 8);
  const selectedAmenities = [];
  for (let i = 0; i < numAmenities; i++) {
    const amenity = randomChoice(AMENITIES);
    if (!selectedAmenities.includes(amenity)) {
      selectedAmenities.push(amenity);
    }
  }
  
  // Property descriptions with Kenyan context
  const descriptions = [
    `Beautiful ${propertyType.type} in the heart of ${location.region}, ${location.city}. Perfect for modern living with excellent connectivity.`,
    `Spacious ${bedrooms}-bedroom ${propertyType.type} featuring modern amenities and secure environment in ${location.region}.`,
    `Well-maintained ${propertyType.type} in prestigious ${location.region} neighborhood. Ideal for families seeking comfort and security.`,
    `Contemporary ${propertyType.type} with panoramic views and premium finishes in ${location.region}, ${location.city}.`,
    `Elegant ${propertyType.type} in prime location offering luxury living and convenience in ${location.region}.`
  ];
  
  return {
    ownerId,
    title: `${propertyType.type.charAt(0).toUpperCase() + propertyType.type.slice(1)} in ${location.region}`,
    description: randomChoice(descriptions),
    location: `${location.region}, ${location.city}`,
    price: finalPrice,
    imageUrls: [
      `/api/placeholder/400/300?property=${id}&view=exterior`,
      `/api/placeholder/400/300?property=${id}&view=interior`,
      `/api/placeholder/400/300?property=${id}&view=kitchen`
    ],
    features: {
      bedrooms,
      bathrooms,
      squareFeet,
      parkingSpaces: randomInt(1, 4),
      yearBuilt,
      amenities: selectedAmenities,
      propertyType: propertyType.type,
      fraudPattern: fraudType
    },
    verificationStatus: fraudulent ? 'failed' : randomChoice(['pending', 'verified'], [0.3, 0.7]),
    aiVerificationResults: {
      documentAuthenticity: fraudulent ? 'suspicious' : 'verified',
      ownershipVerified: !fraudulent,
      riskScore: fraudulent ? randomInt(70, 95) : randomInt(10, 40),
      verifiedAt: new Date().toISOString(),
      fraudRiskFactors: fraudulent ? [
        fraudType === 'undervalued' ? 'Price significantly below market value' : null,
        fraudType === 'overvalued' ? 'Price significantly above market value' : null,
        fraudType === 'flipping' ? 'Rapid transaction history' : null,
        fraudType === 'identity' ? 'Owner identity verification failed' : null,
        fraudType === 'straw_buyer' ? 'Suspicious ownership patterns' : null
      ].filter(Boolean) : []
    }
  };
}

function generateReview(propertyId, userId) {
  const ratings = [1, 2, 3, 4, 5];
  const weights = [0.05, 0.1, 0.15, 0.35, 0.35]; // Mostly positive reviews
  const rating = randomChoice(ratings, weights);
  
  const positiveComments = [
    "Excellent property with great amenities. The location is perfect and the neighborhood is very secure.",
    "Beautiful home with modern finishes. The landlord is very responsive and professional.",
    "Great value for money. The property is well-maintained and in a convenient location.",
    "Highly recommend this property. Clean, spacious, and in a safe neighborhood.",
    "Perfect for families. Good schools nearby and excellent security."
  ];
  
  const negativeComments = [
    "Property needs some maintenance. The location is okay but could be better.",
    "Average property. Some issues with utilities but generally acceptable.",
    "Not as described in the listing. Some disappointment with the actual condition.",
    "Decent property but overpriced for the area. Would expect better amenities.",
    "Location is good but the property itself needs updates and repairs."
  ];
  
  const comment = rating >= 4 ? randomChoice(positiveComments) : randomChoice(negativeComments);
  
  return {
    propertyId,
    userId,
    rating,
    comment,
    createdAt: generateRandomDate(2023, 2024)
  };
}

// API helper functions
async function makeApiRequest(method, endpoint, data = null) {
  const baseUrl = 'http://localhost:5000';
  const url = `${baseUrl}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

// Data generation orchestrator
async function generateTestData(options = {}) {
  const {
    numUsers = 200,
    numProperties = 100,
    numReviews = 300
  } = options;
  
  console.log(`Starting data generation:
  - Users: ${numUsers}
  - Properties: ${numProperties}  
  - Reviews: ${numReviews}
  `);
  
  const startTime = Date.now();
  const generatedData = {
    users: [],
    properties: [],
    reviews: [],
    statistics: {
      fraudulentUsers: 0,
      fraudulentProperties: 0,
      verifiedProperties: 0,
      averagePrice: 0
    }
  };
  
  // Generate users
  console.log('Generating users...');
  for (let i = 1; i <= numUsers; i++) {
    const userData = generateUser(i);
    try {
      const user = await makeApiRequest('POST', '/api/auth/register', {
        username: userData.username,
        password: userData.password
      });
      
      generatedData.users.push({ ...user, profile: userData.profile });
      
      if (userData.profile.fraudPattern) {
        generatedData.statistics.fraudulentUsers++;
      }
      
      if (i % 50 === 0) {
        console.log(`Generated ${i}/${numUsers} users`);
      }
    } catch (error) {
      console.log(`Skipping duplicate user: ${userData.username}`);
    }
  }
  
  // Generate properties
  console.log('Generating properties...');
  for (let i = 1; i <= numProperties; i++) {
    const ownerId = randomInt(1, Math.min(generatedData.users.length, numUsers));
    const propertyData = generateProperty(i, ownerId);
    
    try {
      const property = await makeApiRequest('POST', '/api/properties', propertyData);
      generatedData.properties.push(property);
      
      if (propertyData.features.fraudPattern) {
        generatedData.statistics.fraudulentProperties++;
      }
      
      if (propertyData.verificationStatus === 'verified') {
        generatedData.statistics.verifiedProperties++;
      }
      
      if (i % 25 === 0) {
        console.log(`Generated ${i}/${numProperties} properties`);
      }
    } catch (error) {
      console.log(`Error creating property ${i}:`, error.message);
    }
  }
  
  // Generate reviews - need authentication
  console.log('Generating reviews...');
  
  // Login as a demo user to create reviews
  let sessionCookie = '';
  try {
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'demo_buyer', password: 'demo123' })
    });
    
    if (loginResponse.ok) {
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        sessionCookie = setCookieHeader.split(';')[0];
      }
    }
  } catch (error) {
    console.log('Could not login for review creation, skipping reviews');
  }
  
  if (sessionCookie) {
    for (let i = 1; i <= numReviews; i++) {
      const propertyId = randomInt(1, Math.min(generatedData.properties.length, 20)); // Limit to existing properties
      const reviewData = generateReview(propertyId, 1); // Use demo user ID
      
      try {
        const response = await fetch(`http://localhost:5000/api/properties/${propertyId}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie
          },
          body: JSON.stringify({
            rating: reviewData.rating,
            comment: reviewData.comment
          })
        });
        
        if (response.ok) {
          const review = await response.json();
          generatedData.reviews.push(review);
        }
        
        if (i % 50 === 0) {
          console.log(`Generated ${i}/${numReviews} reviews`);
        }
      } catch (error) {
        console.log(`Error creating review ${i}:`, error.message);
      }
    }
  }
  
  // Calculate statistics
  const totalPrice = generatedData.properties.reduce((sum, p) => sum + p.price, 0);
  generatedData.statistics.averagePrice = Math.floor(totalPrice / generatedData.properties.length);
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\nData generation completed in ${duration}s`);
  console.log('Statistics:');
  console.log(`- Total users: ${generatedData.users.length}`);
  console.log(`- Fraudulent users: ${generatedData.statistics.fraudulentUsers} (${(generatedData.statistics.fraudulentUsers/generatedData.users.length*100).toFixed(1)}%)`);
  console.log(`- Total properties: ${generatedData.properties.length}`);
  console.log(`- Fraudulent properties: ${generatedData.statistics.fraudulentProperties} (${(generatedData.statistics.fraudulentProperties/generatedData.properties.length*100).toFixed(1)}%)`);
  console.log(`- Verified properties: ${generatedData.statistics.verifiedProperties} (${(generatedData.statistics.verifiedProperties/generatedData.properties.length*100).toFixed(1)}%)`);
  console.log(`- Average property price: KES ${generatedData.statistics.averagePrice.toLocaleString()}`);
  console.log(`- Total reviews: ${generatedData.reviews.length}`);
  
  // Save generation report
  const report = {
    timestamp: new Date().toISOString(),
    duration,
    statistics: generatedData.statistics,
    locations: KENYAN_LOCATIONS.length,
    amenities: AMENITIES.length
  };
  
  fs.writeFileSync('data-generation-report.json', JSON.stringify(report, null, 2));
  console.log('\nGeneration report saved to data-generation-report.json');
  
  return generatedData;
}

export { generateTestData };
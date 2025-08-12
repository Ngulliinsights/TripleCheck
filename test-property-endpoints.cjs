const express = require('express');
const cors = require('cors');

// Create a simple test server
const app = express();

app.use(cors());
app.use(express.json());

// Mock property data
const mockProperties = [
  {
    id: 1,
    title: "Modern 3-Bedroom Apartment in Westlands",
    description: "Beautiful modern apartment with stunning city views and premium amenities.",
    price: "15000000",
    location: "Westlands, Nairobi",
    features: { propertyType: "Apartment", bedrooms: 3, bathrooms: 2 },
    verificationStatus: "verified",
    createdAt: new Date(),
  },
  {
    id: 2,
    title: "Luxury Villa in Karen",
    description: "Spacious family home with beautiful gardens and modern fixtures.",
    price: "45000000",
    location: "Karen, Nairobi",
    features: { propertyType: "House", bedrooms: 5, bathrooms: 4 },
    verificationStatus: "verified",
    createdAt: new Date(),
  },
  {
    id: 3,
    title: "Modern Office Space in Westlands",
    description: "Premium office space with modern amenities, perfect for growing businesses.",
    price: "25000000",
    location: "Westlands, Nairobi",
    features: { propertyType: "Office", size: 2500, floors: 3 },
    verificationStatus: "verified",
    createdAt: new Date(),
  },
  {
    id: 4,
    title: "Prime Residential Plot in Runda",
    description: "Excellent residential plot in prestigious Runda estate.",
    price: "12000000",
    location: "Runda, Nairobi",
    features: { propertyType: "Residential Land", size: "0.5 acres" },
    verificationStatus: "verified",
    createdAt: new Date(),
  }
];

// Filter properties by type
function filterPropertiesByType(type) {
  return mockProperties.filter(property => {
    const propType = property.features.propertyType.toLowerCase();
    
    if (type === 'residential') {
      return propType === 'apartment' || propType === 'house';
    } else if (type === 'commercial') {
      return propType === 'office' || propType === 'retail' || propType === 'warehouse';
    } else if (type === 'land') {
      return propType.includes('land');
    }
    
    return true;
  });
}

// Test endpoints
app.get('/api/properties/residential', (req, res) => {
  const properties = filterPropertiesByType('residential');
  res.json({
    success: true,
    items: properties,
    totalCount: properties.length,
    hasNextPage: false,
    page: 1,
    limit: 20
  });
});

app.post('/api/properties/residential', (req, res) => {
  const properties = filterPropertiesByType('residential');
  res.json({
    success: true,
    items: properties,
    totalCount: properties.length,
    hasNextPage: false,
    page: 1,
    limit: 12
  });
});

app.get('/api/properties/commercial', (req, res) => {
  const properties = filterPropertiesByType('commercial');
  res.json({
    success: true,
    items: properties,
    totalCount: properties.length,
    hasNextPage: false,
    page: 1,
    limit: 20
  });
});

app.post('/api/properties/commercial', (req, res) => {
  const properties = filterPropertiesByType('commercial');
  res.json({
    success: true,
    items: properties,
    totalCount: properties.length,
    hasNextPage: false,
    page: 1,
    limit: 12
  });
});

app.get('/api/properties/land', (req, res) => {
  const properties = filterPropertiesByType('land');
  res.json({
    success: true,
    items: properties,
    totalCount: properties.length,
    hasNextPage: false,
    page: 1,
    limit: 20
  });
});

app.post('/api/properties/land', (req, res) => {
  const properties = filterPropertiesByType('land');
  res.json({
    success: true,
    items: properties,
    totalCount: properties.length,
    hasNextPage: false,
    page: 1,
    limit: 12
  });
});

app.get('/api/properties/all', (req, res) => {
  res.json({
    success: true,
    items: mockProperties,
    totalCount: mockProperties.length,
    hasNextPage: false,
    page: 1,
    limit: 20
  });
});

app.post('/api/properties/all', (req, res) => {
  res.json({
    success: true,
    items: mockProperties,
    totalCount: mockProperties.length,
    hasNextPage: false,
    page: 1,
    limit: 12
  });
});

app.post('/api/properties/search', (req, res) => {
  res.json({
    success: true,
    items: mockProperties,
    totalCount: mockProperties.length,
    hasNextPage: false,
    page: 1,
    limit: 12
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /api/properties/residential');
  console.log('- POST /api/properties/residential');
  console.log('- GET /api/properties/commercial');
  console.log('- POST /api/properties/commercial');
  console.log('- GET /api/properties/land');
  console.log('- POST /api/properties/land');
  console.log('- GET /api/properties/all');
  console.log('- POST /api/properties/all');
  console.log('- POST /api/properties/search');
});
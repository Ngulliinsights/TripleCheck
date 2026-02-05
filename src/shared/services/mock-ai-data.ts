/**
 * Mock AI Data for Testing Hugging Face Integration
 * Realistic responses that simulate actual API behavior
 */

export interface MockAIResponse {
  id: string;
  type: string;
  input: string;
  response: any;
  confidence: number;
  processingTime: number;
  timestamp: Date;
}

// Kenyan property documents for testing
export const mockPropertyDocuments = [
  {
    id: 'deed_001',
    type: 'property_deed',
    content: `REPUBLIC OF KENYA
MINISTRY OF LANDS AND PHYSICAL PLANNING
TITLE DEED NO. LR.NO.209/10543

This is to certify that JOHN KAMAU MWANGI is the registered proprietor of the land described below:

LOCATION: Kiambu County, Ruiru Sub-County
PLOT NUMBER: LR.NO.209/10543
AREA: 0.5 Hectares (1.24 Acres)
PROPERTY VALUE: KES 8,500,000
DATE OF REGISTRATION: 15th March 2023
REGISTERED OWNER: John Kamau Mwangi
ID NUMBER: 12345678
PHONE: +254 712 345 678

PROPERTY DESCRIPTION:
- Residential plot with 4-bedroom house
- Built in 2020
- Modern amenities including solar power
- Borehole water supply
- Electric fence security

ENCUMBRANCES: None
RESTRICTIONS: Residential use only

Signed and sealed this 15th day of March 2023
REGISTRAR OF TITLES`,
    imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  },
  {
    id: 'survey_001',
    type: 'survey_report',
    content: `LICENSED SURVEYOR'S REPORT
Survey Reference: SUR/2023/KB/1547

PROPERTY SURVEY REPORT
Client: Mary Wanjiku Ndung'u
Plot Reference: LR.NO.209/8821
Location: Thika, Kiambu County

SURVEY FINDINGS:
Total Area Measured: 2.3 Acres (0.93 Hectares)
Boundaries Verified: All four boundaries confirmed
Encroachments: None detected
Access Road: 6-meter tarmac road frontage

COORDINATES:
NE Corner: -1.0332°S, 37.0729°E
NW Corner: -1.0332°S, 37.0725°E
SE Corner: -1.0340°S, 37.0729°E
SW Corner: -1.0340°S, 37.0725°E

TOPOGRAPHY: Gently sloping terrain, suitable for construction
SOIL TYPE: Red volcanic soil, excellent drainage
UTILITIES: Electricity and water available at boundary

RECOMMENDATIONS:
- Suitable for residential development
- No environmental restrictions
- Building permit can be processed

Surveyed by: Eng. Peter Kiprotich Mutai
License No: LS/2019/0847
Date: 28th February 2023`,
    imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  },
  {
    id: 'permit_001',
    type: 'building_permit',
    content: `COUNTY GOVERNMENT OF NAIROBI
BUILDING PERMIT

Permit No: BP/2023/NRB/4521
Date Issued: 10th April 2023

APPLICANT DETAILS:
Name: Grace Akinyi Ochieng
ID No: 23456789
Phone: +254 722 567 890
Email: grace.ochieng@email.com

PROPERTY DETAILS:
Plot No: LR.NO.209/1247
Location: Kasarani, Nairobi County
Proposed Development: 3-storey residential apartment
Total Floor Area: 1,200 sq meters
Estimated Cost: KES 15,000,000

APPROVED PLANS:
- Ground Floor: Parking and commercial space
- First Floor: 4 x 2-bedroom units
- Second Floor: 4 x 2-bedroom units
- Third Floor: 2 x 3-bedroom units

CONDITIONS:
1. Construction must comply with building codes
2. Environmental impact assessment required
3. Fire safety systems mandatory
4. Parking spaces as per regulations

VALIDITY: 24 months from date of issue
FEES PAID: KES 125,000

Approved by: Arch. Samuel Kiplagat
Chief Building Inspector
County Government of Nairobi`,
    imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  }
];

// Property reviews for sentiment analysis
export const mockPropertyReviews = [
  {
    id: 'review_001',
    property: 'Kileleshwa Apartment',
    review: 'Excellent location with great amenities. The neighborhood is safe and well-connected to the city center. The apartment is spacious and modern. Highly recommended for families looking for quality housing in Nairobi.',
    rating: 5,
    sentiment: 'POSITIVE'
  },
  {
    id: 'review_002',
    property: 'Westlands Office Space',
    review: 'The office space is decent but overpriced for what you get. Parking is limited and the elevators are often broken. The location is good but the building management needs improvement.',
    rating: 3,
    sentiment: 'MIXED'
  },
  {
    id: 'review_003',
    property: 'Karen Residential Plot',
    review: 'Terrible experience! The seller provided fake documents and the plot boundaries were disputed. Lost a lot of money and time. Would not recommend dealing with this agent. Very disappointing.',
    rating: 1,
    sentiment: 'NEGATIVE'
  },
  {
    id: 'review_004',
    property: 'Thika Commercial Land',
    review: 'Great investment opportunity! The land is well-located near the highway with excellent potential for commercial development. The documentation was clean and the transaction was smooth.',
    rating: 5,
    sentiment: 'POSITIVE'
  }
];

// Satellite image analysis mock data
export const mockSatelliteImages = [
  {
    id: 'sat_001',
    location: 'Kiambu County Residential Plot',
    features: ['residential_buildings', 'vegetation', 'paved_roads', 'water_features'],
    landUse: 'residential',
    confidence: 0.92
  },
  {
    id: 'sat_002',
    location: 'Nakuru Agricultural Land',
    features: ['agricultural_fields', 'farm_buildings', 'dirt_roads', 'irrigation'],
    landUse: 'agricultural',
    confidence: 0.88
  },
  {
    id: 'sat_003',
    location: 'Mombasa Commercial Area',
    features: ['commercial_buildings', 'parking_lots', 'main_roads', 'industrial_structures'],
    landUse: 'commercial',
    confidence: 0.95
  }
];

// Mock AI responses that simulate Hugging Face API behavior
export const mockAIResponses = {
  documentOCR: (documentId: string) => {
    const doc = mockPropertyDocuments.find(d => d.id === documentId);
    return {
      text: doc?.content || 'Unable to extract text from document',
      confidence: 0.87,
      entities: [
        { label: 'PERSON', text: 'John Kamau Mwangi', confidence: 0.95 },
        { label: 'LOCATION', text: 'Kiambu County', confidence: 0.92 },
        { label: 'MONEY', text: 'KES 8,500,000', confidence: 0.89 },
        { label: 'DATE', text: '15th March 2023', confidence: 0.94 },
        { label: 'PLOT_NUMBER', text: 'LR.NO.209/10543', confidence: 0.96 }
      ]
    };
  },

  documentClassification: (text: string) => {
    const classifications = [
      { input: 'TITLE DEED', label: 'property_deed', confidence: 0.94 },
      { input: 'SURVEY REPORT', label: 'survey_report', confidence: 0.91 },
      { input: 'BUILDING PERMIT', label: 'building_permit', confidence: 0.88 },
      { input: 'SALE AGREEMENT', label: 'contract', confidence: 0.85 },
      { input: 'COURT ORDER', label: 'legal_notice', confidence: 0.82 }
    ];
    
    const match = classifications.find(c => text.toUpperCase().includes(c.input));
    return match || { label: 'unknown_document', confidence: 0.45 };
  },

  sentimentAnalysis: (reviewId: string) => {
    const review = mockPropertyReviews.find(r => r.id === reviewId);
    const sentimentMap = {
      'POSITIVE': { label: 'LABEL_2', confidence: 0.92 }, // Positive
      'NEGATIVE': { label: 'LABEL_0', confidence: 0.89 }, // Negative
      'MIXED': { label: 'LABEL_1', confidence: 0.67 }     // Neutral
    };
    return sentimentMap[review?.sentiment || 'MIXED'];
  },

  imageAnalysis: (imageId: string) => {
    const image = mockSatelliteImages.find(i => i.id === imageId);
    return {
      labels: image?.features.map((feature, index) => ({
        label: feature.replace('_', ' '),
        confidence: 0.85 - (index * 0.05)
      })) || [],
      description: `Land appears to contain: ${image?.features.join(', ') || 'unknown features'}`
    };
  },

  translation: (text: string, targetLang: string) => {
    const translations = {
      'es': {
        'This is a property deed': 'Esta es una escritura de propiedad',
        'residential plot': 'parcela residencial',
        'commercial building': 'edificio comercial'
      },
      'sw': {
        'This is a property deed': 'Hii ni hati ya mali',
        'residential plot': 'kiwanja cha makazi',
        'commercial building': 'jengo la kibiashara'
      },
      'fr': {
        'This is a property deed': 'Ceci est un acte de propriété',
        'residential plot': 'parcelle résidentielle',
        'commercial building': 'bâtiment commercial'
      }
    };

    const langTranslations = translations[targetLang as keyof typeof translations] || {};
    const translatedText = Object.keys(langTranslations).reduce((acc, key) => {
      return acc.replace(new RegExp(key, 'gi'), langTranslations[key as keyof typeof langTranslations]);
    }, text);

    return {
      translatedText: translatedText !== text ? translatedText : `[${targetLang.toUpperCase()}] ${text}`,
      sourceLanguage: 'en',
      targetLanguage: targetLang
    };
  },

  questionAnswering: (context: string, question: string) => {
    const qaMap = [
      { q: 'property value', a: 'KES 8,500,000', confidence: 0.94 },
      { q: 'location', a: 'Kiambu County, Ruiru Sub-County', confidence: 0.91 },
      { q: 'size', a: '0.5 Hectares (1.24 Acres)', confidence: 0.89 },
      { q: 'owner', a: 'John Kamau Mwangi', confidence: 0.96 },
      { q: 'bedrooms', a: '4-bedroom house', confidence: 0.87 },
      { q: 'built', a: '2020', confidence: 0.83 }
    ];

    const match = qaMap.find(qa => 
      question.toLowerCase().includes(qa.q) || 
      context.toLowerCase().includes(qa.q)
    );

    return match || { answer: 'Information not found in the document', confidence: 0.12 };
  },

  summarization: (text: string) => {
    const summaries = [
      'Property deed for 0.5-hectare residential plot in Kiambu County owned by John Kamau Mwangi, valued at KES 8.5M with 4-bedroom house built in 2020.',
      'Survey report confirms 2.3-acre plot in Thika with clear boundaries, suitable for residential development with utilities available.',
      'Building permit approved for 3-storey apartment in Kasarani, Nairobi, with 14 residential units and commercial space, valid for 24 months.'
    ];
    
    return summaries[Math.floor(Math.random() * summaries.length)];
  },

  fraudDetection: (text: string) => {
    const fraudIndicators = [
      'altered_dates',
      'suspicious_pricing',
      'missing_signatures',
      'fake_credentials',
      'forged_documents'
    ];

    // Simulate fraud detection based on text content
    const suspiciousWords = ['fake', 'forged', 'altered', 'suspicious', 'fraud'];
    const hasSuspiciousContent = suspiciousWords.some(word => 
      text.toLowerCase().includes(word)
    );

    const riskLevel = hasSuspiciousContent ? 'high' : 
                     Math.random() > 0.8 ? 'medium' : 'low';
    
    const confidence = hasSuspiciousContent ? 0.85 : Math.random() * 0.6;
    
    return {
      riskLevel,
      indicators: riskLevel !== 'low' ? [fraudIndicators[Math.floor(Math.random() * fraudIndicators.length)]] : [],
      confidence
    };
  }
};

// Generate realistic processing delays
export const simulateProcessingDelay = (type: string): number => {
  const delays = {
    'ocr': 2000 + Math.random() * 3000,           // 2-5 seconds
    'classification': 1000 + Math.random() * 2000, // 1-3 seconds
    'sentiment': 800 + Math.random() * 1200,       // 0.8-2 seconds
    'translation': 1500 + Math.random() * 2500,    // 1.5-4 seconds
    'qa': 2000 + Math.random() * 3000,            // 2-5 seconds
    'summary': 3000 + Math.random() * 4000,       // 3-7 seconds
    'fraud': 2500 + Math.random() * 3500,         // 2.5-6 seconds
    'image': 4000 + Math.random() * 6000          // 4-10 seconds
  };
  
  return delays[type as keyof typeof delays] || 2000;
};

// Export sample data for testing
export const sampleTestData = {
  propertyDescriptions: [
    mockPropertyDocuments[0].content,
    mockPropertyDocuments[1].content,
    mockPropertyDocuments[2].content
  ],
  propertyReviews: mockPropertyReviews.map(r => r.review),
  testQuestions: [
    'What is the property value?',
    'Where is the property located?',
    'What is the size of the property?',
    'Who is the owner?',
    'When was the building constructed?',
    'What type of property is this?'
  ],
  imageBase64Samples: mockPropertyDocuments.map(d => d.imageBase64)
};
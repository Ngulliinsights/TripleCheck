"use strict";
/**
 * Mock AI Data for Testing Hugging Face Integration
 * Realistic responses that simulate actual API behavior
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleTestData = exports.simulateProcessingDelay = exports.mockAIResponses = exports.mockSatelliteImages = exports.mockPropertyReviews = exports.mockPropertyDocuments = void 0;
// Kenyan property documents for testing
exports.mockPropertyDocuments = [
    {
        id: 'deed_001',
        type: 'property_deed',
        content: "REPUBLIC OF KENYA\nMINISTRY OF LANDS AND PHYSICAL PLANNING\nTITLE DEED NO. LR.NO.209/10543\n\nThis is to certify that JOHN KAMAU MWANGI is the registered proprietor of the land described below:\n\nLOCATION: Kiambu County, Ruiru Sub-County\nPLOT NUMBER: LR.NO.209/10543\nAREA: 0.5 Hectares (1.24 Acres)\nPROPERTY VALUE: KES 8,500,000\nDATE OF REGISTRATION: 15th March 2023\nREGISTERED OWNER: John Kamau Mwangi\nID NUMBER: 12345678\nPHONE: +254 712 345 678\n\nPROPERTY DESCRIPTION:\n- Residential plot with 4-bedroom house\n- Built in 2020\n- Modern amenities including solar power\n- Borehole water supply\n- Electric fence security\n\nENCUMBRANCES: None\nRESTRICTIONS: Residential use only\n\nSigned and sealed this 15th day of March 2023\nREGISTRAR OF TITLES",
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    },
    {
        id: 'survey_001',
        type: 'survey_report',
        content: "LICENSED SURVEYOR'S REPORT\nSurvey Reference: SUR/2023/KB/1547\n\nPROPERTY SURVEY REPORT\nClient: Mary Wanjiku Ndung'u\nPlot Reference: LR.NO.209/8821\nLocation: Thika, Kiambu County\n\nSURVEY FINDINGS:\nTotal Area Measured: 2.3 Acres (0.93 Hectares)\nBoundaries Verified: All four boundaries confirmed\nEncroachments: None detected\nAccess Road: 6-meter tarmac road frontage\n\nCOORDINATES:\nNE Corner: -1.0332\u00B0S, 37.0729\u00B0E\nNW Corner: -1.0332\u00B0S, 37.0725\u00B0E\nSE Corner: -1.0340\u00B0S, 37.0729\u00B0E\nSW Corner: -1.0340\u00B0S, 37.0725\u00B0E\n\nTOPOGRAPHY: Gently sloping terrain, suitable for construction\nSOIL TYPE: Red volcanic soil, excellent drainage\nUTILITIES: Electricity and water available at boundary\n\nRECOMMENDATIONS:\n- Suitable for residential development\n- No environmental restrictions\n- Building permit can be processed\n\nSurveyed by: Eng. Peter Kiprotich Mutai\nLicense No: LS/2019/0847\nDate: 28th February 2023",
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    },
    {
        id: 'permit_001',
        type: 'building_permit',
        content: "COUNTY GOVERNMENT OF NAIROBI\nBUILDING PERMIT\n\nPermit No: BP/2023/NRB/4521\nDate Issued: 10th April 2023\n\nAPPLICANT DETAILS:\nName: Grace Akinyi Ochieng\nID No: 23456789\nPhone: +254 722 567 890\nEmail: grace.ochieng@email.com\n\nPROPERTY DETAILS:\nPlot No: LR.NO.209/1247\nLocation: Kasarani, Nairobi County\nProposed Development: 3-storey residential apartment\nTotal Floor Area: 1,200 sq meters\nEstimated Cost: KES 15,000,000\n\nAPPROVED PLANS:\n- Ground Floor: Parking and commercial space\n- First Floor: 4 x 2-bedroom units\n- Second Floor: 4 x 2-bedroom units\n- Third Floor: 2 x 3-bedroom units\n\nCONDITIONS:\n1. Construction must comply with building codes\n2. Environmental impact assessment required\n3. Fire safety systems mandatory\n4. Parking spaces as per regulations\n\nVALIDITY: 24 months from date of issue\nFEES PAID: KES 125,000\n\nApproved by: Arch. Samuel Kiplagat\nChief Building Inspector\nCounty Government of Nairobi",
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    }
];
// Property reviews for sentiment analysis
exports.mockPropertyReviews = [
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
exports.mockSatelliteImages = [
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
exports.mockAIResponses = {
    documentOCR: function (documentId) {
        var doc = exports.mockPropertyDocuments.find(function (d) { return d.id === documentId; });
        return {
            text: (doc === null || doc === void 0 ? void 0 : doc.content) || 'Unable to extract text from document',
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
    documentClassification: function (text) {
        var classifications = [
            { input: 'TITLE DEED', label: 'property_deed', confidence: 0.94 },
            { input: 'SURVEY REPORT', label: 'survey_report', confidence: 0.91 },
            { input: 'BUILDING PERMIT', label: 'building_permit', confidence: 0.88 },
            { input: 'SALE AGREEMENT', label: 'contract', confidence: 0.85 },
            { input: 'COURT ORDER', label: 'legal_notice', confidence: 0.82 }
        ];
        var match = classifications.find(function (c) { return text.toUpperCase().includes(c.input); });
        return match || { label: 'unknown_document', confidence: 0.45 };
    },
    sentimentAnalysis: function (reviewId) {
        var review = exports.mockPropertyReviews.find(function (r) { return r.id === reviewId; });
        var sentimentMap = {
            'POSITIVE': { label: 'LABEL_2', confidence: 0.92 }, // Positive
            'NEGATIVE': { label: 'LABEL_0', confidence: 0.89 }, // Negative
            'MIXED': { label: 'LABEL_1', confidence: 0.67 } // Neutral
        };
        return sentimentMap[(review === null || review === void 0 ? void 0 : review.sentiment) || 'MIXED'];
    },
    imageAnalysis: function (imageId) {
        var image = exports.mockSatelliteImages.find(function (i) { return i.id === imageId; });
        return {
            labels: (image === null || image === void 0 ? void 0 : image.features.map(function (feature, index) { return ({
                label: feature.replace('_', ' '),
                confidence: 0.85 - (index * 0.05)
            }); })) || [],
            description: "Land appears to contain: ".concat((image === null || image === void 0 ? void 0 : image.features.join(', ')) || 'unknown features')
        };
    },
    translation: function (text, targetLang) {
        var translations = {
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
        var langTranslations = translations[targetLang] || {};
        var translatedText = Object.keys(langTranslations).reduce(function (acc, key) {
            return acc.replace(new RegExp(key, 'gi'), langTranslations[key]);
        }, text);
        return {
            translatedText: translatedText !== text ? translatedText : "[".concat(targetLang.toUpperCase(), "] ").concat(text),
            sourceLanguage: 'en',
            targetLanguage: targetLang
        };
    },
    questionAnswering: function (context, question) {
        var qaMap = [
            { q: 'property value', a: 'KES 8,500,000', confidence: 0.94 },
            { q: 'location', a: 'Kiambu County, Ruiru Sub-County', confidence: 0.91 },
            { q: 'size', a: '0.5 Hectares (1.24 Acres)', confidence: 0.89 },
            { q: 'owner', a: 'John Kamau Mwangi', confidence: 0.96 },
            { q: 'bedrooms', a: '4-bedroom house', confidence: 0.87 },
            { q: 'built', a: '2020', confidence: 0.83 }
        ];
        var match = qaMap.find(function (qa) {
            return question.toLowerCase().includes(qa.q) ||
                context.toLowerCase().includes(qa.q);
        });
        return match || { answer: 'Information not found in the document', confidence: 0.12 };
    },
    summarization: function (text) {
        var summaries = [
            'Property deed for 0.5-hectare residential plot in Kiambu County owned by John Kamau Mwangi, valued at KES 8.5M with 4-bedroom house built in 2020.',
            'Survey report confirms 2.3-acre plot in Thika with clear boundaries, suitable for residential development with utilities available.',
            'Building permit approved for 3-storey apartment in Kasarani, Nairobi, with 14 residential units and commercial space, valid for 24 months.'
        ];
        return summaries[Math.floor(Math.random() * summaries.length)];
    },
    fraudDetection: function (text) {
        var fraudIndicators = [
            'altered_dates',
            'suspicious_pricing',
            'missing_signatures',
            'fake_credentials',
            'forged_documents'
        ];
        // Simulate fraud detection based on text content
        var suspiciousWords = ['fake', 'forged', 'altered', 'suspicious', 'fraud'];
        var hasSuspiciousContent = suspiciousWords.some(function (word) {
            return text.toLowerCase().includes(word);
        });
        var riskLevel = hasSuspiciousContent ? 'high' :
            Math.random() > 0.8 ? 'medium' : 'low';
        var confidence = hasSuspiciousContent ? 0.85 : Math.random() * 0.6;
        return {
            riskLevel: riskLevel,
            indicators: riskLevel !== 'low' ? [fraudIndicators[Math.floor(Math.random() * fraudIndicators.length)]] : [],
            confidence: confidence
        };
    }
};
// Generate realistic processing delays
var simulateProcessingDelay = function (type) {
    var delays = {
        'ocr': 2000 + Math.random() * 3000, // 2-5 seconds
        'classification': 1000 + Math.random() * 2000, // 1-3 seconds
        'sentiment': 800 + Math.random() * 1200, // 0.8-2 seconds
        'translation': 1500 + Math.random() * 2500, // 1.5-4 seconds
        'qa': 2000 + Math.random() * 3000, // 2-5 seconds
        'summary': 3000 + Math.random() * 4000, // 3-7 seconds
        'fraud': 2500 + Math.random() * 3500, // 2.5-6 seconds
        'image': 4000 + Math.random() * 6000 // 4-10 seconds
    };
    return delays[type] || 2000;
};
exports.simulateProcessingDelay = simulateProcessingDelay;
// Export sample data for testing
exports.sampleTestData = {
    propertyDescriptions: [
        exports.mockPropertyDocuments[0].content,
        exports.mockPropertyDocuments[1].content,
        exports.mockPropertyDocuments[2].content
    ],
    propertyReviews: exports.mockPropertyReviews.map(function (r) { return r.review; }),
    testQuestions: [
        'What is the property value?',
        'Where is the property located?',
        'What is the size of the property?',
        'Who is the owner?',
        'When was the building constructed?',
        'What type of property is this?'
    ],
    imageBase64Samples: exports.mockPropertyDocuments.map(function (d) { return d.imageBase64; })
};

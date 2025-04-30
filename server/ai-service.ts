import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import { storage } from './storage';

// Extended Request type that includes file uploads
export type FileUploadRequest = Request & {
  files?: {
    [fieldname: string]: fileUpload.UploadedFile | fileUpload.UploadedFile[];
  };
};
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import util from 'util';
import crypto from 'crypto';

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface DocumentVerificationResult {
  isVerified: boolean;
  confidence: number;
  issues: string[];
  recommendations: string[];
  documentType: string;
  extractedData: Record<string, any>;
  verificationDate: Date;
}

interface FraudDetectionResult {
  isSuspicious: boolean;
  suspiciousScore: number;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  verificationDate: Date;
}

// Directory to save temporary uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../uploads');
// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Analyze a property document for verification
 */
export async function verifyDocument(
  documentBuffer: Buffer, 
  documentName: string,
  documentType: string
): Promise<DocumentVerificationResult> {
  try {
    // Get the file extension
    const fileExt = path.extname(documentName).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png'].includes(fileExt);
    const isPdf = fileExt === '.pdf';

    // For PDF documents, we would extract text - for simplicity, we'll just pass text
    let analysisContent = '';
    
    if (isImage) {
      // Convert buffer to base64 for image files
      const base64Image = documentBuffer.toString('base64');
      
      // For image-based documents, use the multimodal Gemini model
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      
      // Prepare the prompt for document verification
      const prompt = `You are a property document verification expert in Kenya. 
      Analyze this document image thoroughly and validate if it appears to be an authentic ${documentType}.
      
      Look for:
      1. Official letterheads, stamps, or seals
      2. Consistency in formatting
      3. Signs of tampering or alterations
      4. Appropriate signatures and dates
      5. Legal and official language
      6. Standard field formats like ID numbers, dates
      
      For a title deed, check:
      - Proper registration information
      - Land reference number format
      - Proper government seals
      - Consistent typography
      
      Extract all key details like:
      - Property ID/Number
      - Owner name
      - Location details
      - Registration date
      - Land size
      - Any relevant legal information
      
      Format your response as JSON:
      {
        "isVerified": boolean,
        "confidence": number (0.0-1.0),
        "issues": [list of potential issues],
        "recommendations": [list of recommendations],
        "documentType": "string",
        "extractedData": {
          // extracted key-value pairs from document
        }
      }
      
      Focus on objective analysis of the document's authenticity, not the content's truth value.`;
      
      // Create a part for the image
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: `image/${fileExt.substring(1)}`,
        },
      };
      
      // Generate content with the image
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      analysisContent = response.text();
    } else {
      // For non-image files, use text-based model
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Get text content from the document
      let docText = '';
      if (isPdf) {
        // In a real implementation, you would extract text from PDF
        // This is a simplified approach for demonstration
        docText = "This document contains text extracted from a PDF file";
      } else {
        // Assume it's a text document
        docText = documentBuffer.toString('utf-8');
      }
      
      // Prepare the prompt for document verification
      const prompt = `You are a property document verification expert in Kenya. 
      Analyze this document text thoroughly and validate if it appears to be an authentic ${documentType}.
      
      Document content:
      "${docText}"
      
      Look for:
      1. Official legal language and terminology
      2. Consistency in formatting
      3. Signs of irregularities or contradictions
      4. Appropriate references to Kenyan land laws
      5. Proper document structure
      
      Extract all key details like:
      - Property ID/Number
      - Owner name
      - Location details
      - Registration date
      - Land size
      - Any relevant legal information
      
      Format your response as JSON:
      {
        "isVerified": boolean,
        "confidence": number (0.0-1.0),
        "issues": [list of potential issues],
        "recommendations": [list of recommendations],
        "documentType": "string",
        "extractedData": {
          // extracted key-value pairs from document
        }
      }
      
      Focus on objective analysis of the document's authenticity based on the text content.`;
      
      // Generate content with the text
      const result = await model.generateContent(prompt);
      const response = await result.response;
      analysisContent = response.text();
    }
    
    // Extract the JSON from the response
    // It might be surrounded by backticks or other formatting
    const jsonMatch = analysisContent.match(/```json\n([\s\S]*?)```/) || 
                      analysisContent.match(/```([\s\S]*?)```/) || 
                      [null, analysisContent];
    
    let jsonString = jsonMatch[1] || analysisContent;
    // Clean up any non-JSON parts
    jsonString = jsonString.replace(/^```json\n|^```|\n```$/g, '').trim();
    
    try {
      const verificationResult = JSON.parse(jsonString) as DocumentVerificationResult;
      return {
        ...verificationResult,
        verificationDate: new Date()
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return {
        isVerified: false,
        confidence: 0,
        issues: ['Unable to process document verification due to AI response parsing error'],
        recommendations: ['Please try again with a clearer document'],
        documentType,
        extractedData: {},
        verificationDate: new Date()
      };
    }
    
  } catch (error) {
    console.error('Document verification error:', error);
    return {
      isVerified: false,
      confidence: 0,
      issues: ['Error during document verification process'],
      recommendations: ['Please try again later'],
      documentType,
      extractedData: {},
      verificationDate: new Date()
    };
  }
}

/**
 * Analyze property data for potential fraud indicators
 */
export async function detectFraud(propertyData: any): Promise<FraudDetectionResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Convert property data to a string for analysis
    const propertyDataString = JSON.stringify(propertyData, null, 2);
    
    // Prepare the prompt for fraud detection
    const prompt = `You are a real estate fraud detection expert in Kenya. 
    Analyze this property listing data thoroughly and identify potential indicators of fraud.
    
    Property data:
    ${propertyDataString}
    
    Look for red flags including:
    1. Pricing that is significantly below market value
    2. Vague or inconsistent property descriptions
    3. Multiple listings with same photos but different details
    4. Unusual location descriptions or non-existent addresses
    5. Suspicious contact information patterns
    6. Properties listed without proper identifiers or registration numbers
    7. Unusual ownership history or rapid ownership changes
    
    Format your response as JSON:
    {
      "isSuspicious": boolean,
      "suspiciousScore": number (0.0-1.0),
      "reasons": [list of specific reasons if suspicious],
      "riskLevel": "low" or "medium" or "high"
    }
    
    Provide detailed explanations if you identify any suspicious elements. Focus on objective patterns that may indicate fraudulent activity in the Kenyan real estate context.`;
    
    // Generate content for fraud analysis
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisContent = response.text();
    
    // Extract the JSON from the response
    const jsonMatch = analysisContent.match(/```json\n([\s\S]*?)```/) || 
                      analysisContent.match(/```([\s\S]*?)```/) || 
                      [null, analysisContent];
    
    let jsonString = jsonMatch[1] || analysisContent;
    // Clean up any non-JSON parts
    jsonString = jsonString.replace(/^```json\n|^```|\n```$/g, '').trim();
    
    try {
      const fraudResult = JSON.parse(jsonString) as FraudDetectionResult;
      return {
        ...fraudResult,
        verificationDate: new Date()
      };
    } catch (parseError) {
      console.error('Error parsing AI fraud detection response:', parseError);
      return {
        isSuspicious: false,
        suspiciousScore: 0,
        reasons: ['Unable to process fraud detection due to AI response parsing error'],
        riskLevel: 'low',
        verificationDate: new Date()
      };
    }
    
  } catch (error) {
    console.error('Fraud detection error:', error);
    return {
      isSuspicious: false,
      suspiciousScore: 0,
      reasons: ['Error during fraud detection process'],
      riskLevel: 'low',
      verificationDate: new Date()
    };
  }
}

/**
 * Generate a property verification report
 */
export async function generateVerificationReport(propertyId: number): Promise<string> {
  try {
    // Get property data from storage
    const property = await storage.getProperty(propertyId);
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Create a comprehensive prompt with all property data
    const propertyDataString = JSON.stringify(property, null, 2);
    
    // Prepare the prompt for generating a verification report
    const prompt = `You are a property verification expert for TripleCheck, a Kenyan real estate verification platform.
    Generate a comprehensive verification report for the following property:
    
    ${propertyDataString}
    
    Include sections for:
    1. Property Overview
    2. Verification Status Summary
    3. Document Authentication Results
    4. Fraud Detection Analysis
    5. Ownership History Verification
    6. Legal Compliance Check
    7. Recommendations and Next Steps
    
    The report should be detailed yet easy to understand for potential buyers or renters.
    Include any red flags or areas of concern.
    If verification data is missing in some areas, note that those aspects could not be verified.
    
    Format the report in a professional manner with clear sections and bullet points where appropriate.`;
    
    // Generate the verification report
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
    
  } catch (error) {
    console.error('Error generating verification report:', error);
    return `Error: Unable to generate verification report for property ID ${propertyId}. Please try again later.`;
  }
}

/**
 * Analyze multiple property documents for a comprehensive verification
 */
export async function verifyPropertyBundle(propertyId: number, documents: Array<{buffer: Buffer, name: string, type: string}>): Promise<any> {
  try {
    // Process each document
    const documentResults = await Promise.all(
      documents.map(doc => verifyDocument(doc.buffer, doc.name, doc.type))
    );
    
    // Get property data
    const property = await storage.getProperty(propertyId);
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }
    
    // Run fraud detection
    const fraudDetection = await detectFraud(property);
    
    // Create a comprehensive verification result
    const verificationResult = {
      propertyId,
      overallStatus: calculateOverallStatus(documentResults, fraudDetection),
      documentVerifications: documentResults,
      fraudDetection,
      timestamp: new Date(),
      verificationId: crypto.randomUUID()
    };
    
    // Update property verification status in storage
    await storage.updateVerificationStatus(
      propertyId, 
      verificationResult.overallStatus,
      verificationResult
    );
    
    return verificationResult;
    
  } catch (error) {
    console.error('Property bundle verification error:', error);
    throw error;
  }
}

/**
 * Calculate an overall verification status based on document and fraud checks
 */
function calculateOverallStatus(
  documentResults: DocumentVerificationResult[], 
  fraudDetection: FraudDetectionResult
): string {
  
  // If any document failed verification with high confidence
  const failedDocuments = documentResults.filter(doc => 
    !doc.isVerified && doc.confidence > 0.7
  );
  
  if (failedDocuments.length > 0) {
    return 'failed';
  }
  
  // If fraud detection shows high risk
  if (fraudDetection.isSuspicious && fraudDetection.riskLevel === 'high') {
    return 'suspicious';
  }
  
  // If all documents are verified with good confidence
  const allVerified = documentResults.every(doc => 
    doc.isVerified && doc.confidence > 0.6
  );
  
  if (allVerified && (!fraudDetection.isSuspicious || fraudDetection.riskLevel === 'low')) {
    return 'verified';
  }
  
  // If some documents are verified but others are inconclusive
  return 'pending';
}

/**
 * Handle document upload and verification
 */
export async function handleDocumentVerification(req: FileUploadRequest, res: Response) {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files were uploaded' 
      });
    }
    
    // Get property ID
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid property ID' 
      });
    }
    
    // Get property from storage
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found' 
      });
    }
    
    // Process each uploaded file
    const documentsFile = req.files.documents;
    const files = Array.isArray(documentsFile) ? documentsFile : [documentsFile];
    
    const documents = files.map((file: fileUpload.UploadedFile) => ({
      buffer: file.data,
      name: file.name,
      type: req.body.documentTypes ? 
        (Array.isArray(req.body.documentTypes) ? 
          req.body.documentTypes[files.indexOf(file)] : req.body.documentTypes)
        : 'unknown'
    }));
    
    // Verify all documents
    const verificationResult = await verifyPropertyBundle(propertyId, documents);
    
    return res.status(200).json({
      success: true,
      result: verificationResult
    });
    
  } catch (error) {
    console.error('Document verification endpoint error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing document verification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle fraud detection for a property
 */
export async function handleFraudDetection(req: Request, res: Response) {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid property ID' 
      });
    }
    
    // Get property from storage
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found' 
      });
    }
    
    // Run fraud detection
    const fraudDetection = await detectFraud(property);
    
    return res.status(200).json({
      success: true,
      result: fraudDetection
    });
    
  } catch (error) {
    console.error('Fraud detection endpoint error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing fraud detection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate and return a verification report
 */
export async function handleGenerateReport(req: Request, res: Response) {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid property ID' 
      });
    }
    
    // Generate the report
    const report = await generateVerificationReport(propertyId);
    
    return res.status(200).json({
      success: true,
      report
    });
    
  } catch (error) {
    console.error('Report generation endpoint error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error generating verification report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
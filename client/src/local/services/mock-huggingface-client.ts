/**
 * Mock Hugging Face API Client for Testing
 * Uses realistic mock data instead of actual API calls
 * Optimized for TypeScript safety and functionality
 */

import { 
  TextClassificationResult, 
  TranslationResult 
} from '../../local/services/unified-api-client"
import { 
  DocumentAnalysisResult,
  ImageAnalysisResult
} from './huggingface-api-client'
import { 
  mockAIResponses, 
  simulateProcessingDelay, 
  mockPropertyDocuments,
  mockPropertyReviews,
  sampleTestData 
} from './mock-ai-data'

// Type-safe error simulation - using a class for proper property assignment
class MockApiError extends Error {
  public readonly isSimulated = true;
  public readonly errorType: string;
  
  constructor(message: string, errorType: string) {
    super(message);
    this.name = 'MockApiError';
    this.errorType = errorType;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MockApiError.prototype);
  }
}

// Enhanced configuration with better type safety
interface MockClientConfig {
  readonly useMockData?: boolean;
  readonly errorRate?: number; // 0 to 1, default 0.05 (5%)
  readonly simulateNetworkDelay?: boolean;
}

// Utility type guards for runtime type safety
function isValidLabel(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidConfidence(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

// Safe extraction utilities that guarantee return types
const safeExtractors = {
  /**
   * Extracts a label with guaranteed string return
   * This function encapsulates all the label extraction logic and ensures
   * we always get a valid string, which eliminates the TypeScript error
   * 
   * The key improvement here is the explicit return type annotation
   * combined with comprehensive fallback handling
   */
  extractLabel(result: unknown, fallback = 'unknown'): string {
    // Early return for direct string values
    if (isValidLabel(result)) {
      return result;
    }
    
    if (typeof result === 'object' && result !== null) {
      const obj = result as Record<string, unknown>;
      
      // Direct label property
      if ('label' in obj && isValidLabel(obj.label)) {
        return obj.label;
      }
      
      // Labels array (common in ML APIs)
      if ('labels' in obj && Array.isArray(obj.labels) && obj.labels.length > 0) {
        const firstLabel = obj.labels[0];
        if (typeof firstLabel === 'object' && firstLabel !== null && 'label' in firstLabel) {
          const labelValue = (firstLabel as Record<string, unknown>).label;
          if (isValidLabel(labelValue)) {
            return labelValue;
          }
        }
        // Handle case where labels array contains direct string values
        if (isValidLabel(firstLabel)) {
          return firstLabel;
        }
      }
      
      // Handle classification results that might have a 'class' or 'category' field
      const alternativeKeys = ['class', 'category', 'type', 'classification'];
      for (const key of alternativeKeys) {
        if (key in obj && isValidLabel(obj[key])) {
          return obj[key] as string;
        }
      }
    }
    
    // This fallback ensures we ALWAYS return a valid string
    return fallback;
  },

  /**
   * Extracts confidence with guaranteed number return
   * Includes range validation to ensure confidence stays within [0, 1]
   */
  extractConfidence(result: unknown, fallback = 0.5): number {
    if (isValidConfidence(result)) {
      return result;
    }
    
    if (typeof result === 'object' && result !== null) {
      const obj = result as Record<string, unknown>;
      
      // Direct confidence property
      if ('confidence' in obj && isValidConfidence(obj.confidence)) {
        return obj.confidence;
      }
      
      // Score property (alternative naming)
      if ('score' in obj && isValidConfidence(obj.score)) {
        return obj.score;
      }
      
      // Labels array with confidence
      if ('labels' in obj && Array.isArray(obj.labels) && obj.labels.length > 0) {
        const firstLabel = obj.labels[0];
        if (typeof firstLabel === 'object' && firstLabel !== null) {
          const labelObj = firstLabel as Record<string, unknown>;
          if ('confidence' in labelObj && isValidConfidence(labelObj.confidence)) {
            return labelObj.confidence;
          }
          if ('score' in labelObj && isValidConfidence(labelObj.score)) {
            return labelObj.score;
          }
        }
      }
    }
    
    // Ensure fallback is within valid range
    return Math.max(0, Math.min(1, fallback));
  },

  /**
   * Extracts translated text with guaranteed string return
   */
  extractTranslatedText(result: unknown, originalText: string): string {
    if (typeof result === 'string') {
      return result;
    }
    
    if (typeof result === 'object' && result !== null) {
      const obj = result as Record<string, unknown>;
      
      const textKeys = ['translatedText', 'translation', 'text', 'output'];
      for (const key of textKeys) {
        if (key in obj && typeof obj[key] === 'string') {
          return obj[key] as string;
        }
      }
    }
    
    return originalText; // Fallback to original if translation fails
  }
};

export class MockHuggingFaceApiClient {
  private readonly config: Required<MockClientConfig>;

  constructor(config: MockClientConfig = {}) {
    this.config = {
      useMockData: config.useMockData ?? true,
      errorRate: Math.max(0, Math.min(1, config.errorRate ?? 0.05)),
      simulateNetworkDelay: config.simulateNetworkDelay ?? true
    };
  }

  /**
   * Simulates API call behavior with proper error handling and delays
   * This method ensures consistent behavior across all mock operations
   */
  private async simulateApiCall<T>(
    operation: () => T | Promise<T>,
    processingType: string
  ): Promise<T> {
    // Simulate network delay if enabled
    if (this.config.simulateNetworkDelay) {
      const delay = simulateProcessingDelay(processingType);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Simulate occasional API errors based on configured rate
    if (Math.random() < this.config.errorRate) {
      throw new MockApiError(
        `Mock API error: ${processingType} service temporarily unavailable`,
        processingType
      );
    }
    
    // Execute the operation (could be sync or async)
    return await operation();
  }

  /**
   * Analyzes property documents with enhanced type safety
   * Ensures the returned data always matches DocumentAnalysisResult interface
   */
  async analyzePropertyDocument(
    imageBase64: string,
    documentType: 'deed' | 'survey' | 'permit' | 'contract' = 'deed'
  ): Promise<DocumentAnalysisResult> {
    return this.simulateApiCall(() => {
      // Type-safe document ID mapping
      const documentIdMap: Record<typeof documentType, string> = {
        deed: 'deed_001',
        survey: 'survey_001', 
        permit: 'permit_001',
        contract: 'deed_001' // Fallback to deed for contract
      };
      
      const docId = documentIdMap[documentType];
      const result = mockAIResponses.documentOCR(docId);
      
      // Ensure the result conforms to DocumentAnalysisResult
      return {
        ...result,
        // Add any missing properties with safe defaults if needed
        confidence: safeExtractors.extractConfidence(result.confidence, 0.85)
      };
    }, 'ocr');
  }

  /**
   * Analyzes land images with consistent random selection
   */
  async analyzeLandImage(imageBase64: string): Promise<ImageAnalysisResult> {
    return this.simulateApiCall(() => {
      const imageId = `sat_00${Math.floor(Math.random() * 3) + 1}`;
      const result = mockAIResponses.imageAnalysis(imageId);
      
      return {
        ...result,
        confidence: safeExtractors.extractConfidence(result, 0.80)
      };
    }, 'image');
  }

  /**
   * Classifies legal documents with proper text validation
   * FIXED: This method now properly handles the type safety issue
   * 
   * The key improvement is ensuring that both label and score
   * are extracted using our safe extractors, and we construct the
   * return object in a way that TypeScript can verify matches the interface
   */
  async classifyLegalDocument(text: string): Promise<TextClassificationResult> {
    return this.simulateApiCall(() => {
      // Validate input text early
      if (!text || text.trim().length === 0) {
        // Return a properly typed result for empty input
        return {
          label: 'unknown',
          score: 0.1
        };
      }
      
      // Get the mock response
      const mockResult = mockAIResponses.documentClassification(text);
      
      // Use safe extractors to guarantee proper types
      // These methods are guaranteed to return the correct types
      const extractedLabel = safeExtractors.extractLabel(mockResult, 'unknown');
      const extractedConfidence = safeExtractors.extractConfidence(mockResult, 0.5);

      // Construct the result object with explicit type satisfaction
      const result: TextClassificationResult = {
        label: extractedLabel,     // Now guaranteed to be string
        score: extractedConfidence  // Now guaranteed to be number in valid range
      };

      return result;
    }, 'classification');
  }

  /**
   * Generic text classification with candidate labels
   * Ensures type safety for all possible return values
   */
  async classifyText(text: string, candidateLabels: string[]): Promise<TextClassificationResult> {
    return this.simulateApiCall(() => {
      // Handle edge cases with proper typing
      if (!candidateLabels || candidateLabels.length === 0) {
        return {
          label: 'unknown',
          score: 0.1
        };
      }
      
      // Pick a random label from candidates with varying confidence
      const randomIndex = Math.floor(Math.random() * candidateLabels.length);
      const selectedLabel = candidateLabels[randomIndex];
      const confidence = 0.6 + Math.random() * 0.35; // 0.6 to 0.95
      
      return {
        label: selectedLabel, // Guaranteed to be string from candidateLabels
        score: Math.min(confidence, 0.95)
      };
    }, 'classification');
  }

  /**
   * Analyzes property review sentiment with intelligent keyword detection
   * Enhanced with more sophisticated sentiment analysis logic
   */
  async analyzePropertyReviewSentiment(review: string): Promise<TextClassificationResult> {
    return this.simulateApiCall(() => {
      // Enhanced sentiment analysis with more comprehensive word lists
      const positiveWords = [
        'excellent', 'great', 'good', 'amazing', 'perfect', 'recommended',
        'wonderful', 'fantastic', 'outstanding', 'superb', 'brilliant',
        'love', 'satisfied', 'pleased', 'happy', 'delighted', 'impressive',
        'quality', 'professional', 'reliable', 'trustworthy', 'efficient'
      ];
      
      const negativeWords = [
        'terrible', 'bad', 'awful', 'disappointing', 'worst', 'horrible',
        'disgusting', 'unacceptable', 'frustrated', 'angry', 'hate',
        'poor', 'inadequate', 'unsatisfied', 'regret', 'waste', 'scam',
        'unprofessional', 'unreliable', 'delayed', 'overpriced', 'rude'
      ];
      
      const lowerReview = review.toLowerCase();
      
      // More sophisticated scoring that considers word frequency and position
      const positiveMatches = positiveWords.filter(word => lowerReview.includes(word));
      const negativeMatches = negativeWords.filter(word => lowerReview.includes(word));
      
      const positiveScore = positiveMatches.length;
      const negativeScore = negativeMatches.length;
      
      // Determine sentiment with explicit typing
      let label: string;
      let confidence: number;
      
      if (positiveScore > negativeScore) {
        label = 'LABEL_2'; // Positive
        confidence = Math.min(0.75 + (positiveScore * 0.05), 0.95);
      } else if (negativeScore > positiveScore) {
        label = 'LABEL_0'; // Negative  
        confidence = Math.min(0.75 + (negativeScore * 0.05), 0.95);
      } else {
        label = 'LABEL_1'; // Neutral
        confidence = 0.65;
      }
      
      return { 
        label, 
        score: confidence 
      };
    }, 'sentiment');
  }

  /**
   * Translates text with proper language validation
   */
  async translateText(
    text: string,
    targetLanguage: string = 'en',
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    return this.simulateApiCall(() => {
      const mockResult = mockAIResponses.translation(text, targetLanguage);
      
      const translatedText = safeExtractors.extractTranslatedText(mockResult, text);
      const confidence = safeExtractors.extractConfidence(mockResult, 0.85);
      
      return {
        translation_text: translatedText,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
        confidence
      };
    }, 'translation');
  }

  /**
   * Extracts property information with guaranteed answer format
   */
  async extractPropertyInfo(
    propertyDescription: string,
    question: string
  ): Promise<{ answer: string; confidence: number }> {
    return this.simulateApiCall(() => {
      const result = mockAIResponses.questionAnswering(propertyDescription, question);
      
      // Handle different response formats from mock data
      if (typeof result === 'object' && result !== null) {
        const obj = result as Record<string, unknown>;
        
        // Modern format with 'answer' property
        if ('answer' in obj && typeof obj.answer === 'string') {
          return {
            answer: obj.answer,
            confidence: safeExtractors.extractConfidence(obj.confidence, 0.7)
          };
        }
        
        // Legacy format with 'a' property
        if ('a' in obj && typeof obj.a === 'string') {
          return {
            answer: obj.a,
            confidence: safeExtractors.extractConfidence(obj.confidence, 0.7)
          };
        }
      }
      
      // Fallback for unexpected formats
      return {
        answer: 'Information not available',
        confidence: 0.1
      };
    }, 'qa');
  }

  /**
   * Summarizes property documents with guaranteed string return
   */
  async summarizePropertyDocument(text: string): Promise<string> {
    return this.simulateApiCall(() => {
      const result = mockAIResponses.summarization(text);
      
      // Handle case where result is already a string
      if (typeof result === 'string') {
        return result;
      }
      
      // Handle object results with various summary property names
      if (typeof result === 'object' && result !== null) {
        const obj = result as Record<string, unknown>;
        
        const summaryKeys = ['summary', 'text', 'content', 'summaryText', 'output'];
        for (const key of summaryKeys) {
          if (key in obj && typeof obj[key] === 'string') {
            return obj[key] as string;
          }
        }
      }
      
      // Ultimate fallback
      return 'Summary not available';
    }, 'summary');
  }

  /**
   * Detects fraud indicators with strict type compliance
   */
  async detectFraudIndicators(documentText: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    indicators: string[];
    confidence: number;
  }> {
    return this.simulateApiCall(() => {
      const result = mockAIResponses.fraudDetection(documentText);
      
      // Ensure proper risk level typing with validation
      const validRiskLevels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      const resultRiskLevel = typeof result === 'object' && result !== null ? 
        (result as Record<string, unknown>).riskLevel : undefined;
      
      const riskLevel = validRiskLevels.includes(resultRiskLevel as any) 
        ? (resultRiskLevel as 'low' | 'medium' | 'high')
        : 'medium'; // Safe default
      
      // Extract and filter indicators safely
      const rawIndicators = typeof result === 'object' && result !== null ? 
        (result as Record<string, unknown>).indicators : [];
      
      const indicators = Array.isArray(rawIndicators) 
        ? rawIndicators.filter((indicator): indicator is string => 
            typeof indicator === 'string' && indicator.trim().length > 0
          )
        : [];
      
      const confidence = safeExtractors.extractConfidence(
        typeof result === 'object' && result !== null ? 
          (result as Record<string, unknown>).confidence : undefined,
        0.5
      );
      
      return {
        riskLevel,
        indicators,
        confidence
      };
    }, 'fraud');
  }

  /**
   * Utility method for testing error simulation
   */
  async testErrorSimulation(processingType: string = 'test'): Promise<boolean> {
    try {
      await this.simulateApiCall(() => true, processingType);
      return true;
    } catch (error) {
      return (error as MockApiError).isSimulated === true;
    }
  }
}

// Export mock instance with default configuration
export const mockHuggingFaceClient = new MockHuggingFaceApiClient();

// Export utility functions for testing with enhanced type safety
export const mockLandVerificationAI = {
  /**
   * Analyze property documents with type-safe wrapper
   */
  async analyzePropertyDocument(
    imageBase64: string, 
    documentType?: 'deed' | 'survey' | 'permit' | 'contract'
  ): Promise<DocumentAnalysisResult> {
    return mockHuggingFaceClient.analyzePropertyDocument(imageBase64, documentType);
  },

  /**
   * Analyze land images with validation
   */
  async analyzeLandImage(imageBase64: string): Promise<ImageAnalysisResult> {
    if (!imageBase64) {
      throw new Error('Image data is required');
    }
    return mockHuggingFaceClient.analyzeLandImage(imageBase64);
  },

  /**
   * Classify legal documents with input validation
   */
  async classifyLegalDocument(text: string): Promise<TextClassificationResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Document text is required');
    }
    return mockHuggingFaceClient.classifyLegalDocument(text);
  },

  /**
   * Analyze property reviews with sentiment analysis
   */
  async analyzePropertyReview(review: string): Promise<TextClassificationResult> {
    return mockHuggingFaceClient.analyzePropertyReviewSentiment(review);
  },

  /**
   * Translate property descriptions with language validation
   */
  async translatePropertyDescription(
    text: string, 
    targetLanguage: string
  ): Promise<TranslationResult> {
    return mockHuggingFaceClient.translateText(text, targetLanguage);
  },

  /**
   * Extract property details with Q&A functionality
   */
  async extractPropertyDetails(
    description: string, 
    question: string
  ): Promise<{ answer: string; confidence: number }> {
    return mockHuggingFaceClient.extractPropertyInfo(description, question);
  },

  /**
   * Summarize documents with guaranteed string output
   */
  async summarizeDocument(text: string): Promise<string> {
    return mockHuggingFaceClient.summarizePropertyDocument(text);
  },

  /**
   * Check document authenticity with fraud detection
   */
  async checkDocumentAuthenticity(text: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    indicators: string[];
    confidence: number;
  }> {
    return mockHuggingFaceClient.detectFraudIndicators(text);
  },
} as const;

// Export sample data for easy testing
export { sampleTestData } from './mock-ai-data'

// Export types for consumers
export type { MockClientConfig, MockApiError };
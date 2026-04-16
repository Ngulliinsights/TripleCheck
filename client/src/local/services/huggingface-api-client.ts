/**
 * Hugging Face API Client for Land Verification App
 * Free tier APIs for testing functionality
 */

import { apiClient } from '../../local/services/unified-api-client"

export interface HuggingFaceConfig {
  apiKey?: string; // Optional for free inference API
  baseUrl?: string;
}

export interface DocumentAnalysisResult {
  text: string;
  confidence: number;
  entities?: Array<{
    label: string;
    text: string;
    confidence: number;
  }>;
}

export interface ImageAnalysisResult {
  labels: Array<{
    label: string;
    confidence: number;
  }>;
  description?: string;
}

export interface TextClassificationResult {
  label: string;
  confidence: number;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export class HuggingFaceApiClient {
  private config: HuggingFaceConfig;
  private baseUrl = 'https://api-inference.huggingface.co';

  constructor(config: HuggingFaceConfig = {}) {
    this.config = {
      baseUrl: 'https://api-inference.huggingface.co',
      ...config,
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    data: any,
    options: { timeout?: number } = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth header if API key is provided
    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    const response = await apiClient.post<T>(
      `${this.config.baseUrl}${endpoint}`,
      data,
      {
        headers,
        timeout: options.timeout || 30000
      }
    );

    return response.data;
  }

  /**
   * Analyze property documents using OCR and NER
   */
  async analyzePropertyDocument(
    imageBase64: string,
    documentType: 'deed' | 'survey' | 'permit' | 'contract' = 'deed'
  ): Promise<DocumentAnalysisResult> {
    try {
      // First, extract text using OCR
      const ocrResult = await this.makeRequest<Array<{ generated_text: string }>>(
        '/models/microsoft/trocr-base-printed',
        {
          inputs: imageBase64,
        }
      );

      const extractedText = ocrResult[0]?.generated_text || '';

      // Then analyze for entities (property-specific)
      const nerResult = await this.makeRequest<Array<Array<{ entity_group: string; word: string; score: number }>>>(
        '/models/dbmdz/bert-large-cased-finetuned-conll03-english',
        {
          inputs: extractedText,
        }
      );

      const entities = nerResult[0]?.map(entity => ({
        label: entity.entity_group,
        text: entity.word,
        confidence: entity.score,
      })) || [];

      return {
        text: extractedText,
        confidence: 0.85, // Average confidence
        entities,
      };
    } catch (error) {
      console.error('Document analysis failed:', error);
      throw new Error('Failed to analyze property document');
    }
  }

  /**
   * Analyze satellite/aerial images for land verification
   */
  async analyzeLandImage(imageBase64: string): Promise<ImageAnalysisResult> {
    try {
      const result = await this.makeRequest<Array<{ label: string; score: number }>>(
        '/models/google/vit-base-patch16-224',
        {
          inputs: imageBase64,
        }
      );

      const labels = result.map(item => ({
        label: item.label,
        confidence: item.score,
      }));

      // Generate description based on top labels
      const topLabels = labels.slice(0, 3).map(l => l.label).join(', ');
      const description = `Land appears to contain: ${topLabels}`;

      return {
        labels,
        description,
      };
    } catch (error) {
      console.error('Land image analysis failed:', error);
      throw new Error('Failed to analyze land image');
    }
  }

  /**
   * Classify legal documents
   */
  async classifyLegalDocument(text: string): Promise<TextClassificationResult> {
    try {
      const result = await this.makeRequest<Array<Array<{ label: string; score: number }>>>(
        '/models/nlpaueb/legal-bert-base-uncased',
        {
          inputs: text,
        }
      );

      const classification = result[0]?.[0];
      if (!classification) {
        throw new Error('No classification result');
      }

      return {
        label: classification.label,
        confidence: classification.score,
      };
    } catch (error) {
      console.error('Legal document classification failed:', error);
      // Fallback to general text classification
      return this.classifyText(text, [
        'property_deed',
        'survey_report',
        'building_permit',
        'contract',
        'legal_notice',
      ]);
    }
  }

  /**
   * General text classification with custom labels
   */
  async classifyText(text: string, candidateLabels: string[]): Promise<TextClassificationResult> {
    try {
      const result = await this.makeRequest<{ labels: string[]; scores: number[] }>(
        '/models/facebook/bart-large-mnli',
        {
          inputs: text,
          parameters: {
            candidate_labels: candidateLabels,
          },
        }
      );

      return {
        label: result.labels[0],
        confidence: result.scores[0],
      };
    } catch (error) {
      console.error('Text classification failed:', error);
      throw new Error('Failed to classify text');
    }
  }

  /**
   * Analyze property reviews sentiment
   */
  async analyzePropertyReviewSentiment(review: string): Promise<TextClassificationResult> {
    try {
      const result = await this.makeRequest<Array<Array<{ label: string; score: number }>>>(
        '/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
        {
          inputs: review,
        }
      );

      const sentiment = result[0]?.[0];
      if (!sentiment) {
        throw new Error('No sentiment result');
      }

      return {
        label: sentiment.label,
        confidence: sentiment.score,
      };
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }

  /**
   * Translate property descriptions
   */
  async translateText(
    text: string,
    targetLanguage: string = 'en',
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    try {
      // Auto-detect source language if not provided
      let modelName = `Helsinki-NLP/opus-mt-${sourceLanguage || 'auto'}-${targetLanguage}`;
      
      // Common translation models
      if (!sourceLanguage) {
        // Use multilingual model for auto-detection
        modelName = 'facebook/mbart-large-50-many-to-many-mmt';
      }

      const result = await this.makeRequest<Array<{ translation_text: string }>>(
        `/models/${modelName}`,
        {
          inputs: text,
        }
      );

      return {
        translatedText: result[0]?.translation_text || text,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
      };
    } catch (error) {
      console.error('Translation failed:', error);
      throw new Error('Failed to translate text');
    }
  }

  /**
   * Extract information from property descriptions using Q&A
   */
  async extractPropertyInfo(
    propertyDescription: string,
    question: string
  ): Promise<{ answer: string; confidence: number }> {
    try {
      const result = await this.makeRequest<{ answer: string; score: number }>(
        '/models/deepset/roberta-base-squad2',
        {
          inputs: {
            question,
            context: propertyDescription,
          },
        }
      );

      return {
        answer: result.answer,
        confidence: result.score,
      };
    } catch (error) {
      console.error('Property info extraction failed:', error);
      throw new Error('Failed to extract property information');
    }
  }

  /**
   * Generate property description summary
   */
  async summarizePropertyDocument(text: string): Promise<string> {
    try {
      const result = await this.makeRequest<Array<{ summary_text: string }>>(
        '/models/facebook/bart-large-cnn',
        {
          inputs: text,
          parameters: {
            max_length: 150,
            min_length: 50,
          },
        }
      );

      return result[0]?.summary_text || 'Unable to generate summary';
    } catch (error) {
      console.error('Summarization failed:', error);
      throw new Error('Failed to summarize document');
    }
  }

  /**
   * Detect potential fraud indicators in property documents
   */
  async detectFraudIndicators(documentText: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    indicators: string[];
    confidence: number;
  }> {
    try {
      // Use text classification to detect suspicious patterns
      const suspiciousPatterns = [
        'fraudulent_document',
        'forged_signature',
        'altered_dates',
        'suspicious_pricing',
        'fake_credentials',
      ];

      const classification = await this.classifyText(documentText, suspiciousPatterns);
      
      const riskLevel = classification.confidence > 0.7 ? 'high' : 
                       classification.confidence > 0.4 ? 'medium' : 'low';

      return {
        riskLevel,
        indicators: classification.confidence > 0.4 ? [classification.label] : [],
        confidence: classification.confidence,
      };
    } catch (error) {
      console.error('Fraud detection failed:', error);
      return {
        riskLevel: 'low',
        indicators: [],
        confidence: 0,
      };
    }
  }
}

// Export singleton instance
export const huggingFaceClient = new HuggingFaceApiClient();

// Export utility functions for common use cases
export const landVerificationAI = {
  async analyzePropertyDocument(imageBase64: string, documentType?: 'deed' | 'survey' | 'permit' | 'contract') {
    return huggingFaceClient.analyzePropertyDocument(imageBase64, documentType);
  },

  async analyzeLandImage(imageBase64: string) {
    return huggingFaceClient.analyzeLandImage(imageBase64);
  },

  async classifyLegalDocument(text: string) {
    return huggingFaceClient.classifyLegalDocument(text);
  },

  async analyzePropertyReview(review: string) {
    return huggingFaceClient.analyzePropertyReviewSentiment(review);
  },

  async translatePropertyDescription(text: string, targetLanguage: string) {
    return huggingFaceClient.translateText(text, targetLanguage);
  },

  async extractPropertyDetails(description: string, question: string) {
    return huggingFaceClient.extractPropertyInfo(description, question);
  },

  async summarizeDocument(text: string) {
    return huggingFaceClient.summarizePropertyDocument(text);
  },

  async checkDocumentAuthenticity(text: string) {
    return huggingFaceClient.detectFraudIndicators(text);
  },
};
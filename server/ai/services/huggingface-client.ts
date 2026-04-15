/**
 * HuggingFace API Client v2
 * Uses ResilientHttpClient with circuit breaker and validation
 */

import { z } from 'zod';
import { ResilientHttpClient } from '../../infrastructure/http/resilient-client';
import { logger } from '../../infrastructure/observability/telemetry';

// Response schemas
const DocumentAnalysisSchema = z.array(
  z.object({
    generated_text: z.string(),
  })
);

const ImageAnalysisSchema = z.array(
  z.object({
    label: z.string(),
    score: z.number(),
  })
);

const TextClassificationSchema = z.array(
  z.array(
    z.object({
      label: z.string(),
      score: z.number(),
    })
  )
);

const TranslationSchema = z.array(
  z.object({
    translation_text: z.string(),
  })
);

const QuestionAnswerSchema = z.object({
  answer: z.string(),
  score: z.number(),
  start: z.number().optional(),
  end: z.number().optional(),
});

const SummarizationSchema = z.array(
  z.object({
    summary_text: z.string(),
  })
);

const ZeroShotClassificationSchema = z.object({
  sequence: z.string(),
  labels: z.array(z.string()),
  scores: z.array(z.number()),
});

// Result types
export interface DocumentAnalysisResult {
  text: string;
  confidence: number;
  entities: any[];
}

export interface ImageAnalysisResult {
  labels: Array<{ label: string; confidence: number }>;
  description: string;
}

export interface TextClassificationResult {
  label: string;
  confidence: number;
}

export interface TranslationResult {
  translatedText: string;
}

export interface QuestionAnswerResult {
  answer: string;
  confidence: number;
}

export interface FraudDetectionResult {
  riskLevel: 'low' | 'medium' | 'high';
  indicators: string[];
  confidence: number;
}

export class HuggingFaceClient {
  private client: ResilientHttpClient;

  constructor(apiKey?: string) {
    this.client = new ResilientHttpClient({
      baseURL: 'https://api-inference.huggingface.co',
      timeout: 45000,
      retries: 3,
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      circuitBreakerOptions: {
        timeout: 45000,
        errorThresholdPercentage: 50,
        resetTimeout: 60000,
      },
      cacheOptions: {
        enabled: true,
        ttl: 3600000, // 1 hour
      },
    });

    logger.info('HuggingFace client initialized');
  }

  /**
   * Analyze property document (OCR)
   */
  async analyzePropertyDocument(
    imageBase64: string,
    documentType: 'deed' | 'survey' | 'permit' | 'contract' = 'deed'
  ): Promise<DocumentAnalysisResult> {
    try {
      const response = await this.client.post(
        '/models/microsoft/trocr-base-printed',
        { inputs: imageBase64 },
        {},
        DocumentAnalysisSchema
      );

      if (!response || response.length === 0) {
        throw new Error('Empty response from document analysis');
      }

      return {
        text: response[0].generated_text,
        confidence: 0.85,
        entities: [],
      };
    } catch (error: any) {
      logger.error('Document analysis failed', {
        documentType,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Analyze land image
   */
  async analyzeLandImage(imageBase64: string): Promise<ImageAnalysisResult> {
    try {
      const response = await this.client.post(
        '/models/google/vit-base-patch16-224',
        { inputs: imageBase64 },
        {},
        ImageAnalysisSchema
      );

      const labels = response.map((item) => ({
        label: item.label,
        confidence: item.score,
      }));

      return {
        labels,
        description: `Land appears to contain: ${labels
          .slice(0, 3)
          .map((l) => l.label)
          .join(', ')}`,
      };
    } catch (error: any) {
      logger.error('Image analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Classify legal document
   */
  async classifyLegalDocument(text: string): Promise<TextClassificationResult> {
    try {
      const response = await this.client.post(
        '/models/nlpaueb/legal-bert-base-uncased',
        { inputs: text },
        {},
        TextClassificationSchema
      );

      const top = response[0][0];
      return {
        label: top.label,
        confidence: top.score,
      };
    } catch (error: any) {
      logger.error('Legal document classification failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Analyze property review sentiment
   */
  async analyzePropertyReviewSentiment(
    review: string
  ): Promise<TextClassificationResult> {
    try {
      const response = await this.client.post(
        '/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
        { inputs: review },
        {},
        TextClassificationSchema
      );

      const top = response[0][0];
      return {
        label: top.label,
        confidence: top.score,
      };
    } catch (error: any) {
      logger.error('Sentiment analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Translate text
   */
  async translateText(
    text: string,
    targetLanguage: string = 'en',
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    try {
      const model = sourceLanguage
        ? `Helsinki-NLP/opus-mt-${sourceLanguage}-${targetLanguage}`
        : 'facebook/mbart-large-50-many-to-many-mmt';

      const response = await this.client.post(
        `/models/${model}`,
        { inputs: text },
        {},
        TranslationSchema
      );

      return {
        translatedText: response[0].translation_text,
      };
    } catch (error: any) {
      logger.error('Translation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract property information
   */
  async extractPropertyInfo(
    propertyDescription: string,
    question: string
  ): Promise<QuestionAnswerResult> {
    try {
      const response = await this.client.post(
        '/models/deepset/roberta-base-squad2',
        {
          inputs: {
            question,
            context: propertyDescription,
          },
        },
        {},
        QuestionAnswerSchema
      );

      return {
        answer: response.answer,
        confidence: response.score,
      };
    } catch (error: any) {
      logger.error('Property info extraction failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Summarize property document
   */
  async summarizePropertyDocument(text: string): Promise<string> {
    try {
      const response = await this.client.post(
        '/models/facebook/bart-large-cnn',
        {
          inputs: text,
          parameters: { max_length: 150, min_length: 50 },
        },
        {},
        SummarizationSchema
      );

      return response[0].summary_text;
    } catch (error: any) {
      logger.error('Document summarization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Detect fraud indicators
   */
  async detectFraudIndicators(
    documentText: string
  ): Promise<FraudDetectionResult> {
    try {
      const candidateLabels = [
        'fraudulent_document',
        'forged_signature',
        'altered_dates',
        'suspicious_pricing',
        'fake_credentials',
      ];

      const response = await this.client.post(
        '/models/facebook/bart-large-mnli',
        {
          inputs: documentText,
          parameters: { candidate_labels: candidateLabels },
        },
        {},
        ZeroShotClassificationSchema
      );

      const topLabel = response.labels[0];
      const confidence = response.scores[0];
      const riskLevel: 'low' | 'medium' | 'high' =
        confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low';

      return {
        riskLevel,
        indicators: confidence > 0.4 ? [topLabel] : [],
        confidence,
      };
    } catch (error: any) {
      logger.error('Fraud detection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.client.healthCheck();
  }

  /**
   * Get client statistics
   */
  getStats() {
    return this.client.getStats();
  }
}

// Singleton instance
export const huggingFaceClient = new HuggingFaceClient(
  process.env.HUGGINGFACE_API_KEY
);

// Convenience facade
export const landVerificationAI = {
  analyzePropertyDocument: (imageBase64: string, documentType?: any) =>
    huggingFaceClient.analyzePropertyDocument(imageBase64, documentType),
  analyzeLandImage: (imageBase64: string) =>
    huggingFaceClient.analyzeLandImage(imageBase64),
  classifyLegalDocument: (text: string) =>
    huggingFaceClient.classifyLegalDocument(text),
  analyzePropertyReview: (review: string) =>
    huggingFaceClient.analyzePropertyReviewSentiment(review),
  translatePropertyDescription: (text: string, targetLanguage: string) =>
    huggingFaceClient.translateText(text, targetLanguage),
  extractPropertyDetails: (description: string, question: string) =>
    huggingFaceClient.extractPropertyInfo(description, question),
  summarizeDocument: (text: string) =>
    huggingFaceClient.summarizePropertyDocument(text),
  checkDocumentAuthenticity: (text: string) =>
    huggingFaceClient.detectFraudIndicators(text),
  getHealthStatus: () => huggingFaceClient.healthCheck(),
  getMetrics: () => huggingFaceClient.getStats(),
};

export default huggingFaceClient;

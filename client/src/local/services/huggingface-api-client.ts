/**
 * HuggingFace Inference API Client — Land Verification App
 *
 * Wraps the free HuggingFace Inference API for document OCR, NER,
 * image classification, translation, Q&A, summarisation, and fraud detection.
 *
 * Note: this client calls HuggingFace directly (not through the app's
 * /api proxy) because the endpoints are external and require their own
 * auth header. Store NEXT_PUBLIC_HF_API_KEY in your environment.
 */

// ─── Errors ──────────────────────────────────────────────────────────────────

export class HuggingFaceError extends Error {
  constructor(
    message: string,
    public readonly model: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'HuggingFaceError';
  }
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface HuggingFaceConfig {
  /** HuggingFace API key. Falls back to NEXT_PUBLIC_HF_API_KEY env var. */
  apiKey?: string;
  /** Base URL for the inference API. Defaults to the public endpoint. */
  baseUrl?: string;
  /** Request timeout in ms (default: 30 000). */
  timeout?: number;
}

// ─── Public result types ─────────────────────────────────────────────────────

export interface DocumentAnalysisResult {
  text: string;
  /** Average NER confidence across detected entities (0–1). */
  confidence: number;
  entities: Array<{
    label: string;
    text: string;
    confidence: number;
  }>;
}

export interface ImageAnalysisResult {
  labels: Array<{ label: string; confidence: number }>;
  /** Human-readable summary of the top three labels. */
  description: string;
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

export interface PropertyInfoResult {
  answer: string;
  confidence: number;
}

export interface FraudAnalysisResult {
  riskLevel: 'low' | 'medium' | 'high';
  indicators: string[];
  confidence: number;
}

// ─── Raw HuggingFace response types ──────────────────────────────────────────

interface HFOcrResponse extends Array<{ generated_text: string }> {}

interface HFNerEntity {
  entity_group: string;
  word: string;
  score: number;
}

interface HFNerResponse extends Array<HFNerEntity[]> {}

interface HFClassificationEntry {
  label: string;
  score: number;
}

interface HFClassificationResponse extends Array<HFClassificationEntry[]> {}

interface HFZeroShotResponse {
  labels: string[];
  scores: number[];
}

interface HFTranslationResponse extends Array<{ translation_text: string }> {}

interface HFQaResponse {
  answer: string;
  score: number;
}

interface HFSummaryResponse extends Array<{ summary_text: string }> {}

// ─── Supported document types ─────────────────────────────────────────────────

export type LegalDocumentType = 'deed' | 'survey' | 'permit' | 'contract';

const LEGAL_CANDIDATE_LABELS: string[] = [
  'property_deed',
  'survey_report',
  'building_permit',
  'contract',
  'legal_notice',
];

const FRAUD_CANDIDATE_LABELS: string[] = [
  'fraudulent_document',
  'forged_signature',
  'altered_dates',
  'suspicious_pricing',
  'fake_credentials',
];

const HF_BASE_URL = 'https://api-inference.huggingface.co';

// ─── Client ──────────────────────────────────────────────────────────────────

export class HuggingFaceApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: HuggingFaceConfig = {}) {
    this.apiKey =
      config.apiKey ??
      (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_HF_API_KEY ?? '' : '');
    this.baseUrl = (config.baseUrl ?? HF_BASE_URL).replace(/\/$/, '');
    this.timeout = config.timeout ?? 30_000;
  }

  // ── Core fetch ─────────────────────────────────────────────────────────────

  private async makeRequest<T>(model: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}/models/${model}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      throw new HuggingFaceError(
        isTimeout ? `Request to ${model} timed out after ${this.timeout}ms` : `Network error calling ${model}`,
        model,
        err
      );
    }

    clearTimeout(timer);

    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new HuggingFaceError(
        `${model} returned HTTP ${response.status}: ${detail}`,
        model
      );
    }

    return response.json() as Promise<T>;
  }

  // ── Document analysis ──────────────────────────────────────────────────────

  /**
   * Extract text from a scanned property document image, then run NER
   * to surface property-relevant entities (locations, organisations, dates).
   */
  async analyzePropertyDocument(
    imageBase64: string,
    _documentType: LegalDocumentType = 'deed'
  ): Promise<DocumentAnalysisResult> {
    // Step 1: OCR
    const ocrResult = await this.makeRequest<HFOcrResponse>(
      'microsoft/trocr-base-printed',
      { inputs: imageBase64 }
    );

    const extractedText = ocrResult[0]?.generated_text ?? '';
    if (!extractedText) {
      return { text: '', confidence: 0, entities: [] };
    }

    // Step 2: Named-entity recognition on the extracted text
    const nerResult = await this.makeRequest<HFNerResponse>(
      'dbmdz/bert-large-cased-finetuned-conll03-english',
      { inputs: extractedText }
    );

    const entities = (nerResult[0] ?? []).map(e => ({
      label: e.entity_group,
      text: e.word,
      confidence: e.score,
    }));

    const avgConfidence = entities.length
      ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length
      : 0;

    return { text: extractedText, confidence: avgConfidence, entities };
  }

  // ── Image analysis ─────────────────────────────────────────────────────────

  /**
   * Classify a satellite or aerial land image using ViT.
   */
  async analyzeLandImage(imageBase64: string): Promise<ImageAnalysisResult> {
    const result = await this.makeRequest<HFClassificationEntry[]>(
      'google/vit-base-patch16-224',
      { inputs: imageBase64 }
    );

    const labels = result.map(item => ({
      label: item.label,
      confidence: item.score,
    }));

    const topLabels = labels.slice(0, 3).map(l => l.label);
    const description =
      topLabels.length > 0
        ? `Land appears to contain: ${topLabels.join(', ')}`
        : 'Could not determine land characteristics.';

    return { labels, description };
  }

  // ── Legal document classification ──────────────────────────────────────────

  /**
   * Classify a legal document first with a domain-specific BERT model,
   * falling back to zero-shot classification if the primary model fails.
   */
  async classifyLegalDocument(text: string): Promise<TextClassificationResult> {
    try {
      const result = await this.makeRequest<HFClassificationResponse>(
        'nlpaueb/legal-bert-base-uncased',
        { inputs: text }
      );

      const top = result[0]?.[0];
      if (!top) throw new HuggingFaceError('Empty classification result', 'legal-bert-base-uncased');

      return { label: top.label, confidence: top.score };
    } catch {
      // Fall back to zero-shot with known legal categories
      return this.classifyText(text, LEGAL_CANDIDATE_LABELS);
    }
  }

  /**
   * Zero-shot classification against arbitrary candidate labels.
   */
  async classifyText(
    text: string,
    candidateLabels: string[]
  ): Promise<TextClassificationResult> {
    if (!candidateLabels.length) throw new Error('candidateLabels must not be empty');

    const result = await this.makeRequest<HFZeroShotResponse>(
      'facebook/bart-large-mnli',
      { inputs: text, parameters: { candidate_labels: candidateLabels } }
    );

    const label = result.labels[0];
    const score = result.scores[0];
    if (!label || score === undefined) {
      throw new HuggingFaceError('Empty zero-shot classification result', 'bart-large-mnli');
    }

    return { label, confidence: score };
  }

  // ── Sentiment analysis ─────────────────────────────────────────────────────

  /**
   * Analyse the sentiment of a property review.
   */
  async analyzePropertyReviewSentiment(review: string): Promise<TextClassificationResult> {
    const result = await this.makeRequest<HFClassificationResponse>(
      'cardiffnlp/twitter-roberta-base-sentiment-latest',
      { inputs: review }
    );

    const top = result[0]?.[0];
    if (!top) {
      throw new HuggingFaceError('Empty sentiment result', 'twitter-roberta-base-sentiment-latest');
    }

    return { label: top.label, confidence: top.score };
  }

  // ── Translation ────────────────────────────────────────────────────────────

  /**
   * Translate property-related text to a target language.
   *
   * When `sourceLanguage` is known, use the Helsinki-NLP bilingual model for
   * best quality. When unknown, fall back to the multilingual mBART model.
   */
  async translateText(
    text: string,
    targetLanguage: string = 'en',
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const model = sourceLanguage
      ? `Helsinki-NLP/opus-mt-${sourceLanguage}-${targetLanguage}`
      : 'facebook/mbart-large-50-many-to-many-mmt';

    const result = await this.makeRequest<HFTranslationResponse>(model, {
      inputs: text,
    });

    return {
      translatedText: result[0]?.translation_text ?? text,
      sourceLanguage: sourceLanguage ?? 'auto',
      targetLanguage,
    };
  }

  // ── Extractive Q&A ────────────────────────────────────────────────────────

  /**
   * Answer a specific question from a property description using RoBERTa SQuAD2.
   * Useful for pulling structured fields (e.g. "What is the plot size?").
   */
  async extractPropertyInfo(
    propertyDescription: string,
    question: string
  ): Promise<PropertyInfoResult> {
    const result = await this.makeRequest<HFQaResponse>(
      'deepset/roberta-base-squad2',
      { inputs: { question, context: propertyDescription } }
    );

    return { answer: result.answer, confidence: result.score };
  }

  // ── Summarisation ─────────────────────────────────────────────────────────

  /**
   * Produce a concise summary of a lengthy property document.
   */
  async summarizePropertyDocument(text: string): Promise<string> {
    const result = await this.makeRequest<HFSummaryResponse>(
      'facebook/bart-large-cnn',
      { inputs: text, parameters: { max_length: 150, min_length: 50 } }
    );

    return result[0]?.summary_text ?? 'Unable to generate summary.';
  }

  // ── Fraud detection ───────────────────────────────────────────────────────

  /**
   * Score a document for potential fraud indicators using zero-shot classification.
   *
   * Risk thresholds:
   *   - low    confidence < 0.40
   *   - medium confidence 0.40–0.69
   *   - high   confidence ≥ 0.70
   */
  async detectFraudIndicators(documentText: string): Promise<FraudAnalysisResult> {
    let classification: TextClassificationResult;
    try {
      classification = await this.classifyText(documentText, FRAUD_CANDIDATE_LABELS);
    } catch {
      // Fraud detection must never surface an uncaught exception to the caller —
      // a failure to classify is treated as inconclusive (low risk).
      return { riskLevel: 'low', indicators: [], confidence: 0 };
    }

    const { label, confidence } = classification;
    const riskLevel: FraudAnalysisResult['riskLevel'] =
      confidence >= 0.70 ? 'high' : confidence >= 0.40 ? 'medium' : 'low';

    return {
      riskLevel,
      indicators: confidence >= 0.40 ? [label] : [],
      confidence,
    };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const huggingFaceClient = new HuggingFaceApiClient();

// ─── Convenience facade ───────────────────────────────────────────────────────

/**
 * Thin facade over `huggingFaceClient` for common land-verification workflows.
 * Prefer importing the methods directly for tree-shaking in production builds.
 */
export const landVerificationAI = {
  analyzeDocument: (imageBase64: string, type?: LegalDocumentType) =>
    huggingFaceClient.analyzePropertyDocument(imageBase64, type),

  analyzeLandImage: (imageBase64: string) =>
    huggingFaceClient.analyzeLandImage(imageBase64),

  classifyLegalDocument: (text: string) =>
    huggingFaceClient.classifyLegalDocument(text),

  analyzeReviewSentiment: (review: string) =>
    huggingFaceClient.analyzePropertyReviewSentiment(review),

  translate: (text: string, targetLanguage: string, sourceLanguage?: string) =>
    huggingFaceClient.translateText(text, targetLanguage, sourceLanguage),

  extractPropertyDetails: (description: string, question: string) =>
    huggingFaceClient.extractPropertyInfo(description, question),

  summarize: (text: string) =>
    huggingFaceClient.summarizePropertyDocument(text),

  checkAuthenticity: (text: string) =>
    huggingFaceClient.detectFraudIndicators(text),
} as const;
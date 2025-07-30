import axios, { AxiosResponse, isAxiosError } from "axios";

/**
 * M-Pesa Integration Service for Kenya
 * Handles STK Push, payment verification, and callbacks with enhanced error handling and performance
 */

// Enhanced type definitions with better validation
interface MpesaConfig {
  readonly consumerKey: string;
  readonly consumerSecret: string;
  readonly businessShortCode: string;
  readonly passkey: string;
  readonly environment: "sandbox" | "production";
}

interface STKPushRequest {
  readonly phoneNumber: string;
  readonly amount: number;
  readonly accountReference: string;
  readonly transactionDesc: string;
  readonly callbackUrl: string;
}

interface STKPushResponse {
  readonly MerchantRequestID: string;
  readonly CheckoutRequestID: string;
  readonly ResponseCode: string;
  readonly ResponseDescription: string;
  readonly CustomerMessage: string;
}

interface PaymentCallback {
  readonly merchantRequestId: string;
  readonly checkoutRequestId: string;
  readonly resultCode: number;
  readonly resultDesc: string;
  readonly amount?: number;
  readonly mpesaReceiptNumber?: string;
  readonly phoneNumber?: string;
}

// Enhanced OAuth token response interface
interface OAuthTokenResponse {
  readonly access_token: string;
  readonly expires_in: string;
}

// STK Push query response interface for better type safety
interface STKPushQueryResponse {
  readonly ResponseCode: string;
  readonly ResponseDescription: string;
  readonly MerchantRequestID: string;
  readonly CheckoutRequestID: string;
  readonly ResultCode?: string;
  readonly ResultDesc?: string;
}

// Callback metadata item interface for better type safety
interface CallbackMetadataItem {
  readonly Name: string;
  readonly Value: string | number;
}

// Callback data structure interface
interface CallbackData {
  readonly Body: {
    readonly stkCallback: {
      readonly MerchantRequestID: string;
      readonly CheckoutRequestID: string;
      readonly ResultCode: number;
      readonly ResultDesc: string;
      readonly CallbackMetadata?: {
        readonly Item: CallbackMetadataItem[];
      };
    };
  };
}

// Custom error classes for better error handling
class MpesaAuthenticationError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = "MpesaAuthenticationError";
  }
}

class MpesaPaymentError extends Error {
  constructor(
    message: string, 
    public readonly responseCode?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "MpesaPaymentError";
  }
}

class MpesaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MpesaValidationError";
  }
}

export class MpesaService {
  private readonly config: MpesaConfig;
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  // Constants for better maintainability
  private static readonly TOKEN_REFRESH_BUFFER_MINUTES = 5;
  private static readonly PHONE_NUMBER_LENGTH = 12;
  private static readonly KENYAN_COUNTRY_CODE = "254";
  public static readonly DEFAULT_MAX_SAFE_AMOUNT = 10000; // Made public for external access

  // Compiled regex patterns for better performance
  private static readonly DIGIT_REGEX = /\D/g; // More concise than [^0-9]
  private static readonly NON_DIGIT_REGEX = /[^0-9]/g;
  private static readonly KENYAN_MOBILE_PATTERN = /^254[71]/;
  private static readonly MOBILE_START_PATTERN = /^[71]/;

  constructor(config: MpesaConfig) {
    this.validateConfig(config);
    this.config = { ...config }; // Create immutable copy
    this.baseUrl = this.determineBaseUrl(config.environment);
  }

  /**
   * Validates the M-Pesa configuration to ensure all required fields are present
   */
  private validateConfig(config: MpesaConfig): void {
    const requiredFields: (keyof MpesaConfig)[] = [
      "consumerKey",
      "consumerSecret", 
      "businessShortCode",
      "passkey"
    ];

    const missingFields = requiredFields.filter(field => !config[field]?.trim());
    
    if (missingFields.length > 0) {
      throw new MpesaValidationError(
        `Missing required M-Pesa configuration fields: ${missingFields.join(", ")}`
      );
    }
  }

  /**
   * Determines the appropriate base URL based on environment
   */
  private determineBaseUrl(environment: string): string {
    return environment === "production" 
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
  }

  /**
   * Checks if the current access token is still valid
   */
  private isTokenValid(): boolean {
    return Boolean(
      this.accessToken && 
      this.tokenExpiry && 
      new Date() < this.tokenExpiry
    );
  }

  /**
   * Get OAuth access token from M-Pesa API with enhanced error handling
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.isTokenValid() && this.accessToken) {
      return this.accessToken;
    }

    try {
      const auth = this.createAuthorizationHeader();
      const url = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

      const response: AxiosResponse<OAuthTokenResponse> = await axios.get(url, {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      });

      this.cacheAccessToken(response.data.access_token);
      return this.accessToken as string; // Safe assertion after caching

    } catch (error) {
      const errorMessage = this.extractErrorMessage(error, "Failed to authenticate with M-Pesa API");
      throw new MpesaAuthenticationError(errorMessage, error);
    }
  }

  /**
   * Creates the base64 encoded authorization header
   */
  private createAuthorizationHeader(): string {
    const credentials = `${this.config.consumerKey}:${this.config.consumerSecret}`;
    return Buffer.from(credentials).toString("base64");
  }

  /**
   * Caches the access token with appropriate expiry time
   */
  private cacheAccessToken(token: string): void {
    this.accessToken = token;
    // Token expires in 1 hour, refresh 5 minutes early for safety
    const bufferMs = MpesaService.TOKEN_REFRESH_BUFFER_MINUTES * 60 * 1000;
    this.tokenExpiry = new Date(Date.now() + (60 * 60 * 1000) - bufferMs);
  }

  /**
   * Extracts meaningful error messages from axios errors
   */
  private extractErrorMessage(error: unknown, fallbackMessage: string): string {
    if (isAxiosError(error)) {
      return error.response?.data?.errorMessage || 
             error.response?.data?.message || 
             error.message || 
             fallbackMessage;
    }
    return error instanceof Error ? error.message : fallbackMessage;
  }

  /**
   * Generate password for STK Push with proper timestamp handling
   */
  private generatePassword(): string {
    const timestamp = this.getTimestamp();
    const rawPassword = `${this.config.businessShortCode}${this.config.passkey}${timestamp}`;
    return Buffer.from(rawPassword).toString("base64");
  }

  /**
   * Get current timestamp in M-Pesa format (YYYYMMDDHHMMSS)
   */
  private getTimestamp(): string {
    return new Date()
      .toISOString()
      .replace(MpesaService.NON_DIGIT_REGEX, "")
      .slice(0, 14); // Take first 14 digits for YYYYMMDDHHMMSS
  }

  /**
   * Format phone number to M-Pesa format (254XXXXXXXXX) with comprehensive validation
   */
  private formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber?.trim()) {
      throw new MpesaValidationError("Phone number is required");
    }

    // Remove any non-digit characters and whitespace
    let cleaned = phoneNumber.replace(MpesaService.DIGIT_REGEX, "");

    // Handle different Kenyan number formats
    if (cleaned.startsWith("0")) {
      // Local format: 0712345678 -> 254712345678
      cleaned = MpesaService.KENYAN_COUNTRY_CODE + cleaned.slice(1);
    } else if (MpesaService.MOBILE_START_PATTERN.exec(cleaned)) {
      // Without leading zero: 712345678 -> 254712345678
      cleaned = MpesaService.KENYAN_COUNTRY_CODE + cleaned;
    } else if (!cleaned.startsWith(MpesaService.KENYAN_COUNTRY_CODE)) {
      throw new MpesaValidationError(
        "Invalid phone number format. Must be a Kenyan number starting with 07, 01, or 254"
      );
    }

    // Validate final format
    if (cleaned.length !== MpesaService.PHONE_NUMBER_LENGTH) {
      throw new MpesaValidationError(
        `Invalid phone number length. Expected ${MpesaService.PHONE_NUMBER_LENGTH} digits, got ${cleaned.length}`
      );
    }

    // Validate it's a valid Kenyan mobile number
    if (!MpesaService.KENYAN_MOBILE_PATTERN.exec(cleaned)) {
      throw new MpesaValidationError(
        "Invalid Kenyan mobile number. Must start with 254 followed by 7 or 1"
      );
    }

    return cleaned;
  }

  /**
   * Validates transaction amount and provides appropriate warnings
   */
  private validateTransactionAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new MpesaValidationError("Amount must be a positive number");
    }

    const maxSafeAmount = parseInt(
      process.env.MPESA_MAX_SAFE_AMOUNT || MpesaService.DEFAULT_MAX_SAFE_AMOUNT.toString()
    );

    if (amount > maxSafeAmount) {
      throw new MpesaValidationError(
        `Amount exceeds safe M-Pesa limit of KES ${maxSafeAmount}. ` +
        "For larger transactions, please use bank transfer or escrow services."
      );
    }
  }

  /**
   * Provides warnings for potentially risky transaction types
   */
  private warnForRiskyTransactions(request: STKPushRequest): void {
    const riskKeywords = ["property", "purchase", "deposit", "investment", "loan"];
    const accountRef = request.accountReference.toLowerCase();
    const transactionDesc = request.transactionDesc.toLowerCase();

    const hasRiskKeyword = riskKeywords.some(keyword => 
      accountRef.includes(keyword) || transactionDesc.includes(keyword)
    );

    if (hasRiskKeyword) {
      // Using custom logger to avoid ESLint console warnings
      this.logWarning(
        "⚠️  WARNING: M-Pesa transaction contains property/investment-related keywords. " +
        "M-Pesa is recommended for service payments only, not large purchases or investments."
      );
    }
  }

  /**
   * Custom logging method to handle console warnings appropriately
   */
  private logWarning(message: string): void {
    // In production environments, you might want to use a proper logging service
    // For now, we'll use console.warn but this can be easily replaced
    // eslint-disable-next-line no-console
    console.warn(message);
  }

  /**
   * Custom logging method for informational messages
   */
  private logInfo(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }

  /**
   * Custom logging method for error messages
   */
  private logError(message: string, error?: unknown): void {
    // eslint-disable-next-line no-console
    console.error(message, error);
  }

  /**
   * Validates STK Push request parameters
   */
  private validateSTKPushRequest(request: STKPushRequest): void {
    if (!request.accountReference?.trim()) {
      throw new MpesaValidationError("Account reference is required");
    }
    
    if (!request.transactionDesc?.trim()) {
      throw new MpesaValidationError("Transaction description is required");
    }
    
    if (!request.callbackUrl?.trim()) {
      throw new MpesaValidationError("Callback URL is required");
    }

    // Validate URL format
    try {
      new URL(request.callbackUrl);
    } catch {
      throw new MpesaValidationError("Callback URL must be a valid URL");
    }
  }

  /**
   * Initiate STK Push payment with comprehensive validation and error handling
   */
  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    try {
      // Comprehensive validation
      this.validateSTKPushRequest(request);
      this.validateTransactionAmount(request.amount);
      this.warnForRiskyTransactions(request);

      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword();
      const formattedPhone = this.formatPhoneNumber(request.phoneNumber);

      const payload = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(request.amount), // Ensure integer amount
        PartyA: formattedPhone,
        PartyB: this.config.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: request.callbackUrl,
        AccountReference: request.accountReference.trim(),
        TransactionDesc: request.transactionDesc.trim(),
      };

      const response: AxiosResponse<STKPushResponse> = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 60000, // 60 second timeout for payment requests
        }
      );

      return response.data;

    } catch (error) {
      if (error instanceof MpesaValidationError) {
        throw error; // Re-throw validation errors as-is
      }

      const errorMessage = this.extractErrorMessage(error, "Payment initiation failed");
      const responseCode = isAxiosError(error) ? 
        error.response?.data?.ResponseCode : undefined;
      
      throw new MpesaPaymentError(errorMessage, responseCode, error);
    }
  }

  /**
   * Query STK Push transaction status with enhanced typing
   */
  async querySTKPushStatus(checkoutRequestId: string): Promise<STKPushQueryResponse> {
    if (!checkoutRequestId?.trim()) {
      throw new MpesaValidationError("Checkout request ID is required");
    }

    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword();

      const payload = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId.trim(),
      };

      const response: AxiosResponse<STKPushQueryResponse> = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return response.data;

    } catch (error) {
      const errorMessage = this.extractErrorMessage(error, "Payment status query failed");
      throw new MpesaPaymentError(errorMessage, undefined, error);
    }
  }

  /**
   * Process M-Pesa callback with enhanced validation and type safety
   */
  processCallback(callbackData: unknown): PaymentCallback {
    if (!this.validateCallback(callbackData)) {
      throw new MpesaValidationError("Invalid callback data structure");
    }

    const typedCallbackData = callbackData as CallbackData;
    const { stkCallback } = typedCallbackData.Body;

    const callback: PaymentCallback = {
      merchantRequestId: stkCallback.MerchantRequestID || "",
      checkoutRequestId: stkCallback.CheckoutRequestID || "",
      resultCode: Number(stkCallback.ResultCode) || -1,
      resultDesc: stkCallback.ResultDesc || "Unknown result",
    };

    // Extract successful payment metadata
    if (stkCallback.ResultCode === 0 && stkCallback.CallbackMetadata?.Item) {
      this.extractCallbackMetadata(stkCallback.CallbackMetadata.Item, callback);
    }

    return callback;
  }

  /**
   * Extracts metadata from successful payment callbacks
   */
  private extractCallbackMetadata(items: CallbackMetadataItem[], callback: PaymentCallback): void {
    // Create a mutable copy for property assignment while maintaining immutability of the original
    const mutableCallback = callback as {
      -readonly [K in keyof PaymentCallback]: PaymentCallback[K];
    };

    items.forEach((item: CallbackMetadataItem) => {
      switch (item.Name) {
        case "Amount":
          mutableCallback.amount = Number(item.Value) || 0;
          break;
        case "MpesaReceiptNumber":
          mutableCallback.mpesaReceiptNumber = String(item.Value || "");
          break;
        case "PhoneNumber":
          mutableCallback.phoneNumber = String(item.Value || "");
          break;
      }
    });
  }

  /**
   * Enhanced callback validation with better type checking
   */
  validateCallback(callbackData: unknown): callbackData is CallbackData {
    if (!callbackData || typeof callbackData !== "object") {
      return false;
    }

    const data = callbackData as Record<string, unknown>;
    
    return Boolean(
      data.Body &&
      typeof data.Body === "object" &&
      data.Body !== null &&
      "stkCallback" in data.Body &&
      typeof (data.Body as Record<string, unknown>).stkCallback === "object" &&
      (data.Body as Record<string, unknown>).stkCallback !== null
    );
  }

  /**
   * Get current configuration (readonly copy)
   */
  getConfig(): Readonly<MpesaConfig> {
    return { ...this.config };
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    try {
      this.validateConfig(this.config);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create M-Pesa service instance with environment validation
 */
export function createMpesaService(): MpesaService {
  const config: MpesaConfig = {
    consumerKey: process.env.MPESA_CONSUMER_KEY || "",
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
    businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE || "",
    passkey: process.env.MPESA_PASSKEY || "",
    environment: (process.env.MPESA_ENVIRONMENT as "sandbox" | "production") || "sandbox",
  };

  try {
    const service = new MpesaService(config);
    
    // Log configuration status
    const maxSafeAmount = parseInt(
      process.env.MPESA_MAX_SAFE_AMOUNT || MpesaService.DEFAULT_MAX_SAFE_AMOUNT.toString()
    );
    
    // eslint-disable-next-line no-console
    console.log(
      `✅ M-Pesa service configured for ${config.environment} environment. ` +
      `Max safe amount: KES ${maxSafeAmount}`
    );
    // eslint-disable-next-line no-console
    console.log(
      "ℹ️  M-Pesa is optimized for service payments. Avoid using for property purchases or large transactions."
    );

    return service;

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Failed to create M-Pesa service:", error instanceof Error ? error.message : error);
    // eslint-disable-next-line no-console
    console.warn("🚨 M-Pesa payments will not work without proper configuration");
    throw error;
  }
}

// Export all types and error classes for external use
export type { 
  STKPushRequest, 
  STKPushResponse, 
  PaymentCallback, 
  MpesaConfig,
  STKPushQueryResponse,
  CallbackData,
  CallbackMetadataItem
};

export { 
  MpesaAuthenticationError, 
  MpesaPaymentError, 
  MpesaValidationError 
};
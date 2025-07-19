import axios from 'axios';
import { createHash } from 'crypto';

/**
 * M-Pesa Integration Service for Kenya
 * Handles STK Push, payment verification, and callbacks
 */

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  passkey: string;
  environment: 'sandbox' | 'production';
}

interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface PaymentCallback {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  phoneNumber?: string;
}

export class MpesaService {
  private config: MpesaConfig;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: MpesaConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  /**
   * Get OAuth access token from M-Pesa API
   */
  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
      
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = response.data.access_token;
      // Token expires in 1 hour, refresh 5 minutes early
      this.tokenExpiry = new Date(Date.now() + (55 * 60 * 1000));
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get M-Pesa access token:', error);
      throw new Error('Failed to authenticate with M-Pesa API');
    }
  }

  /**
   * Generate password for STK Push
   */
  private generatePassword(): string {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${this.config.businessShortCode}${this.config.passkey}${timestamp}`).toString('base64');
    return password;
  }

  /**
   * Get current timestamp in M-Pesa format
   */
  private getTimestamp(): string {
    return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  }

  /**
   * Format phone number to M-Pesa format (254XXXXXXXXX)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    } else if (!cleaned.startsWith('254')) {
      throw new Error('Invalid phone number format. Must be a Kenyan number.');
    }
    
    // Validate length
    if (cleaned.length !== 12) {
      throw new Error('Invalid phone number length. Must be 12 digits including country code.');
    }
    
    return cleaned;
  }

  /**
   * Initiate STK Push payment
   */
  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword();
      const formattedPhone = this.formatPhoneNumber(request.phoneNumber);

      const payload = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(request.amount), // Ensure integer
        PartyA: formattedPhone,
        PartyB: this.config.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: request.callbackUrl,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('STK Push failed:', error.response?.data || error.message);
      throw new Error(`Payment initiation failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  /**
   * Query STK Push transaction status
   */
  async querySTKPushStatus(checkoutRequestId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword();

      const payload = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('STK Push query failed:', error.response?.data || error.message);
      throw new Error(`Payment status query failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  /**
   * Process M-Pesa callback
   */
  processCallback(callbackData: any): PaymentCallback {
    const { Body } = callbackData;
    const { stkCallback } = Body;

    const callback: PaymentCallback = {
      merchantRequestId: stkCallback.MerchantRequestID,
      checkoutRequestId: stkCallback.CheckoutRequestID,
      resultCode: stkCallback.ResultCode,
      resultDesc: stkCallback.ResultDesc
    };

    // If payment was successful, extract additional details
    if (stkCallback.ResultCode === 0 && stkCallback.CallbackMetadata) {
      const metadata = stkCallback.CallbackMetadata.Item;
      
      metadata.forEach((item: any) => {
        switch (item.Name) {
          case 'Amount':
            callback.amount = item.Value;
            break;
          case 'MpesaReceiptNumber':
            callback.mpesaReceiptNumber = item.Value;
            break;
          case 'PhoneNumber':
            callback.phoneNumber = item.Value;
            break;
        }
      });
    }

    return callback;
  }

  /**
   * Validate callback authenticity (implement based on your security requirements)
   */
  validateCallback(callbackData: any, signature?: string): boolean {
    // Implement signature validation if M-Pesa provides it
    // For now, basic validation
    return callbackData && callbackData.Body && callbackData.Body.stkCallback;
  }
}

// Factory function to create M-Pesa service instance
export function createMpesaService(): MpesaService {
  const config: MpesaConfig = {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    businessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE || '',
    passkey: process.env.MPESA_PASSKEY || '',
    environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
  };

  // Validate required configuration
  const requiredFields = ['consumerKey', 'consumerSecret', 'businessShortCode', 'passkey'];
  const missingFields = requiredFields.filter(field => !config[field as keyof MpesaConfig]);
  
  if (missingFields.length > 0) {
    console.warn(`M-Pesa configuration missing: ${missingFields.join(', ')}`);
    console.warn('M-Pesa payments will not work without proper configuration');
  }

  return new MpesaService(config);
}

// Export types for use in other modules
export type { STKPushRequest, STKPushResponse, PaymentCallback, MpesaConfig };
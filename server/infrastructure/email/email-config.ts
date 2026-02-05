// Email service configuration for TripleCheck
import { EmailServiceConfig } from '../../shared/email-types';

// Default configuration - uses mock service for demo
export const DEFAULT_EMAIL_CONFIG: EmailServiceConfig = {
  provider: 'mock',
  settings: {
    maxMessages: 100,
    syncInterval: 5 * 60 * 1000, // 5 minutes
    autoMarkAsRead: false
  }
};

// Environment-based configuration
export function getEmailConfig(): EmailServiceConfig {
  const provider = (process.env.EMAIL_PROVIDER as EmailServiceConfig['provider']) || 'mock';
  
  const config: EmailServiceConfig = {
    provider,
    settings: {
      maxMessages: parseInt(process.env.EMAIL_MAX_MESSAGES || '100'),
      syncInterval: parseInt(process.env.EMAIL_SYNC_INTERVAL || '300000'), // 5 minutes
      autoMarkAsRead: process.env.EMAIL_AUTO_MARK_READ === 'true'
    }
  };

  // Add provider-specific credentials based on environment
  switch (provider) {
    case 'gmail':
      config.credentials = {
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: process.env.GMAIL_ACCESS_TOKEN
      };
      break;
      
    case 'outlook':
      config.credentials = {
        clientId: process.env.OUTLOOK_CLIENT_ID,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        tenantId: process.env.OUTLOOK_TENANT_ID,
        refreshToken: process.env.OUTLOOK_REFRESH_TOKEN,
        accessToken: process.env.OUTLOOK_ACCESS_TOKEN
      };
      break;
      
    case 'sendgrid':
      config.credentials = {
        apiKey: process.env.SENDGRID_API_KEY
      };
      break;
      
    case 'mock':
    default:
      // No credentials needed for mock service
      break;
  }

  return config;
}

// Configuration validation
export function validateEmailConfig(config: EmailServiceConfig): string[] {
  const errors: string[] = [];

  if (!config.provider) {
    errors.push('Email provider is required');
  }

  switch (config.provider) {
    case 'gmail':
      if (!config.credentials?.clientId) errors.push('Gmail client ID is required');
      if (!config.credentials?.clientSecret) errors.push('Gmail client secret is required');
      break;
      
    case 'outlook':
      if (!config.credentials?.clientId) errors.push('Outlook client ID is required');
      if (!config.credentials?.clientSecret) errors.push('Outlook client secret is required');
      if (!config.credentials?.tenantId) errors.push('Outlook tenant ID is required');
      break;
      
    case 'sendgrid':
      if (!config.credentials?.apiKey) errors.push('SendGrid API key is required');
      break;
      
    case 'mock':
      // No validation needed for mock service
      break;
      
    default:
      errors.push(`Unsupported email provider: ${config.provider}`);
  }

  return errors;
}
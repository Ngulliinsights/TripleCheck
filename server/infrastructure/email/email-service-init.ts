import { EmailServiceFactory, EmailService } from '../../services/email-service';
import { EmailServiceConfig } from '../../shared/email-types';

// Initialize email service with environment-based configuration
export async function initializeEmailService(): Promise<EmailService> {
  const config: EmailServiceConfig = {
    provider: (process.env.EMAIL_PROVIDER as any) || 'smtp',
    
    // SMTP Configuration
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASS,
    
    // SendGrid Configuration
    sendGridApiKey: process.env.SENDGRID_API_KEY,
    
    // Common Configuration
    fromEmail: process.env.FROM_EMAIL || 'noreply@triplecheck.co.ke',
    fromName: process.env.FROM_NAME || 'TripleCheck Kenya',
    
    settings: {
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 10,
    },
  };

  try {
    // Use smart factory to get best available service
    const emailService = await EmailServiceFactory.createBestAvailableService(config);
    
    console.log('✅ Email service initialized successfully');
    return emailService;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    
    // Fallback to mock service
    const mockService = EmailServiceFactory.createService('mock');
    await mockService.initialize(config);
    console.warn('⚠️  Using mock email service as fallback');
    
    return mockService;
  }
}

// Global email service instance
let emailServiceInstance: EmailService | null = null;

export async function getEmailService(): Promise<EmailService> {
  if (!emailServiceInstance) {
    emailServiceInstance = await initializeEmailService();
  }
  return emailServiceInstance;
}

// Email service health check
export async function checkEmailServiceHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  provider: string;
  connected: boolean;
  fallbackMode?: boolean;
  queuedEmails?: number;
  lastError?: string;
}> {
  try {
    const service = await getEmailService();
    const status = await service.getStatus();
    
    // Check if service has fallback capabilities
    const fallbackMode = (service as any).isInFallbackMode?.() || false;
    const queuedEmails = (service as any).getFallbackEmailCount?.() || 0;
    
    return {
      status: status.connected ? 'healthy' : (fallbackMode ? 'degraded' : 'unhealthy'),
      provider: process.env.EMAIL_PROVIDER || 'smtp',
      connected: status.connected,
      fallbackMode,
      queuedEmails,
      lastError: status.error,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      provider: 'unknown',
      connected: false,
      lastError: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Send queued emails (useful for cron jobs or manual triggers)
export async function sendQueuedEmails(): Promise<void> {
  try {
    const service = await getEmailService();
    
    if ((service as any).sendQueuedEmails) {
      await (service as any).sendQueuedEmails();
      console.log('✅ Queued emails sent successfully');
    }
  } catch (error) {
    console.error('❌ Failed to send queued emails:', error);
  }
}
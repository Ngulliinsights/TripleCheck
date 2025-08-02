import nodemailer from 'nodemailer';
import { logger } from '../monitoring/logger';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  fallbackUsed?: boolean;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;
  private fallbackMode: boolean = false;
  private fallbackEmails: EmailMessage[] = [];

  constructor(config: EmailConfig) {
    this.config = config;
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Test if we have real SMTP credentials
      if (this.config.auth.user === 'your-email@gmail.com' || 
          !this.config.auth.user || 
          !this.config.auth.pass) {
        logger.warn('Email service running in fallback mode - no real SMTP credentials');
        this.fallbackMode = true;
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
      });

      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
      this.fallbackMode = false;
    } catch (error) {
      logger.warn('Email service falling back to mock mode', { error });
      this.fallbackMode = true;
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    try {
      if (this.fallbackMode || !this.transporter) {
        return this.handleFallback(message);
      }

      const result = await this.transporter.sendMail({
        from: `"${this.config.from.name}" <${this.config.from.email}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments,
      });

      logger.info('Email sent successfully', { 
        messageId: result.messageId,
        to: message.to,
        subject: message.subject 
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      logger.error('Failed to send email, using fallback', { error });
      return this.handleFallback(message);
    }
  }

  private handleFallback(message: EmailMessage): EmailResult {
    // Store email for later sending when real service is configured
    this.fallbackEmails.push({
      ...message,
      timestamp: new Date(),
    } as any);

    // Log the email content for development
    logger.info('Email fallback - would send:', {
      to: message.to,
      subject: message.subject,
      preview: message.html.substring(0, 100) + '...',
    });

    // In development, you could also write to a file or database
    if (process.env.NODE_ENV === 'development') {
      console.log(`
📧 EMAIL FALLBACK - Would send email:
To: ${message.to}
Subject: ${message.subject}
Content: ${message.text || message.html.replace(/<[^>]*>/g, '').substring(0, 200)}...
      `);
    }

    return {
      success: true,
      messageId: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fallbackUsed: true,
    };
  }

  // Method to send queued emails when real service becomes available
  async sendQueuedEmails(): Promise<void> {
    if (this.fallbackMode || this.fallbackEmails.length === 0) {
      return;
    }

    logger.info(`Sending ${this.fallbackEmails.length} queued emails`);
    
    for (const email of this.fallbackEmails) {
      try {
        await this.sendEmail(email);
      } catch (error) {
        logger.error('Failed to send queued email', { error });
      }
    }

    this.fallbackEmails = [];
  }

  // Get fallback email count for monitoring
  getFallbackEmailCount(): number {
    return this.fallbackEmails.length;
  }

  // Check if service is in fallback mode
  isInFallbackMode(): boolean {
    return this.fallbackMode;
  }

  // Retry initialization (useful when credentials are updated)
  async retryInitialization(): Promise<boolean> {
    await this.initializeTransporter();
    return !this.fallbackMode;
  }
}

// Email Templates
export class EmailTemplates {
  static welcomeEmail(userName: string, loginUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to TripleCheck Kenya</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #14B8A6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #14B8A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to TripleCheck Kenya!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Welcome to Kenya's most trusted land verification platform. We're excited to help you make secure property decisions.</p>
            <p>Your account has been created successfully. You can now:</p>
            <ul>
              <li>Browse verified properties across Kenya</li>
              <li>Start land verification processes</li>
              <li>Connect with verified experts</li>
              <li>Access our fraud detection tools</li>
            </ul>
            <a href="${loginUrl}" class="button">Access Your Account</a>
            <p>If you have any questions, our support team is here to help.</p>
          </div>
          <div class="footer">
            <p>© 2025 TripleCheck Kenya. Securing land transactions across Kenya.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static passwordResetEmail(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - TripleCheck Kenya</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #14B8A6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #14B8A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset your password for your TripleCheck Kenya account.</p>
            <a href="${resetUrl}" class="button">Reset Your Password</a>
            <div class="warning">
              <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
            </div>
            <p>For security reasons, we recommend using a strong password that includes:</p>
            <ul>
              <li>At least 8 characters</li>
              <li>A mix of uppercase and lowercase letters</li>
              <li>Numbers and special characters</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2025 TripleCheck Kenya. This email was sent to ${userName}.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static propertyInquiryEmail(propertyTitle: string, inquirerName: string, message: string, contactInfo: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Property Inquiry - ${propertyTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #14B8A6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .inquiry-box { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Property Inquiry</h1>
          </div>
          <div class="content">
            <h2>Property: ${propertyTitle}</h2>
            <div class="inquiry-box">
              <h3>Inquiry Details:</h3>
              <p><strong>From:</strong> ${inquirerName}</p>
              <p><strong>Contact:</strong> ${contactInfo}</p>
              <p><strong>Message:</strong></p>
              <p>${message}</p>
            </div>
            <p>Please respond to this inquiry promptly to maintain good customer service.</p>
          </div>
          <div class="footer">
            <p>© 2025 TripleCheck Kenya. Property inquiry notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static verificationStatusEmail(userName: string, propertyTitle: string, status: string, details: string): string {
    const statusColor = status === 'completed' ? '#10B981' : status === 'failed' ? '#EF4444' : '#F59E0B';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verification Update - ${propertyTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #14B8A6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-box { background: white; border-left: 4px solid ${statusColor}; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; background: #14B8A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Land Verification Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We have an update on your land verification for:</p>
            <h3>${propertyTitle}</h3>
            <div class="status-box">
              <h4>Status: ${status.toUpperCase()}</h4>
              <p>${details}</p>
            </div>
            <a href="${process.env.FRONTEND_URL}/dashboard/verifications" class="button">View Full Report</a>
          </div>
          <div class="footer">
            <p>© 2025 TripleCheck Kenya. Land verification update.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Initialize email service
const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
  from: {
    name: process.env.FROM_NAME || 'TripleCheck Kenya',
    email: process.env.FROM_EMAIL || 'noreply@triplecheck.co.ke',
  },
};

export const emailService = new EmailService(emailConfig);
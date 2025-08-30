// email-service.merged.ts
// Production-grade email service for TripleCheck: multi-provider with intelligent fallback,
// robust SMTP via Nodemailer, queueing, retry, domain-aware inquiry classification, and templates.

// ---------- Logger (robust fallback if external logger isn't available) ----------
type LogFn = (msg: string, meta?: Record<string, unknown>) => void;
interface Logger {
  info: LogFn; warn: LogFn; error: LogFn; debug: LogFn;
}

// Try to import your project's logger; fall back to console with consistent API
let logger: Logger = {
  info: (m, meta) => console.log(m, meta ?? ''),
  warn: (m, meta) => console.warn(m, meta ?? ''),
  error: (m, meta) => console.error(m, meta ?? ''),
  debug: (m, meta) => console.debug(m, meta ?? ''),
};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maybe = require('../monitoring/logger');
  if (maybe?.logger) logger = maybe.logger as Logger;
} catch { /* noop; fallback logger already set */ }

// ---------- Shared Types ----------
export type EmailProvider = 'mock' | 'smtp' | 'sendgrid' | 'gmail' | 'outlook';

export interface EmailServiceConfig {
  provider: EmailProvider;
  // SMTP specifics (used when provider==='smtp')
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
  settings?: {
    maxRetries?: number;
    retryDelay?: number; // ms
    batchSize?: number;
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

export interface PropertyInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  inquirerName: string;
  inquirerEmail: string;
  inquirerPhone: string;
  message: string;
  timestamp: Date;
  status: 'new' | 'responded';
  priority: 'low' | 'medium' | 'high';
}

export interface EmailInboxMessage {
  id: string;
  threadId?: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  timestamp: Date;
  isRead?: boolean;
  isImportant?: boolean;
  labels?: string[];
}

// ---------- Inquiry Classification ----------
export interface InquiryClassificationResult {
  inquiryType: 'viewing_request' | 'offer' | 'complaint' | 'general_inquiry';
  priority: 'low' | 'medium' | 'high';
  extractedData: {
    senderPhone?: string;
    propertyPrice?: number;
  };
  confidence: number;
}

export class InquiryClassificationService {
  static classify(message: EmailInboxMessage): InquiryClassificationResult {
    const subject = message.subject.toLowerCase();
    const body = message.body.toLowerCase();
    const content = `${subject} ${body}`;

    let inquiryType: InquiryClassificationResult['inquiryType'] = 'general_inquiry';
    let priority: InquiryClassificationResult['priority'] = 'medium';
    let confidence = 0.5;

    if (/\b(viewing|visit|see)\b/.test(content)) {
      inquiryType = 'viewing_request';
      confidence = 0.8;
    } else if (/\b(offer|buy|purchase)\b/.test(content)) {
      inquiryType = 'offer';
      confidence = 0.9;
    } else if (/\b(complaint|problem|issue|discrepanc)/.test(content)) {
      inquiryType = 'complaint';
      confidence = 0.7;
    }

    if (/\b(urgent|asap|immediately)\b/.test(content)) {
      priority = 'high';
    } else if (/\b(when convenient|no rush)\b/.test(content)) {
      priority = 'low';
    }

    const extractedData: InquiryClassificationResult['extractedData'] = {};
    const phoneRegex = /\+254\s?\d{9}|\b\d{10}\b/;
    const phoneMatch = phoneRegex.exec(message.body);
    if (phoneMatch) extractedData.senderPhone = phoneMatch[0];

    const priceRegex = /KES\s?([\d,]+)/i;
    const priceMatch = priceRegex.exec(message.body);
    if (priceMatch?.[1]) {
      extractedData.propertyPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    }

    return { inquiryType, priority, extractedData, confidence };
  }
}

// ---------- Base Interface ----------
export interface EmailService {
  initialize(): Promise<void>;
  getInboxMessages(limit?: number): Promise<EmailInboxMessage[]>;
  sendEmail(message: EmailMessage): Promise<EmailResult>;
  markAsRead(messageId: string): Promise<void>;
  archiveMessage(messageId: string): Promise<void>;
  extractPropertyInquiries?(messages: EmailInboxMessage[]): PropertyInquiry[];
  // health / ops
  sendQueuedEmails?(): Promise<void>;
  getFallbackEmailCount?(): number;
  isInFallbackMode?(): boolean;
  retryInitialization?(): Promise<boolean>;
  getStatus?(): Promise<{ connected: boolean; lastSync?: Date; error?: string }>;
}

// ---------- Utilities ----------
const TRIPLECHECK_EMAIL = 'inquiries@triplecheck.co.ke';

const stripHtml = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

const toArray = (x: string | string[]) => (Array.isArray(x) ? x : [x]);

// ---------- Mock Provider (read-capable for dev/testing) ----------
export class MockEmailService implements EmailService {
  private mockMessages: EmailInboxMessage[] = [];
  private fallbackEmails: EmailMessage[] = [];

  async initialize(): Promise<void> {
    const now = Date.now();
    this.mockMessages = [
      {
        id: '1',
        threadId: 'thread_1',
        from: 'john.kamau@email.com',
        to: [TRIPLECHECK_EMAIL],
        subject: 'Viewing Request - Modern Apartment in Westlands',
        body:
          "Hi, I'm very interested in this property. Could we schedule a viewing this weekend? I'm looking for a 2-bedroom apartment in this area and this seems perfect. What's the earliest availability?",
        timestamp: new Date(now - 2 * 60 * 60 * 1000),
        isRead: false,
        isImportant: false,
        labels: ['inquiry', 'viewing_request'],
      },
      {
        id: '2',
        threadId: 'thread_2',
        from: 'sarah.w@email.com',
        to: [TRIPLECHECK_EMAIL],
        subject: 'Offer - Luxury Villa in Karen',
        body:
          'I would like to make an offer on this property. Is the owner open to negotiations? My budget is around KES 230,000. Please let me know if this is acceptable.',
        timestamp: new Date(now - 5 * 60 * 60 * 1000),
        isRead: true,
        isImportant: false,
        labels: ['inquiry', 'offer'],
      },
      {
        id: '3',
        threadId: 'thread_3',
        from: 'm.ochieng@email.com',
        to: [TRIPLECHECK_EMAIL],
        subject: 'Rental Inquiry - Cozy Studio in Kilimani',
        body:
          "Hello, I'm interested in renting this studio apartment. What are the lease terms and when would it be available? Also, are pets allowed?",
        timestamp: new Date(now - 24 * 60 * 60 * 1000),
        isRead: true,
        isImportant: false,
        labels: ['inquiry', 'rental', 'replied'],
      },
      {
        id: '4',
        threadId: 'thread_4',
        from: 'grace.muthoni@email.com',
        to: [TRIPLECHECK_EMAIL],
        subject: 'Complaint - Photo Discrepancies',
        body:
          'I saw your listing and I am interested. However, I noticed some discrepancies in the photos. Could you provide more recent pictures of the property?',
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
        isRead: true,
        isImportant: false,
        labels: ['inquiry', 'complaint'],
      },
    ];
    logger.info('MockEmailService initialized with seeded inbox');
  }

  async getInboxMessages(limit = 50): Promise<EmailInboxMessage[]> {
    return this.mockMessages.slice(0, limit);
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    // Simulate latency
    await new Promise((r) => setTimeout(r, 200));
    this.fallbackEmails.push(message);
    logger.info('📧 MOCK EMAIL SENT', {
      to: message.to,
      subject: message.subject,
      preview: (message.text ?? stripHtml(message.html)).slice(0, 160),
    });
    return { success: true, messageId: `mock_${Date.now()}`, fallbackUsed: true };
  }

  async markAsRead(messageId: string): Promise<void> {
    const msg = this.mockMessages.find((m) => m.id === messageId);
    if (msg) msg.isRead = true;
  }

  async archiveMessage(messageId: string): Promise<void> {
    const msg = this.mockMessages.find((m) => m.id === messageId);
    if (msg) msg.labels = [...(msg.labels ?? []), 'archived'];
  }

  extractPropertyInquiries(messages: EmailInboxMessage[]): PropertyInquiry[] {
    return messages.map((msg) => {
      const cls = InquiryClassificationService.classify(msg);
      const name = this.extractNameFromEmail(msg.from);
      return {
        id: `inquiry_${msg.id}`,
        propertyId: 'unknown',
        propertyTitle: this.extractPropertyTitle(msg.subject),
        inquirerName: name,
        inquirerEmail: msg.from,
        inquirerPhone: cls.extractedData.senderPhone ?? '',
        message: msg.body,
        timestamp: msg.timestamp,
        status: msg.labels?.includes('replied') ? 'responded' : 'new',
        priority: cls.priority,
      };
    });
  }

  private extractPropertyTitle(subject: string): string {
    const match = /(?:viewing|offer|inquiry).*?-\s*(.+)/i.exec(subject);
    return match?.[1] ?? 'Unknown Property';
    // Source structure inspired by baseline implementation. 
  }

  private extractNameFromEmail(email: string): string {
    const [local] = email.split('@');
    if (!local) return 'Unknown User';
    return local.split('.').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }

  getFallbackEmailCount(): number { return this.fallbackEmails.length; }
  isInFallbackMode(): boolean { return true; }
}

// ---------- SMTP Provider (production) ----------
export class SMTPService implements EmailService {
  private config: Required<Pick<EmailServiceConfig,
    'smtpHost' | 'smtpPort' | 'smtpSecure' | 'smtpUser' | 'smtpPassword' | 'fromEmail' | 'fromName'>> & {
      settings: NonNullable<EmailServiceConfig['settings']>;
    };

  // nodemailer.Transporter typed as any to support dynamic import safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transporter: any | null = null;
  private fallbackMode = false;
  private fallbackEmails: EmailMessage[] = [];

  constructor() {
    // Env-first defaults (merge from both prior files). 
    this.config = {
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
      smtpSecure: (process.env.SMTP_PORT || '587') === '465',
      smtpUser: process.env.SMTP_USER || 'your-email@gmail.com',
      smtpPassword: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || 'your-app-password',
      fromEmail: process.env.FROM_EMAIL || 'noreply@triplecheck.co.ke',
      fromName: process.env.FROM_NAME || 'TripleCheck Kenya',
      settings: {
        maxRetries: 3,
        retryDelay: 1000,
        batchSize: 10,
      },
    };
  }

  async initialize(): Promise<void> {
    try {
      const hasCreds = !!(this.config.smtpHost && this.config.smtpUser && this.config.smtpPassword);
      if (!hasCreds || this.config.smtpUser === 'your-email@gmail.com') {
        logger.warn('SMTP service running in fallback mode - no real credentials configured');
        this.fallbackMode = true;
        return;
      }

      let nodemailer: any = null;
      try {
        // Dynamic import; avoids hard dependency in non-SMTP envs
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        nodemailer = require('nodemailer');
      } catch (err) {
        logger.warn('Nodemailer not available; falling back to mock mode', { err });
        this.fallbackMode = true;
        return;
      }

      // Correct Nodemailer API is createTransport (not createTransporter).
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpSecure,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPassword,
        },
        tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
      });

      await this.transporter.verify();
      logger.info('✅ SMTP service initialized successfully');
      this.fallbackMode = false;
    } catch (error) {
      logger.warn('SMTP service falling back to mock mode', { error });
      this.fallbackMode = true;
    }
  }

  async getInboxMessages(): Promise<EmailInboxMessage[]> {
    // SMTP send-only provider
    return [];
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    if (this.fallbackMode || !this.transporter) {
      return this.handleFallback(message);
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text ?? stripHtml(message.html),
        attachments: message.attachments,
      });

      logger.info('✅ Email sent successfully', {
        messageId: info.messageId,
        to: message.to,
        subject: message.subject,
      });

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      logger.error('❌ Failed to send email, using fallback', { error });
      return this.handleFallback(message, error?.message);
    }
  }

  private handleFallback(message: EmailMessage, errMsg?: string): EmailResult {
    this.fallbackEmails.push(message);

    logger.info('📩 EMAIL FALLBACK - Would send', {
      to: message.to,
      subject: message.subject,
      preview: (message.text ?? stripHtml(message.html)).slice(0, 200),
    });

    return {
      success: true,
      messageId: `fallback_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      fallbackUsed: true,
      error: errMsg,
    };
  }

  async markAsRead(): Promise<void> { /* not supported */ }
  async archiveMessage(): Promise<void> { /* not supported */ }

  async sendQueuedEmails(): Promise<void> {
    if (this.fallbackMode || this.fallbackEmails.length === 0) return;
    logger.info(`📤 Sending ${this.fallbackEmails.length} queued emails`);

    const queue = [...this.fallbackEmails];
    this.fallbackEmails = [];

    for (const email of queue) {
      let attempts = 0;
      let sent = false;
      while (attempts < (this.config.settings.maxRetries ?? 1) && !sent) {
        attempts += 1;
        try {
          const res = await this.sendEmail(email);
          sent = res.success && !res.fallbackUsed;
          if (!sent) throw new Error('Still in fallback');
        } catch (e) {
          if (attempts < (this.config.settings.maxRetries ?? 1)) {
            await new Promise((r) => setTimeout(r, this.config.settings.retryDelay ?? 500));
          } else {
            logger.error('Failed to send queued email after retries', { error: e });
          }
        }
      }
    }
  }

  getFallbackEmailCount(): number { return this.fallbackEmails.length; }
  isInFallbackMode(): boolean { return this.fallbackMode; }

  async retryInitialization(): Promise<boolean> {
    await this.initialize();
    return !this.fallbackMode;
  }

  async getStatus(): Promise<{ connected: boolean; lastSync?: Date; error?: string }> {
    if (this.fallbackMode) {
      return { connected: false, error: 'Running in fallback mode - configure SMTP credentials' };
    }
    try {
      if (this.transporter) {
        await this.transporter.verify();
        return { connected: true, lastSync: new Date() };
      }
    } catch (error: any) {
      return { connected: false, error: error?.message ?? 'Connection failed' };
    }
    return { connected: false, error: 'Transporter not initialized' };
  }
}

// ---------- SendGrid Provider (optional, safe fallback behavior) ----------
export class SendGridService implements EmailService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sgMail: any | null = null;
  private fallbackMode = true;
  private fromEmail = process.env.FROM_EMAIL || 'noreply@triplecheck.co.ke';
  private fromName = process.env.FROM_NAME || 'TripleCheck Kenya';

  async initialize(): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey || apiKey === 'your-sendgrid-api-key') {
      logger.warn('SendGrid service running in fallback mode - no API key configured');
      this.fallbackMode = true;
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@sendgrid/mail');
      this.sgMail = mod;
      this.sgMail.setApiKey(apiKey);
      this.fallbackMode = false;
      logger.info('SendGrid service initialized');
    } catch (err) {
      logger.warn('SendGrid package not available; fallback mode', { err });
      this.fallbackMode = true;
    }
  }

  async getInboxMessages(): Promise<EmailInboxMessage[]> { return []; }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    if (this.fallbackMode || !this.sgMail) {
      logger.info('📧 SENDGRID FALLBACK - Would send', {
        to: message.to,
        subject: message.subject,
      });
      return { success: true, messageId: `sg_fallback_${Date.now()}`, fallbackUsed: true };
    }
    try {
      const [res] = await this.sgMail.send({
        from: { email: this.fromEmail, name: this.fromName },
        to: toArray(message.to),
        subject: message.subject,
        html: message.html,
        text: message.text ?? stripHtml(message.html),
        attachments: message.attachments?.map(a => ({
          content: typeof a.content === 'string' ? Buffer.from(a.content).toString('base64') : a.content.toString('base64'),
          filename: a.filename,
          type: a.contentType ?? 'application/octet-stream',
          disposition: 'attachment',
        })),
      });
      const msgId = res?.headers?.['x-message-id'] || `sendgrid_${Date.now()}`;
      logger.info('✅ SendGrid email sent', { messageId: msgId });
      return { success: true, messageId: msgId };
    } catch (error: any) {
      logger.error('❌ SendGrid send failed; fallback', { error });
      return { success: true, messageId: `sg_fallback_${Date.now()}`, fallbackUsed: true, error: error?.message };
    }
  }

  async markAsRead(): Promise<void> { /* not supported */ }
  async archiveMessage(): Promise<void> { /* not supported */ }
  isInFallbackMode(): boolean { return this.fallbackMode; }
}

// ---------- Gmail / Outlook placeholders (send-only, safe fallbacks) ----------
export class GmailService implements EmailService {
  async initialize(): Promise<void> {
    logger.warn('Gmail service not yet implemented - use SMTP or SendGrid');
  }
  async getInboxMessages(): Promise<EmailInboxMessage[]> { return []; }
  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    logger.info('📧 GMAIL FALLBACK - Would send', { to: message.to, subject: message.subject });
    return { success: true, messageId: `gmail_fallback_${Date.now()}`, fallbackUsed: true };
  }
  async markAsRead(): Promise<void> { /* not implemented */ }
  async archiveMessage(): Promise<void> { /* not implemented */ }
}

export class OutlookService implements EmailService {
  async initialize(): Promise<void> {
    logger.warn('Outlook service not yet implemented - use SMTP or SendGrid');
  }
  async getInboxMessages(): Promise<EmailInboxMessage[]> { return []; }
  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    logger.info('📧 OUTLOOK FALLBACK - Would send', { to: message.to, subject: message.subject });
    return { success: true, messageId: `outlook_fallback_${Date.now()}`, fallbackUsed: true };
  }
  async markAsRead(): Promise<void> { /* not implemented */ }
  async archiveMessage(): Promise<void> { /* not implemented */ }
}

// ---------- Factory ----------
export class EmailServiceFactory {
  static create(provider: EmailProvider): EmailService {
    switch (provider) {
      case 'mock': return new MockEmailService();
      case 'smtp': return new SMTPService();
      case 'sendgrid': return new SendGridService();
      case 'gmail': return new GmailService();
      case 'outlook': return new OutlookService();
      default:
        logger.warn(`Unsupported provider "${provider}" -> using mock`);
        return new MockEmailService();
    }
  }

  static async createBestAvailable(): Promise<EmailService> {
    // Order: SMTP → SendGrid → Mock
    const providers: EmailProvider[] = ['smtp', 'sendgrid', 'mock'];
    for (const p of providers) {
      const svc = this.create(p);
      try {
        await svc.initialize();
        if ('getStatus' in svc) {
          // @ts-expect-error runtime check
          const status = await (svc as any).getStatus();
          if (status?.connected) {
            logger.info(`✅ Email service initialized with provider: ${p}`);
            return svc;
          }
        } else if (!('isInFallbackMode' in svc) || !(svc as any).isInFallbackMode?.()) {
          logger.info(`✅ Email service initialized with provider: ${p}`);
          return svc;
        }
      } catch (error) {
        logger.warn(`❌ Failed to initialize provider ${p}`, { error });
      }
    }
    logger.warn('⚠️ All providers failed; using mock');
    const mock = new MockEmailService();
    await mock.initialize();
    return mock;
  }
}

// ---------- Templates ----------
export class EmailTemplates {
  static welcomeEmail(userName: string, loginUrl: string): string {
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome</title>
<style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto}
  .header{background:#14B8A6;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}
  .content{padding:30px;background:#f9f9f9}
  .button{display:inline-block;background:#14B8A6;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;margin:15px 0}
  .footer{text-align:center;padding:20px;color:#666;font-size:12px;background:#f0f0f0;border-radius:0 0 8px 8px}
</style></head><body>
  <div class="header"><h1>Welcome to TripleCheck Kenya! 🇰🇪</h1></div>
  <div class="content">
    <h2>Hello ${userName},</h2>
    <p>Welcome to Kenya's most trusted land verification platform.</p>
    <ul>
      <li>Browse verified properties</li><li>Start land verification</li>
      <li>Connect with verified experts</li><li>Use fraud detection tools</li>
    </ul>
    <a class="button" href="${loginUrl}">Access Your Account</a>
  </div>
  <div class="footer">© ${new Date().getFullYear()} TripleCheck Kenya.</div>
</body></html>`;
  }

  static passwordResetEmail(userName: string, resetUrl: string): string {
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Password Reset</title>
<style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto}
  .header{background:#14B8A6;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}
  .content{padding:30px;background:#f9f9f9}
  .button{display:inline-block;background:#14B8A6;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;margin:15px 0}
  .warning{background:#FEF3C7;border:1px solid #F59E0B;padding:15px;border-radius:5px;margin:15px 0}
  .footer{text-align:center;padding:20px;color:#666;font-size:12px;background:#f0f0f0;border-radius:0 0 8px 8px}
</style></head><body>
  <div class="header"><h1>🔐 Password Reset Request</h1></div>
  <div class="content">
    <h2>Hello ${userName},</h2>
    <p>We received a request to reset your password.</p>
    <a class="button" href="${resetUrl}">Reset Your Password</a>
    <div class="warning"><strong>Security Notice:</strong> This link expires in 1 hour.</div>
  </div>
  <div class="footer">© ${new Date().getFullYear()} TripleCheck Kenya.</div>
</body></html>`;
  }

  static propertyInquiryNotification(propertyTitle: string, inquirerName: string, message: string, contactInfo: string): string {
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>New Property Inquiry</title>
<style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto}
  .header{background:#14B8A6;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}
  .content{padding:30px;background:#f9f9f9}
  .inquiry{background:#fff;border:1px solid #ddd;padding:20px;border-radius:5px;margin:15px 0}
  .footer{text-align:center;padding:20px;color:#666;font-size:12px;background:#f0f0f0;border-radius:0 0 8px 8px}
</style></head><body>
  <div class="header"><h1>📧 New Property Inquiry</h1></div>
  <div class="content">
    <h2>Property: ${propertyTitle}</h2>
    <div class="inquiry">
      <p><strong>From:</strong> ${inquirerName}</p>
      <p><strong>Contact:</strong> ${contactInfo}</p>
      <p><strong>Message:</strong></p>
      <p style="background:#f8f8f8;padding:15px;border-radius:5px">${message}</p>
    </div>
  </div>
  <div class="footer">© ${new Date().getFullYear()} TripleCheck Kenya.</div>
</body></html>`;
  }

  static verificationStatusUpdate(userName: string, propertyTitle: string, status: string, details: string): string {
    const statusColors: Record<string, string> = { completed: '#10B981', failed: '#EF4444', pending: '#F59E0B' };
    const statusColor = statusColors[status] ?? '#F59E0B';
    const frontend = process.env.FRONTEND_URL || 'https://triplecheck.co.ke';
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Verification Update</title>
<style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto}
  .header{background:#14B8A6;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}
  .content{padding:30px;background:#f9f9f9}
  .status{background:#fff;border-left:4px solid ${statusColor};padding:20px;margin:15px 0;border-radius:0 5px 5px 0}
  .button{display:inline-block;background:#14B8A6;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;margin:15px 0}
  .footer{text-align:center;padding:20px;color:#666;font-size:12px;background:#f0f0f0;border-radius:0 0 8px 8px}
</style></head><body>
  <div class="header"><h1>🔍 Land Verification Update</h1></div>
  <div class="content">
    <h2>Hello ${userName},</h2>
    <p>We have an update on your land verification for:</p>
    <h3>${propertyTitle}</h3>
    <div class="status"><h4>Status: ${status.toUpperCase()}</h4><p>${details}</p></div>
    <a class="button" href="${frontend}/dashboard/verifications">View Full Report</a>
  </div>
  <div class="footer">© ${new Date().getFullYear()} TripleCheck Kenya.</div>
</body></html>`;
  }
}

// ---------- Global instance + helpers ----------
let emailServiceInstance: EmailService | null = null;

export async function getEmailService(): Promise<EmailService> {
  if (!emailServiceInstance) {
    emailServiceInstance = await EmailServiceFactory.createBestAvailable();
  }
  return emailServiceInstance;
}

export async function sendTemplatedEmail(
  template: 'welcome' | 'password-reset' | 'property-inquiry' | 'verification-update',
  to: string | string[],
  data: Record<string, string>
): Promise<EmailResult> {
  const svc = await getEmailService();

  let subject: string;
  let html: string;

  switch (template) {
    case 'welcome':
      subject = 'Welcome to TripleCheck Kenya!';
      html = EmailTemplates.welcomeEmail(data.userName ?? 'User', data.loginUrl ?? 'https://triplecheck.co.ke/login');
      break;
    case 'password-reset':
      subject = 'Reset Your Password - TripleCheck Kenya';
      html = EmailTemplates.passwordResetEmail(data.userName ?? 'User', data.resetUrl ?? '#');
      break;
    case 'property-inquiry':
      subject = `New Property Inquiry - ${data.propertyTitle ?? 'Property'}`;
      html = EmailTemplates.propertyInquiryNotification(
        data.propertyTitle ?? 'Property',
        data.inquirerName ?? 'Unknown',
        data.message ?? 'No message',
        data.contactInfo ?? 'No contact info',
      );
      break;
    case 'verification-update':
      subject = `Verification Update - ${data.propertyTitle ?? 'Property'}`;
      html = EmailTemplates.verificationStatusUpdate(
        data.userName ?? 'User',
        data.propertyTitle ?? 'Property',
        data.status ?? 'pending',
        data.details ?? 'No details',
      );
      break;
    default:
      throw new Error(`Unknown template: ${template as string}`);
  }

  return svc.sendEmail({
    to,
    subject,
    html,
    text: stripHtml(html),
  });
}

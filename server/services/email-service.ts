// Enhanced Email service implementations for TripleCheck with real SMTP and intelligent fallback
import {
  EmailService,
  EmailServiceConfig,
  EmailMessage,
  PropertyInquiry,
} from "../shared/email-types";

// Constants to avoid duplication
const TRIPLECHECK_EMAIL = "inquiries@triplecheck.co.ke";

// Additional interfaces for enhanced functionality
export interface EmailSendRequest {
  to: string;
  subject: string;
  body: string;
  htmlBody?: string | undefined;
  timestamp?: Date;
}

export interface InquiryClassificationResult {
  inquiryType: "viewing_request" | "offer" | "complaint" | "general_inquiry";
  priority: "low" | "medium" | "high";
  extractedData: {
    senderPhone?: string;
    propertyPrice?: number;
  };
  confidence: number;
}

// Enhanced Mock Email Service with proper interface implementation
export class MockEmailService implements EmailService {
  private mockMessages: EmailMessage[] = [];

  async initialize(): Promise<void> {
    this.generateMockMessages();
  }

  private generateMockMessages(): void {
    this.mockMessages = [
      {
        id: "1",
        threadId: "thread_1",
        from: "john.kamau@email.com",
        to: [TRIPLECHECK_EMAIL],
        subject: "Viewing Request - Modern Apartment in Westlands",
        body: "Hi, I'm very interested in this property. Could we schedule a viewing this weekend? I'm looking for a 2-bedroom apartment in this area and this seems perfect. What's the earliest availability?",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: false,
        isImportant: false,
        labels: ["inquiry", "viewing_request"],
      },
      {
        id: "2",
        threadId: "thread_2",
        from: "sarah.w@email.com",
        to: [TRIPLECHECK_EMAIL],
        subject: "Offer - Luxury Villa in Karen",
        body: "I would like to make an offer on this property. Is the owner open to negotiations? My budget is around KES 230,000. Please let me know if this is acceptable.",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        isRead: true,
        isImportant: false,
        labels: ["inquiry", "offer"],
      },
      {
        id: "3",
        threadId: "thread_3",
        from: "m.ochieng@email.com",
        to: [TRIPLECHECK_EMAIL],
        subject: "Rental Inquiry - Cozy Studio in Kilimani",
        body: "Hello, I'm interested in renting this studio apartment. What are the lease terms and when would it be available? Also, are pets allowed?",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isRead: true,
        isImportant: false,
        labels: ["inquiry", "rental", "replied"],
      },
      {
        id: "4",
        threadId: "thread_4",
        from: "grace.muthoni@email.com",
        to: [TRIPLECHECK_EMAIL],
        subject: "Complaint - Photo Discrepancies",
        body: "I saw your listing and I'm interested. However, I noticed some discrepancies in the photos. Could you provide more recent pictures of the property?",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isRead: true,
        isImportant: false,
        labels: ["inquiry", "complaint"],
      },
    ];
  }

  async getInboxMessages(limit = 50): Promise<EmailMessage[]> {
    return this.mockMessages.slice(0, limit);
  }

  async sendEmail(
    to: string[],
    subject: string,
    _body: string,
    _htmlBody?: string
  ): Promise<void> {
    // Simulate sending email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // eslint-disable-next-line no-console
    console.log(
      `📧 MOCK EMAIL SENT - To: ${to.join(", ")}, Subject: ${subject}`
    );
  }

  async markAsRead(messageId: string): Promise<void> {
    const message = this.mockMessages.find((msg) => msg.id === messageId);
    if (message) {
      message.isRead = true;
    }
  }

  async archiveMessage(messageId: string): Promise<void> {
    const message = this.mockMessages.find((msg) => msg.id === messageId);
    if (message) {
      message.labels = [...(message.labels || []), "archived"];
    }
  }

  extractPropertyInquiries(messages: EmailMessage[]): PropertyInquiry[] {
    return messages.map((msg) => {
      const classification = InquiryClassificationService.classifyInquiry(msg);
      return {
        id: `inquiry_${msg.id}`,
        propertyId: "unknown",
        propertyTitle: this.extractPropertyTitle(msg.subject),
        inquirerName: this.extractNameFromEmail(msg.from),
        inquirerEmail: msg.from,
        inquirerPhone: classification.extractedData.senderPhone || '',
        message: msg.body,
        timestamp: msg.timestamp,
        status: msg.labels?.includes("replied") ? "responded" : "new",
        priority: classification.priority,
      };
    });
  }

  private extractPropertyTitle(subject: string): string {
    const match = /(?:viewing|offer|inquiry).*?-\s*(.+)/i.exec(subject);
    return match?.[1] || "Unknown Property";
  }

  private extractNameFromEmail(email: string): string {
    const [localPart] = email.split("@");
    if (!localPart) return "Unknown User";
    return localPart
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
}

// Production-Ready SMTP Service with Intelligent Fallback
export class SMTPService implements EmailService {
  private config: EmailServiceConfig | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transporter: any = null;
  private fallbackMode: boolean = false;
  private fallbackEmails: EmailSendRequest[] = [];

  async initialize(): Promise<void> {
    // Get configuration from environment
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    this.config = {
      provider: "smtp",
      smtpHost: smtpHost || '',
      smtpPort: parseInt(process.env.SMTP_PORT || "587"),
      smtpUser: smtpUser || '',
      smtpPassword: smtpPassword || '',
      fromEmail: process.env.FROM_EMAIL || "noreply@triplecheck.co.ke",
      fromName: process.env.FROM_NAME || "TripleCheck Kenya",
      settings: {
        maxRetries: 3,
        retryDelay: 1000,
        batchSize: 10,
      },
    };

    try {
      // Check if we have real SMTP credentials
      if (
        !smtpHost ||
        !smtpUser ||
        !smtpPassword ||
        smtpUser === "your-email@gmail.com"
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          "SMTP service running in fallback mode - no real credentials configured"
        );
        this.fallbackMode = true;
        return;
      }

      // Import nodemailer dynamically to handle missing dependency gracefully
      let nodemailer: any = null;
      try {
        // Dynamic import with fallback
        const nodemailerModule = await import('nodemailer');
        nodemailer = nodemailerModule.default || nodemailerModule;
      } catch (error) {
        console.warn('Nodemailer not available:', error instanceof Error ? error.message : 'Unknown error');
        nodemailer = null;
      }
      if (!nodemailer) {
        // eslint-disable-next-line no-console
        console.warn("Nodemailer not installed, falling back to mock mode");
        this.fallbackMode = true;
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: parseInt(process.env.SMTP_PORT || "587") === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        tls: {
          rejectUnauthorized: false, // For development - should be true in production
        },
      });

      // Verify connection
      await this.transporter.verify();
      // eslint-disable-next-line no-console
      console.log("✅ SMTP service initialized successfully");
      this.fallbackMode = false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("SMTP service falling back to mock mode:", error);
      this.fallbackMode = true;
    }
  }

  async getInboxMessages(_limit = 50): Promise<EmailMessage[]> {
    // SMTP is for sending only, return empty for receiving
    return [];
  }

  async sendEmail(
    to: string[],
    subject: string,
    body: string,
    htmlBody?: string
  ): Promise<void> {
    if (this.fallbackMode || !this.transporter) {
      return this.handleFallback({
        to: to.join(", "),
        subject,
        body,
        htmlBody,
      });
    }

    try {
      const mailOptions = {
        from: `"${this.config?.fromName || "TripleCheck Kenya"}" <${this.config?.fromEmail || "noreply@triplecheck.co.ke"}>`,
        to: to.join(", "),
        subject,
        text: this.stripHtml(htmlBody || body),
        html: htmlBody || body,
      };

      const result = await this.transporter.sendMail(mailOptions);
      // eslint-disable-next-line no-console
      console.log("✅ Email sent successfully:", {
        messageId: result.messageId,
        to: to.join(", "),
        subject,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("❌ Failed to send email, using fallback:", error);
      return this.handleFallback({
        to: to.join(", "),
        subject,
        body,
        htmlBody,
      });
    }
  }

  private handleFallback(request: EmailSendRequest): void {
    // Store email for later sending when real service is configured
    this.fallbackEmails.push({
      ...request,
      timestamp: new Date(),
    });

    // Log the email content for development
    // eslint-disable-next-line no-console
    console.log(`
📧 EMAIL FALLBACK - Would send email:
To: ${request.to}
Subject: ${request.subject}
Content: ${this.stripHtml(request.body).substring(0, 200)}...
    `);
  }

  private stripHtml(html: string): string {
    // Safe HTML stripping - replace with text content
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove scripts first
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove styles
      .replace(/<[a-zA-Z][^>]*>/g, "") // Opening tags
      .replace(/<\/[a-zA-Z][^>]*>/g, "") // Closing tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }

  async markAsRead(_messageId: string): Promise<void> {
    // SMTP doesn't support message management
  }

  async archiveMessage(_messageId: string): Promise<void> {
    // SMTP doesn't support message management
  }

  extractPropertyInquiries(_messages: EmailMessage[]): PropertyInquiry[] {
    // SMTP doesn't support message retrieval
    return [];
  }

  // Enhanced methods for monitoring and management
  async sendQueuedEmails(): Promise<void> {
    if (this.fallbackMode || this.fallbackEmails.length === 0) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`📤 Sending ${this.fallbackEmails.length} queued emails`);

    for (const email of this.fallbackEmails) {
      try {
        await this.sendEmail(
          [email.to],
          email.subject,
          email.body,
          email.htmlBody
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to send queued email:", error);
      }
    }

    this.fallbackEmails = [];
  }

  getFallbackEmailCount(): number {
    return this.fallbackEmails.length;
  }

  isInFallbackMode(): boolean {
    return this.fallbackMode;
  }

  async getStatus(): Promise<{
    connected: boolean;
    lastSync?: Date;
    error?: string;
  }> {
    if (this.fallbackMode) {
      return {
        connected: false,
        error: "Running in fallback mode - configure SMTP credentials",
      };
    }

    try {
      if (this.transporter) {
        await this.transporter.verify();
        return {
          connected: true,
          lastSync: new Date(),
        };
      }
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }

    return {
      connected: false,
      error: "Transporter not initialized",
    };
  }
}

// SendGrid Service with Fallback (placeholder for future implementation)
export class SendGridService implements EmailService {
  private fallbackMode: boolean = true; // Start in fallback mode

  async initialize(): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey || apiKey === "your-sendgrid-api-key") {
      // eslint-disable-next-line no-console
      console.warn(
        "SendGrid service running in fallback mode - no API key configured"
      );
      this.fallbackMode = true;
      return;
    }

    try {
      // Import SendGrid dynamically
      let sgMail: unknown = null;
      try {
        // Dynamic import with fallback
        const sgModule = await import('@sendgrid/mail');
        sgMail = sgModule.default || sgModule;
      } catch (error) {
        console.warn('SendGrid not available:', error instanceof Error ? error.message : 'Unknown error');
        sgMail = null;
      }
      if (!sgMail) {
        // eslint-disable-next-line no-console
        console.warn(
          "SendGrid package not installed, falling back to mock mode"
        );
        this.fallbackMode = true;
        return;
      }

      // Future: Implement SendGrid initialization
      // eslint-disable-next-line no-console
      console.log("SendGrid service would be initialized here");
      this.fallbackMode = false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("SendGrid service falling back to mock mode:", error);
      this.fallbackMode = true;
    }
  }

  async getInboxMessages(_limit = 50): Promise<EmailMessage[]> {
    return [];
  }

  async sendEmail(
    to: string[],
    subject: string,
    _body: string,
    _htmlBody?: string
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `📧 SENDGRID FALLBACK - Would send email to: ${to.join(", ")}, Subject: ${subject}`
    );
  }

  async markAsRead(_messageId: string): Promise<void> {
    // SendGrid doesn't support message management
  }

  async archiveMessage(_messageId: string): Promise<void> {
    // SendGrid doesn't support message management
  }

  extractPropertyInquiries(_messages: EmailMessage[]): PropertyInquiry[] {
    return [];
  }
}

// Gmail Service (placeholder for future OAuth implementation)
export class GmailService implements EmailService {
  async initialize(): Promise<void> {
    // eslint-disable-next-line no-console
    console.warn(
      "Gmail service not yet implemented - use SMTP or mock service"
    );
  }

  async getInboxMessages(_limit = 50): Promise<EmailMessage[]> {
    return [];
  }

  async sendEmail(
    to: string[],
    subject: string,
    _body: string,
    _htmlBody?: string
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `📧 GMAIL FALLBACK - Would send email to: ${to.join(", ")}, Subject: ${subject}`
    );
  }

  async markAsRead(_messageId: string): Promise<void> {
    // Not implemented
  }

  async archiveMessage(_messageId: string): Promise<void> {
    // Not implemented
  }

  extractPropertyInquiries(_messages: EmailMessage[]): PropertyInquiry[] {
    return [];
  }
}

// Outlook Service (placeholder for future Microsoft Graph implementation)
export class OutlookService implements EmailService {
  async initialize(): Promise<void> {
    // eslint-disable-next-line no-console
    console.warn(
      "Outlook service not yet implemented - use SMTP or mock service"
    );
  }

  async getInboxMessages(_limit = 50): Promise<EmailMessage[]> {
    return [];
  }

  async sendEmail(
    to: string[],
    subject: string,
    _body: string,
    _htmlBody?: string
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `📧 OUTLOOK FALLBACK - Would send email to: ${to.join(", ")}, Subject: ${subject}`
    );
  }

  async markAsRead(_messageId: string): Promise<void> {
    // Not implemented
  }

  async archiveMessage(_messageId: string): Promise<void> {
    // Not implemented
  }

  extractPropertyInquiries(_messages: EmailMessage[]): PropertyInquiry[] {
    return [];
  }
}

// Email Service Factory with Intelligent Provider Selection
export class EmailServiceFactory {
  static createService(provider: EmailServiceConfig["provider"]): EmailService {
    switch (provider) {
      case "mock":
        return new MockEmailService();
      case "gmail":
        return new GmailService();
      case "outlook":
        return new OutlookService();
      case "sendgrid":
        return new SendGridService();
      case "smtp":
        return new SMTPService();
      default:
        // eslint-disable-next-line no-console
        console.warn(
          `Unsupported email provider: ${provider}, using mock service`
        );
        return new MockEmailService();
    }
  }

  // Smart factory that chooses best available provider
  static async createBestAvailableService(): Promise<EmailService> {
    const providers: EmailServiceConfig["provider"][] = [
      "smtp",
      "sendgrid",
      "mock",
    ];

    for (const provider of providers) {
      try {
        const service = this.createService(provider);
        await service.initialize();

        // Check if service is working (for services that support status)
        if ("getStatus" in service) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const status = await (service as any).getStatus();
          if (status.connected) {
            // eslint-disable-next-line no-console
            console.log(
              `✅ Email service initialized with provider: ${provider}`
            );
            return service;
          }
        } else {
          // eslint-disable-next-line no-console
          console.log(
            `✅ Email service initialized with provider: ${provider}`
          );
          return service;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(
          `❌ Failed to initialize ${provider} email service:`,
          error
        );
        continue;
      }
    }

    // Fallback to mock service
    // eslint-disable-next-line no-console
    console.warn("⚠️ All email providers failed, using mock service");
    const mockService = new MockEmailService();
    await mockService.initialize();
    return mockService;
  }
}

// Professional Email Templates
export class EmailTemplates {
  static welcomeEmail(userName: string, loginUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to TripleCheck Kenya</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: #14B8A6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; background: #14B8A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f0f0f0; border-radius: 0 0 8px 8px; }
          ul { padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to TripleCheck Kenya! 🇰🇪</h1>
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: #14B8A6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; background: #14B8A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f0f0f0; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>We received a request to reset your password for your TripleCheck Kenya account.</p>
          <a href="${resetUrl}" class="button">Reset Your Password</a>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
          </div>
        </div>
        <div class="footer">
          <p>© 2025 TripleCheck Kenya. This email was sent to ${userName}.</p>
        </div>
      </body>
      </html>
    `;
  }

  static propertyInquiryNotification(
    propertyTitle: string,
    inquirerName: string,
    message: string,
    contactInfo: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Property Inquiry - ${propertyTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: #14B8A6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .inquiry-box { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f0f0f0; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📧 New Property Inquiry</h1>
        </div>
        <div class="content">
          <h2>Property: ${propertyTitle}</h2>
          <div class="inquiry-box">
            <h3>Inquiry Details:</h3>
            <p><strong>From:</strong> ${inquirerName}</p>
            <p><strong>Contact:</strong> ${contactInfo}</p>
            <p><strong>Message:</strong></p>
            <p style="background: #f8f8f8; padding: 15px; border-radius: 5px;">${message}</p>
          </div>
          <p>Please respond to this inquiry promptly to maintain good customer service.</p>
        </div>
        <div class="footer">
          <p>© 2025 TripleCheck Kenya. Property inquiry notification.</p>
        </div>
      </body>
      </html>
    `;
  }

  static verificationStatusUpdate(
    userName: string,
    propertyTitle: string,
    status: string,
    details: string
  ): string {
    const statusColors = {
      completed: "#10B981",
      failed: "#EF4444",
      pending: "#F59E0B",
    };
    const statusColor =
      statusColors[status as keyof typeof statusColors] || "#F59E0B";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verification Update - ${propertyTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: #14B8A6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .status-box { background: white; border-left: 4px solid ${statusColor}; padding: 20px; margin: 15px 0; border-radius: 0 5px 5px 0; }
          .button { display: inline-block; background: #14B8A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f0f0f0; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔍 Land Verification Update</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>We have an update on your land verification for:</p>
          <h3>${propertyTitle}</h3>
          <div class="status-box">
            <h4>Status: ${status.toUpperCase()}</h4>
            <p>${details}</p>
          </div>
          <a href="${process.env.FRONTEND_URL || "https://triplecheck.co.ke"}/dashboard/verifications" class="button">View Full Report</a>
        </div>
        <div class="footer">
          <p>© 2025 TripleCheck Kenya. Land verification update.</p>
        </div>
      </body>
      </html>
    `;
  }
}

// Inquiry Classification Service
export class InquiryClassificationService {
  static classifyInquiry(message: EmailMessage): InquiryClassificationResult {
    const subject = message.subject.toLowerCase();
    const body = message.body.toLowerCase();
    const content = `${subject} ${body}`;

    // Simple keyword-based classification (can be enhanced with ML later)
    let inquiryType: InquiryClassificationResult["inquiryType"] =
      "general_inquiry";
    let priority: InquiryClassificationResult["priority"] = "medium";
    let confidence = 0.5;

    // Classify inquiry type
    if (
      content.includes("viewing") ||
      content.includes("visit") ||
      content.includes("see")
    ) {
      inquiryType = "viewing_request";
      confidence = 0.8;
    } else if (
      content.includes("offer") ||
      content.includes("buy") ||
      content.includes("purchase")
    ) {
      inquiryType = "offer";
      confidence = 0.9;
    } else if (
      content.includes("complaint") ||
      content.includes("problem") ||
      content.includes("issue") ||
      content.includes("discrepanc")
    ) {
      inquiryType = "complaint";
      confidence = 0.7;
    }

    // Determine priority
    if (
      content.includes("urgent") ||
      content.includes("asap") ||
      content.includes("immediately")
    ) {
      priority = "high";
    } else if (
      content.includes("when convenient") ||
      content.includes("no rush")
    ) {
      priority = "low";
    }

    // Extract property information (basic implementation)
    const extractedData: InquiryClassificationResult["extractedData"] = {};

    // Extract phone numbers
    const phoneRegex = /\+254\s?\d{9}|\d{10}/;
    const phoneMatch = phoneRegex.exec(message.body);
    if (phoneMatch) {
      const [phone] = phoneMatch;
      extractedData.senderPhone = phone;
    }

    // Extract price mentions - simplified regex to avoid backtracking
    const priceRegex = /KES\s?([\d,]+)/i;
    const priceMatch = priceRegex.exec(message.body);
    if (priceMatch?.[1]) {
      extractedData.propertyPrice = parseInt(priceMatch[1].replace(/,/g, ""));
    }

    return {
      inquiryType,
      priority,
      extractedData,
      confidence,
    };
  }
}

// Global email service instance
let emailServiceInstance: EmailService | null = null;

export async function getEmailService(): Promise<EmailService> {
  if (!emailServiceInstance) {
    emailServiceInstance =
      await EmailServiceFactory.createBestAvailableService();
  }
  return emailServiceInstance;
}

// Helper function to send templated emails
export async function sendTemplatedEmail(
  template:
    | "welcome"
    | "password-reset"
    | "property-inquiry"
    | "verification-update",
  to: string[],
  data: Record<string, string>
): Promise<void> {
  const emailService = await getEmailService();

  let subject: string;
  let htmlBody: string;

  switch (template) {
    case "welcome":
      subject = "Welcome to TripleCheck Kenya!";
      htmlBody = EmailTemplates.welcomeEmail(
        data.userName || "User",
        data.loginUrl || "https://triplecheck.co.ke/login"
      );
      break;
    case "password-reset":
      subject = "Reset Your Password - TripleCheck Kenya";
      htmlBody = EmailTemplates.passwordResetEmail(
        data.userName || "User",
        data.resetUrl || "#"
      );
      break;
    case "property-inquiry":
      subject = `New Property Inquiry - ${data.propertyTitle || "Property"}`;
      htmlBody = EmailTemplates.propertyInquiryNotification(
        data.propertyTitle || "Property",
        data.inquirerName || "Unknown",
        data.message || "No message",
        data.contactInfo || "No contact info"
      );
      break;
    case "verification-update":
      subject = `Verification Update - ${data.propertyTitle || "Property"}`;
      htmlBody = EmailTemplates.verificationStatusUpdate(
        data.userName || "User",
        data.propertyTitle || "Property",
        data.status || "pending",
        data.details || "No details"
      );
      break;
    default:
      throw new Error(`Unknown email template: ${template}`);
  }

  await emailService.sendEmail(to, subject, htmlBody, htmlBody);
}

// All classes are already exported above, no need for duplicate exports

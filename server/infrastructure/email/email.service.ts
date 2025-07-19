// Email service implementations for TripleCheck
import { 
  EmailService, 
  EmailServiceConfig, 
  EmailMessage, 
  EmailSendRequest,
  PropertyInquiry,
  InquiryClassificationResult
} from '../shared/email-types.js';

// Mock Email Service - preserves current demo functionality
export class MockEmailService implements EmailService {
  private config: EmailServiceConfig | null = null;
  private mockMessages: EmailMessage[] = [];

  async initialize(config: EmailServiceConfig): Promise<void> {
    this.config = config;
    this.generateMockMessages();
  }

  private generateMockMessages(): void {
    this.mockMessages = [
      {
        id: "1",
        from: { email: "john.kamau@email.com", name: "John Kamau" },
        to: { email: "inquiries@triplecheck.co.ke", name: "TripleCheck Inquiries" },
        subject: "Viewing Request - Modern Apartment in Westlands",
        body: "Hi, I'm very interested in this property. Could we schedule a viewing this weekend? I'm looking for a 2-bedroom apartment in this area and this seems perfect. What's the earliest availability?",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false,
        labels: ["inquiry", "viewing_request"]
      },
      {
        id: "2", 
        from: { email: "sarah.w@email.com", name: "Sarah Wanjiku" },
        to: { email: "inquiries@triplecheck.co.ke", name: "TripleCheck Inquiries" },
        subject: "Offer - Luxury Villa in Karen",
        body: "I would like to make an offer on this property. Is the owner open to negotiations? My budget is around KES 230,000. Please let me know if this is acceptable.",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        isRead: true,
        labels: ["inquiry", "offer"]
      },
      {
        id: "3",
        from: { email: "m.ochieng@email.com", name: "Michael Ochieng" },
        to: { email: "inquiries@triplecheck.co.ke", name: "TripleCheck Inquiries" },
        subject: "Rental Inquiry - Cozy Studio in Kilimani",
        body: "Hello, I'm interested in renting this studio apartment. What are the lease terms and when would it be available? Also, are pets allowed?",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isRead: true,
        labels: ["inquiry", "rental", "replied"]
      },
      {
        id: "4",
        from: { email: "grace.muthoni@email.com", name: "Grace Muthoni" },
        to: { email: "inquiries@triplecheck.co.ke", name: "TripleCheck Inquiries" },
        subject: "Complaint - Photo Discrepancies",
        body: "I saw your listing and I'm interested. However, I noticed some discrepancies in the photos. Could you provide more recent pictures of the property?",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        isRead: true,
        labels: ["inquiry", "complaint"]
      }
    ];
  }

  async getMessages(limit = 50): Promise<{ messages: EmailMessage[]; nextPageToken?: string }> {
    const messages = this.mockMessages.slice(0, limit);
    return { messages };
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    return this.mockMessages.find(msg => msg.id === messageId) || null;
  }

  async sendEmail(request: EmailSendRequest): Promise<string> {
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `mock_sent_${Date.now()}`;
  }

  async replyToEmail(messageId: string, body: string): Promise<string> {
    const originalMessage = await this.getMessage(messageId);
    if (!originalMessage) {
      throw new Error('Original message not found');
    }
    
    // Simulate reply
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mark original as replied
    originalMessage.labels = [...(originalMessage.labels || []), 'replied'];
    
    return `mock_reply_${Date.now()}`;
  }

  async markAsRead(messageId: string, isRead: boolean): Promise<void> {
    const message = this.mockMessages.find(msg => msg.id === messageId);
    if (message) {
      message.isRead = isRead;
    }
  }

  async archiveMessage(messageId: string, archive: boolean): Promise<void> {
    const message = this.mockMessages.find(msg => msg.id === messageId);
    if (message) {
      if (archive) {
        message.labels = [...(message.labels || []), 'archived'];
      } else {
        message.labels = message.labels?.filter(label => label !== 'archived') || [];
      }
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    const index = this.mockMessages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      this.mockMessages.splice(index, 1);
    }
  }

  async searchMessages(query: string, limit = 50): Promise<EmailMessage[]> {
    const searchTerm = query.toLowerCase();
    return this.mockMessages
      .filter(msg => 
        msg.subject.toLowerCase().includes(searchTerm) ||
        msg.body.toLowerCase().includes(searchTerm) ||
        msg.from.name.toLowerCase().includes(searchTerm) ||
        msg.from.email.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit);
  }

  async getStatus(): Promise<{ connected: boolean; lastSync?: Date; error?: string }> {
    return {
      connected: true,
      lastSync: new Date()
    };
  }
}

// Gmail Service Implementation (placeholder for future implementation)
export class GmailService implements EmailService {
  private config: EmailServiceConfig | null = null;

  async initialize(config: EmailServiceConfig): Promise<void> {
    this.config = config;
    // TODO: Initialize Gmail API with OAuth2 credentials
    throw new Error('Gmail service not yet implemented. Use mock service for now.');
  }

  async getMessages(): Promise<{ messages: EmailMessage[]; nextPageToken?: string }> {
    throw new Error('Gmail service not yet implemented');
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    throw new Error('Gmail service not yet implemented');
  }

  async sendEmail(request: EmailSendRequest): Promise<string> {
    throw new Error('Gmail service not yet implemented');
  }

  async replyToEmail(messageId: string, body: string): Promise<string> {
    throw new Error('Gmail service not yet implemented');
  }

  async markAsRead(messageId: string, isRead: boolean): Promise<void> {
    throw new Error('Gmail service not yet implemented');
  }

  async archiveMessage(messageId: string, archive: boolean): Promise<void> {
    throw new Error('Gmail service not yet implemented');
  }

  async deleteMessage(messageId: string): Promise<void> {
    throw new Error('Gmail service not yet implemented');
  }

  async searchMessages(query: string): Promise<EmailMessage[]> {
    throw new Error('Gmail service not yet implemented');
  }

  async getStatus(): Promise<{ connected: boolean; lastSync?: Date; error?: string }> {
    return {
      connected: false,
      error: 'Gmail service not yet implemented'
    };
  }
}

// Outlook Service Implementation (placeholder for future implementation)
export class OutlookService implements EmailService {
  private config: EmailServiceConfig | null = null;

  async initialize(config: EmailServiceConfig): Promise<void> {
    this.config = config;
    // TODO: Initialize Microsoft Graph API with OAuth2 credentials
    throw new Error('Outlook service not yet implemented. Use mock service for now.');
  }

  async getMessages(): Promise<{ messages: EmailMessage[]; nextPageToken?: string }> {
    throw new Error('Outlook service not yet implemented');
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    throw new Error('Outlook service not yet implemented');
  }

  async sendEmail(request: EmailSendRequest): Promise<string> {
    throw new Error('Outlook service not yet implemented');
  }

  async replyToEmail(messageId: string, body: string): Promise<string> {
    throw new Error('Outlook service not yet implemented');
  }

  async markAsRead(messageId: string, isRead: boolean): Promise<void> {
    throw new Error('Outlook service not yet implemented');
  }

  async archiveMessage(messageId: string, archive: boolean): Promise<void> {
    throw new Error('Outlook service not yet implemented');
  }

  async deleteMessage(messageId: string): Promise<void> {
    throw new Error('Outlook service not yet implemented');
  }

  async searchMessages(query: string): Promise<EmailMessage[]> {
    throw new Error('Outlook service not yet implemented');
  }

  async getStatus(): Promise<{ connected: boolean; lastSync?: Date; error?: string }> {
    return {
      connected: false,
      error: 'Outlook service not yet implemented'
    };
  }
}

// SendGrid Service Implementation (placeholder for future implementation)
export class SendGridService implements EmailService {
  private config: EmailServiceConfig | null = null;

  async initialize(config: EmailServiceConfig): Promise<void> {
    this.config = config;
    // TODO: Initialize SendGrid API
    throw new Error('SendGrid service not yet implemented. Use mock service for now.');
  }

  async getMessages(): Promise<{ messages: EmailMessage[]; nextPageToken?: string }> {
    // Note: SendGrid is primarily for sending emails, not receiving
    // For receiving, you'd need to implement webhook handling
    throw new Error('SendGrid is primarily for sending emails. Consider Gmail or Outlook for receiving.');
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    throw new Error('SendGrid is primarily for sending emails');
  }

  async sendEmail(request: EmailSendRequest): Promise<string> {
    // TODO: Implement SendGrid email sending
    throw new Error('SendGrid service not yet implemented');
  }

  async replyToEmail(messageId: string, body: string): Promise<string> {
    throw new Error('SendGrid service not yet implemented');
  }

  async markAsRead(messageId: string, isRead: boolean): Promise<void> {
    throw new Error('SendGrid does not support message management');
  }

  async archiveMessage(messageId: string, archive: boolean): Promise<void> {
    throw new Error('SendGrid does not support message management');
  }

  async deleteMessage(messageId: string): Promise<void> {
    throw new Error('SendGrid does not support message management');
  }

  async searchMessages(query: string): Promise<EmailMessage[]> {
    throw new Error('SendGrid does not support message search');
  }

  async getStatus(): Promise<{ connected: boolean; lastSync?: Date; error?: string }> {
    return {
      connected: false,
      error: 'SendGrid service not yet implemented'
    };
  }
}

// Email Service Factory
export class EmailServiceFactory {
  static createService(provider: EmailServiceConfig['provider']): EmailService {
    switch (provider) {
      case 'mock':
        return new MockEmailService();
      case 'gmail':
        return new GmailService();
      case 'outlook':
        return new OutlookService();
      case 'sendgrid':
        return new SendGridService();
      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }
  }
}

// Inquiry Classification Service
export class InquiryClassificationService {
  static classifyInquiry(message: EmailMessage): InquiryClassificationResult {
    const subject = message.subject.toLowerCase();
    const body = message.body.toLowerCase();
    const content = `${subject} ${body}`;

    // Simple keyword-based classification (can be enhanced with ML later)
    let inquiryType: PropertyInquiry['inquiryType'] = 'general_inquiry';
    let priority: PropertyInquiry['priority'] = 'medium';
    let confidence = 0.5;

    // Classify inquiry type
    if (content.includes('viewing') || content.includes('visit') || content.includes('see')) {
      inquiryType = 'viewing_request';
      confidence = 0.8;
    } else if (content.includes('offer') || content.includes('buy') || content.includes('purchase')) {
      inquiryType = 'offer';
      confidence = 0.9;
    } else if (content.includes('complaint') || content.includes('problem') || content.includes('issue') || content.includes('discrepanc')) {
      inquiryType = 'complaint';
      confidence = 0.7;
    }

    // Determine priority
    if (content.includes('urgent') || content.includes('asap') || content.includes('immediately')) {
      priority = 'high';
    } else if (content.includes('when convenient') || content.includes('no rush')) {
      priority = 'low';
    }

    // Extract property information (basic implementation)
    const extractedData: InquiryClassificationResult['extractedData'] = {};
    
    // Extract phone numbers
    const phoneMatch = message.body.match(/\+254\s?\d{9}|\d{10}/);
    if (phoneMatch) {
      extractedData.senderPhone = phoneMatch[0];
    }

    // Extract price mentions
    const priceMatch = message.body.match(/KES\s?([\d,]+)|(\d+,?\d*)\s?thousand/i);
    if (priceMatch) {
      const priceStr = priceMatch[1] || priceMatch[2];
      extractedData.propertyPrice = parseInt(priceStr.replace(/,/g, ''));
    }

    return {
      inquiryType,
      priority,
      extractedData,
      confidence
    };
  }
}
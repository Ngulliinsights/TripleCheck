// Email service types and interfaces

export interface EmailServiceConfig {
  provider: 'gmail' | 'outlook' | 'custom';
  credentials: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    accessToken?: string;
  };
  settings: {
    maxRetries: number;
    retryDelay: number;
    batchSize: number;
  };
}

export interface PropertyInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  inquirerName: string;
  inquirerEmail: string;
  inquirerPhone?: string;
  message: string;
  timestamp: Date;
  status: 'new' | 'responded' | 'closed';
  priority: 'low' | 'medium' | 'high';
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  timestamp: Date;
  labels?: string[];
  attachments?: EmailAttachment[];
  isRead: boolean;
  isImportant: boolean;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data?: Buffer;
}

export interface EmailService {
  initialize(): Promise<void>;
  getInboxMessages(limit?: number): Promise<EmailMessage[]>;
  sendEmail(to: string[], subject: string, body: string, htmlBody?: string): Promise<void>;
  markAsRead(messageId: string): Promise<void>;
  archiveMessage(messageId: string): Promise<void>;
  extractPropertyInquiries(messages: EmailMessage[]): PropertyInquiry[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  htmlBody?: string;
  variables: string[];
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  recipients: string[];
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
}
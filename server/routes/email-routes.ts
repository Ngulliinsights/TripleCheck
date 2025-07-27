// Email API routes for TripleCheck
import { Router } from "express";
import {
  EmailServiceFactory,
  InquiryClassificationService,
} from "../services/email-service.js";
import { getEmailConfig, validateEmailConfig } from "../infrastructure/email/email-config.js";
import { EmailService, PropertyInquiry } from "../shared/email-types";

const router = Router();
let emailService: EmailService | null = null;

// Initialize email service
async function initializeEmailService() {
  if (!emailService) {
    const config = getEmailConfig();
    const errors = validateEmailConfig(config);

    if (errors.length > 0) {
      console.warn("Email configuration errors:", errors);
      console.warn("Falling back to mock email service");
      config.provider = "mock";
    }

    emailService = EmailServiceFactory.createService(config.provider);
    await emailService.initialize(config);
    console.log(`Email service initialized with provider: ${config.provider}`);
  }
  return emailService;
}

// Get all inquiries/messages
router.get("/inquiries", async (req, res) => {
  try {
    const service = await initializeEmailService();
    const limit = parseInt(req.query.limit as string) || 50;
    const pageToken = req.query.pageToken as string;

    const result = await service.getMessages(limit, pageToken);

    // Convert messages to property inquiries with classification
    const inquiries: PropertyInquiry[] = result.messages.map((message) => {
      const classification =
        InquiryClassificationService.classifyInquiry(message);

      return {
        ...message,
        inquiryType: classification.inquiryType,
        priority: classification.priority,
        propertyId: classification.extractedData.propertyId,
        propertyTitle:
          classification.extractedData.propertyTitle ||
          extractPropertyTitleFromSubject(message.subject),
        propertyLocation: classification.extractedData.propertyLocation,
        propertyPrice: classification.extractedData.propertyPrice,
        senderPhone: classification.extractedData.senderPhone,
      };
    });

    res.json({
      inquiries,
      nextPageToken: result.nextPageToken,
    });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    res.status(500).json({
      error: "Failed to fetch inquiries",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get specific inquiry
router.get("/inquiries/:id", async (req, res) => {
  try {
    const service = await initializeEmailService();
    const message = await service.getMessage(req.params.id);

    if (!message) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    const classification =
      InquiryClassificationService.classifyInquiry(message);

    const inquiry: PropertyInquiry = {
      ...message,
      inquiryType: classification.inquiryType,
      priority: classification.priority,
      propertyId: classification.extractedData.propertyId,
      propertyTitle:
        classification.extractedData.propertyTitle ||
        extractPropertyTitleFromSubject(message.subject),
      propertyLocation: classification.extractedData.propertyLocation,
      propertyPrice: classification.extractedData.propertyPrice,
      senderPhone: classification.extractedData.senderPhone,
    };

    res.json(inquiry);
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    res.status(500).json({
      error: "Failed to fetch inquiry",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Reply to inquiry
router.post("/inquiries/:id/reply", async (req, res) => {
  try {
    const service = await initializeEmailService();
    const { message, isHtml = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const messageId = await service.replyToEmail(
      req.params.id,
      message,
      isHtml
    );

    res.json({
      success: true,
      messageId,
      message: "Reply sent successfully",
    });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({
      error: "Failed to send reply",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Mark inquiry as read/unread
router.patch("/inquiries/:id/read", async (req, res) => {
  try {
    const service = await initializeEmailService();
    const { isRead = true } = req.body;

    await service.markAsRead(req.params.id, isRead);

    res.json({
      success: true,
      message: `Message marked as ${isRead ? "read" : "unread"}`,
    });
  } catch (error) {
    console.error("Error updating read status:", error);
    res.status(500).json({
      error: "Failed to update read status",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Archive/unarchive inquiry
router.patch("/inquiries/:id/archive", async (req, res) => {
  try {
    const service = await initializeEmailService();
    const { archive = true } = req.body;

    await service.archiveMessage(req.params.id, archive);

    res.json({
      success: true,
      message: `Message ${archive ? "archived" : "unarchived"} successfully`,
    });
  } catch (error) {
    console.error("Error updating archive status:", error);
    res.status(500).json({
      error: "Failed to update archive status",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Delete inquiry
router.delete("/inquiries/:id", async (req, res) => {
  try {
    const service = await initializeEmailService();
    await service.deleteMessage(req.params.id);

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      error: "Failed to delete message",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Search inquiries
router.get("/inquiries/search/:query", async (req, res) => {
  try {
    const service = await initializeEmailService();
    const query = req.params.query;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await service.searchMessages(query, limit);

    // Convert to property inquiries
    const inquiries: PropertyInquiry[] = messages.map((message) => {
      const classification =
        InquiryClassificationService.classifyInquiry(message);

      return {
        ...message,
        inquiryType: classification.inquiryType,
        priority: classification.priority,
        propertyId: classification.extractedData.propertyId,
        propertyTitle:
          classification.extractedData.propertyTitle ||
          extractPropertyTitleFromSubject(message.subject),
        propertyLocation: classification.extractedData.propertyLocation,
        propertyPrice: classification.extractedData.propertyPrice,
        senderPhone: classification.extractedData.senderPhone,
      };
    });

    res.json({ inquiries });
  } catch (error) {
    console.error("Error searching inquiries:", error);
    res.status(500).json({
      error: "Failed to search inquiries",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get email service status
router.get("/status", async (req, res) => {
  try {
    const service = await initializeEmailService();
    const status = await service.getStatus();

    res.json({
      ...status,
      provider: getEmailConfig().provider,
    });
  } catch (error) {
    console.error("Error getting email service status:", error);
    res.status(500).json({
      error: "Failed to get service status",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Send new email (for outbound communications)
router.post("/send", async (req, res) => {
  try {
    const service = await initializeEmailService();
    const { to, subject, body, isHtml = false, attachments } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        error: "Missing required fields: to, subject, body",
      });
    }

    const messageId = await service.sendEmail({
      to,
      subject,
      body,
      isHtml,
      attachments,
    });

    res.json({
      success: true,
      messageId,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      error: "Failed to send email",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Helper function to extract property title from email subject
function extractPropertyTitleFromSubject(subject: string): string {
  // Remove common prefixes and extract property title
  const cleanSubject = subject
    .replace(/^(Re:|Fwd:|Inquiry|Viewing|Offer|Complaint):\s*/i, "")
    .replace(/\s*-\s*.*$/, "") // Remove everything after first dash
    .trim();

  return cleanSubject || "Property Inquiry";
}

export default router;

// Email routes for TripleCheck - testing and management endpoints
import { Router } from 'express';
import { getEmailService, sendTemplatedEmail, EmailServiceFactory } from '../services/email-service';

const router = Router();

// Test email sending endpoint
router.post('/test', async (req, res) => {
  try {
    const { to, subject, body, template } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject'
      });
    }

    const emailService = await getEmailService();

    if (template) {
      // Send templated email
      await sendTemplatedEmail(template, [to], req.body);
    } else {
      // Send simple email
      await emailService.sendEmail([to], subject, body || 'Test email from TripleCheck Kenya');
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      to,
      subject
    });
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    });
  }
});

// Send welcome email
router.post('/welcome', async (req, res) => {
  try {
    const { email, userName, loginUrl } = req.body;

    if (!email || !userName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, userName'
      });
    }

    await sendTemplatedEmail('welcome', [email], {
      userName,
      loginUrl: loginUrl || `${process.env.FRONTEND_URL || 'https://triplecheck.co.ke'}/login`
    });

    res.json({
      success: true,
      message: 'Welcome email sent successfully',
      to: email
    });
  } catch (error) {
    console.error('Welcome email failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send welcome email'
    });
  }
});

// Send password reset email
router.post('/password-reset', async (req, res) => {
  try {
    const { email, userName, resetToken } = req.body;

    if (!email || !userName || !resetToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, userName, resetToken'
      });
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'https://triplecheck.co.ke'}/reset-password?token=${resetToken}`;

    await sendTemplatedEmail('password-reset', [email], {
      userName,
      resetUrl
    });

    res.json({
      success: true,
      message: 'Password reset email sent successfully',
      to: email
    });
  } catch (error) {
    console.error('Password reset email failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send password reset email'
    });
  }
});

// Send property inquiry notification
router.post('/property-inquiry', async (req, res) => {
  try {
    const { email, propertyTitle, inquirerName, message, contactInfo } = req.body;

    if (!email || !propertyTitle || !inquirerName || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, propertyTitle, inquirerName, message'
      });
    }

    await sendTemplatedEmail('property-inquiry', [email], {
      propertyTitle,
      inquirerName,
      message,
      contactInfo: contactInfo || 'Not provided'
    });

    res.json({
      success: true,
      message: 'Property inquiry notification sent successfully',
      to: email
    });
  } catch (error) {
    console.error('Property inquiry email failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send property inquiry email'
    });
  }
});

// Send verification status update
router.post('/verification-update', async (req, res) => {
  try {
    const { email, userName, propertyTitle, status, details } = req.body;

    if (!email || !userName || !propertyTitle || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, userName, propertyTitle, status'
      });
    }

    await sendTemplatedEmail('verification-update', [email], {
      userName,
      propertyTitle,
      status,
      details: details || 'No additional details provided'
    });

    res.json({
      success: true,
      message: 'Verification update email sent successfully',
      to: email
    });
  } catch (error) {
    console.error('Verification update email failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification update email'
    });
  }
});

// Get email service status
router.get('/status', async (req, res) => {
  try {
    const emailService = await getEmailService();
    
    let status = { connected: true, provider: 'unknown' };
    
    // Check if service has status method
    if ('getStatus' in emailService) {
      status = await (emailService as any).getStatus();
    }

    // Check if service has fallback info
    let fallbackInfo = {};
    if ('isInFallbackMode' in emailService) {
      fallbackInfo = {
        fallbackMode: (emailService as any).isInFallbackMode(),
        queuedEmails: (emailService as any).getFallbackEmailCount?.() || 0
      };
    }

    res.json({
      success: true,
      status: {
        ...status,
        ...fallbackInfo,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Email status check failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get email status'
    });
  }
});

// Get inbox messages (for services that support it)
router.get('/inbox', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const emailService = await getEmailService();
    
    const messages = await emailService.getInboxMessages(limit);
    
    res.json({
      success: true,
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Inbox fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch inbox messages'
    });
  }
});

// Extract property inquiries from messages
router.get('/inquiries', async (req, res) => {
  try {
    const emailService = await getEmailService();
    const messages = await emailService.getInboxMessages(100);
    const inquiries = emailService.extractPropertyInquiries(messages);
    
    res.json({
      success: true,
      inquiries,
      count: inquiries.length
    });
  } catch (error) {
    console.error('Inquiry extraction failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract inquiries'
    });
  }
});

// Send queued emails (for SMTP service)
router.post('/send-queued', async (req, res) => {
  try {
    const emailService = await getEmailService();
    
    if ('sendQueuedEmails' in emailService) {
      await (emailService as any).sendQueuedEmails();
      res.json({
        success: true,
        message: 'Queued emails sent successfully'
      });
    } else {
      res.json({
        success: true,
        message: 'Service does not support queued emails'
      });
    }
  } catch (error) {
    console.error('Send queued emails failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send queued emails'
    });
  }
});

export default router;
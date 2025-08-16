import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  inquiryType: z.enum(['general', 'support', 'partnership', 'media']),
  timestamp: z.string().optional(),
});

/**
 * Submit contact form
 * POST /api/contact
 */
router.post('/', async (req, res) => {
  try {
    const validatedData = contactFormSchema.parse(req.body);
    
    // Generate ticket ID
    const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Mock contact form processing
    const contactSubmission = {
      id: ticketId,
      ...validatedData,
      status: 'received',
      submittedAt: new Date().toISOString(),
      assignedTo: null,
      priority: validatedData.inquiryType === 'support' ? 'high' : 'normal',
      estimatedResponse: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
    };

    // In a real implementation, this would:
    // 1. Save to database/CRM
    // 2. Send confirmation email to user
    // 3. Notify support team
    // 4. Create ticket in support system
    // 5. Trigger auto-responder

    console.log('Contact form submission:', contactSubmission);

    res.status(201).json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you within 24 hours.",
      data: {
        ticketId,
        status: 'received',
        estimatedResponse: contactSubmission.estimatedResponse
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>)
      });
    }

    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again.'
    });
  }
});

/**
 * Get contact form status (for ticket tracking)
 * GET /api/contact/:ticketId
 */
router.get('/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Mock ticket status
    const statuses = ['received', 'in_progress', 'resolved', 'closed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const ticket = {
      id: ticketId,
      status: randomStatus,
      submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      assignedTo: randomStatus !== 'received' ? 'Support Team' : null,
      responses: randomStatus === 'resolved' || randomStatus === 'closed' ? [
        {
          id: 'resp1',
          message: 'Thank you for your inquiry. We have reviewed your request and will get back to you shortly.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          from: 'Support Team'
        }
      ] : []
    };

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Get contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact status'
    });
  }
});

export { router as contactRouter };
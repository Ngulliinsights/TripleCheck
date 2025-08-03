import { Router } from 'express';

import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Get messages (authenticated)
router.get('/messages', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    data: [
      {
        id: 1,
        from: 'system',
        to: req.user?.id,
        subject: 'Welcome to TripleCheck',
        message: 'Thank you for joining our platform!',
        createdAt: new Date().toISOString(),
        read: false
      }
    ]
  });
});

// Send message (authenticated)
router.post('/messages', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    data: {
      id: Date.now(),
      from: req.user?.id,
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'sent'
    },
    message: 'Message sent successfully'
  });
});

// Get notifications (authenticated)
router.get('/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    data: [
      {
        id: 1,
        type: 'property_verified',
        title: 'Property Verification Complete',
        message: 'Your property has been successfully verified.',
        createdAt: new Date().toISOString(),
        read: false
      },
      {
        id: 2,
        type: 'new_review',
        title: 'New Review Received',
        message: 'You have received a new review on your property.',
        createdAt: new Date().toISOString(),
        read: true
      }
    ]
  });
});

export { router as communicationRouter };
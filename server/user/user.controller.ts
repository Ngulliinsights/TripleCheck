import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all users (authenticated)
router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  // Mock users list
  res.json({ 
    success: true, 
    data: [
      { id: 1, username: 'user1', firstName: 'John', lastName: 'Doe' },
      { id: 2, username: 'user2', firstName: 'Jane', lastName: 'Smith' }
    ]
  });
});

// Get user by ID
router.get('/:id', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      id: req.params.id, 
      username: `user${req.params.id}`,
      firstName: 'Test',
      lastName: 'User',
      email: `user${req.params.id}@example.com`
    } 
  });
});

// Update user (authenticated)
router.put('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    data: { 
      id: req.params.id, 
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'User updated successfully'
  });
});

// Delete user (authenticated)
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    message: 'User deleted successfully'
  });
});

export { router as userRouter };
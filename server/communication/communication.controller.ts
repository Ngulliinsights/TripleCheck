import { Router } from 'express';

const router = Router();

// Placeholder routes for communication domain
router.get('/messages', (req, res) => {
  res.json({ success: true, data: [] });
});

export { router as communicationRouter };
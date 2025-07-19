import { Router } from 'express';

const router = Router();

// Placeholder routes for analytics domain
router.get('/dashboard', (req, res) => {
  res.json({ success: true, data: { metrics: {} } });
});

export { router as analyticsRouter };
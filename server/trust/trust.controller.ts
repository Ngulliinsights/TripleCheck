import { Router } from 'express';

const router = Router();

// Placeholder routes for trust domain
router.get('/score/:userId', (req, res) => {
  res.json({ success: true, data: { score: 85, factors: {} } });
});

router.post('/verify', (req, res) => {
  res.json({ success: true, message: 'Verification initiated' });
});

export { router as trustRouter };
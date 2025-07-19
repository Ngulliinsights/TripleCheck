import { Router } from 'express';

const router = Router();

// Placeholder routes for search domain
router.get('/', (req, res) => {
  res.json({ success: true, data: [], total: 0 });
});

export { router as searchRouter };
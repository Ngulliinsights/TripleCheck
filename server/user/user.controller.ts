import { Router } from 'express';

const router = Router();

// Placeholder routes for user domain
router.get('/:id', (req, res) => {
  res.json({ success: true, data: { id: req.params.id, name: 'User' } });
});

export { router as userRouter };
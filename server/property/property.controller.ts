import { Router } from 'express';
import { PropertyService } from './property.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const propertyService = new PropertyService();

// Get all properties with search and filters
router.get('/', async (req, res, next) => {
  try {
    const result = await propertyService.getProperties(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get single property
router.get('/:id', async (req, res, next) => {
  try {
    const result = await propertyService.getProperty(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Create property (authenticated)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await propertyService.createProperty(req.body, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Update property (authenticated, owner only)
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await propertyService.updateProperty(req.params.id, req.body, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Delete property (authenticated, owner only)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await propertyService.deleteProperty(req.params.id, req.user.id);
    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get properties by owner
router.get('/owner/:ownerId', async (req, res, next) => {
  try {
    const result = await propertyService.getPropertiesByOwner(req.params.ownerId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as propertyRouter };
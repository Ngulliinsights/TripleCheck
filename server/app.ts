import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { validationMiddleware } from './middleware/validation.middleware';

// Domain routers
import { authRouter } from './auth/auth.controller';
import { propertyRouter } from './property/property.controller';
import { trustRouter } from './trust/trust.controller';
import { userRouter } from './user/user.controller';
import { searchRouter } from './search/search.controller';
import { communicationRouter } from './communication/communication.controller';
import { analyticsRouter } from './analytics/analytics.controller';
import { aiRouter } from './ai/ai.controller';

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/trust', trustRouter);
app.use('/api/users', userRouter);
app.use('/api/search', searchRouter);
app.use('/api/communication', communicationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
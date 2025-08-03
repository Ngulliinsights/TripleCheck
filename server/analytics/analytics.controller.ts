import { Router } from 'express';

import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Analytics dashboard (authenticated)
router.get('/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    data: { 
      totalProperties: 150,
      totalUsers: 45,
      totalTransactions: 23,
      averagePrice: 250000,
      metrics: {
        dailyViews: 1250,
        weeklySignups: 12,
        monthlyRevenue: 15000
      }
    } 
  });
});

// Property analytics (authenticated)
router.get('/properties', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    data: {
      totalProperties: 150,
      verifiedProperties: 120,
      pendingVerification: 30,
      averagePrice: 250000,
      priceRanges: {
        under100k: 25,
        '100k-300k': 75,
        '300k-500k': 35,
        over500k: 15
      }
    }
  });
});

// User analytics (authenticated)
router.get('/users', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    data: {
      totalUsers: 45,
      activeUsers: 32,
      newUsersThisMonth: 8,
      userGrowthRate: 15.5,
      usersByRegion: {
        'North America': 20,
        'Europe': 15,
        'Asia': 8,
        'Other': 2
      }
    }
  });
});

export { router as analyticsRouter };
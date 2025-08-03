/**
 * Integration Test Endpoint
 * Tests the complete integration between frontend, backend, and database
 */

import { Router } from 'express';
import { getDatabase } from './infrastructure/database/init';

const router = Router();

// Test database connection and basic CRUD operations
router.get('/api/test/integration', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Test database connection
    const connectionTest = await db.execute('SELECT 1 as test');
    
    // Test properties query
    const propertiesTest = await db.query.properties.findMany({
      limit: 3,
      with: {
        // Add any relations if needed
      }
    });
    
    // Test users query
    const usersTest = await db.query.users.findMany({
      limit: 3,
      columns: {
        id: true,
        username: true,
        email: true,
        role: true,
        trustScore: true
      }
    });
    
    res.json({
      success: true,
      message: 'Integration test passed',
      data: {
        database: {
          connected: true,
          connectionTest: connectionTest.length > 0
        },
        properties: {
          count: propertiesTest.length,
          sample: propertiesTest.map(p => ({
            id: p.id,
            title: p.title,
            price: p.price,
            location: p.location,
            verificationStatus: p.verificationStatus
          }))
        },
        users: {
          count: usersTest.length,
          sample: usersTest.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            trustScore: u.trustScore
          }))
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Integration test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Integration test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Test property API endpoints
router.get('/api/test/properties', async (req, res) => {
  try {
    const db = getDatabase();
    
    const properties = await db.query.properties.findMany({
      limit: 10,
      orderBy: (properties, { desc }) => [desc(properties.createdAt)]
    });
    
    res.json({
      success: true,
      data: properties,
      total: properties.length,
      page: 1,
      limit: 10,
      hasNext: false,
      hasPrev: false
    });
    
  } catch (error) {
    console.error('Properties test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Properties test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test single property endpoint
router.get('/api/test/properties/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const property = await db.query.properties.findFirst({
      where: (properties, { eq }) => eq(properties.id, parseInt(id))
    });
    
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
        message: `Property with ID ${id} was not found`
      });
    }
    
    res.json({
      success: true,
      data: property,
      cached: false
    });
    
  } catch (error) {
    console.error('Single property test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Single property test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as testIntegrationRouter };
/**
 * Price History API Routes
 * Manages historical price tracking and trends
 */

import express from 'express';
import PriceHistory from '../models/PriceHistory.js';

const router = express.Router();

/**
 * GET /api/prices/history/:productId
 * Get price history for a product
 */
router.get('/history/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId, limit, daysBack } = req.query;

    const history = await PriceHistory.getHistory(productId, {
      storeId: storeId || null,
      limit: parseInt(limit) || 50,
      daysBack: parseInt(daysBack) || 90
    });

    res.json({
      success: true,
      productId,
      count: history.length,
      history
    });
  } catch (error) {
    console.error('[API] Error fetching price history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price history',
      message: error.message
    });
  }
});

/**
 * GET /api/prices/current/:productId/:storeId
 * Get current price for a product at a specific store
 */
router.get('/current/:productId/:storeId', async (req, res) => {
  try {
    const { productId, storeId } = req.params;
    const price = await PriceHistory.getCurrentPrice(productId, storeId);

    if (!price) {
      return res.status(404).json({
        success: false,
        error: 'No current price found'
      });
    }

    res.json({
      success: true,
      price
    });
  } catch (error) {
    console.error('[API] Error fetching current price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current price',
      message: error.message
    });
  }
});

/**
 * GET /api/prices/compare/:productId
 * Compare prices across all stores for a product
 */
router.get('/compare/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const comparison = await PriceHistory.compareAcrossStores(productId);

    // Calculate stats
    const prices = comparison.map(p => p.prix).filter(p => p != null);
    const stats = {
      min: prices.length > 0 ? Math.min(...prices) : null,
      max: prices.length > 0 ? Math.max(...prices) : null,
      avg: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
      count: comparison.length
    };

    res.json({
      success: true,
      productId,
      stats,
      stores: comparison
    });
  } catch (error) {
    console.error('[API] Error comparing prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare prices',
      message: error.message
    });
  }
});

/**
 * GET /api/prices/trends/:productId
 * Get price trends for a product
 */
router.get('/trends/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const trends = await PriceHistory.getPriceTrends(productId);

    res.json({
      success: true,
      productId,
      trends
    });
  } catch (error) {
    console.error('[API] Error fetching price trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price trends',
      message: error.message
    });
  }
});

/**
 * GET /api/prices/stale
 * Get all stale prices (RA9 - obsolete prices)
 */
router.get('/stale', async (req, res) => {
  try {
    const { daysThreshold } = req.query;
    const stalePrices = await PriceHistory.detectStalePrices(
      parseInt(daysThreshold) || 30
    );

    res.json({
      success: true,
      threshold: parseInt(daysThreshold) || 30,
      count: stalePrices.length,
      stalePrices
    });
  } catch (error) {
    console.error('[API] Error detecting stale prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect stale prices',
      message: error.message
    });
  }
});

/**
 * POST /api/prices
 * Add a new price record
 */
router.post('/', async (req, res) => {
  try {
    const priceData = req.body;
    
    // Validate required fields
    const required = ['productId', 'productName', 'storeId', 'storeName', 'prix'];
    const missing = required.filter(field => !priceData[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missing
      });
    }

    const newPrice = await PriceHistory.addPrice(priceData);

    res.status(201).json({
      success: true,
      price: newPrice
    });
  } catch (error) {
    console.error('[API] Error adding price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add price',
      message: error.message
    });
  }
});

/**
 * POST /api/prices/bulk
 * Bulk insert prices (OCR batch processing)
 */
router.post('/bulk', async (req, res) => {
  try {
    const { prices } = req.body;

    if (!Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid prices array'
      });
    }

    const inserted = await PriceHistory.bulkInsert(prices);

    res.status(201).json({
      success: true,
      count: inserted.length,
      prices: inserted
    });
  } catch (error) {
    console.error('[API] Error bulk inserting prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk insert prices',
      message: error.message
    });
  }
});

/**
 * PATCH /api/prices/:id/expire
 * Expire a price (set valid_to date)
 */
router.patch('/:id/expire', async (req, res) => {
  try {
    const { id } = req.params;
    const { validTo } = req.body;

    const updated = await PriceHistory.expirePrice(
      id,
      validTo ? new Date(validTo) : new Date()
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Price not found'
      });
    }

    res.json({
      success: true,
      price: updated
    });
  } catch (error) {
    console.error('[API] Error expiring price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to expire price',
      message: error.message
    });
  }
});

/**
 * PATCH /api/prices/:id/verify
 * Verify a price (admin validation - RA10)
 */
router.patch('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'adminId required'
      });
    }

    const verified = await PriceHistory.verifyPrice(id, adminId);

    if (!verified) {
      return res.status(404).json({
        success: false,
        error: 'Price not found'
      });
    }

    res.json({
      success: true,
      price: verified
    });
  } catch (error) {
    console.error('[API] Error verifying price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify price',
      message: error.message
    });
  }
});

export default router;

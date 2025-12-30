/**
 * PriceHistory Model
 * Manages price history records with temporal tracking
 */

import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class PriceHistory {
  /**
   * Add a new price record
   * @param {Object} data - Price data
   * @returns {Promise<Object>} Created record
   */
  static async addPrice({
    productId,
    productName,
    storeId,
    storeName,
    prix,
    prixUnitaire = null,
    unite = null,
    validFrom = new Date(),
    validTo = null,
    source = 'manual',
    confidence = 1.0,
    verifiedBy = null
  }) {
    const query = `
      INSERT INTO price_history (
        id, product_id, product_name, store_id, store_name,
        prix, prix_unitaire, unite, valid_from, valid_to,
        source, confidence, verified_by, verified_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      uuidv4(),
      productId,
      productName,
      storeId,
      storeName,
      prix,
      prixUnitaire,
      unite,
      validFrom,
      validTo,
      source,
      confidence,
      verifiedBy,
      verifiedBy ? new Date() : null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get current price for a product at a store
   * @param {string} productId
   * @param {string} storeId
   * @returns {Promise<Object|null>}
   */
  static async getCurrentPrice(productId, storeId) {
    const query = `
      SELECT * FROM get_current_price($1, $2)
    `;
    const result = await pool.query(query, [productId, storeId]);
    return result.rows[0] || null;
  }

  /**
   * Get price history for a product
   * @param {string} productId
   * @param {Object} options - Filter options
   * @returns {Promise<Array>}
   */
  static async getHistory(productId, { storeId = null, limit = 50, daysBack = 90 } = {}) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    let query = `
      SELECT * FROM price_history
      WHERE product_id = $1 AND valid_from >= $2
    `;
    const params = [productId, cutoffDate];

    if (storeId) {
      query += ` AND store_id = $3`;
      params.push(storeId);
    }

    query += ` ORDER BY valid_from DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get price trends for a product
   * @param {string} productId
   * @returns {Promise<Array>}
   */
  static async getPriceTrends(productId) {
    const query = `
      SELECT * FROM price_trends
      WHERE product_id = $1
      ORDER BY last_update DESC
    `;
    const result = await pool.query(query, [productId]);
    return result.rows;
  }

  /**
   * Detect stale prices (RA9 - prix obsolètes)
   * @param {number} daysThreshold - Days before price considered stale
   * @returns {Promise<Array>}
   */
  static async detectStalePrices(daysThreshold = 30) {
    const query = `SELECT * FROM detect_stale_prices($1)`;
    const result = await pool.query(query, [daysThreshold]);
    return result.rows;
  }

  /**
   * Update price validity (expire old price)
   * @param {string} priceId
   * @param {Date} validTo
   * @returns {Promise<Object>}
   */
  static async expirePrice(priceId, validTo = new Date()) {
    const query = `
      UPDATE price_history
      SET valid_to = $2
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [priceId, validTo]);
    return result.rows[0];
  }

  /**
   * Verify a price (admin validation)
   * @param {string} priceId
   * @param {string} adminId
   * @returns {Promise<Object>}
   */
  static async verifyPrice(priceId, adminId) {
    const query = `
      UPDATE price_history
      SET verified_by = $2, verified_at = NOW(), confidence = 1.0
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [priceId, adminId]);
    return result.rows[0];
  }

  /**
   * Get price comparison across stores for a product
   * @param {string} productId
   * @returns {Promise<Array>}
   */
  static async compareAcrossStores(productId) {
    const query = `
      SELECT 
        store_id,
        store_name,
        prix,
        prix_unitaire,
        unite,
        valid_from,
        source,
        confidence,
        RANK() OVER (PARTITION BY store_id ORDER BY valid_from DESC) as rank
      FROM price_history
      WHERE product_id = $1
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
    `;
    const result = await pool.query(query, [productId]);
    // Filter to get only most recent price per store
    return result.rows.filter(row => row.rank === 1);
  }

  /**
   * Bulk insert prices (for OCR batch processing)
   * @param {Array} pricesArray
   * @returns {Promise<Array>}
   */
  static async bulkInsert(pricesArray) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = [];

      for (const priceData of pricesArray) {
        const query = `
          INSERT INTO price_history (
            id, product_id, product_name, store_id, store_name,
            prix, prix_unitaire, unite, valid_from, valid_to,
            source, confidence
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `;
        const values = [
          uuidv4(),
          priceData.productId,
          priceData.productName,
          priceData.storeId,
          priceData.storeName,
          priceData.prix,
          priceData.prixUnitaire || null,
          priceData.unite || null,
          priceData.validFrom || new Date(),
          priceData.validTo || null,
          priceData.source || 'circulaire',
          priceData.confidence || 0.8
        ];

        const result = await client.query(query, values);
        inserted.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return inserted;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default PriceHistory;
